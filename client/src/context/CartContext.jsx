import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // 1. Initialize state from localStorage with error handling
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error("❌ Error parsing cart from localStorage", error);
            return [];
        }
    });

    // 2. Persist to localStorage whenever cartItems changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // 3. Add to Cart: Using a unique ID check is safer than just appending
    const addToCart = (product) => {
        // We spread to ensure we aren't mutating references
        setCartItems((prev) => [...prev, { ...product, cartId: Date.now() + Math.random() }]);
        console.log("🛒 Added to cart:", product.name);
    };

    // 4. Remove from Cart: Improved to ensure the state updates correctly
    const removeFromCart = (indexToRemove) => {
        setCartItems((prevItems) => 
            prevItems.filter((_, index) => index !== indexToRemove)
        );
    };

    // 5. Clear Cart: Essential for the post-payment redirect
    const clearCart = () => {
        console.log("🧹 Clearing cart state and storage...");
        setCartItems([]);
        localStorage.removeItem('cart'); 
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
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};