// Default/fallback orders data (kept for reference or fallback)
export const ordersData = [];

/**
 * Format date from CRM API format to display format
 * @param {string} dateString - Date string from API (e.g., "2024-06-19 02:07:11")
 * @returns {string} Formatted date (e.g., "Jun 19, 2024")
 */
function formatDate(dateString) {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    return `${month} ${day}, ${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Map CRM order status to display format
 * @param {string} status - Status from API (e.g., "completed", "pending", etc.)
 * @returns {string} Display status text
 */
function mapStatus(status) {
  if (!status) return "Pending";

  const statusMap = {
    completed: "Delivered",
    pending: "Pending",
    processing: "Processing",
    on_hold: "On Hold",
    cancelled: "Canceled",
    refunded: "Refunded",
    failed: "Failed",
    shipped: "Shipped",
    delivered: "Delivered",
    medical_review: "Medical Review",
  };

  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_");
  return statusMap[normalizedStatus] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

/**
 * Map order type from created_via field
 * @param {string} createdVia - Value from created_via field
 * @returns {string} Order type ("Subscription" or "Order")
 */
function mapOrderType(createdVia) {
  if (!createdVia) return "Order";

  const normalized = createdVia.toLowerCase();
  if (normalized === "subscription") {
    return "Subscription";
  }
  return "Order";
}

/**
 * Transform CRM API order data to component format
 * @param {Object} apiOrder - Order object from CRM API
 * @returns {Object} Transformed order object for component
 */
export function transformOrder(apiOrder) {
  if (!apiOrder) return null;

  // Parse billing/shipping if they're JSON strings
  let billing = {};
  let shipping = {};

  try {
    if (typeof apiOrder.billing === "string") {
      billing = JSON.parse(apiOrder.billing);
    } else if (apiOrder.billing) {
      billing = apiOrder.billing;
    }
  } catch (e) {
    console.warn("Failed to parse billing:", e);
  }

  try {
    if (typeof apiOrder.shipping === "string") {
      shipping = JSON.parse(apiOrder.shipping);
    } else if (apiOrder.shipping) {
      shipping = apiOrder.shipping;
    }
  } catch (e) {
    console.warn("Failed to parse shipping:", e);
  }

  // Format total with currency symbol
  const currencySymbol = apiOrder.currency_symbol || "$";
  const total = apiOrder.total || 0;
  const formattedTotal = `${currencySymbol}${total.toFixed(2)}`;

  // Format date - use date_created_local or date_created
  const dateCreated = apiOrder.date_created_local || apiOrder.date_created || "";
  const formattedDate = formatDate(dateCreated);

  // Map status
  const statusText = mapStatus(apiOrder.status);

  // Map order type
  const orderType = mapOrderType(apiOrder.created_via);

  // Get order number (prefer wp_order_id, fallback to id)
  const orderNumber = apiOrder.wp_order_id || `#${apiOrder.id}`;

  // Get tracking number
  const trackingNumber = apiOrder.tracking_number || "N/A";

  // Default product info (since product details aren't in the API response)
  // You can enhance this later by fetching order items or using other fields
  const productName = "Order Items"; // Default placeholder

  return {
    id: apiOrder.id,
    date: formattedDate,
    product: {
      name: productName,
      subtitle: null,
      image: "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
    orderNumber: `#${orderNumber}`,
    trackingNumber: trackingNumber,
    type: orderType,
    total: formattedTotal,
    status: {
      text: statusText,
      color: getStatusColor(statusText),
    },
    isExpanded: false,
    // Store raw API data for potential future use
    rawData: apiOrder,
  };
}

/**
 * Get status color class based on status text
 * @param {string} status - Status text
 * @returns {string} Color identifier
 */
function getStatusColor(status) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "delivered") return "blue";
  if (normalizedStatus === "shipped") return "green";
  if (normalizedStatus === "medical review") return "yellow";
  if (normalizedStatus === "canceled" || normalizedStatus === "cancelled") return "red";
  if (normalizedStatus === "pending" || normalizedStatus === "processing") return "yellow";

  return "gray";
}

/**
 * Transform array of API orders to component format
 * @param {Array} apiOrders - Array of order objects from CRM API
 * @returns {Array} Array of transformed order objects
 */
export function transformOrders(apiOrders) {
  if (!Array.isArray(apiOrders)) return [];

  return apiOrders
    .map(transformOrder)
    .filter((order) => order !== null);
}

// Helper function to group orders by date
export const groupOrdersByDate = (orders) => {
  return orders.reduce((grouped, order) => {
    const date = order.date;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(order);
    return grouped;
  }, {});
};
