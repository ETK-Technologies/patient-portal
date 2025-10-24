import TreatmentsGrid from "../treatments/TreatmentsGrid";
import CustomButton from "../utils/CustomButton";
import { treatmentsData } from "../treatments/treatmentsData";
import { FaArrowRight } from "react-icons/fa";

export default function TreatmentsSection({
  title = "Treatments",
  showAll = false,
  showExploreButton = true,
  exploreButtonText = "Explore all treatments",
  exploreButtonHref = "/treatments",
  className = "",
}) {
  return (
    <div className={className}>
      <h2 className="text-[24px] md:text-[20px] leading-[140%] font-[500] mb-4">
        {title}
      </h2>
      <TreatmentsGrid treatments={treatmentsData} showAll={showAll} />
      {showExploreButton && (
        <div className="mt-6 md:mt-4">
          <CustomButton
            href={exploreButtonHref}
            text={exploreButtonText}
            icon={<FaArrowRight />}
            size="medium"
            width="full"
            className="bg-[#F1F0EF] border border-[#E2E2E1] text-[#000000] hover:bg-[#E8E7E6]"
          />
        </div>
      )}
    </div>
  );
}
