const dummyOrderDetails = {
  orderId: "#356857",
  subscriptionLabel: "New Subscription",
  status: "Canceled",
  timeline: [
    { label: "Order Received", date: "11.03.2025", isCompleted: true },
    { label: "Shipped", date: "11.09.2025", isCompleted: true },
    { label: "Out for delivery", date: null, isCompleted: false },
    { label: "Delivered", date: null, isCompleted: false },
  ],
  billingDetails: {
    paymentMethod: "VISA (**** 7360)",
    transactionDate: "Thursday, November 03, 2025 (GMT+7)",
    customerName: "Tymour Kadry",
    email: "tymour@myrocky.ca",
    phoneNumber: "(124) 356-4567",
    shippingAddress: "125-46095 AV Bole, NOVA SCOTIA AVE NS V3C 5M6 CA",
    trackingNumber: "RKY215543-332",
  },
  items: [
    {
      id: "item-1",
      title: "Tadalafil",
      quantityLabel: "X 1",
      priceLabel: "$138.00",
      highlights: [
        { label: "Tabs Frequency", value: "8-tabs" },
        { label: "Subscription Type", value: "Monthly supply" },
      ],
      image:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
    {
      id: "item-2",
      title: "Body Optimization Program",
      quantityLabel: "X 1",
      priceLabel: [
        { label: "Initial fee", value: "$99" },
        { label: "Monthly fee", value: "$40" },
      ],
      highlights: [
        {
          label: "Includes",
          value:
            "Monthly Prescriptions, Follow-ups with clinicians, Pharmacist counseling",
        },
      ],
      image:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
    {
      id: "item-3",
      title: "Finasteride",
      quantityLabel: "X 1",
      priceLabel: "$138.00",
      highlights: [],
      image:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/order-card-1.png",
    },
  ],
  summary: {
    subtotal: "$375.00",
    discount: {
      value: "- $138.00",
      note: "(coupon: tymour100)",
    },
    shipping: {
      value: "+ $0.00",
      note: "(Free shipping)",
    },
    tax: "$0.00",
    total: "$237.00",
  },
  invoiceUrl: "#",
};

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
    details: dummyOrderDetails,
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
    details: dummyOrderDetails,
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
    details: dummyOrderDetails,
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
    details: dummyOrderDetails,
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
    details: dummyOrderDetails,
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
    details: dummyOrderDetails,
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
    details: dummyOrderDetails,
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
