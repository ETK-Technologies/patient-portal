import PageContainer from "@/components/PageContainer";
import Section from "@/components/utils/Section";
import DashboardOverview from "@/components/home/DashboardOverview";
import TreatmentsSection from "@/components/home/TreatmentsSection";
import ForYouSection from "@/components/home/ForYouSection";
import EssentialSupplementsSection from "@/components/home/EssentialSupplementsSection";

export default function HomePage() {
  return (
    <PageContainer>
      <Section>
        <DashboardOverview />
      </Section>
      <Section>
        <TreatmentsSection />
      </Section>
      <Section>
        <ForYouSection />
      </Section>
      <Section>
        <EssentialSupplementsSection />
      </Section>
    </PageContainer>
  );
}
