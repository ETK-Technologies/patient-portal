"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ProfileField from "../profile/ProfileField";
import UpdateModal from "@/components/utils/UpdateModal";
import { useUser } from "@/contexts/UserContext";

// Helper function to get value - if field exists (even if empty), return empty string, otherwise return "Data not exist in API response"
const getFieldValue = (obj, fieldName) => {
  if (obj && typeof obj === "object" && fieldName in obj) {
    const value = obj[fieldName];
    if (value === null || value === undefined || value === "") {
      return "";
    }
    return value;
  }
  return "Data not exist in API response";
};

// Map API medical profile data to component structure
const mapMedicalProfileData = (apiData) => {
  const missingData = "Not Provided";

  if (!apiData || !apiData.data) {
    return {
      data: {
        allergies: missingData,
        medication: missingData,
        surgeries_or_hospitalizations: missingData,
        medical_conditions: missingData,
      },
      ids: {},
    };
  }

  // Handle nested data structure: data.data (response has { status: true, data: {...} })
  let actualData = apiData.data;
  if (actualData && actualData.data) {
    actualData = actualData.data;
  }

  // API returns medicalProfile_types (array of types) and medicalProfiles (array of entries)
  const medicalProfileTypes = actualData?.medicalProfile_types || actualData?.medicalProfile || [];
  const medicalProfiles = actualData?.medicalProfiles || [];
const profileMap = {};
  medicalProfiles.forEach((profile) => {
    if (profile.meta_key) {
      const metaValue = profile.meta_value || "";
      // Use the most recent entry if there are duplicates (based on updated_at)
      const existing = profileMap[profile.meta_key];
      if (
        !existing ||
        (profile.updated_at &&
          existing.updated_at &&
          new Date(profile.updated_at) > new Date(existing.updated_at))
      ) {
        profileMap[profile.meta_key] = {
          value: metaValue,
          id: profile.id,
          updated_at: profile.updated_at,
        };
      }
    }
  });

  // Map each category from medicalProfile_types array
  // Get values from medicalProfiles array using meta_key
  const mappedData = {};
  const ids = {};
  medicalProfileTypes.forEach((category) => {
    const slug = category.slug;
    let value = "";

    if (profileMap[slug]) {
      const metaValue = profileMap[slug].value;
      // meta_value is an array, so join it if it's an array
      if (Array.isArray(metaValue)) {
        const filtered = metaValue.filter(item => item && item.trim() !== "");
        value = filtered.join(", ");
      } else {
        value = metaValue || "";
      }
      ids[slug] = profileMap[slug].id;
    }

    mappedData[slug] = value !== "" ? value : missingData;
  });

  // Ensure all expected fields exist
  return {
    data: {
      allergies: mappedData.allergies || missingData,
      medication: mappedData.medication || missingData,
      surgeries_or_hospitalizations:
        mappedData.surgeries_or_hospitalizations || missingData,
      medical_conditions: mappedData.medical_conditions || missingData,
    },
    ids: ids,
  };
};

