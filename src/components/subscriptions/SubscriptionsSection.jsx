"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import SubscriptionCard from "./SubscriptionCard";
import ScrollIndicator from "../utils/ScrollIndicator";
import ScrollArrows from "../utils/ScrollArrows";
import SubscriptionFlow from "../subscription-flow/SubscriptionFlow";
import SubscriptionCardSkeleton from "../utils/skeletons/SubscriptionCardSkeleton";
import { FiArrowLeft, FiChevronLeft } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";
import EmptyState from "../utils/EmptyState";
import { subscriptionsData as dummySubscriptionsData } from "./subscriptionsData";

export default function SubscriptionsSection() {
  const [activeTab, setActiveTab] = useState("all");
  const [subscriptionFlow, setSubscriptionFlow] = useState(null); // {sub, action}
  const [showHeader, setShowHeader] = useState(true);
  const [headerVariant, setHeaderVariant] = useState("full"); // 'full' | 'backOnly'
  const [flowBackHandler, setFlowBackHandler] = useState(null); // { handleBack, stepIndex }
  const [subscriptionsData, setSubscriptionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Use dummy data instead of API call
  useEffect(() => {
    setLoading(true);
    // Simulate a small delay for better UX
    setTimeout(() => {
      setSubscriptionsData(dummySubscriptionsData);
      setLoading(false);
      setError(null);
    }, 100);
  }, []);

  // Fetch subscriptions from API (commented out - using dummy data instead)
  // useEffect(() => {
  //   const fetchSubscriptions = async () => {
  //     try {
  //       setLoading(true);
  //       setError(null);

  //       const response = await fetch("/api/user/subscriptions");
  //       const result = await response.json();

  //       if (!response.ok || !result.success) {
  //         throw new Error(result.error || "Failed to fetch subscriptions");
  //       }

  //       // Handle the API response structure
  //       // Response: { success: true, data: { status: true, message: "...", subscriptions: [...] } }
  //       const responseData = result.data;

  //       console.log(
  //         "[SUBSCRIPTIONS] Full API response:",
  //         JSON.stringify(result, null, 2)
  //       );
  //       console.log("[SUBSCRIPTIONS] Response data:", responseData);

  //       // Extract subscriptions array - new format has subscriptions directly in data
  //       let subscriptionsArray = [];

  //       if (responseData?.subscriptions) {
  //         subscriptionsArray = Array.isArray(responseData.subscriptions)
  //           ? responseData.subscriptions
  //           : [];
  //         console.log(
  //           "[SUBSCRIPTIONS] ✓ Found subscriptions in direct structure:",
  //           subscriptionsArray.length,
  //           "items"
  //         );
  //       } else if (responseData?.data?.subscriptions) {
  //         // Fallback for nested structure if needed
  //         subscriptionsArray = Array.isArray(responseData.data.subscriptions)
  //           ? responseData.data.subscriptions
  //           : [];
  //         console.log(
  //           "[SUBSCRIPTIONS] ✓ Found subscriptions in nested structure:",
  //           subscriptionsArray.length,
  //           "items"
  //         );
  //       } else {
  //         console.warn(
  //           "[SUBSCRIPTIONS] ⚠️ Could not find subscriptions array in response structure"
  //         );
  //       }

  //       // Map API response to component format
  //       const mappedSubscriptions = subscriptionsArray.map((sub) => {
  //         // Get first line item for product info
  //         const firstItem = sub.line_items?.[0] || {};

  //         // Map status: "on-hold" -> "paused", "cancelled" -> "canceled", "active" -> "active"
  //         let mappedStatus = sub.status?.toLowerCase() || "active";
  //         if (mappedStatus === "on-hold") {
  //           mappedStatus = "paused";
  //         } else if (mappedStatus === "cancelled") {
  //           mappedStatus = "canceled";
  //         }

  //         // Extract product name - API uses product_name field
  //         const productName = firstItem.product_name || "Unknown Product";

  //         // Extract dosage from direct fields (not meta_data)
  //         const tabsFrequency = firstItem.tabs_frequency || "";
  //         const subscriptionType = firstItem.subscription_type || "";
  //         const dosage =
  //           tabsFrequency && subscriptionType
  //             ? `${tabsFrequency} | ${subscriptionType}`
  //             : tabsFrequency || subscriptionType || "Not available";

  //         // Format next refill date - prefer next_refill (already formatted), otherwise format next_payment_date
  //         let nextRefillDate = "Not scheduled";
  //         if (sub.next_refill) {
  //           // next_refill is already formatted like "Jan 20, 2025"
  //           nextRefillDate = sub.next_refill;
  //         } else if (sub.next_payment_date) {
  //           // Format ISO date string
  //           nextRefillDate = new Date(sub.next_payment_date).toLocaleDateString(
  //             "en-US",
  //             {
  //               month: "short",
  //               day: "numeric",
  //               year: "numeric",
  //             }
  //           );
  //         }

  //         return {
  //           id: sub.id,
  //           category: "Sexual Health", // Default category, can be enhanced later
  //           status: mappedStatus,
  //           productName: productName,
  //           productSubtitle: null, // API doesn't provide subtitle in new format
  //           dosage: dosage,
  //           nextRefill: nextRefillDate,
  //           productImage:
  //             firstItem.image?.src ||
  //             "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
  //           // Store full subscription data for actions
  //           _raw: sub,
  //         };
  //       });

  //       console.log(
  //         "[SUBSCRIPTIONS] Mapped subscriptions:",
  //         mappedSubscriptions
  //       );
  //       setSubscriptionsData(mappedSubscriptions);
  //     } catch (err) {
  //       console.error("[SUBSCRIPTIONS] Error fetching subscriptions:", err);
  //       setError(err.message || "Failed to load subscriptions");
  //       setSubscriptionsData([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchSubscriptions();
  // }, []);

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
    // Request refill is handled directly in SubscriptionCard with API call, don't open page
    // See prescription navigates to prescriptions page, don't open page
    // Message provider integrates with API and navigates to messages, don't open page
    if (
      action === "Request refill" ||
      action === "See prescription" ||
      action === "Message provider"
    ) {
      return;
    }
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
          <div className="flex flex-col items-start gap-2 max-w-[528px] mx-auto">
            <div className="flex items-center justify-between w-full mb-4">
              <button
                onClick={handleBackClick}
                className="inline-flex items-center cursor-pointer justify-center border-none w-10 h-10 md:w-10 md:h-10 rounded-[12px] text-[black] bg-[#FFFFFF] main-shadow "
                aria-label="Back to subscriptions"
              >
                <FiChevronLeft size={20} />
              </button>
              <button
                onClick={handleCloseFlow}
                className="flex px-4 py-3 justify-center items-center gap-[10px] rounded-[12px] cursor-pointer border border-[#E2E2E1] bg-white text-[black] text-[14px] font-medium hover:bg-[#F9FAFB] shadow-[0_0_16px_0_rgba(0,0,0,0.08)]"
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
        <div className="flex items-center justify-between w-full mb-4  max-w-[528px] mx-auto">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center justify-center cursor-pointer border-none w-10 h-10 md:w-10 md:h-10 rounded-[12px] text-[black] bg-[#FFFFFF] main-shadow  "
            aria-label="Back to subscriptions"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={handleCloseFlow}
            className="flex px-4 py-3 justify-center items-center gap-[10px] rounded-[12px] cursor-pointer border border-[#E2E2E1] bg-white text-[black] text-[14px] font-medium hover:bg-[#F9FAFB] shadow-[0_0_16px_0_rgba(0,0,0,0.08)]"
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

    // All other actions are handled directly in SubscriptionCard
    // This should not be reached, but return null as fallback
    return null;
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
      ) : loading ? (
        <div className="space-y-6">
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
            <div className="relative">
              <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2">
                <SubscriptionCardSkeleton />
                <SubscriptionCardSkeleton />
                <SubscriptionCardSkeleton />
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-red-600 text-center">Error: {error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <EmptyState
            title="No Subscriptions"
            message={`You don't have any ${
              activeTab !== "all" ? activeTab : ""
            } subscriptions yet.`}
          />
        </div>
      )}
    </div>
  );
}
