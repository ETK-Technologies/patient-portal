"use client";

import { prescriptionsData } from "./prescriptionsData";
import PrescriptionCard from "./PrescriptionCard";
import PrescriptionsTable from "./PrescriptionsTable";

export default function PrescriptionsSection() {
  return (
    <div>
      {/* Mobile View: Cards */}
      <div className="lg:hidden flex flex-col gap-4">
        {prescriptionsData.map((prescription) => (
          <PrescriptionCard key={prescription.id} prescription={prescription} />
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block">
        <PrescriptionsTable prescriptions={prescriptionsData} />
      </div>
    </div>
  );
}
