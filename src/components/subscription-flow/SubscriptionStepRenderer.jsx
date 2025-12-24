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
  initialAction,
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
    const [selected, setSelected] = useState(() => {
      return answers?.pauseOption || null;
    });
    const isSkipFlow = initialAction === "skip";
    
    let options = (stepConfig?.options || []).map((opt) => ({
      value: opt.id,
      label: opt.label,
      description: opt.description || "",
    }));
    
    if (isSkipFlow) {
      options = options.filter((opt) => opt.value !== "no_thanks");
    }

    React.useEffect(() => {
      if (answers?.pauseOption !== undefined && answers.pauseOption !== selected) {
        setSelected(answers.pauseOption);
      }
    }, [answers?.pauseOption]);

    return (
      <RadioOptionsScreen
        title={stepConfig?.title || ""}
        description={stepConfig?.description || ""}
        options={options}
        selectedValue={selected}
        onChange={setSelected}
        color="#AE7E56"
        containerClassName="w-full md:w-[528px] mx-auto md:px-0"
        continueText={isSkipFlow ? "Continue and Skip" : "Continue"}
        onContinue={async (value) => {
          // Add answer first to update state
          addAnswer(2, stepConfig?.field || "pauseOption", value);
          
          if (isSkipFlow) {
            try {
              const allAnswers = {
                ...answers,
                [stepConfig?.field || "pauseOption"]: value,
              };
              
              const getCookie = (name) => {
                if (typeof document === "undefined") return null;
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) {
                  return parts.pop().split(";").shift();
                }
                return null;
              };

              const wpUserId = getCookie("wp_user_id");
              const crmUserId = getCookie("userId");
              const subscriptionId = subscription?.id || subscription?._raw?.id || "";

              let pauseOptionValue = null;
              if (value && value !== "no_thanks") {
                const match = value.toString().match(/pause(\d+)/);
                if (match) {
                  pauseOptionValue = parseInt(match[1], 10);
                } else if (typeof value === "number") {
                  pauseOptionValue = value;
                }
              }

              if (!pauseOptionValue) {
                throw new Error("Please select a pause option");
              }

              if (!subscriptionId) {
                throw new Error("Subscription ID not found");
              }

              if (!wpUserId || !crmUserId) {
                throw new Error("User information not found. Please log in again.");
              }

              const payload = {
                subscriptionId: subscriptionId.toString(),
                wpUserId: wpUserId,
                crmUserId: crmUserId,
                answers: {
                  subscriptionAction: {
                    value: "skip"
                  },
                  pauseOption: {
                    value: pauseOptionValue
                  }
                }
              };

              const response = await fetch("/api/user/pause-cancel-subscription", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
              });

              const data = await response.json();

              if (!response.ok || !data.success) {
                throw new Error(data.error || data.message || "Failed to skip subscription");
              }

              if (typeof window !== "undefined") {
                window.location.href = "/subscriptions";
              }
            } catch (error) {
              console.error("Error skipping subscription:", error);
              toast.error(error.message || "Failed to skip subscription. Please try again.");
            }
          } else {
            await submitCurrentStepData?.({
              ...answers,
              [stepConfig?.field || "pauseOption"]: value,
            });
            if (value === "no_thanks") {
              handleNavigate("adjustQuantity");
            } else {
              handleNavigate("adjustQuantity");
            }
          }
        }}
      />
    );
  }

  // Handle adjustQuantity step (step 3)
  if (stepIndex === 3) {
    const [selected, setSelected] = useState(() => {
      return answers?.quantity || null;
    });
    const options = (stepConfig?.options || []).map((opt) => ({
      value: opt.id,
      label: opt.label,
      description: opt.description || "",
    }));

    React.useEffect(() => {
      if (answers?.quantity !== undefined && answers.quantity !== selected) {
        setSelected(answers.quantity);
      }
    }, [answers?.quantity]);

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
    const [selected, setSelected] = useState(() => {
      return answers?.treatmentWorked || null;
    });
    const options = (stepConfig?.options || []).map((opt) => ({
      value: opt.id,
      label: opt.label,
    }));

    React.useEffect(() => {
      if (answers?.treatmentWorked !== undefined && answers.treatmentWorked !== selected) {
        setSelected(answers.treatmentWorked);
      }
    }, [answers?.treatmentWorked]);

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
    const initialValue = answers?.cancelReasonText || "";
    
    return (
      <TextInputFlow
        title={stepConfig?.title || ""}
        description={stepConfig?.description || ""}
        placeholder={stepConfig?.placeholder || ""}
        buttonLabel="Continue"
        initialValue={initialValue}
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
    const [selected, setSelected] = useState(() => {
      const storedReasons = answers?.cancelReasons;
      if (Array.isArray(storedReasons) && storedReasons.length > 0) {
        return new Set(storedReasons);
      }
      return new Set();
    });
    const options = (stepConfig?.options || []).map((opt) => ({
      value: opt.id,
      label: opt.label,
    }));

    React.useEffect(() => {
      const storedReasons = answers?.cancelReasons;
      if (Array.isArray(storedReasons)) {
        setSelected(new Set(storedReasons));
      } else if (!storedReasons) {
        setSelected(new Set());
      }
    }, [answers?.cancelReasons]);

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
    const initialValue = answers?.finalFeedback || "";
    
    return (
      <TextInputFlow
        title={stepConfig?.title || ""}
        description={stepConfig?.description || ""}
        placeholder={stepConfig?.placeholder || ""}
        buttonLabel="Submit & Cancel Subscription"
        initialValue={initialValue}
        onComplete={async (text) => {
          try {
            addAnswer(8, stepConfig?.field || "finalFeedback", text);
            const allAnswers = {
              ...answers,
              [stepConfig?.field || "finalFeedback"]: text,
            };
            const result = await submitFormData?.(
              {
                ...allAnswers,
                completion_state: "Complete",
                completion_percentage: 100,
              },
              allAnswers
            );
            
            if (result?.success) {
              toast.success("Subscription updated successfully");
            } else if (result?.error) {
              toast.error(result.error || "Failed to update subscription");
              return;
            }
            
            if (onComplete) {
              onComplete(allAnswers);
            }
            handleNavigate("main");
          } catch (error) {
            console.error("Error submitting subscription cancellation:", error);
            toast.error("An error occurred. Please try again.");
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
