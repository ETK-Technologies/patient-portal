"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import AppointmentsSection from "@/components/appointments/AppointmentsSection";
import CustomButton from "@/components/utils/Button";
import AppointmentCardSkeleton from "@/components/utils/skeletons/AppointmentCardSkeleton";
import { FaArrowRight } from "react-icons/fa";

/**
 * Transform Calendly meeting data to appointment format
 */
function transformMeetingToAppointment(meeting) {
  const startTime = new Date(meeting.startTime);
  const now = new Date();
  const isUpcoming = startTime > now;

  // Format date: "Nov 15, 2025"
  const dateOptions = { month: "short", day: "numeric", year: "numeric" };
  const formattedDate = startTime.toLocaleDateString("en-US", dateOptions);

  // Format time: "3:30pm"
  const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
  const formattedTime = startTime.toLocaleTimeString("en-US", timeOptions);

  // Get invitee info (use first invitee or default)
  const invitee = meeting.organizer?.[0] || {};
  const doctorImage =
    invitee.avatar ||
    "https://myrocky.b-cdn.net/WP%20Images/patient-portal/Dr-GeorgeMankaryous.png";

  return {
    id: meeting.eventUuid,
    type: meeting.name || "Appointment",
    doctorName: invitee.name || "Doctor",
    date: formattedDate,
    time: formattedTime,
    doctorImage: doctorImage,
    status: isUpcoming ? "upcoming" : "completed",
    startTime: meeting.startTime, // Keep original for sorting
  };
}

export default function Appointments() {
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/user/appointments");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch appointments");
        }

        // Transform meetings to appointments
        const appointments = (data.meetings || []).map(
          transformMeetingToAppointment
        );

        // Separate upcoming and past appointments
        const now = new Date();
        const upcoming = appointments
          .filter((apt) => new Date(apt.startTime) > now)
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        const past = appointments
          .filter((apt) => new Date(apt.startTime) <= now)
          .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <PageContainer title="My Appointments">
        <div className="space-y-4">
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="My Appointments">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="My Appointments">
      {upcomingAppointments.length > 0 && (
        <AppointmentsSection
          title="Upcoming Appointments"
          appointments={upcomingAppointments}
        />
      )}

      {pastAppointments.length > 0 && (
        <AppointmentsSection
          title="Past Appointments"
          appointments={pastAppointments}
        />
      )}

      {upcomingAppointments.length === 0 && pastAppointments.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="text-center">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              You have no appointments
            </h3>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              No active appointments right now. Discover what&apos;s available
              and get started today.
            </p>
            <CustomButton
              href="/treatments"
              text="Find a treatment"
              icon={<FaArrowRight className="text-white" />}
              variant="default"
              size="medium"
              width="auto"
              className="bg-black border-black text-white hover:bg-gray-800 mx-auto"
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
