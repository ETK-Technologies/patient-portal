import CustomButton from "../utils/CustomButton";

export default function EssentialSupplementsCard({
  title,
  description,
  ctaText,
  ctaLink,
  desktopImage,
  mobileImage,
  className = "",
}) {
  return (
    <div
      className={`rounded-[16px] w-[272px] h-[418px] md:w-[800px] md:h-[280px] shadow-[0px_0px_16px_0px_#00000014] flex-shrink-0 overflow-hidden relative ${className}`}
    >
      {/* Mobile Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
        style={{ backgroundImage: `url(${mobileImage})` }}
      />
      {/* Desktop Background Image */}
      <div
        className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${desktopImage})` }}
      />

      {/* Text Content Overlay */}
      <div className="relative h-full w-full flex flex-col items-center md:items-start md:justify-between p-6 md:pl-[64px] md:py-[68.5px] z-10">
        <div className="text-center md:text-start max-w-[224px] md:max-w-[367px] ">
          <h3 className="text-[20px] md:text-[24px] md:tracking-[-2%] headers-font leading-[120%] mb-4 text-black">
            {title}
          </h3>
          {description && (
            <p className="text-[14px] md:text-[16px] font-[400] leading-[140%] text-black mb-4 md:mb-[32px]">
              {description}
            </p>
          )}
          {/* CTA Link */}
          <div className="w-full flex justify-center md:justify-start">
            <CustomButton
              href={ctaLink}
              text={ctaText}
              size="small"
              width="fit"
              className="text-[14px] md:text-[16px] text-[#585857] fon-[500] underline !p-0 h-auto bg-transparent border border-transparent hover:text-[#585857]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
