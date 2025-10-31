import { useEffect, useRef, useState } from "react";
import { subscriptionFlowConfig } from "../config/subscriptionFlowConfig";

export function useSubscriptionFlow(subscription, initialStep = null) {
    // Storage keys
    const storageKey = "subscription-flow-data";
    const storageExpiryKey = "subscription-flow-data-expiry";

    // Read stored step index before initializing
    const getStoredStepIndex = () => {
        if (typeof window === "undefined") return initialStep;
        try {
            const ttl = window.localStorage.getItem(storageExpiryKey);
            if (ttl && Date.now() < parseInt(ttl)) {
                const stored = JSON.parse(
                    window.localStorage.getItem(storageKey) || "{}"
                );
                // Only restore if it's for the same subscription
                if (stored.subscriptionId === subscription?.id) {
                    return stored.stepIndex || initialStep;
                }
            }
            return initialStep;
        } catch (e) {
            return initialStep;
        }
    };

    const initialStepIndex = getStoredStepIndex();
    const [stepIndex, setStepIndex] = useState(initialStepIndex);
    const [maxReachedStep, setMaxReachedStep] = useState(initialStepIndex);
    // Store answers as an object - { field: value } format (matches AntiAgingQuiz pattern)
    const [answers, setAnswers] = useState({});
    const isInitializedRef = useRef(false);

    // Calculate progress based on step
    const getProgress = (step) => {
        if (step === null) return subscriptionFlowConfig.progressMap.main || 0;
        return subscriptionFlowConfig.progressMap[step] || 0;
    };

    const [progress, setProgress] = useState(getProgress(initialStepIndex));

    // Read stored data synchronously for initial state
    const getInitialData = () => {
        if (typeof window === "undefined") return {};
        try {
            const ttl = window.localStorage.getItem(storageExpiryKey);
            if (ttl && Date.now() < parseInt(ttl)) {
                const stored = JSON.parse(
                    window.localStorage.getItem(storageKey) || "{}"
                );
                if (stored.subscriptionId === subscription?.id) {
                    // Return answers as object (field: value format)
                    if (stored.answers && typeof stored.answers === "object") {
                        // Handle both object format and old array format
                        if (Array.isArray(stored.answers)) {
                            // Convert old array format to object format
                            const converted = {};
                            stored.answers.forEach((answer) => {
                                if (answer.field) {
                                    converted[answer.field] = answer.value;
                                }
                            });
                            return converted;
                        }
                        return stored.answers;
                    }
                    return {};
                }
            }
            return {};
        } catch (e) {
            return {};
        }
    };

    const readLocalStorage = () => {
        if (typeof window === "undefined") return null;
        try {
            const ttl = window.localStorage.getItem(storageExpiryKey);
            if (ttl && Date.now() < parseInt(ttl)) {
                const stored = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
                if (stored.subscriptionId === subscription?.id) {
                    return stored;
                }
            }
            window.localStorage.removeItem(storageKey);
            window.localStorage.removeItem(storageExpiryKey);
            return null;
        } catch (e) {
            return null;
        }
    };

    const writeLocalStorage = (data) => {
        if (typeof window === "undefined") return;
        try {
            const now = Date.now();
            const ttl = now + 1000 * 60 * 60 * 24; // 24 hours
            window.localStorage.setItem(storageKey, JSON.stringify({
                ...data,
                subscriptionId: subscription?.id,
            }));
            window.localStorage.setItem(storageExpiryKey, ttl.toString());
        } catch (e) {
            // Ignore storage errors
        }
    };

    // Initialize and restore any saved progress
    useEffect(() => {
        const stored = readLocalStorage();
        if (stored) {
            try {
                if (stored.stepIndex !== undefined) {
                    setStepIndex(stored.stepIndex);
                    setProgress(getProgress(stored.stepIndex));
                    setMaxReachedStep(stored.maxReachedStep || stored.stepIndex);
                }
                const initialAnswers = getInitialData();
                if (initialAnswers && Object.keys(initialAnswers).length > 0) {
                    setAnswers(initialAnswers);
                }
            } catch (e) {
                console.error("Error restoring subscription flow state:", e);
            }
        }
        isInitializedRef.current = true;
    }, [subscription?.id]);

    // Persist on changes (but only after initial restoration is complete)
    useEffect(() => {
        if (!isInitializedRef.current) return;
        writeLocalStorage({
            answers,
            stepIndex,
            progress,
            maxReachedStep,
        });
    }, [answers, stepIndex, progress, maxReachedStep, subscription?.id]);

    // Navigation functions
    const goToStep = (targetStep) => {
        // Allow navigation to previous steps or steps that have been reached
        if (
            targetStep === null ||
            targetStep <= maxReachedStep ||
            targetStep < stepIndex
        ) {
            setStepIndex(targetStep);
            setProgress(getProgress(targetStep));
        }
    };

    const handleContinue = async (overrideData = null) => {
        const currentStepConfig = subscriptionFlowConfig.steps[stepIndex];

        // Submit current step data before navigating (matches AntiAgingQuiz pattern)
        if (currentStepConfig && currentStepConfig.field && stepIndex !== null) {
            // Merge override data with existing answers to preserve all previous answers
            const mergedData = overrideData && typeof overrideData === "object"
                ? { ...answers, ...overrideData }
                : answers;
            
            // Update answers state with merged data (preserves all previous answers)
            if (overrideData && typeof overrideData === "object") {
                setAnswers(mergedData);
            }
            // Submit current step data with all answers included
            await submitCurrentStepData(mergedData);
        }

        // Handle conditional navigation
        if (currentStepConfig?.conditionalNavigation) {
            const dataToUse = overrideData || answers;
            const currentAnswer = dataToUse[currentStepConfig.field];
            const targetStep = currentStepConfig.conditionalNavigation[currentAnswer];

            if (targetStep) {
                const nextStep = targetStep;
                if (nextStep > maxReachedStep) {
                    setMaxReachedStep(nextStep);
                }
                setStepIndex(nextStep);
                setProgress(getProgress(nextStep));
                return;
            }
        }

        // Default navigation - go to next step
        const nextStep = stepIndex === null ? 1 : stepIndex + 1;

        // Check navigation config for next step
        const navConfig = subscriptionFlowConfig.navigation[stepIndex];
        if (navConfig && Object.keys(navConfig).length > 0) {
            // Navigation is handled by handleNavigate
        }

        if (nextStep > maxReachedStep) {
            setMaxReachedStep(nextStep);
        }
        setStepIndex(nextStep);
        setProgress(getProgress(nextStep));
    };

    const handleBack = () => {
        if (stepIndex === null) {
            return; // Can't go back from main view
        }

        // Go to previous step
        const prevStep = stepIndex === 1 ? null : stepIndex - 1;
        setStepIndex(prevStep);
        setProgress(getProgress(prevStep));
        // Don't update maxReachedStep when going back
    };

    const handleNavigate = (targetPanel) => {
        // Handle special case: "main" means navigate to null (main view)
        if (targetPanel === "main") {
            setStepIndex(null);
            setProgress(getProgress(null));
            return;
        }

        const currentStepKey = stepIndex === null ? "null" : stepIndex;
        const navConfig = subscriptionFlowConfig.navigation[currentStepKey] || subscriptionFlowConfig.navigation[stepIndex];

        if (navConfig && navConfig[targetPanel] !== undefined) {
            const targetStep = navConfig[targetPanel];
            if (targetStep !== null && targetStep > maxReachedStep) {
                setMaxReachedStep(targetStep);
            }
            setStepIndex(targetStep);
            setProgress(getProgress(targetStep));
        } else {
            // Fallback: try to find targetPanel as a direct step ID
            const targetStep = subscriptionFlowConfig.steps[targetPanel];
            if (targetStep) {
                // targetPanel is a step number
                const stepNum = parseInt(targetPanel);
                if (!isNaN(stepNum)) {
                    if (stepNum > maxReachedStep) {
                        setMaxReachedStep(stepNum);
                    }
                    setStepIndex(stepNum);
                    setProgress(getProgress(stepNum));
                }
            }
        }
    };

    // Transform answers for API submission (matches AntiAgingQuiz pattern)
    const transformAnswersForApi = (ans = answers) => {
        const out = {};
        const steps = subscriptionFlowConfig.steps;
        
        Object.values(steps).forEach((cfg) => {
            if (!cfg || typeof cfg !== "object" || !cfg.field) return;
            const field = cfg.field;
            const value = ans[field];
            if (value === undefined || value === null) return;

            // Handle checkbox type - send array values
            if (cfg.type === "checkbox") {
                if (Array.isArray(value) && value.length > 0) {
                    // For checkbox, send each selected option ID with its label
                    value.forEach((optionId) => {
                        const selectedOption = cfg.options?.find(
                            (opt) => opt.id === optionId || opt.label === optionId
                        );
                        if (selectedOption) {
                            // Use option ID as key, label as value
                            out[optionId] = selectedOption.label || optionId;
                        } else {
                            // Fallback: use the value as-is
                            out[optionId] = optionId;
                        }
                    });
                }
            } 
            // Handle radio types - send selected option label
            else if (cfg.type === "radio" && cfg.options) {
                const selectedOption = cfg.options.find(
                    (opt) => opt.id === value || opt.label === value
                );
                if (selectedOption) {
                    out[field] = selectedOption.label || value;
                } else {
                    out[field] = value;
                }
            }
            // Handle text types - send value directly
            else if (cfg.type === "text") {
                out[field] = value;
            }
            // Default: send value as-is
            else {
                out[field] = value;
            }
        });

        return out;
    };

    // Submit form data to API (similar to AntiAgingQuiz pattern)
    const submitFormData = async (specificData = null, cleanedAnswers = null) => {
        try {
            const essentialData = {
                subscription_id: subscription?.id || "",
                action: "subscription_cancel_flow",
                stage: "subscription-management",
                page_step: stepIndex,
                completion_state: specificData?.completion_state || "Partial",
                completion_percentage: specificData?.completion_percentage || progress,
            };

            // Transform answers into API format
            const answersToUse = cleanedAnswers || answers;
            let allData = transformAnswersForApi(answersToUse);

            // If we have specific data, merge it with all existing answers
            const dataToSubmit = specificData
                ? { ...allData, ...specificData }
                : allData;

            // TODO: Replace with actual API endpoint when available
            // For now, just log the data that would be submitted
            console.log("Subscription flow data to submit:", {
                ...essentialData,
                ...dataToSubmit,
            });

            // Uncomment when API endpoint is ready:
            // const response = await fetch("/api/SubscriptionFlow", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ ...essentialData, ...dataToSubmit }),
            //     credentials: "include",
            // });
            // const data = await response.json();
            // if (data.error) {
            //     console.error("Subscription flow submission error:", data.msg || data.error_message);
            //     return null;
            // }
            // return data;

            return { success: true };
        } catch (error) {
            console.error("Error submitting subscription flow form:", error);
            return null;
        }
    };

    // Submit current step data when Continue is clicked (matches AntiAgingQuiz pattern)
    const submitCurrentStepData = async (overrideData = null) => {
        // Merge override data with current answers to preserve all previous answers
        let dataToUse = overrideData 
            ? { ...answers, ...overrideData } 
            : answers;

        // Get current step config
        const currentStepConfig = subscriptionFlowConfig.steps[stepIndex];
        if (!currentStepConfig || !currentStepConfig.field) {
            return;
        }

        const currentAnswer = dataToUse[currentStepConfig.field];
        if (currentAnswer === undefined || currentAnswer === null) {
            return;
        }

        // Update answers state with merged data to preserve all answers
        setAnswers(dataToUse);

        // Clear dependent fields when conditional navigation skips steps
        if (currentStepConfig.conditionalNavigation) {
            const targetStep = currentStepConfig.conditionalNavigation[currentAnswer];

            // If we're skipping steps due to conditional navigation, clear those skipped steps' data
            if (targetStep && targetStep > stepIndex + 1) {
                dataToUse = { ...dataToUse };
                // Clear data for all skipped steps
                for (
                    let skippedStep = stepIndex + 1;
                    skippedStep < targetStep;
                    skippedStep++
                ) {
                    const skippedStepConfig = subscriptionFlowConfig.steps[skippedStep];
                    if (skippedStepConfig && skippedStepConfig.field) {
                        delete dataToUse[skippedStepConfig.field];
                    }
                }
                // Update the answers state with cleared data immediately
                setAnswers(dataToUse);
            }
        }

        // Handle checkbox questions - send complete data when Continue is clicked
        if (currentStepConfig.type === "checkbox") {
            if (
                currentAnswer &&
                Array.isArray(currentAnswer) &&
                currentAnswer.length > 0
            ) {
                // Transform all answers (including previous ones) for API
                const allTransformedAnswers = transformAnswersForApi(dataToUse);
                
                const payload = {
                    page_step: stepIndex,
                    completion_percentage: progress,
                    ...allTransformedAnswers, // Include all previous answers
                };

                // Add current checkbox answers
                currentAnswer.forEach((optionId) => {
                    const selectedOption = currentStepConfig.options?.find(
                        (opt) => opt.id === optionId || opt.label === optionId
                    );
                    if (selectedOption) {
                        payload[optionId] = selectedOption.label || optionId;
                    } else {
                        payload[optionId] = optionId;
                    }
                });

                // Call submitFormData with payload including all answers
                await submitFormData(payload, dataToUse);
            }
            return;
        }

        // Handle other question types - send all answers including current question
        // Transform all answers (including previous ones) for API
        const allTransformedAnswers = transformAnswersForApi(dataToUse);
        
        const payload = {
            page_step: stepIndex,
            completion_percentage: progress,
            ...allTransformedAnswers, // Include all previous answers
        };

        // Handle radio types
        if (currentStepConfig.type === "radio" && currentStepConfig.options) {
            const selectedOption = currentStepConfig.options.find(
                (opt) => opt.id === currentAnswer || opt.label === currentAnswer
            );
            if (selectedOption) {
                payload[currentStepConfig.field] = selectedOption.label || currentAnswer;
            } else {
                payload[currentStepConfig.field] = currentAnswer;
            }
        }
        // Handle text types
        else if (currentStepConfig.type === "text") {
            payload[currentStepConfig.field] = currentAnswer;
        }
        // Default
        else {
            payload[currentStepConfig.field] = currentAnswer;
        }

        // Call submitFormData with payload including all answers
        await submitFormData(payload, dataToUse);
    };

    // Set answers with sync (matches AntiAgingQuiz pattern)
    const setAnswersWithSync = (updater) => {
        if (typeof updater === "function") {
            setAnswers((prev) => updater(prev));
        } else {
            setAnswers((prev) => ({ ...prev, ...updater }));
        }
    };

    // Add an answer (helper function for backwards compatibility)
    const addAnswer = (stepIdx, field, value) => {
        setAnswers((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Get answer value for a specific field
    const getAnswer = (field) => {
        return answers[field];
    };

    return {
        stepIndex,
        progress,
        answers, // Object format: { field: value }
        setAnswers: setAnswersWithSync,
        addAnswer, // Helper to add answer with stepIndex and field
        getAnswer, // Helper to get answer value by field
        handleContinue,
        handleBack,
        handleNavigate,
        goToStep,
        maxReachedStep,
        submitFormData, // Submit all form data
        submitCurrentStepData, // Submit current step data when Continue is clicked
        transformAnswersForApi, // Transform answers for API format
    };
}

