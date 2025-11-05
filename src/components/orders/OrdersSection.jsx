"use client";

import { useState, useEffect } from "react";
import OrderCard from "./OrderCard";
import { transformOrders, groupOrdersByDate } from "./ordersData";

const OrdersSection = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/orders?per_page=10&order_type=subscription");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch orders");
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.orders)) {
        const transformedOrders = transformOrders(data.orders);
        setOrders(transformedOrders);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedOrders = groupOrdersByDate(orders);
  const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
    // Sort dates in descending order (most recent first)
    // Parse formatted dates (e.g., "Jun 19, 2024") for comparison
    const dateA = new Date(a);
    const dateB = new Date(b);
    // If dates are invalid, fall back to string comparison
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      return b.localeCompare(a);
    }
    return dateB - dateA;
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
        <p className="text-red-600 text-center mb-4">Error: {error}</p>
        <button
          onClick={fetchOrders}
          className="mx-auto block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h2 className="text-[14px] font-[500] text-[#212121] mb-2">{date}</h2>
          <div className="space-y-3">
            {groupedOrders[date].map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      ))}

      {sortedDates.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-center">No orders found.</p>
        </div>
      )}
    </div>
  );
};

export default OrdersSection;
