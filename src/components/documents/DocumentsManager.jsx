"use client";

import { useState, useEffect } from "react";
import DocumentField from "./DocumentField";
import EmptyState from "@/components/utils/EmptyState";

export default function DocumentsManager() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/user/documents");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to fetch documents");
        }

        // Handle the API response structure
        // Response: { success: true, data: { status: true, message: "...", data: { user: {...}, documents: { data: [] } } } }
        const responseData = result.data;

        console.log(
          "[DOCUMENTS] Full API response:",
          JSON.stringify(result, null, 2)
        );
        console.log("[DOCUMENTS] Response data:", responseData);

        // The CRM response is nested: result.data.data.documents.data
        // Path: result.data -> { status, message, data } -> data.documents -> { data: [] }
        let documentsData = [];

        if (responseData?.data?.documents?.data) {
          // Correct path: result.data.data.documents.data
          documentsData = Array.isArray(responseData.data.documents.data)
            ? responseData.data.documents.data
            : [];
          console.log(
            "[DOCUMENTS] ✓ Found documents in nested structure:",
            documentsData.length,
            "items"
          );
          console.log("[DOCUMENTS] Documents data:", documentsData);
        } else if (responseData?.documents?.data) {
          // Fallback: direct structure
          documentsData = Array.isArray(responseData.documents.data)
            ? responseData.documents.data
            : [];
          console.log(
            "[DOCUMENTS] ✓ Found documents in direct structure:",
            documentsData.length,
            "items"
          );
        } else {
          console.warn(
            "[DOCUMENTS] ⚠️ Could not find documents array in response structure"
          );
          console.log(
            "[DOCUMENTS] Available keys in responseData:",
            Object.keys(responseData || {})
          );
          if (responseData?.data) {
            console.log(
              "[DOCUMENTS] Available keys in responseData.data:",
              Object.keys(responseData.data || {})
            );
          }
        }

        console.log(
          "[DOCUMENTS] Final documents array length:",
          documentsData.length
        );
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
  }, []);

  if (loading) {
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
          label={document.name || document.title || "Document"}
          value={document.description || document.type || "No description"}
          document={document}
        />
      ))}
    </div>
  );
}
