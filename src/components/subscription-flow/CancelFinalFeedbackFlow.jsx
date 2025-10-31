"use client";
import React from "react";
import TextInputFlow from "../utils/TextInputFlow";

export default function CancelFinalFeedbackFlow({
  stepConfig,
  onBack,
  onSubmit,
}) {
  return (
    <TextInputFlow
      title={stepConfig?.title || ""}
      description={stepConfig?.description || ""}
      placeholder={stepConfig?.placeholder || ""}
      buttonLabel="Submit & Cancel Subscription"
      onComplete={onSubmit}
      onBack={onBack}
      linkText="Back to subscription"
      linkHref="/subscriptions"
      bottomMessage="We're sorry to see you leave :("
      containerClassName="max-w-[800px] mx-auto"
      showBottomBackground={true}
    />
  );
}
