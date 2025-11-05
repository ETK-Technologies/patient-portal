import { NextResponse } from "next/server";

/**
 * POST /api/auth/login
 *
 * Handles user login with email and password.
 * Authenticates with CRM API and returns user data and token.
 *
 * Expected Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "token": "2898788|fhTQ6UlrwapuFfHqwWNBQCfADzMm86oXnnIKb5P4",
 *   "user": { ... }
 * }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Email and password are required",
                },
                { status: 400 }
            );
        }

        console.log(`[LOGIN] Attempting login for email: ${email}`);

        // Authenticate with CRM
        const loginResult = await loginWithCRM(email, password);

        if (!loginResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: loginResult.error || "Login failed",
                    details: loginResult.details,
                },
                { status: loginResult.status || 401 }
            );
        }

        console.log(`[LOGIN] Login successful for user: ${loginResult.user?.id}`);

        // Set cookie for userId (same pattern as auto-login)
        const userId = loginResult.user?.wp_user_id || loginResult.user?.id;
        const response = NextResponse.json({
            success: true,
            token: loginResult.token,
            user: loginResult.user,
        });

        // Set cookie for user session
        if (userId) {
            response.cookies.set("userId", String(userId), {
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // 7 days
                httpOnly: false, // Allow client-side access
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            });
        }

        // Store token in httpOnly cookie for security (optional, for server-side use)
        if (loginResult.token) {
            response.cookies.set("authToken", loginResult.token, {
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // 7 days
                httpOnly: true, // Secure token storage
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            });
        }

        return response;
    } catch (error) {
        console.error("[LOGIN] Error during login:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Login failed",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * Login with CRM API
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, token?: string, user?: object, error?: string, details?: any, status?: number}>}
 */
async function loginWithCRM(email, password) {
    const crmHost = process.env.CRM_HOST;

    if (!crmHost) {
        console.error("[LOGIN] Missing CRM_HOST environment variable");
        return {
            success: false,
            error: "Server configuration error",
            status: 500,
        };
    }

    try {
        const loginUrl = `${crmHost}/api/crm-user/login`;
        console.log(`[LOGIN] Authenticating with CRM: ${loginUrl}`);

        const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        });

        console.log(`[LOGIN] CRM response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[LOGIN] CRM login failed: ${errorText}`);

            let errorDetails;
            try {
                errorDetails = JSON.parse(errorText);
            } catch {
                errorDetails = errorText;
            }

            return {
                success: false,
                error: "Invalid email or password",
                details: errorDetails,
                status: response.status,
            };
        }

        const data = await response.json();

        // Check for successful login response
        if (data.status && data.token && data.user) {
            console.log(`[LOGIN] ✓ Login successful for user ID: ${data.user.id}`);
            return {
                success: true,
                token: data.token,
                user: data.user,
            };
        }

        // Handle different response formats
        if (data.token && data.user) {
            console.log(`[LOGIN] ✓ Login successful (alternative format)`);
            return {
                success: true,
                token: data.token,
                user: data.user,
            };
        }

        console.error("[LOGIN] Unexpected response format:", data);
        return {
            success: false,
            error: "Unexpected response from server",
            details: data,
            status: 500,
        };
    } catch (error) {
        console.error("[LOGIN] Network error during CRM login:", error);
        return {
            success: false,
            error: "Network error. Please try again later.",
            details: error.message,
            status: 500,
        };
    }
}

