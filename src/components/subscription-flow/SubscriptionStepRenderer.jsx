import React from "react";
import { subscriptionFlowConfig } from "./config/subscriptionFlowConfig";
import PauseCancelFlow from "./PauseCancelFlow";
import PauseInsteadFlow from "./PauseInsteadFlow";
import AdjustQuantityFlow from "./AdjustQuantityFlow";
import TreatmentFeedbackFlow from "./TreatmentFeedbackFlow";
import CancelReasonTextFlow from "./CancelReasonTextFlow";
import CancelReasonChecklistFlow from "./CancelReasonChecklistFlow";
import CancelWhatToExpectFlow from "./CancelWhatToExpectFlow";
import CancelFinalFeedbackFlow from "./CancelFinalFeedbackFlow";

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
        onBack={handleBack}
        onNavigate={handleNavigate}
      />
    );
  }

  // Handle pauseInstead step (step 2)
  if (stepIndex === 2) {
    return (
      <PauseInsteadFlow
        stepConfig={stepConfig}
        onBack={handleBack}
        onComplete={async (value) => {
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
    return (
      <AdjustQuantityFlow
        stepConfig={stepConfig}
        onBack={handleBack}
        onComplete={async (value) => {
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
    return (
      <TreatmentFeedbackFlow
        stepConfig={stepConfig}
        onBack={handleBack}
        onComplete={async (answer) => {
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
      <CancelReasonTextFlow
        stepConfig={stepConfig}
        onBack={handleBack}
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
    return (
      <CancelReasonChecklistFlow
        stepConfig={stepConfig}
        onBack={handleBack}
        onComplete={async (reasons) => {
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
        onBack={handleBack}
        onDone={() => {
          handleNavigate("cancelFinal");
        }}
      />
    );
  }

  // Handle cancelFinal step (step 8)
  if (stepIndex === 8) {
    return (
      <CancelFinalFeedbackFlow
        stepConfig={stepConfig}
        onBack={handleBack}
        onSubmit={async (text) => {
          // Add answer first to update state
          addAnswer(8, stepConfig?.field || "finalFeedback", text);
          // Create complete answers object with all previous answers
          const allAnswers = {
            ...answers,
            [stepConfig?.field || "finalFeedback"]: text,
          };
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
        }}
      />
    );
  }

  return null;
};

export default SubscriptionStepRenderer;
