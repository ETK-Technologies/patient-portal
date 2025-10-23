export default function Section({
  children,
  className = "",
  padding = "py-[24px]",
  background = "",
}) {
  return (
    <div className={`${padding} ${background} ${className}`}>{children}</div>
  );
}
