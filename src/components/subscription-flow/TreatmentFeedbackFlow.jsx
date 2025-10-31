"use client";
import React, { useState } from "react";
import RadioOptionsScreen from "../utils/RadioOptionsScreen";

export default function TreatmentFeedbackFlow({ onBack, onComplete }) {
  const [selected, setSelected] = useState(null); // 'yes' | 'no'

  const options = [
    { value: "yes", label: "Yes, it did" },
    { value: "no", label: "No, it did not" },
  ];

  return (
    <RadioOptionsScreen
      title="Did your treatment to work as expected?"
      options={options}
      selectedValue={selected}
      onChange={setSelected}
      color="#AE7E56"
      containerClassName="max-w-[800px] mx-auto  md:px-0"
      onContinue={(value) => onComplete?.(value)}
      onBack={onBack}
    />
  );
}
