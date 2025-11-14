"use client";

import { useState, useEffect } from "react";
import DashboardCard from "./DashboardCard";

export default function DashboardOverview() {
  const [subscriptionCount, setSubscriptionCount] = useState("0");
  const [loading, setLoading] = useState(true);

  // Fetch subscription count from API
  useEffect(() => {
    const fetchSubscriptionCount = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/subscriptions/count");

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error fetching subscription count:", errorData.error);
          setSubscriptionCount("0");
          return;
        }

        const data = await response.json();

        if (data.success && typeof data.count === "number") {
          setSubscriptionCount(String(data.count));
        } else {
          console.error("Invalid response format:", data);
          setSubscriptionCount("0");
        }
      } catch (error) {
        console.error("Error fetching subscription count:", error);
        setSubscriptionCount("0");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionCount();
  }, []);

  const dashboardData = [
    {
      title: "Orders",
      count: "4",
      link: "/orders",
      linkText: "View Messages",
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
