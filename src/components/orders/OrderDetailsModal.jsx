"use client";

import { useEffect, useMemo } from "react";
import { IoMdClose } from "react-icons/io";
import { FaCheck } from "react-icons/fa";
import CustomButton from "@/components/utils/Button";
import CustomImage from "@/components/utils/CustomImage";
import StatusBadge from "@/components/utils/StatusBadge";

const formatAddress = (address) => {
  if (!address) return null;
  const segments = address.split(",").map((segment) => segment.trim());
  return segments.map((segment, index) => (
    <span key={segment}>
      {segment}
      {index !== segments.length - 1 && <br />}
    </span>
  ));
};

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="font-normal text-base leading-[140%] tracking-[0px] mb-[4px] text-black">
        {label}
      </p>
      <p className="font-normal text-sm leading-[140%] tracking-[0px] text-[#00000099]">
        {value}
      </p>
    </div>
  );
};

const TimelineStep = ({ label, date, isCompleted }) => (
  <div className="flex flex-col items-center gap-[6px] text-center min-w-[77.75px]">
    <div
      className={`flex items-center justify-center w-4 h-4 rounded-full ${
        isCompleted ? "bg-[#B07A4A] text-white" : "bg-[#F4F1EC] text-[#C9C5BF]"
      }`}
    >
      <FaCheck
        className={`w-2 h-2 ${isCompleted ? "opacity-100" : "opacity-60"}`}
      />
    </div>
    <div className="flex flex-col gap-[2px]">
      <p
        className={`font-normal text-sm leading-[140%] tracking-[0px] text-center ${
          isCompleted ? "text-black" : "text-[#A5A4A2]"
        }`}
      >
        {label}
      </p>
      {date && (
        <span
          className={`font-normal text-xs leading-[140%] tracking-[0px] ${
            isCompleted ? "text-[#00000099]" : "text-[#BCBAB6]"
          }`}
        >
          {date}
        </span>
      )}
    </div>
  </div>
);

