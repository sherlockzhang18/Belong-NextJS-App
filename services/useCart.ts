import { useState, useEffect } from 'react'
import { Event as ChronosEvent } from '@jstiava/chronos'
import axios from 'axios'

export interface CartItem {
    event: ChronosEvent
    quantity: number
    ticketOptionId?: string
    seatIds?: string[]
}

interface SerializedCartItem {
    eventData: {
        uuid: string
        name: string
        date?: string
        start_time?: string
        end_time?: string
        location_name?: string
        metadata?: Record<string, any>
    }
    quantity: number
    ticketOptionId?: string
    seatIds?: string[]
}

interface CartState {
    items: SerializedCartItem[]
}

interface TicketOption {
    id: string
    name: string
    price: string
}

const CART_KEY = 'shopping_cart'

export function useCart() {
    const [items, setItems] = useState<CartItem[]>([])
    const [totalPrice, setTotalPrice] = useState(0)
    const [ticketOptions, setTicketOptions] = useState<Record<string, TicketOption>>({})

    useEffect(() => {
        const saved = localStorage.getItem(CART_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as CartState
                setItems(parsed.items.map((item) => ({
                    event: new ChronosEvent({
                        uuid: item.eventData.uuid,
                        name: item.eventData.name,
                        date: item.eventData.date,
                        start_time: item.eventData.start_time,
                        end_time: item.eventData.end_time,
                        location_name: item.eventData.location_name,
                        metadata: item.eventData.metadata,
                    } as any),
                    quantity: item.quantity,
                    ticketOptionId: item.ticketOptionId,
                    seatIds: item.seatIds,
                })))
            } catch (err) {
                console.error('Failed to load cart:', err)
                localStorage.removeItem(CART_KEY)
            }
        }
    }, [])

    useEffect(() => {
        const fetchTicketOptions = async () => {
            const optionsMap: Record<string, TicketOption> = {}

            const eventUuids = [...new Set(
                items
                    .filter(item => item.ticketOptionId)
                    .map(item => item.event.uuid)
            )]

            for (const eventUuid of eventUuids) {
                try {
                    const response = await axios.get(`/api/events/${eventUuid}/ticket-options`)
                    const options = response.data.ticketOptions

                    options.forEach((option: TicketOption) => {
                        optionsMap[option.id] = option
                    })
                } catch (error) {
                    console.error(`Error fetching ticket options for event ${eventUuid}:`, error)
                }
            }

            setTicketOptions(optionsMap)
        }

        if (items.length > 0) {
            fetchTicketOptions()
        }
    }, [items])

    useEffect(() => {
        const calculateTotal = async () => {
            let total = 0

            for (const item of items) {
                if (item.seatIds && item.seatIds.length > 0) {
                    // For seated tickets, get prices from seat details
                    try {
                        const response = await axios.post('/api/seats/details', { seatIds: item.seatIds })
                        const seatPrices = response.data.seats.map((seat: any) => parseFloat(seat.price))
                        total += seatPrices.reduce((sum: number, price: number) => sum + price, 0)
                    } catch (error) {
                        console.error('Error fetching seat prices:', error)
                        // Fallback to event metadata price if seat details unavailable
                        const fallbackPrice = parseFloat(item.event.metadata?.price?.toString() || '0')
                        total += fallbackPrice * item.seatIds.length
                    }
                } else if (item.ticketOptionId && ticketOptions[item.ticketOptionId]) {
                    // For general tickets with ticket option
                    const price = parseFloat(ticketOptions[item.ticketOptionId].price)
                    total += price * item.quantity
                } else {
                    // Fallback to event metadata price
                    const price = parseFloat(item.event.metadata?.price?.toString() || '0')
                    total += price * item.quantity
                }
            }

            setTotalPrice(total)
        }

        calculateTotal()

        const serializedItems: SerializedCartItem[] = items.map(item => ({
            eventData: {
                uuid: item.event.uuid,
                name: item.event.name,
                date: item.event.date?.toString(),
                start_time: item.event.start_time?.toString(),
                end_time: item.event.end_time?.toString(),
                location_name: item.event.location_name || undefined,
                metadata: item.event.metadata,
            },
            quantity: item.quantity,
            ticketOptionId: item.ticketOptionId,
            seatIds: item.seatIds,
        }))
        localStorage.setItem(CART_KEY, JSON.stringify({ items: serializedItems }))
    }, [items, ticketOptions])

    const add = (event: ChronosEvent, options?: { ticketOptionId?: string, quantity?: number, seatIds?: string[] }) => {
        setItems(current => {
            const existing = current.find(item =>
                item.event.uuid === event.uuid &&
                item.ticketOptionId === options?.ticketOptionId &&
                JSON.stringify(item.seatIds) === JSON.stringify(options?.seatIds)
            )

            if (existing && !options?.seatIds) {
                return current.map(item =>
                    item === existing
                        ? { ...item, quantity: item.quantity + (options?.quantity || 1) }
                        : item
                )
            }

            return [...current, {
                event,
                quantity: options?.quantity || 1,
                ticketOptionId: options?.ticketOptionId,
                seatIds: options?.seatIds,
            }]
        })
    }

    const remove = (event: ChronosEvent, options?: { ticketOptionId?: string, seatIds?: string[] }) => {
        setItems(current => {
            const existing = current.find(item =>
                item.event.uuid === event.uuid &&
                item.ticketOptionId === options?.ticketOptionId &&
                JSON.stringify(item.seatIds) === JSON.stringify(options?.seatIds)
            )

            if (!existing) return current

            if (existing.quantity > 1 && !existing.seatIds) {
                return current.map(item =>
                    item === existing
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
            }

            return current.filter(item => item !== existing)
        })
    }

    const getItemPrice = (item: CartItem): number => {
        if (item.seatIds && item.seatIds.length > 0) {
            // For seated items, price needs to be fetched from seat details
            // This is a synchronous function, so we return 0 and rely on cart page to handle pricing
            return 0
        }
        if (item.ticketOptionId && ticketOptions[item.ticketOptionId]) {
            return parseFloat(ticketOptions[item.ticketOptionId].price)
        }
        return parseFloat(item.event.metadata?.price?.toString() || '0')
    }

    const getItemPriceDisplay = (item: CartItem): string => {
        if (item.ticketOptionId && ticketOptions[item.ticketOptionId]) {
            return ticketOptions[item.ticketOptionId].name
        }
        return 'General Admission'
    }

    const clear = () => {
        setItems([])
        localStorage.removeItem(CART_KEY)
    }

    return {
        items,
        totalPrice,
        ticketOptions,
        getItemPrice,
        getItemPriceDisplay,
        add,
        remove,
        clear,
    }
}
