"use client";

import { useState } from "react";
import { GoChevronDown, GoChevronUp } from "react-icons/go";
import CustomImage from "../utils/CustomImage";
import CustomButton from "../utils/CustomButton";
import StatusBadge from "../utils/StatusBadge";
import { FaArrowRight } from "react-icons/fa";

const OrderCard = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(order.isExpanded || false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white shadow-[0px_0px_16px_0px_#00000014] rounded-[16px] mb-3 overflow-hidden p-5 md:p-6">
      {/* Order Header - Always Visible */}
      <div
        className=" cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="w-10 h-10 overflow-hidden rounded-[8px] relative">
              <CustomImage
                src={order.product.image}
                alt={order.product.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-[14px] md:text-[16px] font-[500] leading-[140%] mb-[2px]">
                {order.product.name}
              </h3>
              {order.product.subtitle && (
                <p className="text-[12px] font-[400] leading-[140%] text-[#212121]">
                  {order.product.subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <GoChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <GoChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Order Details - Expandable with Smooth Animation */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className=" pt-5 md:pt-6">
          {/* Mobile Layout */}
          <div className="flex flex-col md:flex-row gap-5 md:gap-[119px] ">
            <div className="flex gap-5 md:gap-[119px]">
              <div className="min-w-[140px] md:min-w-fit">
                <p className="text-[12px] font-[500] leading-[140%] mb-1 text-[#00000099]">
                  Order number
                </p>
                <p className="text-[14px] font-[500] leading-[140%] text-[557456]">
                  {order.orderNumber}
                </p>
              </div>
              <div className="min-w-[140px] md:min-w-fit">
                <p className="text-[12px] font-[500] leading-[140%] mb-1 text-[#00000099]">
                  Tracking Number
                </p>
                <p className="text-[14px] font-[500] leading-[140%] text-[557456]">
                  {order.trackingNumber}
                </p>
              </div>
            </div>
            <div className="flex flex-row-reverse md:flex-row gap-5 md:gap-[119px] ">
              <div className="min-w-[140px] md:min-w-fit">
                <p className="text-[12px] font-[500] leading-[140%] mb-1 text-[#00000099]">
                  Type
                </p>
                <p className="text-[14px] font-[500] leading-[140%] text-[557456]">
                  {order.type}
                </p>
              </div>
              <div className="min-w-[140px] md:min-w-fit">
                <p className="text-[12px] font-[500] leading-[140%] mb-1 text-[#00000099]">
                  Total
                </p>
                <p className="text-[14px] font-[500] leading-[140%] text-[557456]">
                  {order.total}
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-[#E2E2E1] my-5"></div>

          {/* Status and Action Button */}
          <div className=" flex flex-col md:flex-row md:items-center md:justify-between ">
            <StatusBadge
              status={order.status?.text}
              className="mb-4 md:mb-0 mx-auto md:mx-0"
            />
            <CustomButton
              text="Order Details"
              icon={<FaArrowRight />}
              size="small"
              width="auto"
              className="md:w-auto h-[40px] md:px-6 bg-white border border-[#E2E2E1] text-[#585857] hover:bg-[#F9F9F9]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
