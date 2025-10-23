import CustomImage from "../utils/CustomImage";
import CustomButton from "../utils/CustomButton";
import { FaArrowRight } from "react-icons/fa";

export default function EssentialSupplementsCard({
  title,
  description,
  ctaText,
  ctaLink,
  imageUrl,
  className = "",
  textBackgroundColor = "",
}) {
  return (
    <div
      className={`rounded-[16px] w-[272px] h-[418px] md:w-[800px] md:h-[280px] shadow-[0px_0px_16px_0px_#00000014] flex-shrink-0 overflow-hidden  ${className}`}
    >
      <div className="flex h-full">
        {/* Left Side - Text Content */}
        <div className="flex-1 flex flex-col md:flex-row justify-between">
          <div
            className={` ${textBackgroundColor} w-full md:w-[50%] h-[208px] md:h-full p-6 md:pl-[64px] md:py-[68.5px] text-center md:text-start `}
          >
            <h3 className="text-[20px] md:text-[24px] md:tracking-[-2%] headers-font leading-[120%%] mb-4 text-black max-w-[180px] md:max-w-[367px] mx-auto">
              {title}
            </h3>
            <p className="text-[14px] md:text-[16px] font-[400] leading-[140%] text-black mb-4 md:mb-[32px]">
              {description}
            </p>
            {/* CTA Link */}
            <div className="w-full flex justify-center md:justify-start">
              <CustomButton
                href={ctaLink}
                text={ctaText}
                variant="ghost"
                size="small"
                width="fit"
                className="text-[14px] md:text-[16px] text-black fon-[500] underline !p-0 h-auto"
              />
            </div>
          </div>
          {/* Right Side - Image */}
          <div className="w-full md:w-[50%] h-[210px] md:h-full relative">
            <CustomImage src={imageUrl} alt={title} fill />
          </div>
        </div>
      </div>
    </div>
  );
}
