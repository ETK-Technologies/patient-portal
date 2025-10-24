"use client";

import { useRef } from "react";
import ForYouCard from "./ForYouCard";
import ScrollIndicator from "../utils/ScrollIndicator";
import ScrollArrows from "../utils/ScrollArrows";

export default function ForYouSection({ className }) {
  const scrollContainerRef = useRef(null);

  // Dummy data based on the design
  const forYouData = [
    {
      brandName: "ButcherBox",
      offer: "Get 15% off on premium meat",
      imageUrl:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/ButcherBox.jpg", // Placeholder for meat image
      backgroundColor: "bg-gradient-to-b from-[#F9DDDB] to-[#FFFFFF]",
      textBackgroundGradient: "bg-gradient-to-b from-[#FEFAFA] to-white",
      imageShape: "circle", // Meat products work well in circles
      imageSize: "small",
      className: "pt-3 md:pt-4",
    },
    {
      brandName: "Planet Fitness",
      offer: "Free 7-day all-inclusive pass",
      imageUrl:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/PlanetFitness.png", // Placeholder for Planet Fitness logo
      backgroundColor: "bg-gradient-to-b from-[#F1E7FC] to-white",
      textBackgroundGradient: "bg-gradient-to-b from-[#FDFBFF] to-white",
      imageShape: "square", // Logos often work better in squares
      imageSize: "medium",
      className: "pt-3 md:pt-4",
    },
    {
      brandName: "MyRocky",
      offer: "Refer a friend: Earn $20, give $40",
      imageUrl:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/MyRocky-foru.png", // Placeholder for couple image
      backgroundColor: "bg-[#E3E3E3]",
      textBackgroundGradient: "bg-gradient-to-b from-[#E3E3E3] to-white",
      imageOverlayGradient: "bg-gradient-to-b from-transparent to-[#E3E3E3]",
      imageShape: "square", // People photos work well in circles
      imageSize: "large",
    },
    {
      brandName: "OURA Ring",
      offer: "Get 10% off + 1 month free",
      imageUrl:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/OURARing.png", // Placeholder for ring image
      backgroundColor: "bg-[#E3E3E3]",
      textBackgroundGradient: "bg-gradient-to-b from-[#E3E3E3] to-white",
      imageOverlayGradient: "bg-gradient-to-b from-transparent to-[#E3E3E3]",
      imageShape: "circle", // Meat products work well in circles
      imageSize: "small",
      className: "pt-3 md:pt-4",
    },
  ];

  return (
    <div className={className}>
      {/* Section Title */}
      <h2 className="text-[24px] md:text-[20px] leading-[140%] font-[500] mb-4">
        For you
      </h2>

      {/* Scrollable Cards */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {forYouData.map((item, index) => (
            <ForYouCard
              key={index}
              brandName={item.brandName}
              offer={item.offer}
              imageUrl={item.imageUrl}
              backgroundColor={item.backgroundColor}
              textBackgroundGradient={item.textBackgroundGradient}
              imageOverlayGradient={item.imageOverlayGradient}
              imageShape={item.imageShape}
              imageSize={item.imageSize}
              className={item.className || ""}
            />
          ))}
        </div>

        {/* Left Gradient Fade */}
        {/* <div className="hiiden md:absolute right-0 top-0 bottom-0 w-[100px] bg-gradient-to-l from-[#FBFAF9] to-transparent pointer-events-none z-5"></div> */}

        {/* Scroll Arrows */}
        <ScrollArrows
          containerRef={scrollContainerRef}
          scrollAmount={200}
          showOnMobile={false}
        />
      </div>

      {/* Scroll Indicator */}
      <ScrollIndicator
        containerRef={scrollContainerRef}
        totalItems={forYouData.length}
      />
    </div>
  );
}
