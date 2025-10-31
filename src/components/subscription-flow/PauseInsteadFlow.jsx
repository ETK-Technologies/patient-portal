"use client";
import React, { useState } from "react";
import RadioOptionsScreen from "../utils/RadioOptionsScreen";

export default function PauseInsteadFlow({ stepConfig, onBack, onComplete }) {
  const [selected, setSelected] = useState(null);

  // Transform config options to RadioOptionsScreen format
  const options = (stepConfig?.options || []).map((opt) => ({
    value: opt.id,
    label: opt.label,
    description: opt.description || "",
  }));

  return (
    <RadioOptionsScreen
      title={stepConfig?.title || ""}
      description={stepConfig?.description || ""}
      options={options}
      selectedValue={selected}
      onChange={setSelected}
      color="#AE7E56"
      containerClassName="max-w-[800px] mx-auto md:px-0"
      onContinue={(value) => onComplete?.(value)}
      onBack={onBack}
    />
  );
}
