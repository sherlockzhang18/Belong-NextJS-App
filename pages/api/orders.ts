import { NextApiRequest, NextApiResponse } from 'next';
import { db, schema } from '../../utils/db';
import { getUserFromReq } from '../../utils/auth';
import { eq } from 'drizzle-orm';

type OrderRecord = typeof schema.orders.$inferSelect;
type EventRecord = typeof schema.events.$inferSelect;
type TicketOptionRecord = typeof schema.ticketOptions.$inferSelect;
type OrderItemRecord = typeof schema.orderItems.$inferSelect;

interface OrderItem extends OrderItemRecord {
    event: EventRecord;
    ticketOption: TicketOptionRecord | null;
}

interface GroupedOrder extends OrderRecord {
    items: OrderItem[];
}

interface GroupedOrders {
    [orderId: string]: GroupedOrder;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const user = await getUserFromReq(req, res);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const orders = await db.select({
            order: schema.orders,
            items: schema.orderItems,
            event: schema.events,
            ticketOption: schema.ticketOptions
        })
            .from(schema.orders)
            .leftJoin(schema.orderItems, eq(schema.orders.uuid, schema.orderItems.order_id))
            .leftJoin(schema.events, eq(schema.orderItems.event_id, schema.events.uuid))
            .leftJoin(schema.ticketOptions, eq(schema.orderItems.ticket_option_id, schema.ticketOptions.id))
            .where(eq(schema.orders.user_id, user.uuid))
            .orderBy(schema.orders.created_at)
            .execute();

        const groupedOrders = orders.reduce<GroupedOrders>((acc, row) => {
            const orderId = row.order.uuid;
            if (!acc[orderId]) {
                acc[orderId] = {
                    ...row.order,
                    items: []
                };
            }

            if (row.items && row.event) {
                acc[orderId].items.push({
                    ...row.items,
                    event: row.event,
                    ticketOption: row.ticketOption
                });
            }

            return acc;
        }, {});

        return res.status(200).json({
            orders: Object.values(groupedOrders)
        });

    } catch (error) {
        console.error('Error in orders API:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
} 