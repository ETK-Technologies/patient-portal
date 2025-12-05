"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import PrescriptionCard from "./PrescriptionCard";
import PrescriptionsTable from "./PrescriptionsTable";
import EmptyState from "../utils/EmptyState";

export default function PrescriptionsSection() {
  const { userData, loading: userLoading } = useUser();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        if (userLoading) {
          return;
        }

        let crmUserID = null;
        if (userData) {
          if (userData.crm_user_id) {
            crmUserID = userData.crm_user_id;
          }
          else if (userData.id) {
            crmUserID = userData.id;
          }
        }

        if (!crmUserID) {
          console.log(
            "[PRESCRIPTIONS] No user ID available, waiting for user data..."
          );
          setLoading(false);
          return;
        }

        console.log(
          `[PRESCRIPTIONS] Fetching prescriptions for user: ${crmUserID}`
        );

        const queryParams = new URLSearchParams({
          per_page: "10",
          crm_user_id: crmUserID,
        });

        const response = await fetch(
          `/api/user/prescriptions?${queryParams.toString()}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to fetch prescriptions: ${response.status}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch prescriptions");
        }

        let prescriptionsArray = [];
        const responseData = result.data;

        if (Array.isArray(responseData)) {
          prescriptionsArray = responseData;
        } else if (responseData?.data && Array.isArray(responseData.data)) {
          prescriptionsArray = responseData.data;
        } else if (responseData?.prescriptions && Array.isArray(responseData.prescriptions)) {
          prescriptionsArray = responseData.prescriptions;
        } else if (responseData?.status && Array.isArray(responseData.data)) {
          prescriptionsArray = responseData.data;
        }

        console.log(
          `[PRESCRIPTIONS] ✓ Found ${prescriptionsArray.length} prescriptions`
        );

        const transformedPrescriptions = prescriptionsArray.map((prescription) =>
          transformPrescriptionData(prescription)
        );

        setPrescriptions(transformedPrescriptions);
      } catch (err) {
        console.error("[PRESCRIPTIONS] Error fetching prescriptions:", err);
        setError(err.message || "Failed to load prescriptions");
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [userData, userLoading]);

  const transformPrescriptionData = (data) => {
    const id =
      data.id ||
      data.prescription_id ||
      data.prescriptionId ||
      "unknown";
    const prescriptionId = id ? `#${id}` : "#Unknown";

    let medications = [];
    if (data.medications && Array.isArray(data.medications)) {
      medications = data.medications.map((med) => ({
        name: med.name || med.medication_name || med.product_name || "Unknown",
        dosage: med.dosage || med.dose || med.quantity || "",
      }));
    } else if (data.medication) {
      medications = [
        {
          name:
            data.medication.name ||
            data.medication.medication_name ||
            "Unknown",
          dosage: data.medication.dosage || data.medication.dose || "",
        },
      ];
    } else if (data.line_items && Array.isArray(data.line_items)) {
      medications = data.line_items.map((item) => ({
        name: item.product_name || item.name || "Unknown",
        dosage: item.dosage || item.dose || "",
      }));
    }

    if (medications.length === 0) {
      medications = [{ name: "Unknown", dosage: "" }];
    }

    const prescriber =
      data.prescriber ||
      data.prescriber_name ||
      data.doctor_name ||
      data.provider_name ||
      "Unknown";

    let prescribedDate = "Unknown";
    if (data.prescribed_date) {
      prescribedDate = formatDate(data.prescribed_date);
    } else if (data.prescribedDate) {
      prescribedDate = formatDate(data.prescribedDate);
    } else if (data.date) {
      prescribedDate = formatDate(data.date);
    } else if (data.created_at) {
      prescribedDate = formatDate(data.created_at);
    }

    const hasMore = medications.length > 3;
    const moreCount = hasMore ? medications.length - 3 : 0;
    const displayedMedications = hasMore
      ? medications.slice(0, 3)
      : medications;

    return {
      id: id || "unknown",
      prescriptionId,
      medications: displayedMedications,
      prescriber,
      prescribedDate,
      hasMore,
      moreCount,
    };
  };

  // Format date to match prescription card format (e.g., "25 Nov, 2025")
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear();
      return `${day} ${month}, ${year}`;
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (loading || userLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-gray-500 text-center">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-red-600 text-center">Error: {error}</p>
      </div>
    );
  }

  // Empty state
  if (prescriptions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <EmptyState
          title="No Prescriptions"
          message="You don't have any prescriptions yet."
        />
      </div>
    );
  }

  return (
    <div>
      {/* Mobile View: Cards */}
      <div className="lg:hidden flex flex-col gap-4">
        {prescriptions.map((prescription) => (
          <PrescriptionCard
            key={prescription.id}
            prescription={prescription}
          />
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block">
        <PrescriptionsTable prescriptions={prescriptions} />
      </div>
    </div>
  );
}
