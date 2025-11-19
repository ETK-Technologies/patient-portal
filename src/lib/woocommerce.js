import { logger } from "@/utils/devLogger";

// Validate environment variables (lazy - only when API is called)
const validateEnvVariables = () => {
  const required = ["BASE_URL", "CONSUMER_KEY", "CONSUMER_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // Warn if BASE_URL looks incorrect (localhost or wrong format)
  const baseUrl = process.env.BASE_URL;
  if (
    baseUrl &&
    (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))
  ) {
    logger.warn(
      `[WooCommerce] BASE_URL appears to be localhost (${baseUrl}). This should point to your WooCommerce store (e.g., https://myrocky.ca)`
    );
  }
};

// WooCommerce API wrapper using fetch (works without external package)
export const api = {
  get: async (endpoint, params = {}) => {
    // Validate environment variables only when API is called
    validateEnvVariables();

    try {
      let baseUrl = process.env.BASE_URL;
      const consumerKey = process.env.CONSUMER_KEY;
      const consumerSecret = process.env.CONSUMER_SECRET;

      // Remove trailing slash from BASE_URL if present
      if (baseUrl && baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
      }

      // Build query string with auth and params
      const queryParams = new URLSearchParams({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        ...params,
      });

      const url = `${baseUrl}/wp-json/wc/v3/${endpoint}?${queryParams.toString()}`;

      // Log the request (without exposing secrets)
      logger.log(`[WooCommerce] Fetching: ${endpoint}`);
      logger.log(
        `[WooCommerce] URL: ${url
          .replace(consumerSecret, "***")
          .replace(consumerKey, "ck_***")}`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;
        try {
          errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === "string") {
            errorMessage = errorData;
          }
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        // Log the full error for debugging
        logger.error(`[WooCommerce] API Error for ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          url: url.replace(consumerSecret, "***"),
          errorData,
        });

        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      if (error.name === "AbortError") {
        logger.error(`[WooCommerce] Request timeout for ${endpoint}`);
        throw new Error(`Request timeout for ${endpoint} after 5 minutes`);
      }
      // Preserve status if it exists
      if (error.status) {
        error.response = { status: error.status };
      }
      logger.error(`[WooCommerce] Error in api.get for ${endpoint}:`, error);
      throw error;
    }
  },
};

// Cache for product variations (optional but recommended)
const variationsCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch product variations with caching
 */
export async function fetchProductVariations(
  productId,
  productType = "default"
) {
  // Check cache first
  const cacheKey = `variations_${productId}_${productType}`;
  const cachedVariations = variationsCache.get(cacheKey);
  if (cachedVariations && Date.now() - cachedVariations.timestamp < CACHE_TTL) {
    logger.log(`Using cached variations for product ID: ${productId}`);
    return cachedVariations.data;
  }

  try {
    logger.log(`Fetching variations for product ID: ${productId}`);
    const response = await api.get(`products/${productId}/variations`, {
      per_page: 100,
      status: "publish",
    });

    // Transform variations to standardized format
    const formattedVariations = response.data.map((variation) => {
      // Format attributes
      const attributes = {};
      variation.attributes.forEach((attr) => {
        const name = `attribute_${attr.name
          .toLowerCase()
          .replace(/\s+/g, "-")}`;
        const value = attr.option.toLowerCase().replace(/\s+/g, "-");
        attributes[name] = value;
      });

      // Create formatted variation object
      return {
        attributes: attributes,
        backorders_allowed: variation.backorders_allowed,
        dimensions: variation.dimensions || {
          length: "",
          width: "",
          height: "",
        },
        display_price: parseFloat(variation.regular_price || variation.price),
        display_regular_price: parseFloat(
          variation.regular_price || variation.price
        ),
        image: variation.image
          ? {
              title: variation.image.name || "",
              url: variation.image.src || "",
              alt: variation.image.alt || "",
              src: variation.image.src || "",
              full_src: variation.image.src || "",
              full_src_w: variation.image.width || 975,
              full_src_h: variation.image.height || 650,
            }
          : null,
        image_id: variation.image?.id || "",
        is_downloadable: variation.downloadable || false,
        is_in_stock: variation.stock_status === "instock",
        is_purchasable: variation.purchasable || true,
        is_virtual: variation.virtual || false,
        price_html: `$${variation.price}`,
        sku: variation.sku || "",
        variation_description: variation.description || "",
        variation_id: variation.id,
        variation_is_active: 1,
        variation_is_visible: 1,
        weight: variation.weight || "",
        stock_status: variation.stock_status || "instock",
      };
    });

    // Cache the variations
    variationsCache.set(cacheKey, {
      data: formattedVariations,
      timestamp: Date.now(),
    });

    return formattedVariations;
  } catch (error) {
    logger.error(`Error fetching variations: ${error.message}`);
    return [];
  }
}
