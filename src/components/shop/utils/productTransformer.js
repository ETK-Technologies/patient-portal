import { logger } from "@/utils/devLogger";
import { fetchProductVariations } from "@/lib/api/productVariations";

/**
 * Helper function to strip HTML tags from text
 */
const stripHtmlTags = (htmlString) => {
  if (!htmlString) return "";
  return htmlString.replace(/<[^>]*>/g, "").trim();
};

/**
 * Helper function to calculate sale percentage
 */
export const calculateSalePercentage = (regularPrice, salePrice) => {
  if (!salePrice || regularPrice <= 0) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
};

/**
 * Fetches and processes variation data for a product (only for variable products)
 */
export const fetchProductVariationData = async (productId, productType = null) => {
  try {
    // If product type is provided and it's not a variable product, skip fetching
    if (productType && !productType.includes("variable")) {
      return {
        hasVariations: false,
        variations: [],
        variationPrices: {},
        variationImages: {},
        variationAttributes: {},
        variationDetails: {},
        formattedVariations: [],
      };
    }

    // Fetch variations using the productVariations API service
    const variationData = await fetchProductVariations(productId);

    if (!variationData || !variationData.isVariableProduct) {
      return {
        hasVariations: false,
        variations: [],
        variationPrices: {},
        variationImages: {},
        variationAttributes: {},
        variationDetails: {},
        formattedVariations: [],
      };
    }

    // Get raw variations and formatted variations from API response
    const rawVariations = variationData.allVariations || [];
    const apiFormattedVariations = variationData.formattedVariations || [];

    if (!rawVariations || rawVariations.length === 0) {
      return {
        hasVariations: false,
        variations: [],
        variationPrices: {},
        variationImages: {},
        variationAttributes: {},
        variationDetails: {},
        formattedVariations: [],
      };
    }

    const variationPrices = {};
    const variationImages = {};
    const variationAttributes = {};
    const variationDetails = {};
    const formattedVariations = [];

    rawVariations.forEach((variation) => {
      const variationId = variation.id;

      // Store detailed price information
      const price = parseFloat(variation.price || 0);
      const regularPrice = parseFloat(variation.regular_price || variation.price || 0);
      const salePrice = variation.sale_price ? parseFloat(variation.sale_price) : null;

      variationPrices[variationId] = {
        price: price,
        regular_price: regularPrice,
        sale_price: salePrice,
      };

      // Store image information
      if (variation.image && variation.image.src) {
        variationImages[variationId] = {
          src: variation.image.src,
          alt: variation.image.alt || "",
          title: variation.image.title || "",
        };
      }

      // Store attribute information - keep as array format
      const attrArray = variation.attributes || [];
      variationAttributes[variationId] = attrArray;

      // Calculate sale percentage
      const salePercentage = calculateSalePercentage(regularPrice, salePrice);

      // Store detailed variation information for components
      variationDetails[variationId] = {
        id: variationId,
        name: variation.name || "",
        regular_price: regularPrice,
        sale_price: salePrice,
        sale_percentage: salePercentage,
        stock_status: variation.stock_status || "instock",
        price: price,
        sku: variation.sku || "",
        description: variation.description || "",
        image: variation.image
          ? {
            src: variation.image.src,
            alt: variation.image.alt || "",
            title: variation.image.title || "",
          }
          : null,
        attributes: attrArray,
        purchasable: variation.purchasable !== false,
        in_stock: variation.stock_status === "instock",
      };

      // Create formatted variation for cart/display
      const formattedAttrs = {};
      attrArray.forEach((attr) => {
        const name = `attribute_${attr.name?.toLowerCase().replace(/\s+/g, "-") || attr.slug?.replace("pa_", "") || "unknown"}`;
        const value = attr.option?.toLowerCase().replace(/\s+/g, "-") || "";
        formattedAttrs[name] = value;
      });

      formattedVariations.push({
        id: variationId,
        price: price,
        regular_price: regularPrice,
        attributes: formattedAttrs,
      });
    });

    // Use formatted variations from API if available, otherwise use our own
    const finalFormattedVariations =
      apiFormattedVariations.length > 0
        ? apiFormattedVariations
        : formattedVariations;

    return {
      hasVariations: true,
      variations: rawVariations, // Store raw variations
      variationPrices: variationPrices,
      variationImages: variationImages,
      variationAttributes: variationAttributes,
      variationDetails: variationDetails,
      formattedVariations: finalFormattedVariations,
    };
  } catch (error) {
    console.error(`Error fetching variation data for product ${productId}:`, error);
    return {
      hasVariations: false,
      variations: [],
      variationPrices: {},
      variationImages: {},
      variationAttributes: {},
      variationDetails: {},
      formattedVariations: [],
    };
  }
};

