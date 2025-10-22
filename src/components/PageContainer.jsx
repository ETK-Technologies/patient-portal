export default function PageContainer({ title, children, className = "" }) {
  return (
    <div className={`max-w-[800px]  ${className}`}>
      {title && (
        <h1 className="text-[26px] md:text-[32px]  mb-6 md:mb-10 headers-font">
          {title}
        </h1>
      )}
      {children}
    </div>
  );
}
