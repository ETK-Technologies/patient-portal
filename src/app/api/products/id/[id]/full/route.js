import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";
import { logger } from "@/utils/devLogger";

export async function GET(request, { params }) {
  try {
    // Get product ID from the route parameter
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "No product ID provided" },
        { status: 400 }
      );
    }

    // Fetch complete product data by ID
    logger.log(`Fetching product with ID: ${id}`);
    const response = await api.get(`products/${id}`);

    const productData = response.data;

    if (!productData) {
      logger.error(`Product ${id} returned null or undefined`);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Return the complete product data without filtering
    logger.log(`Successfully fetched product ${id}: ${productData.name}`);
    return NextResponse.json(productData);
  } catch (error) {
    logger.error("Error fetching full product data by ID:", error);

    // Provide more detailed error information
    const errorMessage = error.message || "Failed to fetch product";
    const statusCode = error.response?.status || error.status || 500;

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: statusCode }
    );
  }
}