export default function MedicalHistoryManager() {
  const { userData, loading: userLoading } = useUser();
  const [medicalHistoryData, setMedicalHistoryData] = useState({
    allergies: "Not Provided",
    medication: "Not Provided",
    surgeries_or_hospitalizations: "Not Provided",
    medical_conditions: "Not Provided",
  });
  const [medicalProfileIds, setMedicalProfileIds] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    field: null,
  });

  // Fetch medical history data
  useEffect(() => {
    const fetchMedicalHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Extract CRM user ID from userData
        // New format: userData has crm_user_id directly
        // Old format: userData.id or nested structures
        let crmUserID = null;
        if (userData) {
          // Check for crm_user_id (new format from profile API)
          if (userData.crm_user_id) {
            crmUserID = userData.crm_user_id;
          } 
          // Fallback to id (old format)
          else if (userData.id) {
            crmUserID = userData.id;
          } 
          // Check nested structures
          else if (userData.user) {
            if (userData.user.crm_user_id) {
              crmUserID = userData.user.crm_user_id;
            } else if (userData.user.id) {
            crmUserID = userData.user.id;
            }
          } 
          // Check deeply nested structures
          else if (userData.data && userData.data.user) {
            if (userData.data.user.crm_user_id) {
              crmUserID = userData.data.user.crm_user_id;
            } else if (userData.data.user.id) {
            crmUserID = userData.data.user.id;
            }
          }
        }

        if (!crmUserID) {
          console.log(
            "[MEDICAL_HISTORY] No user ID available, waiting for user data..."
          );
          setLoading(false);
          return;
        }

        console.log(`[MEDICAL_HISTORY] Using user ID: ${crmUserID}`);

        console.log(
          `[MEDICAL_HISTORY] Fetching medical history for user: ${crmUserID}`
        );

        const response = await fetch(
          `/api/user/medical-profile?crmUserID=${crmUserID}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || "Failed to fetch medical history");
          setMedicalHistoryData({
            allergies: "Not Provided",
            medication: "Not Provided",
            surgeries_or_hospitalizations: "Not Provided",
            medical_conditions: "Not Provided",
          });
          return;
        }

        const data = await response.json();
        console.log("[MEDICAL_HISTORY] API response:", data);

        // Handle both response formats:
        // New format: { status: true, message: "...", data: {...} }
        // Old format: { success: true, data: {...} }
        if ((data.status && data.data) || (data.success && data.data)) {
          const mapped = mapMedicalProfileData(data);
          setMedicalHistoryData(mapped.data);
          setMedicalProfileIds(mapped.ids);
        } else {
          setError("Invalid response format");
        }
      } catch (err) {
        console.error("[MEDICAL_HISTORY] Error fetching medical history:", err);
        setError(err.message || "Failed to fetch medical history");
        setMedicalHistoryData({
          allergies: "Data not exist in API response",
          medication: "Data not exist in API response",
          surgeries_or_hospitalizations: "Data not exist in API response",
          medical_conditions: "Data not exist in API response",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchMedicalHistory();
    }
  }, [userData, userLoading]);

  const handleUpdateClick = (field) => {
    setModalState({
      isOpen: true,
      field: field,
    });
  };

  const handleSave = async (newValue) => {
    const fieldKey = modalState.field.key;

    try {
      // Extract CRM user ID from userData
      // New format: userData has crm_user_id directly
      // Old format: userData.id or nested structures
      let crmUserID = null;
      if (userData) {
        // Check for crm_user_id (new format from profile API)
        if (userData.crm_user_id) {
          crmUserID = userData.crm_user_id;
        } 
        // Fallback to id (old format)
        else if (userData.id) {
          crmUserID = userData.id;
        } 
        // Check nested structures
        else if (userData.user) {
          if (userData.user.crm_user_id) {
            crmUserID = userData.user.crm_user_id;
          } else if (userData.user.id) {
          crmUserID = userData.user.id;
          }
        } 
        // Check deeply nested structures
        else if (userData.data && userData.data.user) {
          if (userData.data.user.crm_user_id) {
            crmUserID = userData.data.user.crm_user_id;
          } else if (userData.data.user.id) {
          crmUserID = userData.data.user.id;
          }
        }
      }

      if (!crmUserID) {
        toast.error("User ID not available. Please try again.");
        return;
      }

      const profileId = medicalProfileIds[fieldKey];
      
      const requestBody = {
        crm_user_id: crmUserID,
        slug: fieldKey,
        meta_value: newValue,
      };
      
      if (profileId) {
        requestBody.id = profileId;
      }

      const response = await fetch(`/api/user/medical-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      // Handle both response formats:
      // New format: { status: true/false, message: "...", data: {...} }
      // Old format: { success: true/false, error: "..." }
      const isSuccess = result.status === true || result.success === true;
      
      if (!response.ok || !isSuccess) {
        console.error("Failed to update medical history:", result.error || result.message);

        // Show user-friendly error message
        const errorMessage =
          result.error || result.message || "An unexpected error occurred. Please try again.";
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }

      // Update local state after successful API call
      setMedicalHistoryData((prev) => ({
        ...prev,
        [fieldKey]: newValue || "Not Provided",
      }));

      if (result.data && result.data.id) {
        setMedicalProfileIds((prev) => ({
          ...prev,
          [fieldKey]: result.data.id,
        }));
      }

      toast.success(`${modalState.field.label} updated successfully`, {
        position: "top-right",
        autoClose: 3000,
      });
      
      const refreshResponse = await fetch(
        `/api/user/medical-profile?crmUserID=${crmUserID}`,
        {
          credentials: "include",
        }
      );
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        if ((refreshData.status && refreshData.data) || (refreshData.success && refreshData.data)) {
          const mapped = mapMedicalProfileData(refreshData);
          setMedicalHistoryData(mapped.data);
          setMedicalProfileIds(mapped.ids);
        }
      }
    } catch (error) {
      console.error("Error updating medical history:", error);
      toast.error(
        "Unable to save your changes. Please check your connection and try again.",
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    }
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      field: null,
    });
  };

  const getModalProps = () => {
    if (!modalState.field) return {};

    const field = modalState.field;
    const currentValue =
      medicalHistoryData[field.key] === "Not Provided"
        ? ""
        : medicalHistoryData[field.key];

    return {
      title: `Update ${field.label}`,
      label: field.label,
      currentValue: currentValue,
      inputType: "text",
      isFileUpload: false,
      isTagInput: true, // Enable tag input for medical history fields
      placeholder: `Type and press Enter to add ${field.label.toLowerCase()}`,
    };
  };

  // Show loading state
  if (userLoading || loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-[#1F4C73] border-r-transparent"></div>
          <span className="ml-3 text-gray-600">Loading medical history...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-red-600">
          <p className="font-semibold mb-2">Error loading medical history</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Medical history fields based on API response
  const medicalHistoryFields = [
    { key: "allergies", label: "Allergies" },
    { key: "medication", label: "Medication" },
    {
      key: "surgeries_or_hospitalizations",
      label: "Surgeries or Hospitalization",
    },
    { key: "medical_conditions", label: "Medical Conditions" },
  ];

  // Helper function to format field value - show "Not Provided" for missing/empty values
  const formatFieldValue = (fieldKey, value) => {
    if (
      !value ||
      value === "Data not exist in API response" ||
      value.trim() === ""
    ) {
      return "Not Provided";
    }
    return value;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {medicalHistoryFields.map((field) => (
          <ProfileField
            key={field.key}
            label={field.label}
            value={formatFieldValue(field.key, medicalHistoryData[field.key])}
            onUpdate={() => handleUpdateClick(field)}
          />
        ))}
      </div>

      {modalState.isOpen && (
        <UpdateModal
          key={modalState.field?.key}
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          {...getModalProps()}
        />
      )}
    </>
  );
}
