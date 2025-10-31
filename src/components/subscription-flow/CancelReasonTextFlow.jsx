"use client";
import React from "react";
import TextInputFlow from "../utils/TextInputFlow";

export default function CancelReasonTextFlow({
  stepConfig,
  onBack,
  onComplete,
}) {
  return (
    <TextInputFlow
      title={stepConfig?.title || ""}
      description={stepConfig?.description || ""}
      placeholder={stepConfig?.placeholder || ""}
      buttonLabel="Continue"
      onComplete={onComplete}
      onBack={onBack}
    />
  );
}
