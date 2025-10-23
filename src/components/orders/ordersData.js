export const ordersData = [
  {
    id: 1,
    date: "Sep 15, 2025",
    product: {
      name: "Brand Cialis",
      subtitle: "Tadalafil",
      image:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
    orderNumber: "#557456",
    trackingNumber: "RKY215543-332",
    type: "Subscription",
    total: "$120",
    status: {
      text: "Canceled",
      color: "red",
    },
    isExpanded: true,
  },
  {
    id: 2,
    date: "Sep 03, 2025",
    product: {
      name: "Brand Viagra",
      subtitle: "Sildenafil",
      image:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
    orderNumber: "#722345",
    trackingNumber: "RKY344543-168",
    type: "Order",
    total: "$135",
    status: {
      text: "Medical Review",
      color: "yellow",
    },
    isExpanded: true,
  },
  {
    id: 3,
    date: "Aug 22, 2025",
    product: {
      name: "Finasteride & Minoxidil Topical Foam",
      subtitle: null,
      image:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
    orderNumber: "#445123",
    trackingNumber: "RKY123456-789",
    type: "Subscription",
    total: "$89",
    status: {
      text: "Shipped",
      color: "green",
    },
    isExpanded: false,
  },
  {
    id: 4,
    date: "Aug 22, 2025",
    product: {
      name: "Minoxidil",
      subtitle: null,
      image:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
    orderNumber: "#445124",
    trackingNumber: "RKY123457-790",
    type: "Order",
    total: "$45",
    status: {
      text: "Delivered",
      color: "blue",
    },
    isExpanded: false,
  },
  {
    id: 5,
    date: "Aug 15, 2025",
    product: {
      name: "Brand Viagra",
      subtitle: "Sildenafil",
      image:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
    orderNumber: "#445125",
    trackingNumber: "RKY123458-791",
    type: "Order",
    total: "$135",
    status: {
      text: "Delivered",
      color: "blue",
    },
    isExpanded: false,
  },
  {
    id: 6,
    date: "Aug 10, 2025",
    product: {
      name: "Generic Cialis",
      subtitle: "Tadalafil",
      image:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
    orderNumber: "#445126",
    trackingNumber: "RKY123459-792",
    type: "Subscription",
    total: "$95",
    status: {
      text: "Shipped",
      color: "green",
    },
    isExpanded: false,
  },
  {
    id: 7,
    date: "Aug 05, 2025",
    product: {
      name: "Hair Growth Kit",
      subtitle: "Finasteride + Minoxidil",
      image:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
    orderNumber: "#445127",
    trackingNumber: "RKY123460-793",
    type: "Order",
    total: "$125",
    status: {
      text: "Delivered",
      color: "blue",
    },
    isExpanded: false,
  },
];

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
