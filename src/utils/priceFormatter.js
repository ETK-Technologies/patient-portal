/**
 * Format price to display format
 * @param {number|string} price - Price value
 * @returns {string} Formatted price string
 */
export function formatPrice(price) {
  if (!price && price !== 0) return "0.00";
  
  const numericPrice = typeof price === "number" ? price : parseFloat(String(price).replace("$", "").replace(",", ""));
  
  if (isNaN(numericPrice)) return "0.00";
  
  return numericPrice.toFixed(2);
}

