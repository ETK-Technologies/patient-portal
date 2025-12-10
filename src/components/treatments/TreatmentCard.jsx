import Link from "next/link";
import CustomImage from "../utils/CustomImage";

export default function TreatmentCard({
  title,
  description,
  imageUrl,
  mobileImageUrl,
  link,
  isScrollable = false,
}) {
  return (
    <Link
      href={link}
      className={`${
        isScrollable ? "w-[256px]" : "w-full"
      } h-[335px] md:w-[256px] md:h-[341px] relative rounded-[16px] z-[1] overflow-hidden flex-shrink-0`}
    >
      <div className="w-full h-full relative overflow-hidden z-[1]">
        {/* Mobile Image */}
        {mobileImageUrl && (
          <div className="block md:hidden w-full h-full relative">
            <CustomImage src={mobileImageUrl} alt={title} fill />
          </div>
        )}
        {/* Desktop Image */}
        <div
          className={
            mobileImageUrl
              ? "hidden md:block w-full h-full relative"
              : "w-full h-full relative"
          }
        >
          <CustomImage src={imageUrl} alt={title} fill />
        </div>
      </div>
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-[3]">
        <h3 className="font-medium text-xl md:text-[24px] leading-[140%] tracking-[0px] align-middle mb-1 ">
          {title}
        </h3>
        {description && (
          <p className="font-normal text-sm md:text-[14px] leading-[140%] tracking-[0px] align-middle text-[#000000CC] ">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
