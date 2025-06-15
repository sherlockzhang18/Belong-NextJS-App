import React from "react";
import Link from "next/link";
import { useCart, CartItem } from "../services/useCart";
import Button from "@mui/material/Button";

export default function CartPage() {
    const { items, add, removeOne, removeAll, clear, totalPrice } = useCart();

    return (
        <main style={{ padding: "1rem", maxWidth: "600px", margin: "auto" }}>
            <h1>Your Cart</h1>

            {items.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {items.map((item: CartItem) => {
                            const { event, quantity } = item;
                            const raw = event.metadata?.price ?? "";
                            const unit =
                                parseFloat(
                                    String(raw).replace(/[^0-9.]/g, "")
                                ) || 0;
                            const lineTotal = unit * quantity;

                            return (
                                <li
                                    key={event.uuid}
                                    style={{
                                        marginBottom: "1rem",
                                        border: "1px solid var(--foreground)",
                                        borderRadius: 4,
                                        padding: "0.5rem",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>
                                        <strong>{event.name}</strong>
                                        <div
                                            style={{
                                                fontSize: "0.9rem",
                                                color: "var(--foreground)",
                                            }}
                                        >
                                            Unit Price: ${unit.toFixed(2)}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "0.9rem",
                                                color: "var(--foreground)",
                                            }}
                                        >
                                            Quantity: {quantity}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "0.9rem",
                                                color: "var(--foreground)",
                                            }}
                                        >
                                            Total: ${lineTotal.toFixed(2)}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "0.5rem",
                                        }}
                                    >
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() =>
                                                removeOne(event.uuid)
                                            }
                                        >
                                            −1
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => add(event)}
                                        >
                                            +1
                                        </Button>
                                        <Button
                                            variant="text"
                                            size="small"
                                            color="error"
                                            onClick={() =>
                                                removeAll(event.uuid)
                                            }
                                        >
                                            Remove All
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <div style={{ marginTop: "1rem", fontSize: "1.1rem" }}>
                        <strong>Total Price: ${totalPrice().toFixed(2)}</strong>
                    </div>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => clear()}
                        sx={{ marginTop: 2 }}
                    >
                        Clear Cart
                    </Button>
                </>
            )}

            <div style={{ marginTop: "2rem" }}>
                <Link href="/">← Back to Events</Link>
            </div>
        </main>
    );
}
