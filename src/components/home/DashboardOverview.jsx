"use client";

import { useState, useEffect } from "react";
import DashboardCard from "./DashboardCard";
import { useUser } from "@/contexts/UserContext";

export default function DashboardOverview() {
  const { userData } = useUser();
  const [subscriptionCount, setSubscriptionCount] = useState("0");
  const [ordersCount, setOrdersCount] = useState("0");
  const [loading, setLoading] = useState(true);

  // Fetch dashboard states (counts) from API
  useEffect(() => {
    const fetchDashboardStates = async () => {
      try {
        setLoading(true);

        // Extract CRM user ID from userData
        let crmUserID = null;
        if (userData) {
          // Check for crm_user_id (new format from profile API)
          if (userData.crm_user_id) {
            crmUserID = userData.crm_user_id;
          }
          // Fallback to id (old format)
          else if (userData.id) {
            crmUserID = userData.id;
          }
        }

        if (!crmUserID) {
          console.log(
            "[DASHBOARD_OVERVIEW] No user ID available, waiting for user data..."
          );
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/user/dashboard/states?crmUserID=${crmUserID}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error(
            "Error fetching dashboard states:",
            errorData.error || errorData.message
          );
          setSubscriptionCount("0");
          setOrdersCount("0");
          return;
        }

        const data = await response.json();

        // Handle both response formats:
        // New format: { status: true, message: "...", subscriptions_count: 0, orders_count: 0, ... }
        // Old format: { success: true, count: 5, ... }
        if (data.status && typeof data.subscriptions_count === "number") {
          setSubscriptionCount(String(data.subscriptions_count));
          setOrdersCount(String(data.orders_count || 0));
        } else if (data.success && typeof data.count === "number") {
          // Fallback to old format
          setSubscriptionCount(String(data.count));
          setOrdersCount("0");
        } else {
          console.error("Invalid response format:", data);
          setSubscriptionCount("0");
          setOrdersCount("0");
        }
      } catch (error) {
        console.error("Error fetching dashboard states:", error);
        setSubscriptionCount("0");
        setOrdersCount("0");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStates();
  }, [userData]);

  const dashboardData = [
    {
      title: "Orders",
      count: loading ? "..." : ordersCount,
      link: "/orders",
      linkText: "View Orders",
    },
    {
      title: "Messages",
      count: "2",
      link: "/messages",
      linkText: "View Messages",
    },
    {
      title: "Subscriptions",
      count: loading ? "..." : subscriptionCount,
      link: "/subscriptions",
      linkText: "View Subscriptions",
    },
    {
      title: "Upcoming Appointments",
      count: "0",
      link: "/appointments",
      linkText: "View Appointments",
    },
  ];

  return (
    <div className="flex gap-6 overflow-x-auto scrollbar-hide">
      <div className="flex gap-[16px] min-w-max">
        {dashboardData.map((item, index) => (
          <DashboardCard
            key={index}
            title={item.title}
            count={item.count}
            link={item.link}
            linkText={item.linkText}
          />
        ))}
      </div>
    </div>
  );
}
