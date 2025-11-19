import { NextResponse } from "next/server";
import { api, fetchProductVariations } from "@/lib/woocommerce";

export async function GET(request) {
  try {
    // Get the product ID from the URL parameter
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Fetch the product
    try {
      const productResponse = await api.get(`products/${productId}`);
      const product = productResponse.data;

      // Check if this is a variable product
      const isVariableProduct =
        product.type === "variable" || product.type === "variable-subscription";
      const hasVariations = product.variations && product.variations.length > 0;

      if (!isVariableProduct || !hasVariations) {
        return NextResponse.json({
          message: `Product ${productId} is not a variable product or has no variations`,
          product: {
            id: product.id,
            name: product.name,
            type: product.type,
            has_variations: hasVariations,
            num_variations: product.variations ? product.variations.length : 0,
          },
        });
      }

      // Determine product type from categories (optional)
      const categories = product.categories?.map((cat) => cat.slug) || [];
      let productType = "default";
      if (categories.includes("merchandise")) productType = "merchandise";
      else if (categories.includes("supplements")) productType = "supplements";

      // Fetch raw variations
      const rawVariationsResponse = await api.get(
        `products/${product.id}/variations`,
        {
          per_page: 100,
        }
      );

      // Get formatted variations
      const formattedVariations = await fetchProductVariations(
        product.id,
        productType
      );

      // Return the product and its variations
      return NextResponse.json({
        product: {
          id: product.id,
          name: product.name,
          type: product.type,
          attributes: product.attributes,
          categories: product.categories,
          productType,
          variation_ids: product.variations,
        },
        raw_variations: rawVariationsResponse.data,
        formatted_variations: formattedVariations.map((variation) => ({
          id: variation.variation_id,
          price: variation.display_price,
          regular_price: variation.display_regular_price,
          attributes: variation.attributes,
          stock_status: variation.stock_status,
          is_in_stock: variation.is_in_stock,
          image: variation.image,
        })),
      });
    } catch (productError) {
      console.error(`Error fetching product ${productId}:`, productError);
      return NextResponse.json(
        {
          error: `Error fetching product: ${productError.message}`,
          productId,
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("[Debug API] Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred fetching product data" },
      { status: 500 }
    );
  }
}

