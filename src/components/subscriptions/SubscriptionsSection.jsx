"use client";

import { useState, useRef } from "react";
import SubscriptionCard from "./SubscriptionCard";
import { subscriptionsData } from "./subscriptionsData";
import ScrollIndicator from "../utils/ScrollIndicator";
import ScrollArrows from "../utils/ScrollArrows";

export default function SubscriptionsSection() {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "paused", label: "Paused" },
    { id: "canceled", label: "Canceled" },
  ];

  // Filter subscriptions by tab
  const filteredSubscriptions =
    activeTab === "all"
      ? subscriptionsData
      : subscriptionsData.filter(
          (sub) => sub.status.toLowerCase() === activeTab
        );

  // Group subscriptions by category
  const groupedSubscriptions = filteredSubscriptions.reduce((acc, sub) => {
    if (!acc[sub.category]) {
      acc[sub.category] = [];
    }
    acc[sub.category].push(sub);
    return acc;
  }, {});

  return (
    <div>
      {/* Note */}
      <div className="mb-6">
        <p className="text-[12px] md:text-[14px] font-[400] leading-[140%] text-[#585857]">
          <span className="font-[500]">Note:</span> you may be subject to new
          pricing if you wish to resubscribe at a later date. We therefore
          suggest pausing subscription and resuming when needed.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6 border-b border-[#E2E2E1]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-[14px] md:text-[16px] font-[500] leading-[140%] transition-colors relative ${
              activeTab === tab.id
                ? "text-[#212121]"
                : "text-[#00000099] hover:text-[#212121]"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#212121]"></div>
            )}
          </button>
        ))}
      </div>

      {/* Subscriptions by Category */}
      {Object.keys(groupedSubscriptions).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedSubscriptions).map(
            ([category, subscriptions]) => {
              const CategorySection = () => {
                const scrollContainerRef = useRef(null);

                return (
                  <div key={category}>
                    <h2 className="text-[18px] md:text-[20px] font-[500] leading-[140%] mb-4">
                      {category}
                    </h2>
                    {/* Horizontal scroll on both mobile and desktop */}
                    <div className="relative">
                      <div
                        ref={scrollContainerRef}
                        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2"
                      >
                        {subscriptions.map((subscription) => (
                          <div key={subscription.id}>
                            <SubscriptionCard subscription={subscription} />
                          </div>
                        ))}
                      </div>

                      {/* Scroll Arrows for Desktop */}
                      <ScrollArrows
                        containerRef={scrollContainerRef}
                        scrollAmount={350}
                        showOnMobile={false}
                      />
                    </div>

                    {/* Scroll Indicator for Mobile Only */}
                    <div className="md:hidden">
                      <ScrollIndicator
                        containerRef={scrollContainerRef}
                        totalItems={subscriptions.length}
                      />
                    </div>
                  </div>
                );
              };

              return <CategorySection key={category} />;
            }
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-600">
            No {activeTab !== "all" ? activeTab : ""} subscriptions found.
          </p>
        </div>
      )}
    </div>
  );
}
