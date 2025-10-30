import PageContainer from "@/components/PageContainer";
import BillingShippingManager from "@/components/billing-shipping/BillingShippingManager";

export default function BillingShipping() {
  return (
    <PageContainer title="Billing & Shipping Information">
      <BillingShippingManager />
    </PageContainer>
  );
}
