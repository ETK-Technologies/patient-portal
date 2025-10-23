import EssentialSupplementsSection from "@/components/home/EssentialSupplementsSection";
import PageContainer from "@/components/PageContainer";
import ShopSection from "@/components/shop/ShopSection";
import Section from "@/components/utils/Section";

export default function Shop() {
  return (
    <PageContainer title="Shop">
      <ShopSection />
      <Section>
        <EssentialSupplementsSection />
      </Section>
    </PageContainer>
  );
}
