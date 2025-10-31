"use client";
import React, { useState } from "react";
import RadioOptionsScreen from "../utils/RadioOptionsScreen";

const PAUSE_OPTIONS = [
  {
    label: "Yes, pause for 90 days",
    description: "Next order ships {90 days after next usual date}",
    value: "pause90",
  },
  {
    label: "Yes, pause for 60 days",
    description: "Next order ships {60 days after next usual date}",
    value: "pause60",
  },
  {
    label: "Yes, pause for 30 days",
    description: "Next order ships {30 days after next usual date}",
    value: "pause30",
  },
  {
    label: "No thanks",
    description: "",
    value: "no_thanks",
  },
];

export default function PauseInsteadFlow({ onBack, onComplete }) {
  const [selected, setSelected] = useState(null);

  return (
    <RadioOptionsScreen
      title="Would you like to pause your subscription instead?"
      description="Pausing your subscription will let you receive future refills with your existing prescription."
      options={PAUSE_OPTIONS}
      selectedValue={selected}
      onChange={setSelected}
      color="#AE7E56"
      containerClassName="max-w-[800px] mx-auto  md:px-0"
      onContinue={(value) => onComplete?.(value)}
      onBack={onBack}
    />
  );
}
