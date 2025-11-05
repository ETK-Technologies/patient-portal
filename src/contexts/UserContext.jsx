"use client";

import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user data on mount and when needed
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user/profile");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch user data");
      }

      const data = await response.json();

      if (data.success && data.userData) {
        setUserData(data.userData);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err.message);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUserData = () => {
    return fetchUserData();
  };

  // Initialize user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const value = {
    userData,
    loading,
    error,
    refreshUserData,
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
