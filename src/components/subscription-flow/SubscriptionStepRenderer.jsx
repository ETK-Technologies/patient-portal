"use client";
import React, { useState } from "react";
import { subscriptionFlowConfig } from "./config/subscriptionFlowConfig";
import PauseCancelFlow from "./PauseCancelFlow";
import CancelWhatToExpectFlow from "./CancelWhatToExpectFlow";
import RadioOptionsScreen from "../utils/RadioOptionsScreen";
import TextInputFlow from "../utils/TextInputFlow";
import CheckboxOptionsScreen from "../utils/CheckboxOptionsScreen";
import { toast } from "react-toastify";

const SubscriptionStepRenderer = ({
  stepIndex,
  subscription,
  answers,
  addAnswer,
  setAnswers,
  handleContinue,
  handleBack,
  handleNavigate,
  submitCurrentStepData,
  submitFormData,
  onComplete,
}) => {
  // Main view (stepIndex is null)
  if (stepIndex === null) {
    return null; // Main view is handled by SubscriptionFlow.jsx
  }

  const stepConfig = subscriptionFlowConfig.steps[stepIndex];

  if (!stepConfig) {
    return (
      <div className="max-w-[800px] mx-auto px-5 md:px-0">
        <p className="text-center text-gray-600">Step not found</p>
      </div>
    );
  }

  // Handle pauseCancel step (step 1)
  if (stepIndex === 1) {
    return (
      <PauseCancelFlow
        subscription={subscription}
        onNavigate={handleNavigate}
      />
    );
  }

  // Handle pauseInstead step (step 2)
  if (stepIndex === 2) {
    const [selected, setSelected] = useState(null);
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
        containerClassName="w-full md:w-[528px] mx-auto md:px-0"
        onContinue={async (value) => {
          // Add answer first to update state
          addAnswer(2, stepConfig?.field || "pauseOption", value);
          // Submit data with all previous answers included
          await submitCurrentStepData?.({
            ...answers, // Include all previous answers
            [stepConfig?.field || "pauseOption"]: value,
          });
          if (value === "no_thanks") {
            // Go to adjust quantity if user chooses no thanks
            handleNavigate("adjustQuantity");
          } else {
            // If user selected a pause option, proceed to adjust quantity
            handleNavigate("adjustQuantity");
          }
        }}
      />
    );
  }

  // Handle adjustQuantity step (step 3)
  if (stepIndex === 3) {
    const [selected, setSelected] = useState(null);
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
        containerClassName="w-full md:w-[528px] mx-auto md:px-0"
        onContinue={async (value) => {
          // Add answer first to update state
          addAnswer(3, stepConfig?.field || "quantity", value);
          // Submit data with all previous answers included
          await submitCurrentStepData?.({
            ...answers, // Include all previous answers
            [stepConfig?.field || "quantity"]: value,
          });
          handleNavigate("treatmentFeedback");
        }}
      />
    );
  }

  // Handle treatmentFeedback step (step 4)
  if (stepIndex === 4) {
    const [selected, setSelected] = useState(null);
    const options = (stepConfig?.options || []).map((opt) => ({
      value: opt.id,
      label: opt.label,
    }));

    return (
      <RadioOptionsScreen
        title={stepConfig?.title || ""}
        description={stepConfig?.description || ""}
        options={options}
        selectedValue={selected}
        onChange={setSelected}
        color="#AE7E56"
        containerClassName="w-full md:w-[528px] mx-auto md:px-0"
        onContinue={async (answer) => {
          // Add answer first to update state
          addAnswer(4, stepConfig?.field || "treatmentWorked", answer);
          // Submit data with all previous answers included
          await submitCurrentStepData?.({
            ...answers, // Include all previous answers
            [stepConfig?.field || "treatmentWorked"]: answer,
          });
          // Use conditional navigation from config
          if (stepConfig?.conditionalNavigation?.[answer]) {
            const targetStep = stepConfig.conditionalNavigation[answer];
            const targetStepConfig = subscriptionFlowConfig.steps[targetStep];
            if (targetStepConfig?.id) {
              handleNavigate(targetStepConfig.id);
            }
          }
        }}
      />
    );
  }

  // Handle cancelReasonText step (step 5)
  if (stepIndex === 5) {
    return (
      <TextInputFlow
        title={stepConfig?.title || ""}
        description={stepConfig?.description || ""}
        placeholder={stepConfig?.placeholder || ""}
        buttonLabel="Continue"
        onComplete={async (text) => {
          // Add answer first to update state
          addAnswer(5, stepConfig?.field || "cancelReasonText", text);
          // Submit data with all previous answers included
          await submitCurrentStepData?.({
            ...answers, // Include all previous answers
            [stepConfig?.field || "cancelReasonText"]: text,
          });
          handleNavigate("cancelInfo");
        }}
      />
    );
  }

  // Handle cancelReasonChecklist step (step 6)
  if (stepIndex === 6) {
    const [selected, setSelected] = useState(new Set());
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
        containerClassName="w-full md:w-[528px] mx-auto md:px-0"
        onContinue={async (reasons) => {
          // If reasons is an array (Set), convert to array
          const reasonsArray = Array.isArray(reasons)
            ? reasons
            : reasons instanceof Set
            ? Array.from(reasons)
            : [reasons];
          // Add answer first to update state
          addAnswer(6, stepConfig?.field || "cancelReasons", reasonsArray);
          // Submit data with all previous answers included
          await submitCurrentStepData?.({
            ...answers, // Include all previous answers
            [stepConfig?.field || "cancelReasons"]: reasonsArray,
          });
          handleNavigate("cancelInfo");
        }}
      />
    );
  }

  // Handle cancelInfo step (step 7)
  if (stepIndex === 7) {
    return (
      <CancelWhatToExpectFlow
        subscription={subscription}
        onDone={() => {
          handleNavigate("cancelFinal");
        }}
      />
    );
  }

  // Handle cancelFinal step (step 8)
  if (stepIndex === 8) {
    return (
      <TextInputFlow
        title={stepConfig?.title || ""}
        description={stepConfig?.description || ""}
        placeholder={stepConfig?.placeholder || ""}
        buttonLabel="Submit & Cancel Subscription"
        onComplete={async (text) => {
          // Add answer first to update state
          addAnswer(8, stepConfig?.field || "finalFeedback", text);
          // Create complete answers object with all previous answers
          const allAnswers = {
            ...answers,
            [stepConfig?.field || "finalFeedback"]: text,
          };

          // Build payload for pause/cancel subscription API
          try {
            const subscriptionId = subscription?._raw?.id || subscription?.id;
            if (!subscriptionId) {
              console.error("[PAUSE_CANCEL] Subscription ID not found");
              throw new Error("Subscription ID not found");
            }

            // Get initial action to determine subscriptionAction
            const initialAction = allAnswers.initialAction || "pauseCancel";
            const pauseOption = allAnswers.pauseOption;
            
            // Determine subscriptionAction based on logic:
            // - If initialAction is "skip" and then pause → "skip"
            // - If initialAction is "pauseCancel" and then pause → "pause"
            // - If initialAction is "pauseCancel" and then "no thanks" → "cancel"
            let subscriptionAction = "cancel"; // default
            if (initialAction === "skip") {
              // If user initially chose skip, it's always skip (even if they later choose pause)
              subscriptionAction = "skip";
            } else if (initialAction === "pauseCancel") {
              if (pauseOption && pauseOption !== "no_thanks") {
                subscriptionAction = "pause";
              } else {
                subscriptionAction = "cancel";
              }
            }

            // Map pauseOption value (pause30 -> 30, pause60 -> 60, pause90 -> 90)
            let pauseOptionValue = null;
            if (pauseOption && pauseOption !== "no_thanks") {
              if (pauseOption === "pause30") pauseOptionValue = 30;
              else if (pauseOption === "pause60") pauseOptionValue = 60;
              else if (pauseOption === "pause90") pauseOptionValue = 90;
            }

            // Map quantityOption value
            const quantityOption = allAnswers.quantity;
            let quantityOptionValue = null;
            if (quantityOption && quantityOption !== "no_thanks") {
              quantityOptionValue = String(quantityOption);
            }

            // Map treatmentWorked
            const treatmentWorked = allAnswers.treatmentWorked;

            // Map treatmentWorkedTest (if yes) or cancelReasons (if no)
            const cancelReasonText = allAnswers.cancelReasonText;
            const cancelReasons = allAnswers.cancelReasons;

            // Get cancel reason labels from config
            const cancelReasonConfig = subscriptionFlowConfig.steps[6];
            const cancelReasonLabels = [];
            if (cancelReasons && Array.isArray(cancelReasons)) {
              cancelReasons.forEach((reasonId) => {
                const reasonOption = cancelReasonConfig?.options?.find(
                  (opt) => opt.id === reasonId
                );
                if (reasonOption) {
                  cancelReasonLabels.push(reasonOption.label);
                }
              });
            }

            // Build answers object in the required format
            const answersPayload = {
              subscriptionAction: {
                value: subscriptionAction,
              },
            };

            // Add pauseOption if available
            if (pauseOptionValue !== null) {
              answersPayload.pauseOption = {
                value: pauseOptionValue,
              };
            }

            // Add quantityOption if available
            if (quantityOptionValue !== null) {
              answersPayload.quantityOption = {
                value: quantityOptionValue,
              };
            }

            // Add treatmentWorked if available
            if (treatmentWorked) {
              answersPayload.treatmentWorked = {
                value: treatmentWorked,
              };
            }

            // Add treatmentWorkedTest if treatment worked (yes)
            if (treatmentWorked === "yes" && cancelReasonText) {
              answersPayload.treatmentWorkedTest = {
                text: cancelReasonText,
              };
            }

            // Add cancelReasons if treatment didn't work (no)
            if (treatmentWorked === "no" && cancelReasonLabels.length > 0) {
              answersPayload.cancelReasons = {
                value: cancelReasonLabels,
              };
            }

            // Add finalFeedback
            if (text) {
              answersPayload.finalFeedback = {
                text: text,
              };
            }

            // Build the complete payload
            const payload = {
              subscriptionId: String(subscriptionId),
              answers: answersPayload,
            };

            console.log("[PAUSE_CANCEL] Submitting payload:", JSON.stringify(payload, null, 2));

            // Call the API
            const response = await fetch("/api/user/pause-cancel-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
              throw new Error(result.error || "Failed to pause/cancel subscription");
            }

            console.log("[PAUSE_CANCEL] Successfully submitted pause/cancel request");

            // Submit final data with all answers included (matches AntiAgingQuiz pattern)
            await submitFormData?.(
              {
                ...allAnswers, // Include all answers
                completion_state: "Complete",
                completion_percentage: 100,
              },
              allAnswers
            );
            // Complete the flow and go back to main view
            if (onComplete) {
              // Pass all answers as object for completion handler
              onComplete(allAnswers);
            }
            // Navigate back to main view (null)
            handleNavigate("main");
          } catch (error) {
            console.error("[PAUSE_CANCEL] Error submitting pause/cancel:", error);
            toast.error(error.message || "Failed to submit. Please try again.");
          }
        }}
        linkText="Back to subscription"
        linkHref="/subscriptions"
        bottomMessage="We're sorry to see you leave :("
        containerClassName="w-full md:w-[528px] mx-auto"
        showBottomBackground={true}
      />
    );
  }

  return null;
};

export default SubscriptionStepRenderer;
