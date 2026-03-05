import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

const getCurrentUserId = () => {
  try {
    const storageData = JSON.parse(localStorage.getItem('user'));
    return storageData?.id || storageData?._id || storageData?.result?._id || 'guest';
  } catch (error) {
    return 'guest';
  }
};

const getCartStorageKey = () => `cart_${getCurrentUserId()}`;

const getProductKey = (item = {}) =>
  String(item._id || item.id || item.productId || item.sku || item.name || item.cartId || '');

const normalizeQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
};

const normalizeCartItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  const merged = new Map();
  items.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const key = getProductKey(item) || `fallback_${index}_${Date.now()}`;
    const qty = normalizeQuantity(item.quantity);
    const existing = merged.get(key);

    if (existing) {
      existing.quantity += qty;
      return;
    }

    merged.set(key, {
      ...item,
      quantity: qty,
      cartId: item.cartId || `${Date.now()}_${Math.random()}`
    });
  });

  return Array.from(merged.values());
};

const readCartFromStorage = (storageKey) => {
  try {
    const savedCart = localStorage.getItem(storageKey);
    return savedCart ? normalizeCartItems(JSON.parse(savedCart)) : [];
  } catch (error) {
    console.error('Error parsing cart from localStorage', error);
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartStorageKey, setCartStorageKey] = useState(getCartStorageKey);
  const [cartItems, setCartItems] = useState(() => readCartFromStorage(getCartStorageKey()));

  // Keep cart tied to the active logged-in user.
  useEffect(() => {
    const syncUserCart = () => {
      const nextKey = getCartStorageKey();
      if (nextKey !== cartStorageKey) {
        setCartStorageKey(nextKey);
        setCartItems(readCartFromStorage(nextKey));
      }
    };

    syncUserCart();
    window.addEventListener('storage', syncUserCart);
    return () => window.removeEventListener('storage', syncUserCart);
  }, [cartStorageKey]);

  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(normalizeCartItems(cartItems)));
  }, [cartItems, cartStorageKey]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const nextItems = normalizeCartItems(prev);
      const incomingKey = getProductKey(product);
      const existingIndex = nextItems.findIndex((item) => getProductKey(item) === incomingKey);

      if (existingIndex >= 0) {
        return nextItems.map((item, index) => (
          index === existingIndex
            ? { ...item, quantity: normalizeQuantity(item.quantity) + 1 }
            : item
        ));
      }

      return [
        ...nextItems,
        { ...product, quantity: 1, cartId: Date.now() + Math.random() }
      ];
    });
  };

  const removeFromCart = (indexToRemove) => {
    setCartItems((prevItems) => prevItems.filter((_, index) => index !== indexToRemove));
  };

  const updateCartQuantity = (indexToUpdate, nextQuantity) => {
    const safeQuantity = Math.min(99, normalizeQuantity(nextQuantity));
    setCartItems((prevItems) => prevItems.map((item, index) => (
      index === indexToUpdate ? { ...item, quantity: safeQuantity } : item
    )));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(cartStorageKey);
  };

  return (
    <CartContext.Provider
      value={{ cartItems: normalizeCartItems(cartItems), addToCart, removeFromCart, updateCartQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
