/**
 * Utility function to get user ID for testing
 * Uses test ID (33237) when actual user ID is not available or doesn't have data
 *
 * @param {Object} userData - User data from UserContext
 * @returns {string|number} - User ID to use (test ID or actual ID)
 */
export function getUserID(userData) {
  // Test ID to use when actual user doesn't have data
  const TEST_USER_ID = 33237;

  // Try to extract actual user ID from different response structures
  let actualUserID = null;

  if (userData) {
    if (userData.id) {
      actualUserID = userData.id;
    } else if (userData.user && userData.user.id) {
      actualUserID = userData.user.id;
    } else if (userData.data && userData.data.user && userData.data.user.id) {
      actualUserID = userData.data.user.id;
    }
  }

  // For testing: always use test ID to see what data exists
  // TODO: Remove this and use actualUserID once real user data is available
  return TEST_USER_ID;

  // Uncomment below to use actual user ID when available:
  // return actualUserID || TEST_USER_ID;
}
