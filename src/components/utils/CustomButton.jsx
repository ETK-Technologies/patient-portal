import Link from "next/link";

export default function CustomButton({
  href,
  text,
  icon,
  size = "medium",
  width = "full",
  variant = "pill",
  justify = "center",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  children,
}) {
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

  // Variant styles (border radius)
  const variants = {
    pill: "rounded-[64px]",
    rounded: "rounded-[8px]",
    square: "rounded-none",
  };

  // Justify content styles
  const justifyStyles = {
    center: "justify-center",
    between: "justify-between",
    start: "justify-start",
    end: "justify-end",
  };

  const baseClasses =
    "flex items-center gap-2 leading-[140%] font-[500] cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const buttonClasses = `${baseClasses} ${variants[variant]} ${justifyStyles[justify]} ${sizes[size]} ${widths[width]} ${className}`;

  const buttonContent = (
    <>
      {children || text}
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
