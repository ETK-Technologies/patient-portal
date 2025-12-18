/**
 * Redirect to checkout page after item has been added to cart
 * @param {boolean} openInNewTab - If true, opens checkout in new tab. Default: false
 */
export const redirectToCheckout = (openInNewTab = false) => {
  // Use the same Rocky Headless URL as cartService.js for consistency
  const baseUrl =
    process.env.NEXT_PUBLIC_ROCKY_API_URL ||
    "https://rocky-headless-git-staging-rocky-health.vercel.app";

  const checkoutUrl = `${baseUrl}/checkout`;

  console.log("[Checkout] Redirecting to:", checkoutUrl);

  // Redirect to checkout (same tab or new tab)
  if (openInNewTab) {
    window.open(checkoutUrl, "_blank");
  } else {
    window.location.href = checkoutUrl;
  }
};
