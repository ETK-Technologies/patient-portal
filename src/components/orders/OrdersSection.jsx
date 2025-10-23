import OrderCard from "./OrderCard";
import { ordersData, groupOrdersByDate } from "./ordersData";

const OrdersSection = () => {
  const groupedOrders = groupOrdersByDate(ordersData);
  const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
    // Sort dates in descending order (most recent first)
    return new Date(b) - new Date(a);
  });

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h2 className="text-[14px] font-[500] text-[#212121] mb-2">{date}</h2>
          <div className="space-y-3">
            {groupedOrders[date].map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      ))}

      {sortedDates.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-center">No orders found.</p>
        </div>
      )}
    </div>
  );
};

export default OrdersSection;
