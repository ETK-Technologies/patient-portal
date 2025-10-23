import ProductSection from "./ProductSection";
import { shopData } from "./shopData";

export default function ShopSection() {
  return (
    <div className="space-y-8">
      <ProductSection
        title="Most popular medications"
        products={shopData.medications}
        showScrollIndicator={true}
      />

      <ProductSection
        title="Everyday wellness"
        products={shopData.wellness}
        showScrollIndicator={true}
      />

      <ProductSection
        title="Rocky Merch"
        products={shopData.merchandise}
        showScrollIndicator={false}
      />
    </div>
  );
}
