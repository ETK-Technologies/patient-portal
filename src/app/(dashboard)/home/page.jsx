import PageContainer from "@/components/PageContainer";
import DashboardCard from "@/components/home/DashboardCard";
import TreatmentsGrid from "@/components/treatments/TreatmentsGrid";
import { treatmentsData } from "@/components/treatments/treatmentsData";
import { FaArrowRight } from "react-icons/fa";

export default function HomePage() {
  return (
    <PageContainer>
      {/* Dashboard Overview Cards */}
      <div className="flex gap-6 pb-[24px] overflow-x-auto  scrollbar-hide">
        <div className="flex gap-[16px] min-w-max">
          <DashboardCard
            title="Messages"
            count="0"
            link="/messages"
            linkText="View Messages"
          />

          <DashboardCard
            title="Subscriptions"
            count="0"
            link="/subscriptions"
            linkText="View Subscriptions"
          />

          <DashboardCard
            title="Upcoming Appointments"
            count="0"
            link="/appointments"
            linkText="View Appointments"
          />
        </div>
      </div>

      {/* Treatments Section */}
      <div className="py-[24px]">
        <h2 className="text-[24px] md:text-[20px] leading-[140%] font-[500] mb-4">
          Treatments
        </h2>
        <TreatmentsGrid treatments={treatmentsData} showAll={false} />
        <button className="flex items-center justify-center gap-2 w-full h-[48px] rounded-[64px] py-[13px] text-[16px] leading-[140%] font-[500] bg-[#F1F0EF] border border-[#E2E2E1] mt-6 md-mt-4">
          <span>Explore all treatments</span>
          <FaArrowRight />
        </button>
      </div>
    </PageContainer>
  );
}
