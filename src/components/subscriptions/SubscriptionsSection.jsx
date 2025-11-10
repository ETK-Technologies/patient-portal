"use client";

import { useState, useRef, useCallback } from "react";
import SubscriptionCard from "./SubscriptionCard";
import { subscriptionsData } from "./subscriptionsData";
import ScrollIndicator from "../utils/ScrollIndicator";
import ScrollArrows from "../utils/ScrollArrows";
import SubscriptionFlow from "../subscription-flow/SubscriptionFlow";
import SubscriptionActionPanel from "./SubscriptionActionPanel";
import { FiArrowLeft, FiChevronLeft } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";

export default function SubscriptionsSection() {
  const [activeTab, setActiveTab] = useState("all");
  const [subscriptionFlow, setSubscriptionFlow] = useState(null); // {sub, action}
  const [showHeader, setShowHeader] = useState(true);
  const [headerVariant, setHeaderVariant] = useState("full"); // 'full' | 'backOnly'
  const [flowBackHandler, setFlowBackHandler] = useState(null); // { handleBack, stepIndex }

  // Store the back handler from the flow
  // Must be defined at top level (not conditionally) to follow Rules of Hooks
  // Only update if stepIndex actually changed to prevent unnecessary re-renders
  const handleBackHandler = useCallback(({ handleBack, stepIndex }) => {
    setFlowBackHandler((prev) => {
      // Only update if stepIndex changed
      if (prev?.stepIndex !== stepIndex) {
        return { handleBack, stepIndex };
      }
      // Return same reference if nothing changed to prevent re-renders
      return prev;
    });
  }, []);

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

  // FLOW HANDLER
  const handleCardAction = (subscription, action) => {
    setSubscriptionFlow({ subscription, action });
    setHeaderVariant(action === "Manage subscription" ? "full" : "backOnly");
  };

  const handleCloseFlow = () => {
    setSubscriptionFlow(null);
    setShowHeader(true);
    // Reset the flow back handler when closing the flow
    setFlowBackHandler(null);
  };

  if (subscriptionFlow) {
    const { subscription, action } = subscriptionFlow;

    const Header = () => {
      // Determine which back handler to use
      // Use handleBack if we're in a flow step, otherwise close the flow
      const handleBackClick = () => {
        if (
          flowBackHandler &&
          flowBackHandler.stepIndex !== null &&
          typeof flowBackHandler.handleBack === "function"
        ) {
          // Use the handleBack function directly, just like the bottom back button
          flowBackHandler.handleBack();
        } else {
          handleCloseFlow();
        }
      };

      if (headerVariant === "full") {
        return (
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center justify-between w-full mb-4">
              <button
                onClick={handleBackClick}
                className="inline-flex items-center justify-center border-none w-10 h-10 md:w-10 md:h-10 rounded-full  text-[black] "
                aria-label="Back to subscriptions"
              >
                <FiChevronLeft size={20} />
              </button>
              <button
                onClick={handleCloseFlow}
                className="flex h-6 px-4 py-0 justify-center items-center gap-[10px] rounded-[24px] border border-[#E2E2E1] bg-white text-[black] text-[14px] font-medium hover:bg-[#F9FAFB] shadow-[0_0_16px_0_rgba(0,0,0,0.08)]"
              >
                Back to subscription
              </button>
            </div>

            <div>
              <nav
                className="text-[13px] text-[#23221C] mb-1"
                aria-label="Breadcrumb"
              >
                <ol className="list-none p-0 flex gap-1">
                  <li>Subscriptions</li>
                  <li>
                    <span className="mx-1">&gt;</span>
                  </li>
                  <li className="text-[#212121] font-medium">
                    Subscription details
                  </li>
                </ol>
              </nav>
              <h1 className="text-[22px] md:text-[24px] font-semibold leading-[120%] mb-4">
                Subscription details
              </h1>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center justify-between w-full mb-4">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center justify-center border-none w-10 h-10 md:w-10 md:h-10 rounded-full  text-[black] "
            aria-label="Back to subscriptions"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={handleCloseFlow}
            className="px-4 py-2 rounded-full border border-[#E2E2E1] bg-white text-[black] text-[14px] font-medium hover:bg-[#F9FAFB]"
          >
            Back to subscription
          </button>
        </div>
      );
    };

    if (action === "Manage subscription") {
      return (
        <div>
          {showHeader && <Header />}
          <SubscriptionFlow
            subscription={subscription}
            action={action}
            setShowHeader={setShowHeader}
            setHeaderVariant={setHeaderVariant}
            onBackHandler={handleBackHandler}
          />
        </div>
      );
    }

    return (
      <div>
        {showHeader && <Header />}
        <SubscriptionActionPanel action={action} subscription={subscription} />
      </div>
    );
  }

  return (
    <div>
      {/* Page title (shown only when not in a flow) */}
      <h1 className="text-[26px] md:text-[32px]  mb-6 md:mb-10 headers-font">
        My Subscriptions
      </h1>
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
                            <SubscriptionCard
                              subscription={subscription}
                              onAction={handleCardAction}
                            />
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
