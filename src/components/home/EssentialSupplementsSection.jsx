"use client";

import { useRef } from "react";
import EssentialSupplementsCard from "./EssentialSupplementsCard";
import ScrollArrows from "../utils/ScrollArrows";
import ScrollIndicator from "../utils/ScrollIndicator";

export default function EssentialSupplementsSection({ className = "" }) {
  const scrollContainerRef = useRef(null);

  // Dummy data based on the design
  const supplementsData = [
    {
      title: "Keep Digestion on Track",
      description:
        "Fennel, turmeric, and milk thistle ease bloating and support gut and liver health.",
      ctaText: "Shop Essential Gut Support",
      ctaLink: "/shop/gut-support",
      imageUrl:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Essential-supplements-card1.png", // Placeholder for kitchen image
      textBackgroundColor: "bg-[#D6D6D6]",
    },
    {
      title: "Get $50 off Skincare That’s Personalized to You",

      ctaText: "See if you’re eligible",
      ctaLink: "/shop/stress-support",
      imageUrl:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Essential-supplements-card2.png", // Placeholder for person image
      textBackgroundColor: "bg-[#CABC97]",
    },
    {
      title: "Hair Loss Treatment",
      description:
        "Ashwagandha and rhodiola help manage stress and support mental clarity.",
      ctaText: "See if you're eligible ",
      ctaLink: "/shop/stress-support",
      imageUrl:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Essential-supplements-card3.png", // Placeholder for person image
      textBackgroundColor: "bg-[#E1E2E1]",
    },
    {
      title: "Better Sleep Starts Tonight",
      description:
        "L-theanine, GABA, and magnesium for restorative rest without grogginess.",
      ctaText: "Shop Essential Night Boost",
      ctaLink: "/shop/stress-support",
      imageUrl:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Essential-supplements-card4.jpg", // Placeholder for person image
      textBackgroundColor: "bg-[#D6D6D6]",
    },
    {
      title: "Mood Balance Support",
      description:
        "Adaptogens help your body manage stress naturally so you can stay balanced and focused.",
      ctaText: "Shop Essential Mood Balance",
      ctaLink: "/shop/stress-support",
      imageUrl:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Essential-supplements-card5.jpg", // Placeholder for person image
      textBackgroundColor: "bg-[#DDD6D0]",
    },
    {
      title: "Unlock Peak Performance",
      description:
        "Ayurvedic herbs boost testosterone, stamina, and drive—naturally.",
      ctaText: "Shop Essential T-Boost",
      ctaLink: "/shop/stress-support",
      imageUrl:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Essential-supplements-card6.jpg", // Placeholder for person image
      textBackgroundColor: "bg-[#CFD0D4]",
    },
  ];

  return (
    <div className={className}>
      {/* Section Title */}
      <h2 className="text-[24px] md:text-[20px] leading-[140%] font-[500] mb-4">
        Essential supplements
      </h2>

      {/* Scrollable Cards */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {supplementsData.map((item, index) => (
            <EssentialSupplementsCard
              key={index}
              title={item.title}
              description={item.description}
              ctaText={item.ctaText}
              ctaLink={item.ctaLink}
              imageUrl={item.imageUrl}
              textBackgroundColor={item.textBackgroundColor}
            />
          ))}
        </div>

        {/* Scroll Arrows */}
        <ScrollArrows
          containerRef={scrollContainerRef}
          scrollAmount={800}
          showOnMobile={false}
        />
      </div>

      {/* Scroll Indicator for Mobile */}
      <div className="md:hidden">
        <ScrollIndicator
          containerRef={scrollContainerRef}
          totalItems={supplementsData.length}
        />
      </div>
    </div>
  );
}
