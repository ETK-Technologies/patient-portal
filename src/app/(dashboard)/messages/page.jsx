"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import { toast } from "react-toastify";

export default function Messages() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpenedMessenger, setHasOpenedMessenger] = useState(false);

  useEffect(() => {
    const openMessenger = async () => {
      if (hasOpenedMessenger || isLoading) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/messenger/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to connect to messenger");
        }

        const data = await response.json();

        if (data.success && data.loginURL) {
          window.open(data.loginURL, "_blank", "noopener,noreferrer");
          setHasOpenedMessenger(true);
          toast.success("Opening messenger...");
        } else {
          throw new Error("No login URL received");
        }
      } catch (error) {
        console.error("Error opening messenger:", error);
        toast.error(error.message || "Failed to open messenger. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      openMessenger();
    }, 100);

    return () => clearTimeout(timer);
  }, [hasOpenedMessenger, isLoading]);

  return (
    <PageContainer title="Messages">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Connecting to messenger...</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              {hasOpenedMessenger
                ? "Messenger opened in a new tab. If it didn't open, please click the button below."
                : "Your messages will appear here."}
            </p>
            {hasOpenedMessenger && (
              <button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const response = await fetch("/api/messenger/session", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || "Failed to connect to messenger");
                    }

                    const data = await response.json();

                    if (data.success && data.loginURL) {
                      window.open(data.loginURL, "_blank", "noopener,noreferrer");
                      toast.success("Opening messenger...");
                    } else {
                      throw new Error("No login URL received");
                    }
                  } catch (error) {
                    console.error("Error opening messenger:", error);
                    toast.error(error.message || "Failed to open messenger. Please try again.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Opening..." : "Open Messenger"}
              </button>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
