import React, { createContext, useContext, useReducer, ReactNode } from "react";

export type Event = {
  id: string;
  title: string;
  price: number;
  [key: string]: unknown;
};

// Cart item is an Event + quantity
type CartItem = Event & { quantity: number };

type CartState = { items: CartItem[] };
type CartAction =
  | { type: "ADD"; payload: Event }
  | { type: "REMOVE"; payload: Event }
  | { type: "CLEAR" };

// Reducer to handle add/remove
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i // create new item with incremented quantity
          ),
        };
      }
      return { items: [...state.items, { ...action.payload, quantity: 1 }] }; // add new item with quantity 1
    }
    case "REMOVE": {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return state;
      if (item.quantity > 1) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
          ),
        };
      }
      return { items: state.items.filter((i) => i.id !== item.id) };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

// Create context
const CartContext = createContext<{
  items: CartItem[];
  add: (evt: Event) => void;
  remove: (evt: Event) => void;
  clear: () => void;
} | null>(null);

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const add = (evt: Event) => dispatch({ type: "ADD", payload: evt });
  const remove = (evt: Event) => dispatch({ type: "REMOVE", payload: evt });
  const clear = () => dispatch({ type: "CLEAR" });

  return (
    <CartContext.Provider value={{ items: state.items, add, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook to consume it
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
