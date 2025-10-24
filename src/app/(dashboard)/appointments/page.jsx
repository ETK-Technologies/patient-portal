import PageContainer from "@/components/PageContainer";
import AppointmentsSection from "@/components/appointments/AppointmentsSection";
import { upcomingAppointments, pastAppointments } from "@/components/appointments/appointmentsData";

export default function Appointments() {
  return (
    <PageContainer title="My Appointments">
      <AppointmentsSection 
        title="Upcoming Appointments" 
        appointments={upcomingAppointments} 
      />
      
      {pastAppointments.length > 0 && (
        <AppointmentsSection 
          title="Past Appointments" 
          appointments={pastAppointments} 
        />
      )}
    </PageContainer>
  );
}
