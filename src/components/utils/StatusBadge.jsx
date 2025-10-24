import { getStatusColor, getStatusContainerClasses } from "./statusHelpers";

/**
 * Reusable status badge component
 * @param {Object} props
 * @param {string} props.status - The status text to display
 * @param {string} props.className - Additional CSS classes
 */
export default function StatusBadge({ status, className = "" }) {
  if (!status) return null;

  return (
    <div
      className={`flex items-center gap-1 w-fit py-[3px] px-2 rounded-[8px] border ${getStatusContainerClasses(
        status
      )} ${className}`}
    >
      <div
        className={`w-[6px] h-[6px] rounded-full ${getStatusColor(status)}`}
      ></div>
      <span className="text-[10px] font-[400] text-[#212121] leading-[140%] capitalize">
        {status}
      </span>
    </div>
  );
}
