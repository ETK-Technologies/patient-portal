import Link from "next/link";

export default function DashboardCard({ title, count, link, linkText }) {
  return (
    <div className="bg-white rounded-[16px] shadow-rounded-[16px] main-shadow w-[140px] h-[166px] md:w-[256px] md:h-[169px] p-4 md:p-6 ">
      <div className="mb-6 h-[82px]">
        <p className="text-[26px] text-[32px] font-[500] leading-[140%] mb-1 md:mb-2">
          {count}
        </p>
        <h3 className="text-[14px] text-[16px] font-[400] leading-[100%] ">
          {title}
        </h3>
      </div>
      <Link
        href={link}
        className="text-[12px] md:text-[13px] text-[#585857] hover:text-[#000000] leading-[140%] underline w-[60px] md:w-full block"
      >
        {linkText}
      </Link>
    </div>
  );
}
