import { useState, useEffect } from 'react'
import type { Event as ChronosEvent, EventData } from '@jstiava/chronos'
import { Event } from '@jstiava/chronos'

const STORAGE_KEY = 'my-cart'

export type CartItem = {
    event: ChronosEvent
    quantity: number
}

export function useCart() {
    const [items, setItems] = useState<CartItem[]>([])

    useEffect(() => {
        try {
            const data = localStorage.getItem(STORAGE_KEY)
            if (data) {
                const parsed: { event: EventData; quantity: number }[] = JSON.parse(data)
                const restored = parsed.map(({ event, quantity }) => ({
                    event: new Event(event, true),
                    quantity,
                }))
                setItems(restored)
            }
        } catch (e) {
            console.error('Failed to load cart:', e)
        }
    }, [])

    useEffect(() => {
        try {
            const toStore = items.map(({ event, quantity }) => ({
                event: event.eject(true),
                quantity,
            }))
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
        } catch (e) {
            console.error('Failed to save cart:', e)
        }
    }, [items])

    function add(event: ChronosEvent) {
        setItems((prev) => {
            const idx = prev.findIndex((c) => c.event.uuid === event.uuid)
            if (idx >= 0) {
                const next = [...prev]
                next[idx].quantity++
                return next
            }
            return [...prev, { event, quantity: 1 }]
        })
    }

    function remove(event: ChronosEvent) {
        setItems((prev) => {
            const idx = prev.findIndex((c) => c.event.uuid === event.uuid)
            if (idx === -1) return prev
            const next = [...prev]
            if (next[idx].quantity > 1) {
                next[idx].quantity--
            } else {
                next.splice(idx, 1)
            }
            return next
        })
    }

    function clear() {
        setItems([])
    }

    const totalPrice = items.reduce((sum, { event, quantity }) => {
        const raw = event.metadata?.price?.toString().replace(/[^0-9.]/g, '') || '0'
        const num = parseFloat(raw) || 0
        return sum + num * quantity
    }, 0)

    return { items, add, remove, clear, totalPrice }
}
