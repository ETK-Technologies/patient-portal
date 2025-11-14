"use client";

import { useEffect, useState } from "react";
import OrderCard from "./OrderCard";

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
  };
  const statusText =
    statusMap[apiOrder.status?.toLowerCase()] || apiOrder.status || "Unknown";

  // Format total as currency
  const formattedTotal = `$${parseFloat(apiOrder.total || 0).toFixed(2)}`;

  return {
    id: apiOrder.id,
    date: formatDateForGrouping(
      apiOrder.created_at?.split(" ")[0] || apiOrder.created_at
    ),
    product: {
      name: firstItem.product_name || "Unknown Product",
      subtitle: firstItem.brand || firstItem.type || null,
      image: firstItem.product_image || "",
    },
    orderNumber: `#${apiOrder.id}`,
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
  const [error, setError] = useState(null);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/user/orders");

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[ORDERS_SECTION] Error fetching orders:", errorData);
          setError(errorData.error || "Failed to fetch orders");
          setOrders([]);
          return;
        }

        const data = await response.json();
        console.log("[ORDERS_SECTION] Orders API response:", data);

        // Check if we have the grouped data structure from API
        if (data.orders && Array.isArray(data.orders)) {
          // API returns: [{date: '2025-10-08', orders: Array(5)}, ...]
          const allOrders = [];
          data.orders.forEach((dateGroup) => {
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
          setOrders(allOrders);
        } else if (data.data && Array.isArray(data.data)) {
          // Fallback: if data is directly an array
          const transformedOrders = data.data.map(transformOrder);
          setOrders(transformedOrders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("[ORDERS_SECTION] Error fetching orders:", error);
        setError(error.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-center">Loading orders...</p>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-center">Data not exist</p>
      </div>
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
    </div>
  );
};

export default OrdersSection;
