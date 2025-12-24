/**
 * Get the status dot color based on status text
 * @param {string} status - The status text
 * @returns {string} Tailwind CSS class for the status dot color
 */
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    // Subscription statuses
    case "active":
      return "bg-[#00AB55]";
    case "paused":
      return "bg-yellow-500";
    case "pending-cancel":
      return "bg-gray-500";

    // Consultation statuses
    case "completed":
      return "bg-[#00AB55]";

    // Order statuses
    case "pending":
      return "bg-orange-500";
    case "processing":
      return "bg-purple-500";
    case "medical review":
      return "bg-yellow-500";
    case "shipped":
      return "bg-green-500";
    case "delivered":
      return "bg-blue-500";

    // Shared statuses
    case "canceled":
      return "bg-[#A50E0E]";

    default:
      return "bg-gray-500";
  }
};

/**
 * Get the status container background and border classes
 * @param {string} status - The status text
 * @returns {string} Tailwind CSS classes for the status container
 */
export const getStatusContainerClasses = (status) => {
  switch (status?.toLowerCase()) {
    // Subscription statuses
    case "active":
      return "bg-gradient-to-r from-green-100/30 to-white border-[#C3FACF]";
    case "paused":
      return "bg-gradient-to-r from-yellow-100/30 to-white border-[#FEEFC3]";
    case "pending-cancel":
      return "bg-gradient-to-r from-gray-100/30 to-white border-[#E0E0E0]";

    // Consultation statuses
    case "completed":
      return "bg-gradient-to-r from-green-100/30 to-white border-[#C3FACF]";

    // Order statuses
    case "pending":
      return "bg-gradient-to-r from-orange-100/30 to-white border-[#FED7AA]";
    case "processing":
      return "bg-gradient-to-r from-purple-100/30 to-white border-[#E9D5FF]";
    case "medical review":
      return "bg-gradient-to-r from-yellow-100/30 to-white border-[#FEEFC3]";
    case "shipped":
      return "bg-gradient-to-r from-green-100/30 to-white border-[#C3FACF]";
    case "delivered":
      return "bg-gradient-to-r from-blue-100/30 to-white border-[#C3E6FA]";

    // Shared statuses
    case "canceled":
      return "bg-gradient-to-r from-red-100/30 to-white border-[#FAD2CF]";

    default:
      return "bg-gradient-to-r from-gray-100/30 to-white border-[#E0E0E0]";
  }
};
