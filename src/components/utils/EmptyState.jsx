import Link from "next/link";
import CustomButton from "./CustomButton";
import { FaArrowRight } from "react-icons/fa";

/**
 * Reusable EmptyState component for displaying empty states across the application
 *
 * @param {string} title - The main title text (e.g., "You have no orders")
 * @param {string} description - The description text below the title
 * @param {string} buttonText - Text for the action button
 * @param {string} buttonHref - Link href for the button (if provided, button will be a Link)
 * @param {function} buttonOnClick - onClick handler for the button (if provided, button will be a button element)
 * @param {ReactNode} buttonIcon - Icon to display in the button (defaults to FaArrowRight)
 * @param {string} className - Additional CSS classes for the container
 */
export default function EmptyState({
  title = "No items found",
  description = "There are no items to display at this time.",
  buttonText = "Get started",
  buttonHref,
  buttonOnClick,
  buttonIcon = <FaArrowRight />,
  className = "",
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {/* Title */}
        <h3 className="text-[18px] md:text-[20px] font-bold text-[#212121]">
          {title}
        </h3>

        {/* Description */}
        <p className="text-[14px] md:text-[16px] text-[#585857] max-w-md">
          {description}
        </p>

        {/* Action Button */}
        {(buttonHref || buttonOnClick) && (
          <div className="pt-2">
            {buttonHref ? (
              <CustomButton
                href={buttonHref}
                size="medium"
                width="fit"
                className="bg-[#000000] border border-[#000000] text-white hover:bg-[#333333]"
                icon={buttonIcon}
              >
                {buttonText}
              </CustomButton>
            ) : (
              <CustomButton
                onClick={buttonOnClick}
                size="medium"
                width="fit"
                className="bg-[#000000] border border-[#000000] text-white hover:bg-[#333333]"
                icon={buttonIcon}
              >
                {buttonText}
              </CustomButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
