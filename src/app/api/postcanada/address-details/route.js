import { NextResponse } from "next/server";
import { logger } from "@/utils/devLogger";

const POSTCANADA_API_KEY = process.env.POSTCANADA_API_KEY;
const POSTCANADA_API_URL =
  "https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Retrieve/v2.10/json3.ws";

export async function POST(request) {
  try {
    const { addressId, searchTerm } = await request.json();

    if (!addressId) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    if (!POSTCANADA_API_KEY) {
      logger.error("Post Canada API key is missing");
      return NextResponse.json(
        { error: "Post Canada API key is not configured" },
        { status: 500 }
      );
    }

    logger.log("Making request to Post Canada API for address details:", {
      addressId,
      searchTerm,
    });

    const url = new URL(POSTCANADA_API_URL);
    url.searchParams.append("Key", POSTCANADA_API_KEY);
    url.searchParams.append("Id", addressId);

    // Set origin based on environment
    const origin =
      process.env.NODE_ENV === "production"
        ? "https://www.myrocky.ca"
        : "http://localhost:3000";

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        Referer: origin,
      },
    });

    logger.log("Post Canada API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Post Canada API error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Post Canada API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    logger.log("Post Canada API response data:", data);

    // Check for API errors first
    if (data.Error) {
      logger.error("Post Canada API error:", data);
      return NextResponse.json(
        {
          error: "Post Canada API Error",
          details: data.Description || data.Cause || "Unknown error",
          resolution: data.Resolution || "Please check your API configuration",
        },
        { status: 400 }
      );
    }

    if (!data.Items || !Array.isArray(data.Items) || data.Items.length === 0) {
      logger.error("Invalid response format from Post Canada:", data);
      return NextResponse.json(
        { error: "Invalid response format from Post Canada" },
        { status: 500 }
      );
    }

    // Get the first item (address details)
    const addressItem = data.Items[0];

    // Format address for our form
    const address = {
      street: addressItem.Line1 || "",
      unit: addressItem.Line2 || "",
      city: addressItem.City || "",
      province: addressItem.Province || "",
      postalCode: addressItem.PostalCode || "",
    };

    logger.log("Formatted address:", address);

    return NextResponse.json({ address });
  } catch (error) {
    logger.error("Post Canada address details error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to retrieve address details", details: error.message },
      { status: 500 }
    );
  }
}
