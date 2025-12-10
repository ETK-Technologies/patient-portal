import { NextResponse } from "next/server";
import { authenticateWithCRM } from "../../utils/crmAuth";
import https from "https";
import http from "http";

/**
 * GET /api/user/prescriptions
 *
 * Fetches user prescriptions from CRM.
 * Query parameters:
 *   - per_page: number (default: 10)
 *   - crm_user_id: number (required)
 *   - crm_order_id: number (optional, if provided filters by order)
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "data": {
 *     "status": true,
 *     "message": "Prescriptions fetched successfully.",
 *     "data": [...]
 *   }
 * }
 */
export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const perPage = searchParams.get("per_page") || "10";
    const crmUserId = searchParams.get("crm_user_id");
    const crmOrderId = searchParams.get("crm_order_id");

    if (!crmUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "crm_user_id is required",
        },
        { status: 400 }
      );
    }

    console.log(`[PRESCRIPTIONS] Fetching prescriptions with params:`, {
      per_page: perPage,
      crm_user_id: crmUserId,
      crm_order_id: crmOrderId || null,
    });

    const prescriptionsData = await fetchPrescriptions(
      crmUserId,
      perPage,
      crmOrderId
    );

    if (prescriptionsData.error) {
      return NextResponse.json(
        {
          success: false,
          error: prescriptionsData.error,
          details: prescriptionsData.details,
        },
        { status: prescriptionsData.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prescriptionsData,
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch prescriptions",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch prescriptions from CRM API
 * Uses the prescriptions endpoint: /api/user/prescriptions
 * with query parameters: per_page, crm_user_id, crm_order_id
 */
async function fetchPrescriptions(crmUserId, perPage, crmOrderId = null) {
  const crmHost = process.env.CRM_HOST;
  const apiUsername = process.env.CRM_API_USERNAME;
  const apiPasswordEncoded = process.env.CRM_API_PASSWORD;

  if (!crmHost || !apiUsername || !apiPasswordEncoded) {
    console.error("[PRESCRIPTIONS] Missing CRM credentials:");
    console.error({
      crmHost: crmHost || "MISSING",
      apiUsername: apiUsername ? "SET" : "MISSING",
      apiPasswordEncoded: apiPasswordEncoded ? "SET" : "MISSING",
    });
    return {
      status: false,
      message: "CRM configuration missing",
      error: "Missing CRM credentials",
      status: 500,
    };
  }

  console.log(`[PRESCRIPTIONS] CRM Host: ${crmHost}`);
  console.log(`[PRESCRIPTIONS] CRM Username: ${apiUsername}`);

  try {
    let apiPassword;
    try {
      const decoded = Buffer.from(apiPasswordEncoded, "base64").toString(
        "utf8"
      );
      const hasNonPrintable = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/.test(decoded);
      const isSameAsInput = decoded === apiPasswordEncoded;

      if (!hasNonPrintable && !isSameAsInput && decoded.length > 0) {
        apiPassword = decoded;
        console.log("[PRESCRIPTIONS] Password decoded from base64");
      } else {
        apiPassword = apiPasswordEncoded;
        console.log("[PRESCRIPTIONS] Using password as plain text");
      }
    } catch (decodeError) {
      apiPassword = apiPasswordEncoded;
      console.log(
        "[PRESCRIPTIONS] Base64 decode failed, using password as plain text"
      );
    }

    console.log("[PRESCRIPTIONS] Authenticating with CRM...");
    const authResult = await authenticateWithCRM(
      crmHost,
      apiUsername,
      apiPassword
    );

    if (!authResult.success) {
      console.error(
        `[PRESCRIPTIONS] CRM authentication failed: ${authResult.error}`
      );
      if (authResult.endpoint) {
        console.error(
          `[PRESCRIPTIONS] Failed endpoint: ${authResult.endpoint}`
        );
      }
      return {
        status: false,
        message: "CRM authentication failed",
        error: `CRM authentication failed: ${authResult.error}`,
        status: 401,
      };
    }

    const authToken = authResult.token;
    console.log(
      `[PRESCRIPTIONS] Successfully obtained CRM auth token from ${authResult.endpoint}`
    );

    const requestPayload = {
      per_page: parseInt(perPage, 10) || 10,
      crm_user_id: parseInt(crmUserId, 10),
      crm_order_id: crmOrderId ? parseInt(crmOrderId, 10) : null,
    };

    const prescriptionsUrl = new URL(`${crmHost}/api/user/prescriptions`);
    const isHttps = prescriptionsUrl.protocol === "https:";
    const httpModule = isHttps ? https : http;
    
    console.log(
      `[PRESCRIPTIONS] Fetching prescriptions from: ${prescriptionsUrl.toString()}`
    );
    console.log(
      `[PRESCRIPTIONS] Request payload:`,
      JSON.stringify(requestPayload, null, 2)
    );

    const responseData = await new Promise((resolve, reject) => {
      const requestBody = JSON.stringify(requestPayload);
      
      const options = {
        hostname: prescriptionsUrl.hostname,
        port: prescriptionsUrl.port || (isHttps ? 443 : 80),
        path: prescriptionsUrl.pathname + prescriptionsUrl.search,
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "is-patient-portal": "true",
          "Content-Length": Buffer.byteLength(requestBody),
        },
      };

      const req = httpModule.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error(
              `[PRESCRIPTIONS] Failed to fetch prescriptions: ${res.statusCode} ${res.statusMessage}`
            );
            console.error(`[PRESCRIPTIONS] Error details: ${data}`);

            let errorDetails = data;
            try {
              const errorJson = JSON.parse(data);
              errorDetails = errorJson.message || errorJson.error || data;
            } catch {}

            reject({
              status: false,
              message: `Failed to fetch: ${res.statusCode} ${res.statusMessage}`,
              error: errorDetails,
              status: res.statusCode,
              details: data,
            });
            return;
          }

          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (parseError) {
            reject({
              status: false,
              message: "Failed to parse response",
              error: parseError.message,
              status: 500,
            });
          }
        });
      });

      req.on("error", (error) => {
        console.error(`[PRESCRIPTIONS] Request error:`, error);
        reject({
          status: false,
          message: error.message || "Failed to fetch prescriptions",
          error: error.message,
          status: 500,
        });
      });

      req.write(requestBody);
      req.end();
    });

    console.log("[PRESCRIPTIONS] CRM response received");
    console.log(
      "[PRESCRIPTIONS] Full CRM response:",
      JSON.stringify(responseData, null, 2)
    );

    let prescriptions = responseData;
    if (responseData.status && responseData.data) {
      prescriptions = {
        ...responseData,
        ...responseData.data,
      };
      console.log("[PRESCRIPTIONS]  Extracted data from nested structure");
    }

    console.log(
      `[PRESCRIPTIONS]  Successfully fetched prescriptions for user: ${crmUserId}`
    );
    if (Array.isArray(prescriptions)) {
      console.log(`[PRESCRIPTIONS] Found ${prescriptions.length} prescriptions`);
    } else if (prescriptions.prescriptions && Array.isArray(prescriptions.prescriptions)) {
      console.log(`[PRESCRIPTIONS] Found ${prescriptions.prescriptions.length} prescriptions`);
    }

    return prescriptions;
  } catch (error) {
    console.error(
      "[PRESCRIPTIONS] Error fetching prescriptions from CRM:",
      error
    );
    return {
      status: false,
      message: error.message || "Failed to fetch prescriptions",
      error: error.message,
      status: 500,
    };
  }
}