/**
 * Helper function to get color hex value from color name
 */
const getColorValue = (colorName) => {
  const colorMap = {
    black: "#000000",
    white: "#FFFFFF",
    red: "#FF0000",
    blue: "#0000FF",
    green: "#008000",
    yellow: "#FFFF00",
    orange: "#FFA500",
    purple: "#800080",
    pink: "#FFC0CB",
    gray: "#808080",
    grey: "#808080",
    brown: "#A52A2A",
    navy: "#000080",
    maroon: "#800000",
    olive: "#808000",
    teal: "#008080",
    silver: "#C0C0C0",
    gold: "#FFD700",
  };

  return colorMap[colorName.toLowerCase()] || "#000000";
};

/**
 * Helper function to extract material information from product data
 */
const extractMaterial = (productData) => {
  const description = stripHtmlTags(productData.description || "").toLowerCase();
  const shortDesc = stripHtmlTags(productData.short_description || "").toLowerCase();

  if (description.includes("cotton") || shortDesc.includes("cotton")) {
    return "100% cotton";
  }
  if (description.includes("polyester") || shortDesc.includes("polyester")) {
    return "100% polyester";
  }
  if (description.includes("wool") || shortDesc.includes("wool")) {
    return "100% wool";
  }
  if (description.includes("silk") || shortDesc.includes("silk")) {
    return "100% silk";
  }

  return "Premium materials";
};

/**
 * Helper function to generate size chart based on available sizes
 */
const generateSizeChart = (sizes) => {
  const sizeChart = {};

  sizes.forEach((size) => {
    if (size === "One Size Fits All") {
      sizeChart[size] = "Adjustable fit";
    } else if (size === "S") {
      sizeChart[size] = 'Chest: 39"';
    } else if (size === "M") {
      sizeChart[size] = 'Chest: 42"';
    } else if (size === "L") {
      sizeChart[size] = 'Chest: 45"';
    } else if (size === "XL") {
      sizeChart[size] = 'Chest: 48"';
    } else if (size === "XXL") {
      sizeChart[size] = 'Chest: 51"';
    } else {
      sizeChart[size] = `Size ${size}`;
    }
  });

  return sizeChart;
};

/**
 * Extracts and transforms WooCommerce product data into a standardized format
 */
