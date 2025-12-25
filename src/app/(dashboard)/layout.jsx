"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar/Navbar";
import { usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarClosing, setSidebarClosing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { userData, error } = useUser();

  // Get the current page title from the pathname
  const getPageTitle = () => {
    const path = pathname.split("/")[2] || "dashboard"; // Get the second segment (after /dashboard/)
    return path.charAt(0).toUpperCase() + path.slice(1); // Capitalize first letter
  };

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMobileClose = () => {
    setSidebarClosing(true);
    // Wait for animation to complete before hiding the sidebar
    setTimeout(() => {
      setSidebarOpen(false);
      setSidebarClosing(false);
    }, 300); // Match the duration of the CSS transition
  };

  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (error && !userData) {
    return (
      <div
        className="h-screen flex items-center justify-center max-w-[1440px] mx-auto"
        style={{ backgroundColor: "#FBFAF9" }}
      >
        <div className="flex flex-col items-center justify-center space-y-4 max-w-md text-center px-4">
          <div className="text-red-600 text-4xl mb-2">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800">Unable to Load Profile</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col max-w-[1440px] mx-auto"
      style={{ backgroundColor: "#FBFAF9" }}
    >
      {/* Full width navbar */}
      <div className="w-full">
        <Navbar onMenuClick={handleMenuToggle} pageTitle={getPageTitle()} />
      </div>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky lg:top-0 lg:self-start inset-y-0 right-0 z-[9999] transform transition-all duration-300 ease-in-out ${
            sidebarOpen && !sidebarClosing
              ? "translate-x-0 "
              : "translate-x-full lg:translate-x-0"
          } ${sidebarCollapsed ? "w-20" : "w-64"}`}
        >
          <Sidebar
            isOpen={sidebarOpen}
            isClosing={sidebarClosing}
            onClose={handleMobileClose}
            isCollapsed={sidebarCollapsed}
            onCollapse={handleSidebarCollapse}
          />
        </aside>

        {/* Main content area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Page content */}
          <div className="flex-1 overflow-y-auto p-5 md:pt-0 md:p-6 md:pt-0 md:pl-[60px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
