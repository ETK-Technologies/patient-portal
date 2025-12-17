"use client";

import { useRef } from "react";
import EssentialSupplementsCard from "./EssentialSupplementsCard";
import ScrollArrows from "../utils/ScrollArrows";
import ScrollIndicator from "../utils/ScrollIndicator";

export default function EssentialSupplementsSection({ className = "" }) {
  const scrollContainerRef = useRef(null);

  // Supplements data with background images
  const supplementsData = [
    {
      title: "Keep Digestion on Track",
      description:
        "Fennel, turmeric, and milk thistle ease bloating and support gut and liver health.",
      ctaText: "Shop Essential Gut Support",
      ctaLink: "/shop",
      desktopImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-01-Desktop.jpg",
      mobileImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-01-Mobile.jpg",
    },
    {
      title: "Get $50 off Skincare That’s Personalized to You",

      ctaText: "See if you’re eligible",
      ctaLink: "/shop",
      desktopImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-02-Desktop.jpg",
      mobileImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-02-Mobile.jpg",
    },
    {
      title: "Hair Loss Treatment",
      description:
        "Ashwagandha and rhodiola help manage stress and support mental clarity.",
      ctaText: "See if you're eligible ",
      ctaLink: "/shop",
      desktopImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-03-Desktop.jpg",
      mobileImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-03-Mobile.jpg",
    },
    {
      title: "Better Sleep Starts Tonight",
      description:
        "L-theanine, GABA, and magnesium for restorative rest without grogginess.",
      ctaText: "Shop Essential Night Boost",
      ctaLink: "/shop",
      desktopImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-04-Desktop.jpg",
      mobileImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-04-Mobile.jpg",
    },
    {
      title: "Mood Balance Support",
      description:
        "Adaptogens help your body manage stress naturally so you can stay balanced and focused.",
      ctaText: "Shop Essential Mood Balance",
      ctaLink: "/shop",
      desktopImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-05-Desktop.jpg",
      mobileImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-05-Mobile.jpg",
    },
    {
      title: "Unlock Peak Performance",
      description:
        "Ayurvedic herbs boost testosterone, stamina, and drive—naturally.",
      ctaText: "Shop Essential T-Boost",
      ctaLink: "/shop",
      desktopImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-06-Desktop.jpg",
      mobileImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-06-Mobile.jpg",
    },
    {
      title: "Essential Follicle Support",
      description:
        "Meticulously crafted to address male pattern baldness with nutraceuticals and botanicals.",
      ctaText: "Shop Essential Follicle Support",
      ctaLink: "/shop",
      desktopImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-07-Desktop.jpg",
      mobileImage:
        "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Banner-07-Mobile.jpg",
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
              desktopImage={item.desktopImage}
              mobileImage={item.mobileImage}
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
