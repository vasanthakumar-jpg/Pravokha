import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/Separator";
import { Link } from "react-router-dom";
import styles from "./CartDrawer.module.css";
import { cn } from "@/lib/utils";

export function CartDrawer() {
    const { items, removeFromCart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen, cartCount, clearCart } = useCart();

    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader>
                    <div className={styles.header}>
                        <SheetTitle className={styles.title}>
                            <ShoppingBag className="h-5 w-5" />
                            Shopping Cart ({cartCount})
                        </SheetTitle>
                        {items.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive">
                                Clear All
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className={styles.emptyState}>
                        <ShoppingBag className={styles.emptyIcon} />
                        <div>
                            <h3 className={styles.emptyTitle}>Your cart is empty</h3>
                            <p className={styles.emptyText}>
                                Add some items to get started!
                            </p>
                        </div>
                        <Button onClick={() => setIsCartOpen(false)}>
                            Continue Shopping
                        </Button>
                    </div>
                ) : (
                    <>
                        <ScrollArea className={styles.scrollArea}>
                            <div className={styles.itemsContainer}>
                                {items.map((item) => (
                                    <div key={`${item.productId}-${item.variantId}-${item.size}`} className={styles.item}>
                                        <div className={styles.itemImageContainer}>
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className={styles.itemImage}
                                            />
                                        </div>

                                        <div className={styles.itemDetails}>
                                            <div className={styles.itemHeader}>
                                                <div className={styles.itemInfo}>
                                                    <h4 className={styles.itemTitle}>{item.title}</h4>
                                                    <div className={styles.itemVariant}>
                                                        <div
                                                            className={styles.colorIndicator}
                                                            style={{ backgroundColor: item.colorHex }}
                                                            title={item.colorName}
                                                        />
                                                        <span className={styles.variantText}>
                                                            {item.colorName}
                                                        </span>
                                                        <span className={styles.variantText}>•</span>
                                                        <span className={styles.variantText}>
                                                            Size: {item.size}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={styles.removeButton}
                                                    onClick={() => removeFromCart(item.productId, item.variantId, item.size)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className={styles.quantityRow}>
                                                <div className={styles.quantityControls}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={styles.quantityButton}
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.productId,
                                                                item.variantId,
                                                                item.size,
                                                                item.quantity - 1
                                                            )
                                                        }
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className={styles.quantityValue}>
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={styles.quantityButton}
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.productId,
                                                                item.variantId,
                                                                item.size,
                                                                item.quantity + 1
                                                            )
                                                        }
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <p className={styles.itemPrice}>₹{item.price * item.quantity}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className={styles.footer}>
                            <div className={styles.actions}>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Subtotal</span>
                                    <span>₹{cartTotal}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Shipping</span>
                                    <span className={styles.freeShipping}>Free</span>
                                </div>
                                <Separator />
                                <div className={styles.totalRow}>
                                    <span>Total</span>
                                    <span>₹{cartTotal}</span>
                                </div>
                            </div>

                            <div className={styles.actions}>
                                <Link to="/checkout" className="block" onClick={() => setIsCartOpen(false)}>
                                    <Button className={cn(styles.checkoutButton)} size="lg">
                                        Proceed to Checkout
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    className={styles.continueButton}
                                    onClick={() => setIsCartOpen(false)}
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}

