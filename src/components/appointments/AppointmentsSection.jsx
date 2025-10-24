import AppointmentCard from "./AppointmentCard";

export default function AppointmentsSection({ title, appointments }) {
  if (!appointments || appointments.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-[18px] md:text-[20px] font-[500] leading-[140%] mb-4 md:mb-6">
        {title}
      </h2>
      <div className="space-y-4">
        {appointments.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </div>
    </div>
  );
}
