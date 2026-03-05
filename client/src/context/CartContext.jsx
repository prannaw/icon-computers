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

const readCartFromStorage = (storageKey) => {
  try {
    const savedCart = localStorage.getItem(storageKey);
    return savedCart ? JSON.parse(savedCart) : [];
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
    localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
  }, [cartItems, cartStorageKey]);

  const addToCart = (product) => {
    setCartItems((prev) => [...prev, { ...product, cartId: Date.now() + Math.random() }]);
  };

  const removeFromCart = (indexToRemove) => {
    setCartItems((prevItems) => prevItems.filter((_, index) => index !== indexToRemove));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(cartStorageKey);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
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
