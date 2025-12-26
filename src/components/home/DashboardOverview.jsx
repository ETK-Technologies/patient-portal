"use client";

import { useState, useEffect } from "react";
import DashboardCard from "./DashboardCard";
import DashboardCardSkeleton from "../utils/skeletons/DashboardCardSkeleton";
import { useUser } from "@/contexts/UserContext";

export default function DashboardOverview() {
  const { userData } = useUser();
  const [subscriptionCount, setSubscriptionCount] = useState(null);
  const [ordersCount, setOrdersCount] = useState(null);
  const [messagesCount, setMessagesCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasReceivedResponse, setHasReceivedResponse] = useState(false);
  const [hasCalledAPI, setHasCalledAPI] = useState(false);

  // Fetch dashboard states (counts) from API
 useEffect(() => {
    if (hasCalledAPI && !userData) {
      return;
    }

    const fetchDashboardStates = async () => {
      try {
        setLoading(true);
        setHasCalledAPI(true);

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

        const statsApiUrl = crmUserID 
          ? `/api/user/dashboard/states?crmUserID=${crmUserID}`
          : `/api/user/dashboard/states`;
        const messengerApiUrl = `/api/messenger/unread-count`;

        console.log("[DASHBOARD_OVERVIEW] Calling both APIs in parallel:");
        console.log("[DASHBOARD_OVERVIEW] - Stats API:", statsApiUrl);
        console.log("[DASHBOARD_OVERVIEW] - Messenger API:", messengerApiUrl);

        const [statsResponse, messengerResponse] = await Promise.all([
          fetch(statsApiUrl),
          fetch(messengerApiUrl),
        ]);

        console.log("[DASHBOARD_OVERVIEW] Both API calls completed");

        if (!statsResponse.ok) {
          const errorData = await statsResponse.json();
          console.error(
            "Error fetching dashboard states:",
            errorData.error || errorData.message
          );
          setSubscriptionCount("0");
          setOrdersCount("0");
        } else {
          const statsData = await statsResponse.json();
          console.log("[DASHBOARD_OVERVIEW] Stats API response received");

          if (statsData.status && typeof statsData.subscriptions_count === "number") {
            setSubscriptionCount(String(statsData.subscriptions_count));
            setOrdersCount(String(statsData.orders_count || 0));
            console.log("[DASHBOARD_OVERVIEW] Stats counts set:", {
              subscriptions: statsData.subscriptions_count,
              orders: statsData.orders_count || 0,
            });
          } else if (statsData.success && typeof statsData.count === "number") {
            setSubscriptionCount(String(statsData.count));
            setOrdersCount("0");
            console.log("[DASHBOARD_OVERVIEW] Using fallback format for stats");
          } else {
            console.error("Invalid stats response format:", statsData);
            setSubscriptionCount("0");
            setOrdersCount("0");
          }
        }

        if (!messengerResponse.ok) {
          const errorData = await messengerResponse.json();
          console.error(
            "Error fetching unread messages count:",
            errorData.error || errorData.message
          );
          setMessagesCount("0");
        } else {
          const messengerData = await messengerResponse.json();
          console.log("[DASHBOARD_OVERVIEW] Messenger API response received");
          
          if (messengerData.success && typeof messengerData.count === "number") {
            setMessagesCount(String(messengerData.count));
            console.log("[DASHBOARD_OVERVIEW] Messages count set:", messengerData.count);
          } else {
            console.error("Invalid messenger response format:", messengerData);
            setMessagesCount("0");
          }
        }
        
        console.log("[DASHBOARD_OVERVIEW] All data received and processed from both APIs");
        setHasReceivedResponse(true);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setSubscriptionCount("0");
        setOrdersCount("0");
        setMessagesCount("0");
        setHasReceivedResponse(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStates();
  }, [userData]);

  const dashboardData = [
    {
      title: "Orders",
      count: ordersCount,
      link: "/orders",
      linkText: "View Orders",
    },
    {
      title: "Messages",
      count: messagesCount,
      link: "/messages",
      linkText: "View Messages",
    },
    {
      title: "Subscriptions",
      count: subscriptionCount,
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

  if (loading || !hasReceivedResponse || subscriptionCount === null || ordersCount === null || messagesCount === null) {
    return (
      <div className="flex gap-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-[16px] min-w-max">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>
      </div>
    );
  }

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
