import { NextResponse } from "next/server";
import { logger } from "@/utils/devLogger";

const POSTCANADA_API_KEY = process.env.POSTCANADA_API_KEY;
const POSTCANADA_API_URL =
  "https://ws1.postescanada-canadapost.ca/AddressComplete/Interactive/Find/v2.10/json3.ws";

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || query.length < 1) {
      return NextResponse.json(
        { error: "Query must be at least 1 character long" },
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

    logger.log("Making request to Post Canada API with query:", query);
    logger.log("API Key present:", !!POSTCANADA_API_KEY);

    const url = new URL(POSTCANADA_API_URL);
    url.searchParams.append("Key", POSTCANADA_API_KEY);
    url.searchParams.append("SearchTerm", query);
    url.searchParams.append("Country", "CAN");
    url.searchParams.append("MaxSuggestions", "10");
    url.searchParams.append("LanguagePreference", "en");

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

    if (!data.Items || !Array.isArray(data.Items)) {
      logger.error("Invalid response format from Post Canada:", data);
      return NextResponse.json(
        { error: "Invalid response format from Post Canada" },
        { status: 500 }
      );
    }

    // Transform Post Canada response to match our expected format
    const addresses = data.Items.map((item, index) => {
      // Create full address with proper formatting
      const fullAddress = [item.Text, item.Description]
        .filter(Boolean)
        .join(", ");

      return {
        id: item.Id,
        formattedAddress: fullAddress,
        // Store original data for address details
        originalData: item,
      };
    });

    logger.log("Transformed addresses:", addresses);

    return NextResponse.json({ addresses });
  } catch (error) {
    logger.error("Post Canada address autocomplete error:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch address suggestions", details: error.message },
      { status: 500 }
    );
  }
}
