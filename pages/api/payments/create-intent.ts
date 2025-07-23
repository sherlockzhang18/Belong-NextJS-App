import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../utils/db';
import { getUserFromReq } from '../../../utils/auth';
import { createPaymentIntent } from '../../../utils/stripe';
import { eq } from 'drizzle-orm';
import { events, ticketOptions, orders, orderItems, seats } from '../../../drizzle/schema';

interface OrderItem {
    eventId: string;
    quantity: number;
    ticketOptionId?: string;
    seatIds?: string[];
}

interface CreatePaymentIntentData {
    items: OrderItem[];
}

interface EventMetadata {
    price?: number | string;
    description?: string;
    files?: string[];
    ticketing_link?: string;
    [key: string]: any;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const user = await getUserFromReq(req, res);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { items } = req.body as CreatePaymentIntentData;
        if (!items?.length) {
            return res.status(400).json({ message: 'No items provided' });
        }

        for (const item of items) {
            if (item.seatIds && item.seatIds.length > 0) {
                const seatStatuses = await Promise.all(
                    item.seatIds.map(seatId =>
                        db.select()
                            .from(seats)
                            .where(eq(seats.id, seatId))
                            .limit(1)
                    )
                );

                for (let i = 0; i < seatStatuses.length; i++) {
                    const [seat] = seatStatuses[i];
                    if (!seat) {
                        return res.status(400).json({ 
                            message: `Seat ${item.seatIds[i]} not found` 
                        });
                    }
                    if (seat.status === 'sold') {
                        return res.status(409).json({ 
                            message: `Seat ${seat.seat_number} is no longer available` 
                        });
                    }
                    if (seat.status === 'reserved' && seat.reserved_until && seat.reserved_until < new Date()) {
                        return res.status(409).json({ 
                            message: `Reservation for seat ${seat.seat_number} has expired` 
                        });
                    }
                }
            }
        }

        const [eventsData, ticketOptionsData] = await Promise.all([
            Promise.all(
                items.map(item =>
                    db.select()
                        .from(events)
                        .where(eq(events.uuid, item.eventId))
                        .execute()
                )
            ),
            Promise.all(
                items
                    .filter(item => item.ticketOptionId)
                    .map(item =>
                        db.select()
                            .from(ticketOptions)
                            .where(eq(ticketOptions.id, item.ticketOptionId!))
                            .execute()
                    )
            )
        ]);

        if (eventsData.some(e => !e?.length)) {
            return res.status(400).json({ message: 'One or more events not found' });
        }

        if (ticketOptionsData.some(t => !t?.length)) {
            return res.status(400).json({ message: 'One or more ticket options not found' });
        }

        let total = 0;
        const seatsData: Array<{ seat: any; ticketOption: any }> = [];

        for (const item of items) {
            if (item.seatIds && item.seatIds.length > 0) {
                const itemSeats = await Promise.all(
                    item.seatIds.map(seatId =>
                        db.select({
                            seat: seats,
                            ticketOption: ticketOptions
                        })
                        .from(seats)
                        .innerJoin(ticketOptions, eq(seats.ticket_option_id, ticketOptions.id))
                        .where(eq(seats.id, seatId))
                        .limit(1)
                    )
                );
                seatsData.push(...itemSeats.map(([data]) => data));
            }
        }

        items.forEach((item) => {
            if (item.seatIds && item.seatIds.length > 0) {
                item.seatIds.forEach(seatId => {
                    const seatData = seatsData.find(s => s.seat.id === seatId);
                    if (seatData) {
                        total += Number(seatData.ticketOption.price);
                    }
                });
            } else if (item.ticketOptionId) {
                const option = ticketOptionsData
                    .flat()
                    .find(t => t.id === item.ticketOptionId);
                if (option) {
                    total += Number(option.price) * item.quantity;
                }
            } else {
                const event = eventsData
                    .flat()
                    .find(e => e.uuid === item.eventId);
                if (event) {
                    const metadata = event.metadata as EventMetadata;
                    const price = metadata.price ? parseFloat(metadata.price.toString()) : 0;
                    total += price * item.quantity;
                }
            }
        });

        if (total <= 0) {
            return res.status(400).json({ message: 'Total amount must be greater than 0' });
        }

        const amountInCents = Math.round(total * 100);
        if (amountInCents < 50) {
            return res.status(400).json({
                message: 'Total amount must be at least $0.50 to process payment'
            });
        }

        const [order] = await db.insert(orders)
            .values({
                user_id: user.uuid,
                status: 'pending',
                total_amount: total.toFixed(2),
                metadata: { items }
            })
            .returning()
            .execute();

        const orderItemsToInsert = [];
        
        for (const item of items) {
            if (item.seatIds && item.seatIds.length > 0) {
                for (const seatId of item.seatIds) {
                    const seatData = seatsData.find(s => s.seat.id === seatId);
                    if (seatData) {
                        orderItemsToInsert.push({
                            order_id: order.uuid,
                            event_id: item.eventId,
                            ticket_option_id: seatData.ticketOption.id,
                            seat_id: seatId,
                            quantity: 1,
                            unit_price: Number(seatData.ticketOption.price).toFixed(2),
                            subtotal: Number(seatData.ticketOption.price).toFixed(2)
                        });
                    }
                }
            } else {
                const event = eventsData.flat().find(e => e.uuid === item.eventId)!;
                const ticketOption = item.ticketOptionId
                    ? ticketOptionsData.flat().find(t => t.id === item.ticketOptionId)
                    : null;

                const metadata = event.metadata as EventMetadata;
                const unitPrice = ticketOption
                    ? Number(ticketOption.price)
                    : (metadata.price ? parseFloat(metadata.price.toString()) : 0);

                orderItemsToInsert.push({
                    order_id: order.uuid,
                    event_id: item.eventId,
                    ticket_option_id: item.ticketOptionId || null,
                    seat_id: null,
                    quantity: item.quantity,
                    unit_price: unitPrice.toFixed(2),
                    subtotal: (unitPrice * item.quantity).toFixed(2)
                });
            }
        }

        await db.insert(orderItems)
            .values(orderItemsToInsert)
            .execute();

        const paymentIntent = await createPaymentIntent({
            amount: amountInCents,
            currency: 'usd',
            metadata: {
                order_id: order.uuid,
                user_id: user.uuid
            }
        });

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            orderId: order.uuid
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
