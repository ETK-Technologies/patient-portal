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
  const VARIABLE_PRODUCTS = ["592501", "567280"]; // Hoodie and Tee
  // Product-specific requirements
  const PRODUCT_REQUIRES_COLOR = ["567280"]; // Only Tee requires color

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

  // Build checkout URL
  const baseUrl = `http://localhost:3000/checkout?onboarding-add-to-cart=${productIds.join(
    ","
  )}`;
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