const OrderItem = ({ item }) => {
  return (
    <div className="flex items-start gap-4 pb-6 md:items-center">
      {item.image && (
        <div className="relative w-[64px] h-[64px] rounded-[12px] overflow-hidden bg-[#F1F0EF] flex-shrink-0">
          <CustomImage
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-col gap-[6px] flex-1">
        <div className="flex flex-col items-start justify-between gap-[6px] md:flex-row md:items-center md:justify-between flex-1">
          <p className="font-medium text-base leading-[140%] tracking-[0px]">
            {item.title}{" "}
            <span className="font-medium text-base leading-[140%] tracking-[0px]">
              {item.quantityLabel}
            </span>
          </p>
          {item.priceLabel && (
            <div className="flex flex-col items-start md:items-end gap-[2px] text-right">
              {Array.isArray(item.priceLabel) ? (
                item.priceLabel.map(({ label, value }) => (
                  <span
                    key={`${item.id}-price-${label}`}
                    className="font-normal text-sm leading-[140%] tracking-[0px] text-right"
                  >
                    <span className="text-[#000000]">{label}</span>
                    <span className="text-[#00000099] ml-2">{value}</span>
                  </span>
                ))
              ) : (
                <span className="font-normal text-sm leading-[140%] tracking-[0px] text-right">
                  {item.priceLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {item.highlights?.length > 0 && (
          <div className="flex flex-col gap-[2px] md:max-w-[380px]">
            {item.highlights.map(({ label, value }) => (
              <p
                key={`${item.id}-${label}`}
                className="font-normal text-sm leading-[140%] tracking-[0px]"
              >
                <span className="text-[#000000] mr-1">{label}:</span>
                <span className="text-[#00000099]">{value}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderSummaryRow = ({
  label,
  value,
  note,
  emphasis,
  emphasisClassName = "",
}) => {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-[4px]">
      <span
        className={`font-[400] text-base leading-[140%] tracking-[0px] ${
          emphasis ? emphasisClassName : ""
        }`}
      >
        {label}
      </span>
      <span className="flex flex-col items-end text-right">
        <span
          className={`font-[400] text-base leading-[140%] tracking-[0px] text-right ${
            emphasis ? emphasisClassName : ""
          }`}
        >
          {value}
        </span>
        {note && (
          <span className="font-[400] text-xs leading-[140%] tracking-[0px] text-right text-[#00000099]">
            {note}
          </span>
        )}
      </span>
    </div>
  );
};

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
  const details = order?.details;
  const derivedStatus = details?.status || order?.status?.text;
  const derivedOrderId = details?.orderId || order?.orderNumber;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const billingInfo = useMemo(() => {
    if (!details?.billingDetails) return [];
    const {
      paymentMethod,
      transactionDate,
      customerName,
      email,
      phoneNumber,
      shippingAddress,
      trackingNumber,
    } = details.billingDetails;

    return [
      { label: "Payment Method", value: paymentMethod },
      { label: "Transaction Date", value: transactionDate },
      { label: "Customer Name", value: customerName },
      { label: "Email", value: email },
      { label: "Phone Number", value: phoneNumber },
      {
        label: "Shipping Address",
        value: shippingAddress ? formatAddress(shippingAddress) : null,
      },
      {
        label: "Tracking Number",
        value: trackingNumber || order?.trackingNumber,
      },
    ].filter((entry) => entry.value);
  }, [details?.billingDetails, order?.trackingNumber]);

  if (!isOpen || !details) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center pt-[36px] md:p-8">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-[24px] w-full max-w-[760px] max-h-full shadow-xl flex flex-col">
        <CustomButton
          variant="ghost"
          size="small"
          width="auto"
          onClick={onClose}
          className="!absolute top-5 right-5 !rounded-full !w-10 !h-10 !p-0 !bg-[#F4F4F4] hover:!bg-[#F5F4F2]"
        >
          <IoMdClose className="w-5 h-5 text-black" />
        </CustomButton>

        <div className="px-5 py-6 md:px-8 md:py-8 overflow-y-auto">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-2 ">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="font-medium text-xl leading-[114.9%] tracking-[-2%] align-middle">
                  Orders {derivedOrderId}
                </h2>
                <StatusBadge status={derivedStatus} />
              </div>
              {details.subscriptionLabel && (
                <p className="font-medium text-sm leading-[140%] tracking-[0px] align-middle text-[#00724C]">
                  {details.subscriptionLabel}
                </p>
              )}
            </div>

            {details.timeline?.length > 0 && (
              <div className="flex flex-row items-start gap-2 overflow-x-auto md:overflow-visible py-4 border-t border-b border-[#E2E2E1]">
                {details.timeline.map((step, index) => (
                  <div
                    key={`${step.label}-${index}`}
                    className="flex items-center md:flex-1 md:justify-center"
                  >
                    <TimelineStep
                      label={step.label}
                      date={step.date}
                      isCompleted={step.isCompleted}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4 pb-4 border-b border-[#E2E2E1]">
              <h3 className="font-medium text-xl leading-[140%] tracking-[0px] align-middle">
                Billing & Shipping Details
              </h3>
              <div className="grid grid-cols-1 gap-y-4">
                {billingInfo.map(({ label, value }) => (
                  <InfoRow key={label} label={label} value={value} />
                ))}
              </div>
            </div>

            {details.items?.length > 0 && (
              <div className="border-b border-[#E2E2E1]">
                <h3 className="font-medium text-xl leading-[140%] tracking-[0px] align-middle mb-4">
                  Items
                </h3>
                <div>
                  {details.items.map((item) => (
                    <OrderItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {details.summary && (
              <div className="flex flex-col gap-[12px]">
                <OrderSummaryRow
                  label="Subtotal"
                  value={details.summary.subtotal}
                />
                <OrderSummaryRow
                  label="Discount"
                  value={details.summary.discount?.value}
                  note={details.summary.discount?.note}
                />
                <OrderSummaryRow
                  label="Shipping"
                  value={details.summary.shipping?.value}
                  note={details.summary.shipping?.note}
                />
                <OrderSummaryRow label="Tax" value={details.summary.tax} />
                <div className="pb-4 border-b border-[#E2E2E1]">
                  <OrderSummaryRow
                    label="Total"
                    value={details.summary.total}
                    emphasis
                    emphasisClassName="font-medium text-lg"
                  />
                </div>
              </div>
            )}

            <div>
              <CustomButton
                text="Download Invoice"
                variant="default"
                size="medium"
                width="full"
                className="!w-full md:!w-[174px] !py-[10px] !bg-white !border !border-black !text-black !font-medium !text-sm !leading-[140%] !tracking-[0px] !align-middle hover:!bg-[#E3E3E3] hover:!border-[#E3E3E3] "
                onClick={() => {
                  if (details.invoiceUrl) {
                    window.open(details.invoiceUrl, "_blank");
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
