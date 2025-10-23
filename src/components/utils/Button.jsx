import Link from "next/link";

export default function CustomButton({
  href,
  text,
  icon,
  variant = "default",
  size = "medium",
  width = "full",
  className = "",
  onClick,
  disabled = false,
  type = "button",
}) {
  // Variant styles
  const variants = {
    default:
      "bg-[#F1F0EF] border border-[#E2E2E1] text-[#000000] hover:bg-[#E8E7E6]",
    primary:
      "bg-[#007BFF] border border-[#007BFF] text-white hover:bg-[#0056B3]",
    secondary:
      "bg-white border border-[#E2E2E1] text-[#585857] hover:bg-[#F9F9F9]",
    danger:
      "bg-[#DC3545] border border-[#DC3545] text-white hover:bg-[#C82333]",
    success:
      "bg-[#28A745] border border-[#28A745] text-white hover:bg-[#218838]",
    ghost:
      "bg-transparent border border-transparent text-[#585857] hover:bg-[#F9F9F9]",
  };

  // Size styles
  const sizes = {
    small: "h-[36px] px-3 py-2 text-[14px]",
    medium: "h-[48px] px-4 py-[13px] text-[16px]",
    large: "h-[56px] px-6 py-4 text-[18px]",
  };

  // Width styles
  const widths = {
    auto: "w-auto",
    full: "w-full",
    fit: "w-fit",
  };

  const baseClasses =
    "flex items-center justify-center gap-2 rounded-[64px] leading-[140%] font-[500] cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${widths[width]} ${className}`;

  const buttonContent = (
    <>
      {text}
      {icon && <span className="flex items-center">{icon}</span>}
    </>
  );

  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {buttonContent}
      </Link>
    );
  }

  // Otherwise render as button
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {buttonContent}
    </button>
  );
}
