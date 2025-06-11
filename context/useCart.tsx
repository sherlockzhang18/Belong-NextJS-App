// context/useCart.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

export interface Price {
  id: string;
  unit_amount?: number;
  currency?: string;
}

export interface Event {
  id: string;
  title: string;
  price: Price | null;
  size?: string;
  quantity?: number;
}

export interface UseCart {
  items: Event[];
  add: (item: Event) => boolean;
  remove: (id: string, size?: string) => boolean;
  get: (id: string, size?: string) => Event | null;
  clear: () => void;
  checkout: () => {
    id: string;
    price: Price | null;
    quantity: number;
    size: string;
  }[];
}

export default function useCart(): UseCart {
  const [items, setItems] = useState<Event[]>([]);

  // hydrate from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        console.warn("Failed to parse saved cart");
      }
    }
  }, []);

  // persist to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  // UPDATED add(): increments quantity if exists
  const add = useCallback((item: Event): boolean => {
    if (!item.price) return false;

    setItems((prev) => {
      const exist = prev.find((i) => i.id === item.id && i.size === item.size);

      if (exist) {
        // increment the existing item’s quantity
        return prev.map((i) =>
          i.id === item.id && i.size === item.size
            ? { ...i, quantity: (i.quantity ?? 1) + 1 }
            : i
        );
      }

      // otherwise add brand-new with quantity = 1
      return [...prev, { ...item, quantity: 1 }];
    });

    return true;
  }, []);

  const remove = useCallback((id: string, size?: string): boolean => {
    setItems((prev) =>
      prev.filter((i) => !(i.id === id && (size == null || i.size === size)))
    );
    return true;
  }, []);

  const get = useCallback(
    (id: string, size?: string): Event | null => {
      return (
        items.find((i) => i.id === id && (size == null || i.size === size)) ??
        null
      );
    },
    [items]
  );

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const checkout = useCallback(
    () =>
      items.map((i) => ({
        id: i.id,
        price: i.price,
        quantity: i.quantity ?? 1,
        size: i.size ?? "",
      })),
    [items]
  );

  return { items, add, remove, get, clear, checkout };
}
