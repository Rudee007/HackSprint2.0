import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/Auth";     // exposes user.id
import { toast } from "react-toastify";

/* helpers */
const fetchSlots = (providerId, date, therapy = "consultation") =>
  api
    .get(`/scheduling/providers/${providerId}/availability`, {
      params: { date, therapyType: therapy }
    })
    .then((r) => r.data.data.slots);

const bookSlot = (payload) => api.post("/booking/create", payload);

export default function SlotPicker({ provider, onClose, onBooked }) {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  useEffect(() => {
    fetchSlots(provider.doctorId, today)
      .then(setSlots)
      .finally(() => setLoading(false));
  }, [provider]);

  const handleBook = async (slot) => {
    try {
      await bookSlot({
        providerId: provider.doctorId,
        patientId: user.id,
        startTime: slot.startTime,
        duration: 30,
        type: "in_person",
        providerType: "doctor",      // or "therapist"
        fee: 1500,
        sessionType: "therapy",
        meetingLink: "",
        notes: ""
      });
      toast.success("Appointment booked!");
      onBooked(slot);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-xl p-6 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">
          Available slots • {today}
        </h2>

        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        ) : slots.length === 0 ? (
          <p>No slots today.</p>
        ) : (
          slots.map((s) => (
            <button
              key={s.startTime}
              onClick={() => handleBook(s)}
              className="block w-full text-left px-4 py-2 mb-2 border rounded hover:bg-emerald-50"
            >
              {s.start} – {s.end}
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}
