import Link from "next/link";
import CustomImage from "../utils/CustomImage";

export default function TreatmentCard({
  title,
  description,
  imageUrl,
  link,
  isScrollable = false,
}) {
  return (
    <Link
      href="#"
      className={`${
        isScrollable ? "w-[256px]" : "w-full"
      } h-[335px] md:w-[256px] md:h-[341px] relative rounded-[16px] overflow-hidden flex-shrink-0`}
    >
      <div className="absolute top-0 left-0 right-0 bottom-0 z-[1] treatment-card w-full h-full"></div>
      <div className="w-full h-full relative overflow-hidden">
        <CustomImage src={imageUrl} alt={title} fill />
      </div>
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-[2]">
        <h3 className="font-medium text-xl md:text-[24px] leading-[140%] tracking-[0px] align-middle mb-1 ">
          {title}
        </h3>
        {description && (
          <p className="font-normal text-sm md:text-[14px] leading-[140%] tracking-[0px] align-middle text-[#FFFFFFCC] ">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
