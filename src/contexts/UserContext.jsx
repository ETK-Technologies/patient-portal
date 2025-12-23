"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const UserContext = createContext(null);

// Get user data from localStorage if available
const getStoredUserData = () => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("userData");
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Check if stored data has the expected format
    if (parsed.status && parsed.user) {
      // Check if data is recent (within 5 minutes) - if older, we'll refresh from API
      const dataAge = parsed._timestamp
        ? Date.now() - parsed._timestamp
        : Infinity;
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (dataAge < maxAge) {
        console.log("[UserContext] Using stored user data from localStorage");
        return parsed.user;
      } else {
        console.log(
          "[UserContext] Stored user data is too old, will refresh from API"
        );
      }
    }
  } catch (err) {
    console.warn("[UserContext] Error reading stored user data:", err);
  }

  return null;
};

// Store user data in localStorage
const storeUserData = (user) => {
  if (typeof window === "undefined" || !user) return;

  try {
    const dataToStore = {
      status: true,
      message: "User profile fetched successfully.",
      user: user,
      _timestamp: Date.now(),
    };
    localStorage.setItem("userData", JSON.stringify(dataToStore));
  } catch (err) {
    console.warn("[UserContext] Error storing user data:", err);
  }
};

const setUserEmailCookie = (user) => {
  if (typeof window === "undefined" || !user) return;

  const userEmail = user?.email;
  if (!userEmail) {
    console.warn("[UserContext] No email found in user data to set cookie");
    return;
  }

  try {
    const isProduction = process.env.NODE_ENV === "production";
    const userEmailCookieOptions = [
      `userEmail=${encodeURIComponent(userEmail)}`,
      "path=/",
      `max-age=${60 * 60 * 24 * 7}`, // 7 days
      isProduction ? "SameSite=Strict" : "",
      isProduction ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    document.cookie = userEmailCookieOptions;
    console.log(`[UserContext] userEmail cookie set: ${userEmail}`);
  } catch (err) {
    console.warn("[UserContext] Error setting userEmail cookie:", err);
  }
};

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState(null);

  // Fetch user data from API
  const fetchUserData = useCallback(async (useStoredData = false) => {
    try {
      // If useStoredData is true, check localStorage first and use it immediately
      if (useStoredData) {
        const storedUser = getStoredUserData();
        if (storedUser) {
          setUserData(storedUser);
          setUserEmailCookie(storedUser);
          setLoading(false);
          setError(null);
          // Still fetch from API in background to ensure data is fresh
          fetchUserData(false).catch((err) => {
            console.warn("[UserContext] Background refresh failed:", err);
          });
          return;
        }
      }

      setLoading(true);
      setError(null);

      // Add cache-busting timestamp to ensure we get fresh data
      const response = await fetch(`/api/user/profile?t=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch user data");
      }

      const data = await response.json();

      // Handle both response formats:
      // New format: { status: true, message: "...", user: {...} }
      // Old format: { success: true, userData: {...} }
      let extractedUser = null;
      if (data.status && data.user) {
        extractedUser = data.user;
      } else if (data.success && data.userData) {
        extractedUser = data.userData;
      } else {
        throw new Error("Invalid response format");
      }

      // Store the user data
      setUserData(extractedUser);
      storeUserData(extractedUser);
      setUserEmailCookie(extractedUser);
    } catch (err) {
      console.error("[UserContext] Error fetching user data:", err);

      // If API call fails, try to use stored data as fallback
      const storedUser = getStoredUserData();
      if (storedUser) {
        console.log(
          "[UserContext] Using stored data as fallback after API error"
        );
        setUserData(storedUser);
        setUserEmailCookie(storedUser);
        setError(null);
      } else {
        setError(err.message);
        setUserData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setSubscriptionsLoading(true);
      setSubscriptionsError(null);

      const response = await fetch("/api/user/subscriptions");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch subscriptions");
      }

      const responseData = result.data;
      let subscriptionsArray = [];

      if (responseData?.subscriptions) {
        subscriptionsArray = Array.isArray(responseData.subscriptions)
          ? responseData.subscriptions
          : [];
      } else if (responseData?.data?.subscriptions) {
        subscriptionsArray = Array.isArray(responseData.data.subscriptions)
          ? responseData.data.subscriptions
          : [];
      }

      const mappedSubscriptions = subscriptionsArray.map((sub) => {
        const firstItem = sub.line_items?.[0] || {};

        let mappedStatus = sub.status?.toLowerCase() || "active";
        if (mappedStatus === "on-hold") {
          mappedStatus = "paused";
        } else if (mappedStatus === "cancelled") {
          mappedStatus = "canceled";
        }

        const productName = firstItem.product_name || "Unknown Product";

        const tabsFrequency = firstItem.tabs_frequency || "";
        const subscriptionType = firstItem.subscription_type || "";
        const dosage =
          tabsFrequency && subscriptionType
            ? `${tabsFrequency} | ${subscriptionType}`
            : tabsFrequency || subscriptionType || "Not available";

        let nextRefillDate = "Not scheduled";
        if (sub.next_refill) {
          nextRefillDate = sub.next_refill;
        } else if (sub.next_payment_date) {
          nextRefillDate = new Date(sub.next_payment_date).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            }
          );
        }

        return {
          id: sub.id,
          category: "Sexual Health",
          status: mappedStatus,
          productName: productName,
          productSubtitle: null,
          dosage: dosage,
          nextRefill: nextRefillDate,
          productImage:
            firstItem.image?.src ||
            "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
          _raw: sub,
        };
      });

      setSubscriptions(mappedSubscriptions);
    } catch (err) {
      console.error("[UserContext] Error fetching subscriptions:", err);
      setSubscriptionsError(err.message || "Failed to load subscriptions");
      setSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  }, []);

  // Refresh user data (force API call)
  const refreshUserData = useCallback(() => {
    return fetchUserData(false);
  }, [fetchUserData]);

  const refreshSubscriptions = useCallback(() => {
    return fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Initialize user data on mount
  useEffect(() => {
    // First, try to use stored data immediately for fast UI rendering
    // Then fetch from API to ensure data is fresh
    fetchUserData(true);
  }, [fetchUserData]);

  useEffect(() => {
    if (userData && !loading) {
      fetchSubscriptions();
    }
  }, [userData, loading, fetchSubscriptions]);

  const value = {
    userData,
    loading,
    error,
    refreshUserData,
    subscriptions,
    subscriptionsLoading,
    subscriptionsError,
    refreshSubscriptions,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook to use user context
export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}
