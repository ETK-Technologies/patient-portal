/**
 * Get CRM authentication token from cookies
 * @param {Request} request - The incoming request object
 * @returns {string|null} - The token from cookie, or null if not found
 */
export function getTokenFromCookie(request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      console.log("[TOKEN_COOKIE] No cookie header found");
      return null;
    }

    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {});

    const token = cookies.token;
    if (token) {
      console.log("[TOKEN_COOKIE] Token found in cookie (token)");
      return token;
    }

    const authToken = cookies.authToken;
    if (authToken) {
      console.log("[TOKEN_COOKIE] Token found in cookie (authToken - fallback)");
      return authToken;
    }

    console.log("[TOKEN_COOKIE] Token not found in cookies (checked: token, authToken)");
    return null;
  } catch (error) {
    console.error("[TOKEN_COOKIE] Error reading token from cookie:", error);
    return null;
  }
}
