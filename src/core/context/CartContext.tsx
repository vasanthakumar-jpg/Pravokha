import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/shared/hook/use-toast";

export interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  colorName: string;
  colorHex: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
  maxStock: number;
  sellerId: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (productId: string, variantId: string, size: string) => void;
  updateQuantity: (productId: string, variantId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("pravokha-cart");
    const parsedItems = saved ? JSON.parse(saved) : [];

    // Auto-merge duplicates for existing users
    const mergedItems: CartItem[] = [];
    parsedItems.forEach((item: CartItem) => {
      const existing = mergedItems.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId && i.size === item.size
      );
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        mergedItems.push({ ...item });
      }
    });

    return mergedItems;
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("pravokha-cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    const existing = items.find(
      (i) => i.productId === item.productId && i.variantId === item.variantId && i.size === item.size
    );

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > item.maxStock) {
        toast({
          title: "Stock limit reached",
          description: `Only ${item.maxStock} items available in stock`,
          variant: "destructive",
        });
        return;
      }

      setItems(prev => prev.map((i) =>
        i.productId === item.productId && i.variantId === item.variantId && i.size === item.size
          ? { ...i, quantity: newQuantity }
          : i
      ));

      toast({
        title: "Updated cart",
        description: `${item.title} quantity updated to ${newQuantity}`,
      });
    } else {
      if (item.maxStock < 1) {
        toast({
          title: "Out of stock",
          description: "This item is out of stock",
          variant: "destructive",
        });
        return;
      }

      if (quantity > item.maxStock) {
        toast({
          title: "Stock limit reached",
          description: `Only ${item.maxStock} items available in stock`,
          variant: "destructive",
        });
        return;
      }

      setItems(prev => [...prev, { ...item, quantity }]);

      toast({
        title: "Added to cart",
        description: `${quantity} × ${item.title} (${item.colorName}, ${item.size}) added to cart`,
      });
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, variantId: string, size: string) => {
    setItems((prev) => prev.filter(
      (i) => !(i.productId === productId && i.variantId === variantId && i.size === size)
    ));
    toast({
      title: "Removed from cart",
      description: "Item removed from your cart",
    });
  };

  const updateQuantity = (productId: string, variantId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId, size);
      return;
    }

    const item = items.find(i => i.productId === productId && i.variantId === variantId && i.size === size);

    if (item && quantity > item.maxStock) {
      toast({
        title: "Stock limit reached",
        description: `Only ${item.maxStock} items available in stock`,
        variant: "destructive",
      });
      return;
    }

    setItems(prev => prev.map((i) =>
      i.productId === productId && i.variantId === variantId && i.size === size
        ? { ...i, quantity }
        : i
    ));
  };



  const clearCart = () => {
    setItems([]);
    toast({
      title: "Cart cleared",
      description: "All items removed from cart",
    });
  };

  // Check for T-shirt combo: 3 items at Rs 325 each = Rs 949 total
  const tshirtItems = items.filter(item => item.price === 325);
  const tshirtCount = tshirtItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasComboOffer = tshirtCount === 3;

  const cartTotal = hasComboOffer
    ? 949 + items.filter(item => item.price !== 325).reduce((sum, item) => sum + item.price * item.quantity, 0)
    : items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
