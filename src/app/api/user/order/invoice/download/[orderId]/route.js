import { NextResponse } from "next/server";
import { getTokenFromCookie } from "@/app/api/utils/getTokenFromCookie";

/**
 * GET /api/user/order/invoice/download/[orderId]
 *
 * Downloads invoice PDF for a specific order from CRM.
 * Returns the invoice file (PDF) from the CRM invoice download endpoint.
 * wpUserID is obtained from cookies (set during auto-login).
 * orderId is obtained from the URL parameter (crmOrderID).
 *
 * Expected Response:
 * PDF file with appropriate Content-Type headers
 */
export async function GET(request, { params }) {
  try {
    // Get orderId from URL parameters
    // params is a Promise in Next.js and must be awaited
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        {
          status: false,
          message: "Order ID is required",
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    // Get wpUserID from cookies (set during auto-login)
    // Parse cookie header manually for compatibility
    const cookieHeader = request.headers.get("cookie") || "";
    let wpUserID = null;

    if (cookieHeader) {
      // Parse cookies from header string
      const match = cookieHeader.match(/userId=([^;]+)/);
      if (match) {
        wpUserID = decodeURIComponent(match[1].trim());
      }
    }

    console.log(
      `[INVOICE_DOWNLOAD] Cookie header: ${cookieHeader.substring(0, 100)}...`
    );
    console.log(
      `[INVOICE_DOWNLOAD] Extracted wpUserID: ${wpUserID || "not found"}`
    );
    console.log(`[INVOICE_DOWNLOAD] Order ID: ${orderId}`);

    if (!wpUserID) {
      return NextResponse.json(
        {
          status: false,
          message: "User not authenticated",
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    console.log(`[INVOICE_DOWNLOAD] Downloading invoice for order: ${orderId}`);

    // Download invoice from CRM
    const invoiceResponse = await downloadInvoice(orderId, request);

    if (invoiceResponse.error) {
      return NextResponse.json(
        {
          status: false,
          message: invoiceResponse.error,
          error: invoiceResponse.error,
        },
        { status: invoiceResponse.statusCode || 500 }
      );
    }

    // Return the PDF file with appropriate headers
    return new NextResponse(invoiceResponse.fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": invoiceResponse.contentType || "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${orderId}.pdf"`,
        "Content-Length": invoiceResponse.contentLength?.toString() || "",
      },
    });
  } catch (error) {
    console.error("Error downloading invoice:", error);
    return NextResponse.json(
      {
        status: false,
        message: "Failed to download invoice",
        error: "Failed to download invoice",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Download invoice PDF from CRM API
 * Uses the invoice download endpoint: /api/user/order/invoice/download/{orderId}
 */
async function downloadInvoice(orderId, request) {
  const crmHost = process.env.CRM_HOST;

  if (!crmHost) {
    console.error("[INVOICE_DOWNLOAD] Missing CRM_HOST");
    return {
      error: "Missing CRM configuration",
      statusCode: 500,
    };
  }

  console.log(`[INVOICE_DOWNLOAD] CRM Host: ${crmHost}`);

  try {
    const authToken = getTokenFromCookie(request);

    if (!authToken) {
      console.error("[INVOICE_DOWNLOAD] No token found in cookie");
      return {
        error: "Authentication token not found",
        statusCode: 401,
      };
    }

    console.log("[INVOICE_DOWNLOAD] Using token from cookie");

    // Step 2: Download invoice from CRM
    // Uses the invoice download endpoint: /api/user/order/invoice/download/{orderId}
    const invoiceUrl = `${crmHost}/api/user/order/invoice/download/${orderId}`;
    console.log(`[INVOICE_DOWNLOAD] Downloading invoice from: ${invoiceUrl}`);

    const invoiceResponse = await fetch(invoiceUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "is-patient-portal": "true",
      },
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      console.error(
        `[INVOICE_DOWNLOAD] Failed to download invoice: ${invoiceResponse.status} ${invoiceResponse.statusText}`
      );
      console.error(`[INVOICE_DOWNLOAD] Error details: ${errorText}`);
      return {
        error: `Failed to download invoice: ${invoiceResponse.status} ${invoiceResponse.statusText}`,
        statusCode: invoiceResponse.status,
      };
    }

    // Get the file buffer and content type
    const fileBuffer = await invoiceResponse.arrayBuffer();
    const contentType =
      invoiceResponse.headers.get("content-type") || "application/pdf";
    const contentLength = invoiceResponse.headers.get("content-length");

    console.log(
      `[INVOICE_DOWNLOAD] ✓ Successfully downloaded invoice for order: ${orderId}`
    );
    console.log(
      `[INVOICE_DOWNLOAD] Content-Type: ${contentType}, Size: ${
        contentLength || fileBuffer.byteLength
      } bytes`
    );

    return {
      fileBuffer: Buffer.from(fileBuffer),
      contentType: contentType,
      contentLength: contentLength || fileBuffer.byteLength,
    };
  } catch (error) {
    console.error(
      "[INVOICE_DOWNLOAD] Error downloading invoice from CRM:",
      error
    );
    return {
      error: error.message,
      statusCode: 500,
    };
  }
}
