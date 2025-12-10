"use client";

import CustomImage from "../utils/CustomImage";

export default function ForYouSection({ className }) {
  return (
    <div className={className}>
      {/* Section Title */}
      <h2 className="text-[24px] md:text-[20px] leading-[140%] font-[500] mb-4">
        For you
      </h2>

      {/* Referral Card */}
      <div className="for-you-card rounded-[16px] shadow-[0px_0px_16px_0px_#00000014] overflow-hidden h-[523px] md:h-[266px]">
        <div className="flex flex-col-reverse md:flex-row h-full">
          {/* Left Side - Text Content */}
          <div className="flex-1 p-6 md:py-[64px] md:pl-[84px] md:pr-0 flex flex-col justify-center items-center md:items-start">
            {/* Headline */}
            <h3 className="text-[20px] md:text-[24px] text-center md:text-left md:text-nowrap font-[600] leading-[130%] max-w-[190px] md:max-w-full text-black mb-3 md:mb-4">
              Refer a friend: Earn $20, give $40
            </h3>

            {/* Description */}
            <p className="text-[16px] text-center md:text-left font-[400] leading-[140%] text-black mb-[32px] md:mb-6">
              Refer a friend and get rewarded. They receive $40 off their first
              order, and you earn $20 once they purchase. Easy win for both of
              you.
            </p>

            {/* Get Started Link */}
            <a
              href="#"
              className="text-[16px] font-[500] text-black leading-[140%] text-black underline "
              onClick={(e) => e.preventDefault()}
            >
              Get Started
            </a>
          </div>

          {/* Right Side - Image */}
          <div className="relative w-full md:w-[300px] lg:w-[400px] h-[261px] md:h-auto md:flex-shrink-0 overflow-hidden">
            <CustomImage
              src="https://myrocky.b-cdn.net/WP%20Images/patient-portal/for-u.png"
              alt="Refer a friend"
              fill
              className="object-cover object-[88%_center] md:object-[155%_center]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
