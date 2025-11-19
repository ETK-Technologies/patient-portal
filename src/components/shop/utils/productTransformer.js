/**
 * Transform WooCommerce product data to our shop format
 */
export function transformWooCommerceProduct(wcProduct) {
  if (!wcProduct) return null;

  // Extract images
  const images = wcProduct.images?.map((img) => img.src) || [];
  const primaryImage = images[0] || "";

  // Determine if variable product
  const isVariable = wcProduct.type === "variable";

  // Get price - for ShopBanner format, use numeric price
  // For variable products, use base price or null
  let price = null;
  let priceDisplay = "Varies";

  if (wcProduct.price) {
    const numericPrice = parseFloat(wcProduct.price);
    if (!isNaN(numericPrice)) {
      price = numericPrice; // Numeric price for ShopBanner
      priceDisplay = `$${numericPrice.toFixed(2)}`; // Formatted string for display
    }
  }

  // If variable product and no base price, keep as "Varies"
  if (isVariable && !price) {
    priceDisplay = "Varies";
  }

  // Clean HTML from descriptions
  const cleanHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const shortDescription = cleanHtml(wcProduct.short_description);
  const fullDescription = cleanHtml(wcProduct.description);

  // Transform to our format
  // For ShopBanner: price should be numeric, image should be string
  const transformed = {
    id: wcProduct.id,
    name: wcProduct.name,
    price: price, // Numeric price for ShopBanner (or null for variable products)
    priceDisplay: priceDisplay, // Formatted string for display
    image: primaryImage, // Single image URL string for ShopBanner
    images: images.length > 1 ? images : [primaryImage], // Array of images for ProductModal
    type: "clothing",
    productId: String(wcProduct.id),
    isVariable: isVariable,
    description: shortDescription || fullDescription || "",
    // Store full WooCommerce data for reference
    _wcData: wcProduct,
  };

  // Add details for products with full description
  if (fullDescription && fullDescription !== shortDescription) {
    transformed.details = {
      description: fullDescription,
    };
  }

  // Add attributes info for variable products
  if (isVariable && wcProduct.attributes) {
    transformed.attributes = wcProduct.attributes.map((attr) => ({
      name: attr.name,
      options: attr.options || [],
    }));
  }

  return transformed;
}

/**
 * Transform array of WooCommerce products
 */
export function transformProductsArray(wcProducts, includeVariations = false) {
  if (!Array.isArray(wcProducts)) {
    return [];
  }

  return wcProducts
    .map((product) => transformWooCommerceProduct(product))
    .filter((product) => product !== null);
}
