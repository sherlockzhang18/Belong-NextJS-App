import { useState, useEffect } from 'react'
import { Event as ChronosEvent } from '@jstiava/chronos'

export interface CartItem {
  event: ChronosEvent
  quantity: number
}

const STORAGE_KEY = 'my-cart'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  // 1) Load from localStorage on mount
  useEffect(() => {
    try {
      const json = localStorage.getItem(STORAGE_KEY)
      if (json) {
        const raws: Array<{ event: any; quantity: number }> = JSON.parse(json)
        const wrapped = raws.map(r => ({
          event: new ChronosEvent(r.event),
          quantity: r.quantity
        }))
        setItems(wrapped)
      }
    } catch (e) {
      console.error('useCart load error:', e)
    }
  }, [])

  // 2) Persist to localStorage on every change
  useEffect(() => {
    try {
      const payload = items.map(i => ({
        event: i.event.eject(),
        quantity: i.quantity
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (e) {
      console.error('useCart save error:', e)
    }
  }, [items])

  // 3) Add one unit of an event
  function add(event: ChronosEvent) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.event.uuid === event.uuid)
      if (idx > -1) {
        const copy = [...prev]
        copy[idx] = { event, quantity: copy[idx].quantity + 1 }
        return copy
      }
      return [...prev, { event, quantity: 1 }]
    })
  }

  // 4) Remove one unit (decrement or remove)
  function removeOne(uuid: string) {
    setItems(prev => {
      return prev
        .map(i =>
          i.event.uuid === uuid
            ? { event: i.event, quantity: i.quantity - 1 }
            : i
        )
        .filter(i => i.quantity > 0)
    })
  }

  // 5) Remove all units of an event
  function removeAll(uuid: string) {
    setItems(prev => prev.filter(i => i.event.uuid !== uuid))
  }

  // 6) Clear the entire cart
  function clear() {
    setItems([])
  }

  // 7) Compute total price (assumes metadata.price is like "$49")
  function totalPrice(): number {
    return items.reduce((sum, { event, quantity }) => {
      const raw = event.metadata?.price ?? ''
      const unit = parseFloat(String(raw).replace(/[^0-9.]/g, '')) || 0
      return sum + unit * quantity
    }, 0)
  }

  return {
    items,
    add,
    removeOne,
    removeAll,
    clear,
    totalPrice
  }
}
