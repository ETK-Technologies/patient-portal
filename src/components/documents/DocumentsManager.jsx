"use client";

import { useState, useEffect } from "react";
import DocumentField from "./DocumentField";
import EmptyState from "@/components/utils/EmptyState";
import { useUser } from "@/contexts/UserContext";

export default function DocumentsManager() {
  const { userData, loading: userLoading } = useUser();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (userLoading) {
        return;
      }

      let userId = null;
      if (userData) {
        if (userData.crm_user_id) {
          userId = userData.crm_user_id;
        }
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/user/${userId}/documents`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to fetch documents");
        }

        const responseData = result.data;
        let documentsData = [];

        if (responseData?.data?.documents?.data) {
          documentsData = Array.isArray(responseData.data.documents.data)
            ? responseData.data.documents.data
            : [];
        } else if (responseData?.documents?.data) {
          documentsData = Array.isArray(responseData.documents.data)
            ? responseData.documents.data
            : [];
        }

        setDocuments(documentsData);
      } catch (err) {
        console.error("[DOCUMENTS] Error fetching documents:", err);
        setError(err.message || "Failed to load documents");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [userData, userLoading]);

  if (loading || userLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-gray-600 text-center">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-red-600 text-center">Error: {error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <EmptyState
          title="No Documents"
          message="You don't have any documents yet."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {documents.map((document, index) => (
        <DocumentField
          key={document.id || index}
          label="Document Type"
          value={document.document_type || document.type || ""}
          document={document}
        />
      ))}
    </div>
  );
}
