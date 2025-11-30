// SlotButton.jsx
import api from "../utils/api";                // shared Axios instance
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";  // exposes user.id

/**
 * Single slot button → books instantly on click.
 * Props:
 *  slot        { start, end, startTime, available }
 *  providerId  Mongo ID of doctor / therapist
 *  therapyType "consultation" etc.
 *  onBooked    callback(slot) on success
 */
export default function SlotButton({ slot, providerId, therapyType, onBooked }) {
  const { user } = useAuth();

  const handleClick = async () => {
    try {
      await api.post("/bookings/create", {
        providerId,
        patientId   : user.id,
        startTime   : slot.startTime,
        duration    : 30,
        type        : "in_person",
        providerType: "doctor",
        fee         : 0,
        sessionType : therapyType || "therapy",
        meetingLink : "",
        notes       : ""
      });
      toast.success("Appointment booked!");
      onBooked?.(slot);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed, try another slot");
    }
  };

  /* ─── UI ───────────────────────────── */
  return (
    <button
      onClick={handleClick}
      disabled={!slot.available}
      className={`
        w-full px-4 py-2 rounded-lg text-left border
        ${slot.available
          ? "bg-white hover:bg-emerald-50 active:scale-[.98] cursor-pointer"
          : "bg-gray-100 text-gray-400 cursor-not-allowed"}
        transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500
      `}
    >
      {slot.start} – {slot.end}
    </button>
  );
}
