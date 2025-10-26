"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CustomImage from "@/components/utils/CustomImage";
import AccountDropdown from "./navbar/AccountDropdown";

const navigationItems = [
  { name: "Home", href: "/home" },
  { name: "Messages", href: "/messages" },
  { name: "Subscriptions", href: "/subscriptions" },
  { name: "Orders", href: "/orders" },
  { name: "Appointments", href: "/appointments" },
  { name: "Consultations", href: "/consultations" },
  { name: "Treatments", href: "/treatments" },
  { name: "Shop", href: "/shop" },
];

export default function Sidebar({ isOpen, isClosing, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:block lg:w-[260px] ">
        <div className="h-full" style={{ backgroundColor: "#FBFAF9" }}>
          <div className="flex flex-col h-full">
            {/* Navigation */}
            <nav className="flex-1 px-[20px] p-6">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-[20px] py-3 text-[14px] font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? "text-gray-900"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        style={{
                          backgroundColor: isActive ? "#FFFFFF" : "transparent",
                          boxShadow: isActive
                            ? "0px 0px 16px 0px #00000014"
                            : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.target.style.backgroundColor = "#FFFFFF";
                            e.target.style.boxShadow =
                              "0px 0px 16px 0px #00000014";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.boxShadow = "none";
                          }
                        }}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile sidebar - slides in smoothly */}
      {(isOpen || isClosing) && (
        <div
          className={`fixed top-0 right-0 h-full w-screen bg-white shadow-lg z-[9999] transform transition-transform duration-300 ease-in-out lg:hidden ${
            isOpen && !isClosing ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            backgroundColor: "#FBFAF9",
            boxShadow: "0px 0px 16px 0px #00000014",
          }}
        >
          {/* Header with close button */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
              <button
                onClick={onClose}
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
          </div>

          <div className="flex flex-col h-full">
            {/* Mobile Account Menu - Only visible on mobile */}
            <div className="p-4 border-b border-gray-200">
              <AccountDropdown />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center px-[20px] py-3 text-[14px] font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? "text-gray-900"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        style={{
                          backgroundColor: isActive ? "#FFFFFF" : "transparent",
                          boxShadow: isActive
                            ? "0px 0px 16px 0px #00000014"
                            : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.target.style.backgroundColor = "#FFFFFF";
                            e.target.style.boxShadow =
                              "0px 0px 16px 0px #00000014";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.boxShadow = "none";
                          }
                        }}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
