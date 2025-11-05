"use client";

import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  const isAuthenticated = !!userData && !!token;

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check authentication status from cookies/localStorage
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have a userId cookie
      const userId = getCookie("userId");

      if (userId) {
        // Try to fetch user profile
        await fetchUserData();
      } else {
        // Check localStorage for token (from login)
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("userData");

        if (storedToken && storedUser) {
          try {
            setToken(storedToken);
            setUserData(JSON.parse(storedUser));
            // Verify token is still valid by fetching profile
            await fetchUserData();
          } catch (e) {
            // Invalid stored data, clear it
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
            setToken(null);
            setUserData(null);
          }
        } else {
          setUserData(null);
          setToken(null);
        }
      }
    } catch (err) {
      console.error("Error checking auth status:", err);
      setUserData(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data on mount and when needed
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user/profile");

      if (!response.ok) {
        const errorData = await response.json();
        // If unauthorized, clear session
        if (response.status === 401) {
          clearSession();
        }
        throw new Error(errorData.error || "Failed to fetch user data");
      }

      const data = await response.json();

      if (data.success && data.userData) {
        setUserData(data.userData);
        // Store in localStorage for persistence
        localStorage.setItem("userData", JSON.stringify(data.userData));
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err.message);
      // Don't clear session on network errors, only on auth errors
      if (err.message.includes("not authenticated") || err.message.includes("401")) {
        clearSession();
      }
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Login failed");
      }

      // Store token and user data
      setToken(data.token);
      setUserData(data.user);

      // Store in localStorage for persistence
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));

      // Set userId cookie (handled by API, but ensure it's set)
      if (data.user?.wp_user_id || data.user?.id) {
        const userId = data.user.wp_user_id || data.user.id;
        document.cookie = `userId=${userId}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }

      return { success: true, user: data.user, token: data.token };
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Logout API error:", err);
      // Continue with logout even if API call fails
    } finally {
      // Clear session regardless of API response
      clearSession();
      // Redirect handled by components using this function
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  // Clear session data
  const clearSession = () => {
    setUserData(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    // Clear cookies
    document.cookie = "userId=; path=/; max-age=0";
    document.cookie = "authToken=; path=/; max-age=0";
  };

  // Refresh user data
  const refreshUserData = () => {
    return fetchUserData();
  };

  const value = {
    userData,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    refreshUserData,
    checkAuthStatus,
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

// Custom hook for auth (alias for useUser for clarity)
export function useAuth() {
  return useUser();
}

// Helper function to get cookie value
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}
