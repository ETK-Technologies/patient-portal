"use client";
import React, { useState } from "react";
import CheckboxOptionsScreen from "../utils/CheckboxOptionsScreen";

const REASONS = [
  "Takes too long to receive treatment.",
  "Slow responses from my provider.",
  "Side effects with treatment.",
  "Cost.",
  "I didn’t get the results I wanted.",
  "I don’t need treatment anymore.",
  "The patient portal is difficult to navigate.",
  "I’m trying out different products.",
];

export default function CancelReasonChecklistFlow({ onBack, onComplete }) {
  const [selected, setSelected] = useState(new Set());

  const options = REASONS.map((reason) => ({ value: reason, label: reason }));

  return (
    <CheckboxOptionsScreen
      title="We’re sorry to see you go."
      description="Please tell us why you’d like to cancel. Select all that apply."
      options={options}
      selectedValues={selected}
      onChange={setSelected}
      color="#AE7E56"
      containerClassName="max-w-[800px] mx-auto px-5 md:px-0"
      onContinue={(values) => onComplete?.(values)}
      onBack={onBack}
    />
  );
}
