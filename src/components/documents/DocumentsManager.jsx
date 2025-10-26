"use client";

import DocumentField from "./DocumentField";
import { documentsFields } from "./documentsData";

export default function DocumentsManager() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {documentsFields.map((field) => (
        <DocumentField
          key={field.key}
          label={field.label}
          value={field.value}
        />
      ))}
    </div>
  );
}
