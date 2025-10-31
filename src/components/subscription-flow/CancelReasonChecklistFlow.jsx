"use client";
import React, { useState } from "react";
import CheckboxOptionsScreen from "../utils/CheckboxOptionsScreen";

export default function CancelReasonChecklistFlow({
  stepConfig,
  onBack,
  onComplete,
}) {
  const [selected, setSelected] = useState(new Set());

  // Transform config options to CheckboxOptionsScreen format
  const options = (stepConfig?.options || []).map((opt) => ({
    value: opt.id,
    label: opt.label,
  }));

  return (
    <CheckboxOptionsScreen
      title={stepConfig?.title || ""}
      description={stepConfig?.description || ""}
      options={options}
      selectedValues={selected}
      onChange={setSelected}
      color="#AE7E56"
      containerClassName="max-w-[800px] mx-auto md:px-0"
      onContinue={(values) => onComplete?.(values)}
      onBack={onBack}
    />
  );
}
