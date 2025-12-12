/**
 * Cart Service for Patient Portal
 * Handles adding items to cart via Rocky Headless API
 */

/**
 * Get the Rocky Headless API URL from environment variable
 * Throws error if not configured
 */
const getRockyApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_ROCKY_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_ROCKY_API_URL is not configured. Please set it in your .env.local file."
    );
  }

  return apiUrl;
};

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
    const rockyApiUrl = getRockyApiUrl();
    const response = await fetch(`${rockyApiUrl}/api/cart`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: Include cookies for cross-origin requests
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
 * Add item to cart via Rocky Headless API
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
    isSubscription = false,
    subscriptionPeriod = "1_month",
  } = productData;

  console.log("[CartService] Adding item to cart via Rocky Headless:", {
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
    const rockyApiUrl = getRockyApiUrl();

    // Transform size/color into attributes format that rocky-headless expects
    let attributes = null;
    if (size || color) {
      attributes = [];
      if (size) {
        attributes.push({
          attribute: "pa_size",
          value: size.toLowerCase(),
        });
      }
      if (color) {
        attributes.push({
          attribute: "pa_color",
          value: color.toLowerCase(),
        });
      }
    }

    // Prepare request body in rocky-headless format
    const requestBody = {
      productId,
      quantity,
    };

    // Add optional fields
    if (variationId) {
      requestBody.variationId = variationId;
    }
    if (attributes) {
      requestBody.attributes = attributes;
    }
    if (meta_data && meta_data.length > 0) {
      requestBody.meta_data = meta_data;
    }
    if (isSubscription) {
      requestBody.isSubscription = isSubscription;
      requestBody.subscriptionPeriod = subscriptionPeriod;
    }

    console.log("[CartService] Request to Rocky Headless:", requestBody);

    const response = await fetch(`${rockyApiUrl}/api/cart/add-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: Include cookies for cross-origin requests
      body: JSON.stringify(requestBody),
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
          const retryResponse = await fetch(`${rockyApiUrl}/api/cart/add-item`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(requestBody),
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

    console.log("[CartService] Item added successfully via Rocky Headless:", data);
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

