"use client";
import React, { useState } from "react";
import RadioOptionsScreen from "../utils/RadioOptionsScreen";

const QUANTITY_OPTIONS = [12, 16, 24, 30, 36, 42, "no_thanks"];

export default function AdjustQuantityFlow({ onBack, onComplete }) {
  const [selected, setSelected] = useState(null);

  const options = QUANTITY_OPTIONS.map((opt) => ({
    value: opt,
    label: opt === "no_thanks" ? "No thanks" : `${opt} pills`,
    description: opt === "no_thanks" ? "" : "shipped every 3 months",
  }));

  return (
    <RadioOptionsScreen
      title="Need less right now?"
      description="Pick what works better for your needs and save money while you're at it."
      options={options}
      selectedValue={selected}
      onChange={setSelected}
      color="#AE7E56"
      containerClassName="max-w-[800px] mx-auto "
      onContinue={(value) => onComplete?.(value)}
      onBack={onBack}
    />
  );
}
