// Subscription Flow Configuration - Data-driven approach
export const subscriptionFlowConfig = {
    // Main subscription details view (step 0 or null)
    mainView: {
        id: "main",
        type: "main-details",
    },

    // Flow steps configuration
    steps: {
        1: {
            id: "pauseCancel",
            type: "pause-cancel",
            title: "Pause or cancel subscription",
            component: "PauseCancelFlow",
        },
        2: {
            id: "pauseInstead",
            type: "radio",
            title: "Would you like to pause your subscription instead?",
            description: "Pausing your subscription will let you receive future refills with your existing prescription.",
            field: "pauseOption",
            options: [
                {
                    id: "pause90",
                    label: "Yes, pause for 90 days",
                    description: "Next order ships {90 days after next usual date}",
                },
                {
                    id: "pause60",
                    label: "Yes, pause for 60 days",
                    description: "Next order ships {60 days after next usual date}",
                },
                {
                    id: "pause30",
                    label: "Yes, pause for 30 days",
                    description: "Next order ships {30 days after next usual date}",
                },
                {
                    id: "no_thanks",
                    label: "No thanks",
                    description: "",
                },
            ],
        },
        3: {
            id: "adjustQuantity",
            type: "radio",
            title: "Need less right now?",
            description: "Pick what works better for your needs and save money while you're at it.",
            field: "quantity",
            options: [
                { id: 12, label: "12 pills", description: "shipped every 3 months" },
                { id: 16, label: "16 pills", description: "shipped every 3 months" },
                { id: 24, label: "24 pills", description: "shipped every 3 months" },
                { id: 30, label: "30 pills", description: "shipped every 3 months" },
                { id: 36, label: "36 pills", description: "shipped every 3 months" },
                { id: 42, label: "42 pills", description: "shipped every 3 months" },
                { id: "no_thanks", label: "No thanks", description: "" },
            ],
        },
        4: {
            id: "treatmentFeedback",
            type: "radio",
            title: "Did your treatment work as expected?",
            field: "treatmentWorked",
            options: [
                { id: "yes", label: "Yes, it did" },
                { id: "no", label: "No, it did not" },
            ],
            conditionalNavigation: {
                yes: 5, // Go to cancelReasonText
                no: 6, // Go to cancelReasonChecklist
            },
        },
        5: {
            id: "cancelReasonText",
            type: "text",
            title: "If your treatment worked for you, what's the reason you'd like to cancel?",
            description: "We love blunt feedback.",
            field: "cancelReasonText",
            placeholder: "My treatment worked but...",
        },
        6: {
            id: "cancelReasonChecklist",
            type: "checkbox",
            title: "We're sorry to see you go.",
            description: "Please tell us why you'd like to cancel. Select all that apply.",
            field: "cancelReasons",
            options: [
                { id: "reason1", label: "Takes too long to receive treatment." },
                { id: "reason2", label: "Slow responses from my provider." },
                { id: "reason3", label: "Side effects with treatment." },
                { id: "reason4", label: "Cost." },
                { id: "reason5", label: "I didn't get the results I wanted." },
                { id: "reason6", label: "I don't need treatment anymore." },
                { id: "reason7", label: "The patient portal is difficult to navigate." },
                { id: "reason8", label: "I'm trying out different products." },
            ],
        },
        7: {
            id: "cancelInfo",
            type: "cancel-what-to-expect",
            title: "What to expect after cancelling",
            component: "CancelWhatToExpectFlow",
        },
        8: {
            id: "cancelFinal",
            type: "text",
            title: "Tell us how we can serve you better.",
            description: "Be brutally honest.",
            field: "finalFeedback",
            placeholder: "What can we do better?",
        },
    },

    // Navigation configuration - defines flow paths
    navigation: {
        // From main view (null)
        null: {
            pauseCancel: 1,
            pauseInstead: 2,
            cancelReasonText: 5, // For direct navigation from main
            // Other main view actions handled separately
        },
        // From pauseCancel (step 1)
        1: {
            pauseInstead: 2,
            adjustQuantity: 3,
            proceedToCancel: 4,
        },
        // From pauseInstead (step 2)
        2: {
            adjustQuantity: 3,
            proceedToCancel: 4,
        },
        // From adjustQuantity (step 3)
        3: {
            treatmentFeedback: 4,
        },
        // From treatmentFeedback (step 4) - conditional based on answer
        4: {
            cancelReasonText: 5, // if yes
            cancelReasonChecklist: 6, // if no
        },
        // From cancelReasonText (step 5)
        5: {
            cancelInfo: 7,
        },
        // From cancelReasonChecklist (step 6)
        6: {
            cancelInfo: 7,
        },
        // From cancelInfo (step 7)
        7: {
            cancelFinal: 8,
        },
        // From cancelFinal (step 8) - back to main
        8: {
            main: null,
        },
    },

    // Progress mapping (percentage for each step)
    progressMap: {
        main: 0,
        1: 12.5,
        2: 25,
        3: 37.5,
        4: 50,
        5: 62.5,
        6: 62.5,
        7: 75,
        8: 100,
    },

    // Step titles for navigation
    stepTitles: {
        main: "Subscription Details",
        1: "Pause or Cancel",
        2: "Pause Instead",
        3: "Adjust Quantity",
        4: "Treatment Feedback",
        5: "Cancel Reason",
        6: "Cancel Reasons",
        7: "What to Expect",
        8: "Final Feedback",
    },
};

