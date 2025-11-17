"use client";

import { useEffect, useMemo, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaCheck } from "react-icons/fa";
import CustomButton from "@/components/utils/Button";
import CustomImage from "@/components/utils/CustomImage";
import StatusBadge from "@/components/utils/StatusBadge";

const formatAddress = (address) => {
  if (!address) return null;
  const segments = address.split(",").map((segment) => segment.trim());
  return segments.map((segment, index) => (
    <span key={`address-segment-${index}`}>
      {segment}
      {index !== segments.length - 1 && <br />}
    </span>
  ));
};

const InfoRow = ({ label, value }) => {
  // Always render if value is provided (even if empty string)
  // Only skip if value is null/undefined (which shouldn't happen with our mapping)
  if (value === null || value === undefined) return null;

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

const TimelineStep = ({ label, date, isCompleted, isCanceled }) => {
  const isCanceledStep = isCanceled || label?.toLowerCase() === "canceled";

  return (
    <div className="flex flex-col items-center gap-[6px] text-center min-w-[77.75px]">
      <div
        className={`flex items-center justify-center w-4 h-4 rounded-full ${
          isCanceledStep && isCompleted
            ? "bg-[#DC3545] text-white"
            : isCompleted
            ? "bg-[#B07A4A] text-white"
            : "bg-[#F4F1EC] text-[#C9C5BF]"
        }`}
      >
        <FaCheck
          className={`w-2 h-2 ${isCompleted ? "opacity-100" : "opacity-60"}`}
        />
      </div>
      <div className="flex flex-col gap-[2px]">
        <p
          className={`font-normal text-sm leading-[140%] tracking-[0px] text-center ${
            isCanceledStep && isCompleted
              ? "text-[#DC3545]"
              : isCompleted
              ? "text-black"
              : "text-[#A5A4A2]"
          }`}
        >
          {label}
        </p>
        {date && (
          <span
            className={`font-normal text-xs leading-[140%] tracking-[0px] ${
              isCanceledStep && isCompleted
                ? "text-[#DC3545]"
                : isCompleted
                ? "text-[#00000099]"
                : "text-[#BCBAB6]"
            }`}
          >
            {date}
          </span>
        )}
      </div>
    </div>
  );
};

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
                item.priceLabel.map(({ label, value }, priceIndex) => (
                  <span
                    key={`${item.id}-price-${label}-${priceIndex}`}
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
            {item.highlights
              .filter(
                (highlight) =>
                  highlight.value &&
                  highlight.value !== "" &&
                  highlight.value !== "Data not exist in API response"
              )
              .map(({ label, value }, highlightIndex) => (
                <p
                  key={`${item.id}-highlight-${label}-${highlightIndex}`}
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

const ANIMATION_DURATION = 300;

// Helper function to get value - if field exists (even if empty), return empty string, otherwise return "Data not exist in API response"
const getValueOrNotExist = (obj, fieldPath) => {
  // Handle nested paths like "shipping_address.city"
  const parts = fieldPath.split(".");
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      // Field doesn't exist in the path
      return "Data not exist in API response";
    }
  }

  // Field exists - return empty string if null/undefined/empty, otherwise return the value
  if (current === null || current === undefined || current === "") {
    return "";
  }
  return current;
};

// Helper for simple field access
const getFieldValue = (obj, fieldName) => {
  if (obj && typeof obj === "object" && fieldName in obj) {
    const value = obj[fieldName];
    // Field exists - return empty string if null/undefined/empty, otherwise return the value
    if (value === null || value === undefined || value === "") {
      return "";
    }
    return value;
  }
  // Field doesn't exist
  return "Data not exist in API response";
};

// Map API response to modal structure
const mapOrderManageData = (apiData) => {
  // Try different possible response structures
  const order =
    apiData?.data?.data?.order || apiData?.data?.order || apiData?.order;

  if (!order) {
    console.warn(
      "[ORDER_DETAILS_MODAL] Could not find order in response:",
      apiData
    );
    return null;
  }
  const missingData = "Data not exist in API response";

  // Map shipping address - format as comma-separated string for formatAddress function
  const shippingAddressParts = [];
  let shippingAddress;
  if ("shipping_address" in order) {
    // Field exists in API response
    if (order.shipping_address) {
      const firstName = getFieldValue(order.shipping_address, "first_name");
      const lastName = getFieldValue(order.shipping_address, "last_name");
      if (
        firstName !== "Data not exist in API response" ||
        lastName !== "Data not exist in API response"
      ) {
        const fullName = `${
          firstName !== "Data not exist in API response" ? firstName : ""
        } ${
          lastName !== "Data not exist in API response" ? lastName : ""
        }`.trim();
        if (fullName) {
          shippingAddressParts.push(fullName);
        }
      }

      const company = getFieldValue(order.shipping_address, "company");
      if (company !== "Data not exist in API response") {
        shippingAddressParts.push(company);
      }

      const address1 = getFieldValue(order.shipping_address, "address_1");
      if (address1 !== "Data not exist in API response") {
        shippingAddressParts.push(address1);
      }

      const address2 = getFieldValue(order.shipping_address, "address_2");
      if (address2 !== "Data not exist in API response") {
        shippingAddressParts.push(address2);
      }

      const city = getFieldValue(order.shipping_address, "city");
      if (city !== "Data not exist in API response") {
        shippingAddressParts.push(city);
      }

      const state = getFieldValue(order.shipping_address, "state");
      if (state !== "Data not exist in API response") {
        shippingAddressParts.push(state);
      }

      const postcode = getFieldValue(order.shipping_address, "postcode");
      if (postcode !== "Data not exist in API response") {
        shippingAddressParts.push(postcode);
      }

      const country = getFieldValue(order.shipping_address, "country");
      if (country !== "Data not exist in API response") {
        shippingAddressParts.push(country);
      }
    }
    // If shipping_address exists but is null/empty, shippingAddressParts will be empty, which is correct
    shippingAddress =
      shippingAddressParts.length > 0 ? shippingAddressParts.join(", ") : "";
  } else {
    // Field doesn't exist in API response
    shippingAddress = missingData;
  }

  // Normalize status (handle both "cancelled" and "canceled" from API)
  const normalizedStatus = order.status?.toLowerCase();
  const statusMap = {
    cancelled: "Canceled",
    canceled: "Canceled",
    pending: "Pending",
    shipped: "Shipped",
    delivered: "Delivered",
    processing: "Processing",
    trash: "Trash",
  };
  const statusText = statusMap[normalizedStatus] || order.status || "Unknown";

  // Map timeline from status and dates
  // Always show 4 steps: Order Received, Shipped, Out for delivery, Delivered/Canceled
  const timeline = [];
  const isCancelled =
    normalizedStatus === "cancelled" || normalizedStatus === "canceled";

  // Step 1: Order Received (always completed if order exists)
  timeline.push({
    label: "Order Received",
    date: order.created_at
      ? new Date(order.created_at).toLocaleDateString()
      : "",
    isCompleted: true,
  });

  // Step 2: Shipped
  const isShippedCompleted =
    normalizedStatus === "shipped" ||
    normalizedStatus === "delivered" ||
    isCancelled; // If cancelled, it might have been shipped first
  timeline.push({
    label: "Shipped",
    date:
      isShippedCompleted && order.updated_at
        ? new Date(order.updated_at).toLocaleDateString()
        : "",
    isCompleted: isShippedCompleted,
  });

  // Step 3: Out for delivery
  const isOutForDeliveryCompleted =
    normalizedStatus === "delivered" || isCancelled; // If cancelled, it might have been out for delivery
  timeline.push({
    label: "Out for delivery",
    date:
      isOutForDeliveryCompleted && order.updated_at
        ? new Date(order.updated_at).toLocaleDateString()
        : "",
    isCompleted: isOutForDeliveryCompleted,
  });

  // Step 4: Delivered or Canceled
  if (isCancelled) {
    timeline.push({
      label: "Canceled",
      date: order.updated_at
        ? new Date(order.updated_at).toLocaleDateString()
        : "",
      isCompleted: true,
    });
  } else {
    timeline.push({
      label: "Delivered",
      date:
        normalizedStatus === "delivered" && order.updated_at
          ? new Date(order.updated_at).toLocaleDateString()
          : "",
      isCompleted: normalizedStatus === "delivered",
    });
  }

  // Map line items
  const items =
    order.line_items?.map((item, itemIndex) => {
      const productName = getFieldValue(item, "product_name");
      const quantity = getFieldValue(item, "quantity");
      const total = getFieldValue(item, "total");
      const subtotal = getFieldValue(item, "subtotal");
      const image = getFieldValue(item, "product_image");
      const brand = getFieldValue(item, "brand");
      const type = getFieldValue(item, "type");
      const frequency = getFieldValue(item, "tab_frequency");

      // Special handling for Body Optimization Program
      const isBodyOptimizationProgram =
        productName?.toLowerCase() === "body optimization program";

      let priceLabel;
      let highlights = [];

      if (isBodyOptimizationProgram) {
        // For Body Optimization Program, show initial fee and monthly fee
        const initialFee =
          subtotal !== "Data not exist in API response" && subtotal !== ""
            ? parseFloat(subtotal)
            : total !== "Data not exist in API response" && total !== ""
            ? parseFloat(total)
            : 0;
        const monthlyFee = 40; // Default monthly fee for Body Optimization Program

        priceLabel = [
          { label: "Initial fee", value: `$${initialFee.toFixed(2)}` },
          { label: "Monthly fee", value: `$${monthlyFee.toFixed(2)}` },
        ];

        // Show "Includes" text instead of regular highlights
        highlights = [
          {
            label: "Includes:",
            value:
              "Monthly Prescriptions, Follow-ups with clinicians, Pharmacist counseling",
          },
        ];
      } else {
        // Regular product handling
        priceLabel =
          total !== "Data not exist in API response"
            ? total !== ""
              ? `$${parseFloat(total).toFixed(2)}`
              : ""
            : missingData;

        highlights = [
          { label: "Brand", value: brand },
          { label: "Type", value: type },
          { label: "Frequency", value: frequency },
        ].filter(
          (highlight) =>
            highlight.value &&
            highlight.value !== "" &&
            highlight.value !== "Data not exist in API response"
        );
      }

      return {
        id:
          productName !== "Data not exist in API response"
            ? `${productName}-${itemIndex}`
            : `unknown-${itemIndex}`,
        title: productName,
        quantityLabel:
          quantity !== "Data not exist in API response"
            ? quantity !== ""
              ? `x${quantity}`
              : ""
            : missingData,
        image: image !== "Data not exist in API response" ? image : "",
        priceLabel: priceLabel,
        highlights: highlights,
      };
    }) || [];

  // Calculate subtotal from line items
  const subtotal =
    order.line_items?.reduce(
      (sum, item) => sum + parseFloat(item.subtotal || 0),
      0
    ) || 0;

  // Map summary
  const discountTotal = getFieldValue(order, "discount_total");
  const shippingTotal = getFieldValue(order, "shipping_total");
  const totalTax = getFieldValue(order, "total_tax");
  const total = getFieldValue(order, "total");
  const couponCode = order.coupon?.[0]
    ? getFieldValue(order.coupon[0], "code")
    : missingData;

  const summary = {
    subtotal: subtotal > 0 ? `$${subtotal.toFixed(2)}` : "",
    discount:
      discountTotal !== missingData
        ? {
            value:
              discountTotal !== ""
                ? `-$${parseFloat(discountTotal).toFixed(2)}`
                : "",
            note:
              couponCode !== missingData && couponCode !== ""
                ? `Coupon: ${couponCode}`
                : "",
          }
        : { value: missingData, note: "" },
    shipping:
      shippingTotal !== missingData
        ? {
            value:
              shippingTotal !== ""
                ? `$${parseFloat(shippingTotal).toFixed(2)}`
                : "",
            note: "",
          }
        : { value: missingData, note: "" },
    tax:
      totalTax !== missingData
        ? totalTax !== ""
          ? `$${parseFloat(totalTax).toFixed(2)}`
          : ""
        : missingData,
    total:
      total !== missingData
        ? total !== ""
          ? `$${parseFloat(total).toFixed(2)}`
          : ""
        : missingData,
  };

  // Handle tracking number
  const trackingNumberField = getFieldValue(order, "tracking_number");
  let trackingNumberValue = missingData;
  if (trackingNumberField !== missingData) {
    if (Array.isArray(trackingNumberField) && trackingNumberField.length > 0) {
      trackingNumberValue = trackingNumberField.join(", ");
    } else if (trackingNumberField !== "") {
      trackingNumberValue = trackingNumberField;
    } else {
      trackingNumberValue = "";
    }
  }

  return {
    orderId: getFieldValue(order, "id"),
    status: statusText, // Use normalized status
    subscriptionLabel: getFieldValue(order, "order_type"),
    timeline: timeline.length > 0 ? timeline : null,
    billingDetails: {
      paymentMethod: missingData, // Not in API response
      transactionDate: getFieldValue(order, "transaction_date"),
      customerName: getFieldValue(order, "customer_name"),
      email: getFieldValue(order, "customer_email"),
      phoneNumber: getFieldValue(order, "customer_phone"),
      shippingAddress: shippingAddress,
      trackingNumber: trackingNumberValue,
    },
    items: items,
    summary: summary,
    invoiceUrl: null, // Not in API response
  };
};

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
  const details = order?.details;
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [orderManageData, setOrderManageData] = useState(null);
  const [mappedOrderData, setMappedOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mountRafId;
    let visibilityRafId;
    let unmountTimeoutId;

    if (isOpen) {
      mountRafId = window.requestAnimationFrame(() => {
        setIsVisible(false);
        setIsMounted(true);

        visibilityRafId = window.requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      mountRafId = window.requestAnimationFrame(() => {
        setIsVisible(false);

        unmountTimeoutId = window.setTimeout(() => {
          setIsMounted(false);
        }, ANIMATION_DURATION);
      });
    }

    return () => {
      if (mountRafId) {
        window.cancelAnimationFrame(mountRafId);
      }
      if (visibilityRafId) {
        window.cancelAnimationFrame(visibilityRafId);
      }
      if (unmountTimeoutId) {
        window.clearTimeout(unmountTimeoutId);
      }
    };
  }, [isOpen]);

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

  // Fetch order management data when modal opens
  useEffect(() => {
    if (!isOpen || !order?.id) {
      setOrderManageData(null);
      setMappedOrderData(null);
      setError(null);
      return;
    }

    const fetchOrderManageData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Extract order ID (could be from order.id or order.details.id)
        // Handle case where orderNumber might be "#123" format
        let orderId = order.id || order.details?.id;

        // If orderId is not found, try extracting from orderNumber (remove # prefix)
        if (!orderId && order.orderNumber) {
          orderId = order.orderNumber.replace(/^#/, "");
        }

        if (!orderId) {
          console.error("[ORDER_DETAILS_MODAL] No order ID found", order);
          setError("Order ID not found");
          setLoading(false);
          return;
        }

        console.log(
          `[ORDER_DETAILS_MODAL] Fetching order management data for order: ${orderId}`
        );

        const response = await fetch(`/api/user/orders/manage/${orderId}`);

        if (!response.ok) {
          const errorData = await response.json();
          console.error(
            "[ORDER_DETAILS_MODAL] Error fetching order management data:",
            errorData
          );
          setError(errorData.error || "Failed to fetch order details");
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log(
          "[ORDER_DETAILS_MODAL] Order management data received:",
          data
        );

        // Store the full response data
        setOrderManageData(data.data || data);

        // Map the API response to modal structure
        // The response structure is: { success: true, data: { status, message, data: { order } } }
        // So we pass the full response to mapOrderManageData which handles nested paths
        const mapped = mapOrderManageData(data);
        setMappedOrderData(mapped);

        setLoading(false);
      } catch (err) {
        console.error(
          "[ORDER_DETAILS_MODAL] Error fetching order management data:",
          err
        );
        setError(err.message || "Failed to fetch order details");
        setLoading(false);
      }
    };

    fetchOrderManageData();
  }, [isOpen, order?.id]);

  // Use mapped data if available, otherwise fall back to details
  const displayData = mappedOrderData || details;
  const derivedStatus = displayData?.status || order?.status?.text;
  const derivedOrderId = displayData?.orderId || order?.orderNumber;

  const billingInfo = useMemo(() => {
    const billingDetails = displayData?.billingDetails;
    if (!billingDetails) return [];

    const {
      paymentMethod,
      transactionDate,
      customerName,
      email,
      phoneNumber,
      shippingAddress,
      trackingNumber,
    } = billingDetails;

    return [
      { label: "Payment Method", value: paymentMethod },
      { label: "Transaction Date", value: transactionDate },
      { label: "Customer Name", value: customerName },
      { label: "Email", value: email },
      { label: "Phone Number", value: phoneNumber },
      {
        label: "Shipping Address",
        value:
          shippingAddress &&
          shippingAddress !== "Data not exist in API response"
            ? formatAddress(shippingAddress)
            : shippingAddress,
      },
      {
        label: "Tracking Number",
        value:
          trackingNumber ||
          order?.trackingNumber ||
          "Data not exist in API response",
      },
    ];
  }, [displayData?.billingDetails, order?.trackingNumber]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-end justify-center pt-[36px] md:items-center md:p-8 transition-opacity duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative bg-white rounded-t-[24px] md:rounded-[24px] w-full max-w-[760px] max-h-full shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        } md:translate-y-0`}
      >
        <CustomButton
          variant="ghost"
          size="small"
          width="auto"
          onClick={onClose}
          className="!absolute top-5 right-5 !rounded-full !w-10 !h-10 !p-0 !bg-[#F4F4F4] hover:!bg-[#F5F4F2]"
        >
          <IoMdClose className="w-5 h-5 text-black" />
        </CustomButton>

        <div className="px-5 py-6 md:px-8 md:py-8 overflow-y-auto modal-scrollbar">
          {loading && !mappedOrderData && (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-600">Loading order details...</p>
            </div>
          )}

          {error && !mappedOrderData && (
            <div className="flex items-center justify-center py-8">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}

          {(!loading || mappedOrderData) && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col gap-2 ">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 className="font-medium text-xl leading-[114.9%] tracking-[-2%] align-middle">
                    Orders {derivedOrderId}
                  </h2>
                  <StatusBadge status={derivedStatus} />
                </div>
                {displayData?.subscriptionLabel && (
                  <p className="font-medium text-sm leading-[140%] tracking-[0px] align-middle text-[#00724C]">
                    {displayData.subscriptionLabel}
                  </p>
                )}
              </div>

              {displayData?.timeline?.length > 0 && (
                <div className="flex flex-row items-start gap-2 overflow-x-auto md:overflow-visible py-4 border-t border-b border-[#E2E2E1]">
                  {displayData.timeline.map((step, index) => (
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

              {displayData?.items?.length > 0 && (
                <div className="border-b border-[#E2E2E1]">
                  <h3 className="font-medium text-xl leading-[140%] tracking-[0px] align-middle mb-4">
                    Items
                  </h3>
                  <div>
                    {displayData.items.map((item) => (
                      <OrderItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {displayData?.summary && (
                <div className="flex flex-col gap-[12px]">
                  <OrderSummaryRow
                    label="Subtotal"
                    value={displayData.summary.subtotal}
                  />
                  <OrderSummaryRow
                    label="Discount"
                    value={displayData.summary.discount?.value}
                    note={displayData.summary.discount?.note}
                  />
                  <OrderSummaryRow
                    label="Shipping"
                    value={displayData.summary.shipping?.value}
                    note={displayData.summary.shipping?.note}
                  />
                  <OrderSummaryRow
                    label="Tax"
                    value={displayData.summary.tax}
                  />
                  <div className="pb-4 border-b border-[#E2E2E1]">
                    <OrderSummaryRow
                      label="Total"
                      value={displayData.summary.total}
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
                    if (displayData?.invoiceUrl) {
                      window.open(displayData.invoiceUrl, "_blank");
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
