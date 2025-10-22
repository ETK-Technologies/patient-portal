"use client";

import { useState } from "react";
import { IoNotificationsOutline } from "react-icons/io5";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const notifications = [
    {
      id: 1,
      title: "Payment Pre-Authorization",
      time: "now",
      isUnread: true,
      description:
        "Secure Payment Pre-Authorization. Verify your payment details to continue. You'll only be charged for treatment if prescribed.",
      actions: [
        { label: "Review Details", variant: "secondary" },
        { label: "Pre-Authorize Payment", variant: "primary" },
      ],
    },
    {
      id: 2,
      title: "Preparing Your Order",
      time: "7h ago",
      isUnread: false,
      description:
        "Pharmacy Is Preparing Your Order. Your treatment is being carefully prepared and packaged.",
      actions: [{ label: "View Order Details", variant: "primary" }],
    },
    {
      id: 3,
      title: "Medical Review",
      time: "2d ago",
      isUnread: false,
      description:
        "Medical Review in Progress. Our healthcare team is carefully reviewing your information.",
      actions: [],
    },
    {
      id: 4,
      title: "Appointment Reminder",
      time: "3d ago",
      isUnread: false,
      description:
        "Your appointment is scheduled for tomorrow at 2:00 PM. Please arrive 15 minutes early.",
      actions: [{ label: "View Appointment", variant: "primary" }],
    },
    {
      id: 5,
      title: "Prescription Ready",
      time: "4d ago",
      isUnread: true,
      description:
        "Your prescription has been prepared and is ready for pickup at your local pharmacy.",
      actions: [{ label: "View Details", variant: "secondary" }],
    },
    {
      id: 6,
      title: "Lab Results Available",
      time: "5d ago",
      isUnread: false,
      description:
        "Your recent lab test results are now available in your patient portal.",
      actions: [{ label: "View Results", variant: "primary" }],
    },
    {
      id: 7,
      title: "Insurance Update",
      time: "1w ago",
      isUnread: false,
      description: "Your insurance information has been updated successfully.",
      actions: [],
    },
  ];

  const filteredNotifications =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => n.isUnread);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2  hover:bg-[#F1F0EF] rounded-lg transition-colors relative cursor-pointer"
      >
        <IoNotificationsOutline className="w-4 h-4" />

        {/* Unread indicator */}
        {notifications.some((n) => n.isUnread) && (
          <span className="absolute  w-[6px] h-[6px] right-[10px] top-[10px] bg-red-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Desktop overlay */}
          <div className="fixed inset-0 bg-black opacity-50 z-10 bg-opacity-50 z-40 hidden lg:block" />

          {/* Notification panel */}
          <div
            className="fixed top-0 right-0 h-full w-full bg-white shadow-lg z-50 lg:w-[440px] lg:h-full lg:shadow-2xl transform transition-transform duration-300 ease-in-out"
            style={{
              backgroundColor: "#FFFFFF",
              boxShadow: "0px 0px 16px 0px #00000014",
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex mt-3">
                <button
                  onClick={() => setActiveTab("All")}
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    activeTab === "All"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab("Unread")}
                  className={`px-3 py-1 text-sm font-medium rounded ml-2 ${
                    activeTab === "Unread"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Unread
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-screen overflow-y-auto">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </h4>
                        {notification.isUnread && (
                          <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.time}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        {notification.description}
                      </p>

                      {/* Action buttons */}
                      {notification.actions.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {notification.actions.map((action, index) => (
                            <button
                              key={index}
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                action.variant === "primary"
                                  ? "bg-gray-900 text-white hover:bg-gray-800"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
