/**
 * Cart Service for Patient Portal
 * Handles adding items to cart via API
 */

/**
 * Check if the user is authenticated by looking for authToken cookie
 */
const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  return document.cookie.includes("authToken=");
};

/**
 * Initialize cart nonce by fetching the cart
 * This ensures we have a valid nonce for cart operations
 * @returns {Promise<boolean>} Success status
 */
export const initializeCartNonce = async () => {
  try {
    console.log("[CartService] Initializing cart nonce...");
    const response = await fetch("/api/cart", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("[CartService] Cart nonce initialized successfully");
      return true;
    } else {
      console.warn("[CartService] Failed to initialize cart nonce");
      return false;
    }
  } catch (error) {
    console.error("[CartService] Error initializing cart nonce:", error);
    return false;
  }
};

/**
 * Add item to cart via API
 * @param {Object} productData - Product data including productId, quantity, variationId, size, color
 * @returns {Promise<Object>} Cart data or error
 */
export const addItemToCart = async (productData) => {
  const {
    productId,
    variationId,
    quantity = 1,
    size,
    color,
    meta_data = [],
  } = productData;

  console.log("[CartService] Adding item to cart:", {
    productId,
    variationId,
    quantity,
    size,
    color,
  });

  if (!isAuthenticated()) {
    throw new Error(
      "User not authenticated. Please log in to add items to cart."
    );
  }

  try {
    const response = await fetch("/api/cart/add-item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        variationId,
        quantity,
        size,
        color,
        meta_data,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // If nonce error, try initializing the nonce and retry once
      if (
        data.error &&
        (data.error.includes("Nonce") || data.error.includes("nonce"))
      ) {
        console.log("[CartService] Nonce error, initializing and retrying...");
        const nonceInitialized = await initializeCartNonce();

        if (nonceInitialized) {
          // Retry the add to cart operation
          const retryResponse = await fetch("/api/cart/add-item", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId,
              variationId,
              quantity,
              size,
              color,
              meta_data,
            }),
          });

          const retryData = await retryResponse.json();

          if (retryResponse.ok) {
            console.log("[CartService] Item added successfully after retry");
            return retryData;
          }
        }
      }

      throw new Error(data.error || "Failed to add item to cart");
    }

    console.log("[CartService] Item added successfully:", data);
    return data;
  } catch (error) {
    console.error("[CartService] Error adding to cart:", error);
    throw error;
  }
};

/**
 * Get cart items count from cart badge or return 0
 */
export const getCartItemsCount = () => {
    if (typeof window === "undefined") return 0;

    // Try to get cart count from localStorage or cookies
    // This would need to be implemented based on how the main site stores cart data
    return 0;
};

export default {
  addItemToCart,
  initializeCartNonce,
  isAuthenticated,
  getCartItemsCount,
};

