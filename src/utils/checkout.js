/**
 * Redirects to Rocky-Headless checkout with cart products
 * @param {Array} cartItems - Array of cart items with { productId, quantity, variationId?, size?, color? }
 * @param {boolean} openInNewTab - If true, opens checkout in new tab. Default: false
 */
export const handleCheckout = (cartItems, openInNewTab = false) => {
  // Validate cart is not empty
  if (!cartItems || cartItems.length === 0) {
    return;
  }

  // Variable products that require variation ID or attributes
  const VARIABLE_PRODUCTS = []; // All variable merch now uses variation IDs directly
  // Product-specific requirements
  const PRODUCT_REQUIRES_COLOR = [];

  // Build product IDs and URL parameters
  const productIds = [];
  const urlParams = new URLSearchParams();

  cartItems.forEach((item) => {
    productIds.push(item.productId);

    // Check if this is a variable product
    const isVariableProduct = VARIABLE_PRODUCTS.includes(item.productId);
    const requiresColor = PRODUCT_REQUIRES_COLOR.includes(item.productId);

    if (isVariableProduct) {
      // For variable products, we need either variationId OR size + (color if required)
      if (item.variationId) {
        // Option 1: Use variation ID directly
        urlParams.append(`variation_${item.productId}`, item.variationId);
      } else if (item.size) {
        // Option 2: Use Size and Color attributes
        // CRITICAL: Size is always required for variable products
        // Normalize size to lowercase (WooCommerce default_attributes use lowercase)
        const normalizedSize = item.size.toLowerCase().trim();
        urlParams.append(`${item.productId}_size`, normalizedSize);

        // Color handling:
        // - Tee (567280) REQUIRES color (has Color attribute)
        // - Hoodie (592501) does NOT have Color attribute, so don't send color
        if (requiresColor) {
          // Tee requires color
          if (item.color) {
            const normalizedColor = item.color.toLowerCase().trim();
            urlParams.append(`${item.productId}_color`, normalizedColor);
          } else {
            // Tee requires color but it's missing - skip this product
            console.error(
              `Product ${item.productId} (Tee) requires color attribute but none provided. Skipping.`
            );
            const index = productIds.indexOf(item.productId);
            if (index > -1) {
              productIds.splice(index, 1);
            }
            return; // Skip this item
          }
        }
        // For Hoodie (592501), we don't send color (it doesn't have Color attribute)
        // Only size is needed
      } else {
        // Variable product without size - show warning and skip
        console.error(
          `Variable product ${item.productId} requires size attribute but none provided. Skipping.`
        );
        // Remove this product from the checkout
        const index = productIds.indexOf(item.productId);
        if (index > -1) {
          productIds.splice(index, 1);
        }
      }
    }
    // Simple products don't need any additional parameters
  });

  // If no valid products after filtering, don't redirect
  if (productIds.length === 0) {
    console.error("No valid products to checkout");
    alert(
      "Unable to proceed to checkout. Please ensure all variable products have size selected."
    );
    return;
  }

  // Build checkout URL with a unique token to prevent duplicate processing
  // This is critical because when a user is not logged in, the main website
  // processes the onboarding-add-to-cart parameter twice:
  // 1. Once when the page first loads (before login)
  // 2. Once again after the user logs in (page reloads with same URL)
  // 
  // The main website should check sessionStorage for this token before processing.
  // If token exists, skip processing (already added to cart).
  // If token doesn't exist, process add-to-cart and store token in sessionStorage.

  // Create a hash of cart items for better deduplication
  const cartItemsHash = btoa(
    JSON.stringify({
      ids: productIds.sort(),
      params: Object.fromEntries(urlParams)
    })
  ).substring(0, 16).replace(/[+/=]/g, ''); // URL-safe hash

  const addToCartToken = `cart_${Date.now()}_${cartItemsHash}`;

  // Store token in sessionStorage so main website can check for duplicates
  if (typeof window !== "undefined") {
    try {
      const tokenData = {
        token: addToCartToken,
        timestamp: Date.now(),
        productIds: productIds,
        hash: cartItemsHash
      };

      const processedTokens = JSON.parse(
        sessionStorage.getItem("processed_cart_tokens") || "[]"
      );
      // Keep only last 20 tokens to prevent storage bloat
      const recentTokens = processedTokens.slice(-19);
      recentTokens.push(tokenData);
      sessionStorage.setItem("processed_cart_tokens", JSON.stringify(recentTokens));

      console.log("[Checkout] Cart token stored:", addToCartToken);
    } catch (e) {
      console.warn("[Checkout] Could not store cart token:", e);
    }
  }

  const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?onboarding-add-to-cart=${productIds.join(
    ","
  )}&cart_token=${addToCartToken}`;
  const queryString = urlParams.toString();
  const checkoutUrl = queryString ? `${baseUrl}&${queryString}` : baseUrl;

  // Debug logging to help troubleshoot
  console.log("[Checkout] Product IDs:", productIds);
  console.log("[Checkout] URL Parameters:", Object.fromEntries(urlParams));
  console.log("[Checkout] Full URL:", checkoutUrl);

  // Redirect to checkout (same tab or new tab)
  if (openInNewTab) {
    window.open(checkoutUrl, "_blank");
  } else {
    window.location.href = checkoutUrl;
  }
};
