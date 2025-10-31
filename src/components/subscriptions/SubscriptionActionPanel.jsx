export default function SubscriptionActionPanel({ action, subscription }) {
  const panels = {
    "See prescription": {
      title: "Prescription",
      description: "This is a simple panel showing the prescription area.",
    },
    "Message provider": {
      title: "Message provider",
      description:
        "This is a simple panel where you can chat with your provider.",
    },
    "Request refill": {
      title: "Request refill",
      description: "This is a simple panel to start the refill flow.",
    },
  };

  const current = panels[action] || { title: action || "", description: "" };

  return (
    <div className="bg-white rounded-[16px] shadow-[0px_0px_16px_0px_#00000014] border border-[#E5E7EB] p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[18px] font-semibold leading-[120%]">
            {current.title}
          </h2>
          {subscription?.id && (
            <p className="text-sm text-[#7D7C77] mt-1">
              Subscription #{subscription.id}
            </p>
          )}
        </div>
      </div>
      {current.description && (
        <p className="text-sm text-[#212121] mt-4">{current.description}</p>
      )}
    </div>
  );
}
