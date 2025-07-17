import { useState, useEffect } from 'react'
import { Event as ChronosEvent } from '@jstiava/chronos'
import axios from 'axios'

export interface CartItem {
    event: ChronosEvent
    quantity: number
    ticketOptionId?: string
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
        const total = items.reduce((sum, item) => {
            if (item.ticketOptionId && ticketOptions[item.ticketOptionId]) {
                const price = parseFloat(ticketOptions[item.ticketOptionId].price)
                return sum + (price * item.quantity)
            }
            const price = parseFloat(item.event.metadata?.price?.toString() || '0')
            return sum + (price * item.quantity)
        }, 0)
        setTotalPrice(total)

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
        }))
        localStorage.setItem(CART_KEY, JSON.stringify({ items: serializedItems }))
    }, [items, ticketOptions])

    const add = (event: ChronosEvent, options?: { ticketOptionId?: string, quantity?: number }) => {
        setItems(current => {
            const existing = current.find(item =>
                item.event.uuid === event.uuid &&
                item.ticketOptionId === options?.ticketOptionId
            )

            if (existing) {
                return current.map(item =>
                    item === existing
                        ? { ...item, quantity: item.quantity + (options?.quantity || 1) }
                        : item
                )
            }

            return [...current, {
                event,
                quantity: options?.quantity || 1,
                ticketOptionId: options?.ticketOptionId
            }]
        })
    }

    const remove = (event: ChronosEvent, options?: { ticketOptionId?: string }) => {
        setItems(current => {
            const existing = current.find(item =>
                item.event.uuid === event.uuid &&
                item.ticketOptionId === options?.ticketOptionId
            )

            if (!existing) return current

            if (existing.quantity > 1) {
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
