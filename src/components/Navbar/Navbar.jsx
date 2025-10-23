"use client";

import CustomImage from "@/components/utils/CustomImage";
import AccountDropdown from "./AccountDropdown";
// import NotificationDropdown from "./NotificationDropdown";
import { RxHamburgerMenu } from "react-icons/rx";

export default function Navbar({ onMenuClick }) {
  return (
    <nav className="px-2 md:px-[40px] py-3 h-[56px] flex items-center justify-between">
      {/* Left side - Logo */}
      <div className="flex items-center">
        <div className="relative ml-3 md:ml-0 w-[98px] h-[24px]">
          <CustomImage
            src="https://myrocky.b-cdn.net/WP%20Images/patient-portal/Rocky-portal-logo.png"
            alt="Rocky Portal Logo"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Right side - Notifications, Account dropdown, and Mobile menu button */}
      <div className="flex items-center ">
        {/* <NotificationDropdown /> */}
        {/* Hide account dropdown on mobile - it will be in sidebar */}
        <div className="hidden lg:block">
          <AccountDropdown />
        </div>
        {/* Mobile menu button - moved to right side */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RxHamburgerMenu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
