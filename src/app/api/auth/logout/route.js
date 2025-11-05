import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Handles user logout.
 * Clears authentication cookies and session data.
 *
 * Expected Response:
 * {
 *   "success": true,
 *   "message": "Logged out successfully"
 * }
 */
export async function POST(request) {
  try {
    console.log("[LOGOUT] Logging out user");

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear authentication cookies
    response.cookies.delete("userId");
    response.cookies.delete("authToken");

    // Set expired cookies to ensure they're removed
    response.cookies.set("userId", "", {
      path: "/",
      maxAge: 0,
      httpOnly: false,
      sameSite: "lax",
    });

    response.cookies.set("authToken", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    });

    console.log("[LOGOUT] ✓ Logout successful");

    return response;
  } catch (error) {
    console.error("[LOGOUT] Error during logout:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