export const extractProductData = (productData, variationData = null) => {
  if (!productData) return null;

  // Extract images from the product data
  const images = productData.images?.map((img) => img.src) || [];

  // Get the first image as the main image
  const mainImage = images[0] || "";

  // Extract price information based on product type
  const isVariable = productData.type === "variable";
  const regularPrice = productData.regular_price
    ? parseFloat(productData.regular_price)
    : 0;
  const salePrice = productData.sale_price ? parseFloat(productData.sale_price) : null;
  const basePrice = productData.price ? parseFloat(productData.price) : 0;

  // For variable products, use price field; for simple products, use regular_price field
  const displayPrice = salePrice || (isVariable ? basePrice : regularPrice);

  const attributes = productData.attributes || [];

  const sizeAttribute = attributes.find(
    (attr) =>
      attr.name?.toLowerCase().includes("size") ||
      attr.name?.toLowerCase().includes("pa_size")
  );
  const colorAttribute = attributes.find(
    (attr) =>
      attr.name?.toLowerCase().includes("color") ||
      attr.name?.toLowerCase().includes("pa_color")
  );

  // Sort sizes from small to XL for better UX
  const sortSizes = (sizes) => {
    const order = [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "XXXL",
      "One Size",
      "One Size Fits All",
    ];
    return sizes.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  };

  const sizes = sortSizes(sizeAttribute?.options || ["One Size Fits All"]);
  const colors =
    colorAttribute?.options?.map((color) => ({
      name: color.toLowerCase(),
      value: getColorValue(color),
    })) || [];

  // Process variation data if provided
  const processedVariationData = variationData || {
    hasVariations: false,
    variations: [],
    variationPrices: {},
    variationImages: {},
    variationAttributes: {},
    variationDetails: {},
    formattedVariations: [],
  };

  return {
    id: productData.id,
    name: productData.name,
    slug: productData.slug,
    description: stripHtmlTags(productData.description) || "",
    short_description: stripHtmlTags(productData.short_description) || "",
    images: images,
    image: mainImage,
    regular_price: regularPrice,
    sale_price: salePrice,
    base_price: basePrice,
    price: displayPrice,
    priceDisplay: displayPrice > 0 ? `$${displayPrice.toFixed(2)}` : "Varies",
    sizes: sizes,
    colors: colors,
    // Product type and variations
    type: productData.type || "simple",
    productId: String(productData.id),
    isVariable: isVariable,
    variations: productData.variations || [],
    has_variations:
      processedVariationData.hasVariations ||
      (productData.variations && productData.variations.length > 0) ||
      false,
    // Enhanced variation data
    variationData: {
      hasVariations: processedVariationData.hasVariations,
      variations: processedVariationData.variations,
      variationPrices: processedVariationData.variationPrices,
      variationImages: processedVariationData.variationImages,
      variationAttributes: processedVariationData.variationAttributes,
      variationDetails: processedVariationData.variationDetails,
      formattedVariations: processedVariationData.formattedVariations,
    },
    // Additional fields
    attributes: attributes.map((attr) => ({
      name: attr.name,
      options: attr.options || [],
    })),
    material: extractMaterial(productData),
    fit: "true to size",
    modelInfo: "",
    sizeChart: generateSizeChart(sizes),
    detailedDescription:
      stripHtmlTags(productData.description) ||
      stripHtmlTags(productData.short_description) ||
      "",
    // Store full WooCommerce data for reference
    _wcData: productData,
  };
};

/**
 * Transforms an array of WooCommerce products into the featured products format
 */
export const transformProductsArray = async (
  products,
  includeVariations = false
) => {
  if (!Array.isArray(products)) return [];

  if (!includeVariations) {
    // Synchronous processing without variations
    return products
      .map((product) => extractProductData(product))
      .filter((product) => product !== null);
  }

  // Asynchronous processing with variations (only for variable products)
  const transformedProducts = await Promise.all(
    products.map(async (product) => {
      try {
        // Check if product is variable before fetching variation data
        const productType = product.type || "simple";
        const isVariableProduct = productType.includes("variable");

        let variationData = null;
        if (isVariableProduct) {
          // Only fetch variation data for variable products
          variationData = await fetchProductVariationData(
            product.id,
            productType
          );
        }

        // Extract product data with variation information (if available)
        return extractProductData(product, variationData);
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        // Fallback to basic product data without variations
        return extractProductData(product);
      }
    })
  );

  return transformedProducts.filter((product) => product !== null);
};

/**
 * Transforms a single product with variation data (only for variable products)
 */
export const transformSingleProduct = async (
  product,
  includeVariations = false
) => {
  if (!product) return null;

  if (!includeVariations) {
    return extractProductData(product);
  }

  try {
    // Check if product is variable before fetching variation data
    const productType = product.type || "simple";
    const isVariableProduct = productType.includes("variable");

    let variationData = null;
    if (isVariableProduct) {
      // Only fetch variation data for variable products
      variationData = await fetchProductVariationData(product.id, productType);
    }

    return extractProductData(product, variationData);
  } catch (error) {
    console.error(`Error processing product ${product.id}:`, error);
    return extractProductData(product);
  }
};
