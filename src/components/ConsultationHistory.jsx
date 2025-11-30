import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Loader2, AlertCircle } from "lucide-react";
import api from "../utils/api";


export default function ConsultationHistory({ onBookFirst }) {
  /* ──────────────────── state ──────────────────── */
  const [consults, setConsults] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  console.log("Stored token", localStorage.getItem("accessToken"));
  console.log("Stored patient id", localStorage.getItem("id"));
  
  /* ───────── fetch on mount / page change ──────── */
  const patientId = localStorage.getItem("id");       // ← pulled from LS

  useEffect(() => {
    if (!patientId) {
      setError("Patient ID not found – please log in again.");
      return;
    }

    (async () => {
      setLoading(true);
      setError("");

      try {
        
const { data } = await api.get(`/consultations/${patientId}`, {
    // params: { page, limit: 10 }
  });

        if (data.success) {
          setConsults(data.data);
          setPages(data.pagination?.totalPages || 1);
        } else {
          setError("Failed to load consultations.");
        }
      } catch {
        setError("Error fetching consultations.");
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, page]);

  /* ───────────── helper for status badge ─────────── */
  const badgeCls = (s) =>
    ({
      completed: "bg-green-100 text-green-800",
      scheduled: "bg-blue-100  text-blue-800",
      cancelled: "bg-red-100   text-red-800",
      pending:   "bg-yellow-100 text-yellow-800"
    }[s] || "bg-gray-100 text-gray-700");

  /* ────────────────  UI branches  ───────────────── */
  if (loading)
    return (
      <div className="py-16 flex flex-col items-center">
        <Loader2 size={48} className="animate-spin text-emerald-500" />
        <p className="mt-4 text-lg font-semibold text-gray-600">
          Loading consultations…
        </p>
      </div>
    );

  if (error)
    return (
      <div className="py-16 flex flex-col items-center">
        <AlertCircle size={48} className="text-red-500 mb-2" />
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );

  if (!consults.length)
    return (
      <div className="py-16 flex flex-col items-center">
        <Calendar size={64} className="text-gray-400" />
        <p className="mt-4 text-xl text-gray-500">No consultations found</p>

        <button
          onClick={onBookFirst}
          className="mt-6 px-8 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600
                     text-white font-semibold shadow-lg hover:from-emerald-700 hover:to-teal-700 transition"
        >
          Book Your First Consultation
        </button>
      </div>
    );

  /* ────────────────── main list ─────────────────── */
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-emerald-700 mb-8 text-center">
        My Consultation History
      </h2>

      <div className="divide-y divide-gray-200">
        {consults.map(({ _id, type, providerId, scheduledAt, notes, status, fee }) => {
          const label =
            type === "video"
              ? "🌐 Video Consultation"
              : type === "audio"
              ? "🎧 Audio Consultation"
              : "🏥 In-Person Consultation";

          return (
            <div key={_id} className="py-6 flex flex-col md:flex-row md:justify-between">
              {/* left column */}
              <div className="md:w-3/5">
                <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
                <p className="text-gray-700 mt-1">Dr. {providerId?.name || "Provider"}</p>
                <p className="text-sm text-gray-500">
                  {new Date(scheduledAt).toLocaleDateString()} •{" "}
                  {new Date(scheduledAt).toLocaleTimeString()}
                </p>
                {notes && (
                  <p className="mt-2 text-gray-700 text-sm max-w-lg">Notes: {notes}</p>
                )}
              </div>

              {/* right column */}
              <div className="md:w-1/5 mt-4 md:mt-0 flex flex-col items-start md:items-end">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeCls(
                    status
                  )}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>

                <span className="mt-3 text-lg font-semibold text-emerald-700">
                  {"\u20B9"}{fee ?? 0}
                </span>

                {status === "completed" && (
                  <button
                    onClick={() => alert("Open feedback modal")}
                    className="mt-4 px-4 py-2 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold
                               hover:bg-purple-200 transition"
                  >
                    Give Feedback
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* pagination */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-6 py-2 rounded-md bg-gray-200 text-gray-600
                     hover:bg-gray-300 disabled:opacity-50 transition"
        >
          Previous
        </button>

        <span className="self-center font-semibold">
          Page {page} / {pages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          disabled={page === pages}
          className="px-6 py-2 rounded-md bg-gray-200 text-gray-600
                     hover:bg-gray-300 disabled:opacity-50 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
