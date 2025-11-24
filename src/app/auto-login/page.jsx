"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Auto-Login Content Component
 * Handles the auto-login logic
 */
function AutoLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        // Get token and user ID from URL parameters
        const token = searchParams.get("token");
        const wpUserId = searchParams.get("wp_user_id");
        const redirectPage = searchParams.get("redirect") || "home";

        // Validate required parameters
        if (!token || !wpUserId) {
          // Redirect immediately on error - no UI shown
          router.replace("/");
          return;
        }

        // Verify the token with the backend
        const response = await fetch(
          `/api/user/verify-auto-login?token=${encodeURIComponent(
            token
          )}&wp_user_id=${encodeURIComponent(wpUserId)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          // Redirect immediately on error - no UI shown
          router.replace("/");
          return;
        }

        // Store user session
        await storeUserSession(wpUserId, data.userData);

        // Success - redirect immediately without showing any UI
        router.replace(`/${redirectPage}`);
      } catch (error) {
        console.error("Auto-login error:", error);
        // Redirect immediately on error - no UI shown
        router.replace("/");
      }
    };

    authenticateUser();
  }, [router, searchParams]);

  // Return null - no UI is shown, just redirect happens
  return null;
}

/**
 * Auto-Login Page
 *
 * This page handles the auto-login flow when users are redirected from the main website.
 * It verifies the auto-login token, logs the user in, and redirects them immediately.
 */
export default function AutoLoginPage() {
  return (
    <Suspense fallback={null}>
      <AutoLoginContent />
    </Suspense>
  );
}

/**
 * Store user session after successful authentication
 * Stores user data in both cookie (for server-side access) and localStorage (for client-side immediate access)
 */
async function storeUserSession(userId, userData = {}) {
  // Set a cookie to track the user session (for server-side API calls)
  // Use secure cookie settings in production
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = [
    `userId=${userId}`,
    "path=/",
    `max-age=${60 * 60 * 24 * 7}`, // 7 days
    isProduction ? "SameSite=Strict" : "",
    isProduction ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = cookieOptions;

  // Store user data in localStorage for immediate access by UserContext
  // This allows UserContext to use the data without making an API call
  if (userData && Object.keys(userData).length > 0) {
    // Store in the format that UserContext expects: { status: true, user: {...} }
    const userDataForContext = {
      status: true,
      message: "User profile fetched successfully.",
      user: userData,
      // Add timestamp to track when data was stored
      _timestamp: Date.now(),
    };
    localStorage.setItem("userData", JSON.stringify(userDataForContext));
    console.log(
      `[AUTO-LOGIN] User data stored in localStorage for user ${userId}`
    );
  } else {
    console.warn(`[AUTO-LOGIN] No user data to store for user ${userId}`);
  }

  console.log(`[AUTO-LOGIN] User session stored for user ${userId}`);
}
