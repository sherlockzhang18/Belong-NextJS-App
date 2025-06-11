import { useState, useCallback } from 'react'

export interface Event
{
  id: string
  title: string
  price: number
}

export interface CartItem extends Event {
  quantity: number
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const add = useCallback((e: Event) => {
    setItems(prev => {
      const exist = prev.find(item => item.id === e.id)
      if (exist) {
        return prev.map(item =>
          item.id === e.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...e, quantity: 1 }]
    })
  }, [])

  const remove = useCallback((ci: CartItem) => {
    setItems(prev => {
      const exist = prev.find(item => item.id === ci.id)
      if (!exist) return prev
      if (exist.quantity <= 1) {
        return prev.filter(item => item.id !== ci.id)
      }
      return prev.map(item =>
        item.id === ci.id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
  }, [])

  return { items, add, remove, clear }
}

export type CartHook = ReturnType<typeof useCart>