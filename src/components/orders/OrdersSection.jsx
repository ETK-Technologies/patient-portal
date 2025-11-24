"use client";

import { useEffect, useState } from "react";
import OrderCard from "./OrderCard";
import CustomButton from "@/components/utils/CustomButton";
import EmptyState from "@/components/utils/EmptyState";
import OrderCardSkeleton from "@/components/utils/skeletons/OrderCardSkeleton";
import { FaArrowRight } from "react-icons/fa";

// Helper function to format date from API format (2025-10-08) to display format (Oct 08, 2025)
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Helper function to format date for grouping (2025-10-08 -> Oct 08, 2025)
const formatDateForGrouping = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Transform API order data to match component expected structure
const transformOrder = (apiOrder) => {
  // Get first line item as main product
  const firstItem = apiOrder.line_items?.[0] || {};

  // Format tracking number (it's an array, join or use first)
  const trackingNumber = Array.isArray(apiOrder.tracking_number)
    ? apiOrder.tracking_number.join(", ") || "N/A"
    : apiOrder.tracking_number || "N/A";

  // Map status
  const statusMap = {
    cancelled: "Canceled",
    canceled: "Canceled",
    pending: "Pending",
    shipped: "Shipped",
    delivered: "Delivered",
    processing: "Processing",
    trash: "Trash",
  };
  const statusText =
    statusMap[apiOrder.status?.toLowerCase()] || apiOrder.status || "Unknown";

  // Format total as currency
  const formattedTotal = `$${parseFloat(apiOrder.total || 0).toFixed(2)}`;

  // Use crm_order_id as the primary ID (required for order details API)
  const orderId = apiOrder.crm_order_id || apiOrder.id;
  
  return {
    id: orderId,
    date: formatDateForGrouping(
      apiOrder.created_at?.split(" ")[0] || apiOrder.created_at
    ),
    product: {
      name: firstItem.product_name || "Unknown Product",
      subtitle: firstItem.brand || firstItem.type || null,
      image: firstItem.product_image || "",
    },
    orderNumber: `#${apiOrder.wp_order_id || orderId}`,
    trackingNumber: trackingNumber,
    type: firstItem.type || "Order",
    total: formattedTotal,
    status: {
      text: statusText,
      color:
        statusText.toLowerCase() === "canceled"
          ? "red"
          : statusText.toLowerCase() === "pending"
          ? "yellow"
          : statusText.toLowerCase() === "shipped"
          ? "green"
          : statusText.toLowerCase() === "delivered"
          ? "blue"
          : "gray",
    },
    isExpanded: false,
    // Store original API data for details modal
    details: apiOrder,
  };
};

// Group orders by date
const groupOrdersByDate = (orders) => {
  return orders.reduce((grouped, order) => {
    const date = order.date;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(order);
    return grouped;
  }, {});
};

const OrdersSection = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Helper function to process orders from API response
  const processOrdersData = (data) => {
    const allOrders = [];

    // New API format: { status: true, message: "...", data: { orders: [...], pagination: {...} } }
    // Old format: { success: true, orders: [...], data: {...} }
    let ordersData = null;
    
    if (data.status && data.data && data.data.orders) {
      // New format: data.data.orders
      ordersData = data.data.orders;
    } else if (data.data && data.data.orders) {
      // Alternative: data.data.orders
      ordersData = data.data.orders;
    } else if (data.orders && Array.isArray(data.orders)) {
      // Old format: data.orders
      ordersData = data.orders;
    } else if (data.data && Array.isArray(data.data)) {
      // Fallback: data.data is array
      ordersData = data.data;
    }

    if (ordersData && Array.isArray(ordersData)) {
      // API returns: [{date: '2025-10-08', orders: Array(5)}, ...]
      ordersData.forEach((dateGroup) => {
        if (dateGroup.orders && Array.isArray(dateGroup.orders)) {
          dateGroup.orders.forEach((order) => {
            // Use the date from the group, not from the order
            const transformedOrder = transformOrder(order);
            transformedOrder.date = formatDateForGrouping(dateGroup.date);
            transformedOrder.originalDate = dateGroup.date; // Keep for sorting
            allOrders.push(transformedOrder);
          });
        }
      });
    }

    return allOrders;
  };

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async (page = 1) => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await fetch(`/api/user/orders?page=${page}`);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[ORDERS_SECTION] Error fetching orders:", errorData);
          setError(errorData.message || errorData.error || "Failed to fetch orders");
          if (page === 1) {
            setOrders([]);
          }
          return;
        }

        const data = await response.json();
        console.log("[ORDERS_SECTION] Orders API response:", data);

        const newOrders = processOrdersData(data);

        if (page === 1) {
          setOrders(newOrders);
        } else {
          // Append new orders to existing ones
          setOrders((prevOrders) => [...prevOrders, ...newOrders]);
        }

        // Store pagination info from response
        if (data.data?.pagination) {
          setPagination(data.data.pagination);
        }
      } catch (error) {
        console.error("[ORDERS_SECTION] Error fetching orders:", error);
        setError(error.message);
        if (page === 1) {
          setOrders([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchOrders(1);
  }, []);

  // Load more orders
  const handleLoadMore = async () => {
    if (!pagination || !pagination.next_page_url || loadingMore) {
      return;
    }

    const nextPage = pagination.current_page + 1;
    try {
      setLoadingMore(true);
      setError(null);

      const response = await fetch(`/api/user/orders?page=${nextPage}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "[ORDERS_SECTION] Error fetching more orders:",
          errorData
        );
        setError(errorData.message || errorData.error || "Failed to fetch more orders");
        return;
      }

      const data = await response.json();
      console.log("[ORDERS_SECTION] Load more orders API response:", data);

      const newOrders = processOrdersData(data);

      // Append new orders to existing ones
      setOrders((prevOrders) => [...prevOrders, ...newOrders]);

      // Update pagination info
      if (data.data?.pagination) {
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("[ORDERS_SECTION] Error loading more orders:", error);
      setError(error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  // Group orders by date
  const groupedOrders = groupOrdersByDate(orders);
  const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
    // Sort dates in descending order (most recent first)
    // Find the original date from the first order in each group for accurate sorting
    const dateA = groupedOrders[a]?.[0]?.originalDate || a;
    const dateB = groupedOrders[b]?.[0]?.originalDate || b;
    return new Date(dateB) - new Date(dateA);
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Date group skeleton */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="space-y-3">
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-center">Error: {error}</p>
      </div>
    );
  }

  if (sortedDates.length === 0 || orders.length === 0) {
    return (
      <EmptyState
        title="You have no orders"
        description="No active orders right now. Discover what's available and get started today."
        buttonText="Find a treatment"
        buttonHref="/treatments"
      />
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h2 className="text-[14px] font-medium text-[#212121] mb-2">
            {date}
          </h2>
          <div className="space-y-3">
            {groupedOrders[date].map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      ))}

      {/* View More Button */}
      {pagination && pagination.next_page_url && (
        <div className="mt-6 md:mt-4">
          <CustomButton
            onClick={handleLoadMore}
            disabled={loadingMore}
            size="medium"
            width="full"
            className="bg-[#F1F0EF] border border-[#E2E2E1] text-[#000000] hover:bg-[#E8E7E6]"
            icon={!loadingMore && <FaArrowRight />}
          >
            {loadingMore ? "Loading..." : "View More"}
          </CustomButton>
        </div>
      )}
    </div>
  );
};

export default OrdersSection;
