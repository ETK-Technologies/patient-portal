import PageContainer from "@/components/PageContainer";
import TreatmentsGrid from "@/components/treatments/TreatmentsGrid";
import { treatmentsData } from "@/components/treatments/treatmentsData";

export default function Treatments() {
  return (
    <PageContainer title="Treatments">
      <TreatmentsGrid treatments={treatmentsData} showAll={true} />
    </PageContainer>
  );
}
