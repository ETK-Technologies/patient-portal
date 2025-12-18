import { logger } from "@/utils/devLogger";

/**
 * Product Variations API Service
 * Handles fetching product variations and caching them for performance
 */

// Cache for storing variation data to avoid repeated API calls
let variationCache = {};

/**
 * Fetch product variations from the API or cache
 * @param {string} productId - The product ID
 * @param {Object} attributes - Optional attributes to match (e.g., {DIN: "02540258"})
 * @returns {Promise<Object>} Variation data
 */
export const fetchProductVariations = async (productId, attributes = null) => {
  try {
    // Check if we have this product in cache
    if (variationCache[productId]) {
      logger.log(`Using cached variations for product ${productId}`);
      return variationCache[productId];
    }

    // Fetch variations from API
    logger.log(`Fetching variations for product ${productId} from API`);
    const response = await fetch(`/api/products/debug?id=${productId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch variations: ${response.statusText}`);
    }

    const data = await response.json();

    // Process and store the variations data
    const variations = {
      productType: data.product?.productType || "default",
      isVariableProduct: data.product?.type?.includes("variable") || false,
      allVariations: data.raw_variations || [],
      formattedVariations: data.formatted_variations || [],
      // Maps attribute combinations to variation IDs
      attributeMap: {},
    };

    // Create a mapping of attribute combinations to variation IDs
    if (variations.allVariations && variations.allVariations.length > 0) {
      variations.allVariations.forEach((variation) => {
        // Create a key based on attributes (e.g., "Brand:Novo Nordisk,DIN:02540258")
        const attributeKey = variation.attributes
          .map((attr) => `${attr.name}:${attr.option}`)
          .sort()
          .join(",");

        variations.attributeMap[attributeKey] = variation.id;

        // Also create a simpler map with just DIN or Dose as keys if they exist
        variation.attributes.forEach((attr) => {
          if (attr.name === "DIN") {
            variations.attributeMap[attr.option] = variation.id;
          }
          if (
            attr.name === "Dose/ Strength" ||
            attr.name.toLowerCase().includes("dose")
          ) {
            variations.attributeMap[attr.option] = variation.id;
          }
        });
      });
    }

    // Add to cache
    variationCache[productId] = variations;

    return variations;
  } catch (error) {
    logger.error(`Error fetching product variations for ${productId}:`, error);
    // Return empty variation data
    return {
      productType: "default",
      isVariableProduct: false,
      allVariations: [],
      formattedVariations: [],
      attributeMap: {},
    };
  }
};

/**
 * Find the best matching variation ID based on product attributes
 * @param {string} productId - The product ID
 * @param {Object} attributes - The attributes to match against (e.g., {DIN: "02540258"})
 * @returns {Promise<string|null>} The best matching variation ID or null if no match
 */
export const findVariationId = async (productId, attributes = {}) => {
  try {
    // Handle empty attributes
    if (!attributes || Object.keys(attributes).length === 0) {
      return null;
    }

    // Get all variations for this product
    const variations = await fetchProductVariations(productId);

    // If not a variable product or no variations, return null
    if (
      !variations.isVariableProduct ||
      variations.allVariations.length === 0
    ) {
      return null;
    }

    // Try to match by attribute combination
    const attributeEntries = Object.entries(attributes);
    if (attributeEntries.length > 0) {
      // Try exact match first - create a key based on all attributes
      const attributeKey = attributeEntries
        .map(([name, value]) => `${name}:${value}`)
        .sort()
        .join(",");

      if (variations.attributeMap[attributeKey]) {
        return variations.attributeMap[attributeKey];
      }

      // Try individual attribute matches
      for (const [name, value] of attributeEntries) {
        // Try matching by value directly (especially useful for DIN or dose)
        if (variations.attributeMap[value]) {
          return variations.attributeMap[value];
        }

        // Try to find a variation with this attribute
        const matchingVariation = variations.allVariations.find((variation) =>
          variation.attributes.some(
            (attr) =>
              attr.name.toLowerCase() === name.toLowerCase() &&
              attr.option.toLowerCase() === value.toLowerCase()
          )
        );

        if (matchingVariation) {
          return matchingVariation.id;
        }
      }
    }

    // If no match found, return the first variation as default
    if (variations.allVariations.length > 0) {
      return variations.allVariations[0].id;
    }

    return null;
  } catch (error) {
    logger.error(`Error finding variation ID for ${productId}:`, error);
    return null;
  }
};

/**
 * Clear the variation cache
 */
export const clearVariationCache = () => {
  variationCache = {};
};

/**
 * Get specific variation data by ID
 * @param {string} productId - The product ID
 * @param {string} variationId - The variation ID
 * @returns {Promise<Object|null>} Variation data or null if not found
 */
export const getVariationById = async (productId, variationId) => {
  try {
    const variations = await fetchProductVariations(productId);
    return (
      variations.allVariations.find(
        (v) => v.id.toString() === variationId.toString()
      ) || null
    );
  } catch (error) {
    logger.error(
      `Error getting variation ${variationId} for product ${productId}:`,
      error
    );
    return null;
  }
};

