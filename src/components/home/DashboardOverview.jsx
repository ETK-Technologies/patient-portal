import DashboardCard from "./DashboardCard";

export default function DashboardOverview() {
  const dashboardData = [
    {
      title: "Messages",
      count: "0",
      link: "/messages",
      linkText: "View Messages",
    },
    {
      title: "Subscriptions",
      count: "0",
      link: "/subscriptions",
      linkText: "View Subscriptions",
    },
    {
      title: "Upcoming Appointments",
      count: "0",
      link: "/appointments",
      linkText: "View Appointments",
    },
  ];

  return (
    <div className="flex gap-6 overflow-x-auto scrollbar-hide">
      <div className="flex gap-[16px] min-w-max">
        {dashboardData.map((item, index) => (
          <DashboardCard
            key={index}
            title={item.title}
            count={item.count}
            link={item.link}
            linkText={item.linkText}
          />
        ))}
      </div>
    </div>
  );
}
