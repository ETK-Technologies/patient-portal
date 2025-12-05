"use client";

import { useState, useEffect } from "react";
import PrescriptionCard from "../prescriptions/PrescriptionCard";

export default function SubscriptionActionPanel({ action, subscription }) {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (action === "See prescription") {
      fetchPrescription();
    }
  }, [action]);

  const fetchPrescription = async () => {
    const prescriptionId =
      subscription?.prescriptionId ||
      subscription?.prescription_id ||
      subscription?._raw?.prescription_id ||
      subscription?._raw?.prescriptionId;

    if (!prescriptionId) {
      setError("Prescription ID not found in subscription data");
      console.error(
        "[SUBSCRIPTION_ACTION_PANEL] No prescription ID found in subscription:",
        subscription
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/user/prescription/${prescriptionId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch prescription: ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.status && !result.success) {
        throw new Error(result.error || result.message || "Failed to fetch prescription");
      }

      const prescriptionData = result.data?.prescription || result.data || result;
      const transformedPrescription = transformPrescriptionData(
        prescriptionData,
        prescriptionId
      );

      setPrescription(transformedPrescription);
    } catch (err) {
      console.error("[SUBSCRIPTION_ACTION_PANEL] Error fetching prescription:", err);
      setError(err.message || "Failed to load prescription");
    } finally {
      setLoading(false);
    }
  };

  const transformPrescriptionData = (data, prescriptionId) => {
    const id = prescriptionId || data.id || data.prescription_id || data.prescriptionId;
    const prescriptionIdFormatted = id ? `#${id}` : "#Unknown";

    let medications = [];
    if (data.medications && Array.isArray(data.medications)) {
      medications = data.medications.map((med) => {
        const dosage = med.current_dosage || med.dosage || "";
        const frequency = med.current_frequency || med.frequency || "";
        const quantity = med.quantity || "";
        
        let dosageText = dosage;
        if (frequency) {
          dosageText = `${dosage} - ${frequency.trim()}`;
        }
        if (quantity) {
          dosageText = `${dosageText} (${quantity.trim()})`;
        }

        return {
          name: med.name || med.medication_name || med.product_name || "Unknown",
          dosage: dosageText || dosage || "",
        };
      });
    } else if (data.medication) {
      medications = [
        {
          name: data.medication.name || data.medication.medication_name || "Unknown",
          dosage: data.medication.dosage || data.medication.dose || "",
        },
      ];
    } else if (data.line_items && Array.isArray(data.line_items)) {
      medications = data.line_items.map((item) => ({
        name: item.product_name || item.name || "Unknown",
        dosage: item.dosage || item.dose || "",
      }));
    }

    if (medications.length === 0 && subscription) {
      medications = [
        {
          name: subscription.productName || subscription.product_name || "Unknown",
          dosage: subscription.dosage || "",
        },
      ];
    }

    const prescriberFirstName = data.prescriber_first_name || "";
    const prescriberLastName = data.prescriber_last_name || "";
    let prescriber = "Unknown";
    
    if (prescriberFirstName && prescriberLastName) {
      prescriber = `${prescriberFirstName} ${prescriberLastName}`;
    } else if (prescriberFirstName) {
      prescriber = prescriberFirstName;
    } else if (prescriberLastName) {
      prescriber = prescriberLastName;
    } else {
      prescriber =
        data.prescriber ||
        data.prescriber_name ||
        data.doctor_name ||
        data.provider_name ||
        "Unknown";
    }

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

    return {
      id: id || "unknown",
      prescriptionId: prescriptionIdFormatted,
      medications,
      prescriber,
      prescribedDate,
      hasMore: false,
      moreCount: 0,
    };
  };

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

  const panels = {
    "See prescription": {
      title: "Prescription",
      description: null,
    },
    "Message provider": {
      title: "Message provider",
      description:
        "This is a simple panel where you can chat with your provider.",
    },
    "Request refill": {
      title: "Request refill",
      description: "This is a simple panel to start the refill flow.",
    },
  };

  const current = panels[action] || { title: action || "", description: "" };

  if (action === "See prescription") {
    return (
      <div>
        <div className="bg-white rounded-[16px] shadow-[0px_0px_16px_0px_#00000014] border border-[#E5E7EB] p-6 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[18px] font-semibold leading-[120%]">
                {current.title}
              </h2>
              {subscription?.id && (
                <p className="text-sm text-[#7D7C77] mt-1">
                  Subscription #{subscription.id}
                </p>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-[16px] shadow-[0px_0px_16px_0px_#00000014] border border-[#E5E7EB] p-6">
            <p className="text-sm text-[#212121]">Loading prescription...</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-[16px] shadow-[0px_0px_16px_0px_#00000014] border border-[#E5E7EB] p-6">
            <p className="text-sm text-red-600">Error: {error}</p>
          </div>
        )}

        {prescription && !loading && !error && (
          <PrescriptionCard prescription={prescription} />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] shadow-[0px_0px_16px_0px_#00000014] border border-[#E5E7EB] p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[18px] font-semibold leading-[120%]">
            {current.title}
          </h2>
          {subscription?.id && (
            <p className="text-sm text-[#7D7C77] mt-1">
              Subscription #{subscription.id}
            </p>
          )}
        </div>
      </div>
      {current.description && (
        <p className="text-sm text-[#212121] mt-4">{current.description}</p>
      )}
    </div>
  );
}
