import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  Clock,
  Calendar,
  Heart,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  User,
  Stethoscope,
  Pill,
  Activity,
  Search as SearchIcon,
  Filter as FilterIcon,
} from "lucide-react";
import axios from "axios";
import { translations } from "../i18n/translations";

// API Configuration helper (keeps parity with original file)
const getEnvVar = (key, defaultValue) => {
  try {
    return process?.env?.[key] || defaultValue;
  } catch {
    return defaultValue;
  }
};

const api = axios.create({
  baseURL: getEnvVar("REACT_APP_API_BASE_URL", "http://localhost:3003/api"),
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const NotificationCenter = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | unread | high
  const panelRef = useRef(null);

  // language
  const language = localStorage.getItem("language") || "en";
  const t = translations[language];

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      // focus first focusable in panel
      setTimeout(
        () => panelRef.current?.querySelector("input,button")?.focus(),
        50
      );
    } else {
      document.removeEventListener("keydown", handleKey);
    }
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const USE_MOCK = !getEnvVar("REACT_APP_API_BASE_URL", null);

      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 500));
        const now = Date.now();
        const mockNotifications = [
          {
            id: "1",
            type: "appointment_reminder",
            title: "Upcoming Appointment",
            message:
              "Your Panchakarma session with Dr. Sharma is scheduled for tomorrow at 10:00 AM",
            timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
            priority: "high",
            actionUrl: "/appointments/123",
          },
          {
            id: "2",
            type: "treatment_update",
            title: "Treatment Plan Updated",
            message:
              "Dr. Kumar has updated your Ayurvedic treatment plan. Please review the new recommendations.",
            timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
            read: false,
            priority: "medium",
          },
          {
            id: "3",
            type: "feedback_request",
            title: "Feedback Requested",
            message:
              "Please share your experience about the recent Abhyanga therapy session.",
            timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
            read: true,
            priority: "low",
          },
        ];
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter((n) => !n.read).length);
      } else {
        const response = await api.get(`/notifications/patient/${userId}`);
        if (response.data.success) {
          setNotifications(response.data.data);
          setUnreadCount(response.data.data.filter((n) => !n.read).length);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const USE_MOCK = !getEnvVar("REACT_APP_API_BASE_URL", null);
      if (USE_MOCK) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        await api.patch(`/notifications/${notificationId}/read`);
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const USE_MOCK = !getEnvVar("REACT_APP_API_BASE_URL", null);
      if (USE_MOCK) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        await api.patch(`/notifications/patient/${userId}/read-all`);
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "appointment_reminder":
        return <Calendar className="w-5 h-5" />;
      case "treatment_update":
        return <Stethoscope className="w-5 h-5" />;
      case "feedback_request":
        return <MessageSquare className="w-5 h-5" />;
      case "wellness_tip":
        return <Heart className="w-5 h-5" />;
      case "medication_reminder":
        return <Pill className="w-5 h-5" />;
      case "health_alert":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === "high") return "text-red-600 bg-red-50";
    if (type === "appointment_reminder") return "text-blue-600 bg-blue-50";
    if (type === "treatment_update") return "text-emerald-600 bg-emerald-50";
    if (type === "wellness_tip") return "text-purple-600 bg-purple-50";
    return "text-gray-600 bg-gray-50";
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return t.justNow;
    if (diffInMinutes < 60) return `${diffInMinutes}${t.minutesAgo}`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)}${t.hoursAgo}`;
    return `${Math.floor(diffInMinutes / 1440)}${t.daysAgo}`;
  };

  // derived list after search & filter
  const visibleNotifications = notifications
    .filter((n) =>
      filter === "unread"
        ? !n.read
        : filter === "high"
        ? n.priority === "high"
        : true
    )
    .filter((n) =>
      query
        ? `${n.title} ${n.message}`.toLowerCase().includes(query.toLowerCase())
        : true
    );

  return (
    <div className="relative">
      {/* Bell button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen((s) => !s)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={t.openNotifications}
        className="relative p-2.5 sm:p-3 bg-white rounded-full shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-emerald-300"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-lg"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* soft ring to indicate new */}
        {unreadCount > 0 && (
          <span className="absolute -inset-1 rounded-full ring-2 ring-emerald-200 opacity-60 animate-pulse" />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-full mt-2 w-[95vw] sm:w-[420px] max-w-[420px] bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
              role="dialog"
              aria-label={t.notifications}
            >
              {/* Header */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <Bell className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {t.notifications}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {unreadCount > 0
                          ? `${unreadCount} ${t.unread}`
                          : t.allCaughtUp}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        title={t.markAllRead}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setIsOpen(false)}
                      aria-label={t.close}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* search & filters */}
                <div className="flex gap-2 items-center">
                  <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 flex-1 shadow-sm focus-within:ring-2 focus-within:ring-emerald-200 focus-within:border-emerald-400 transition-all">
                    <SearchIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <input
                      placeholder={t.searchPlaceholder}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full text-sm outline-none placeholder:text-gray-400 bg-transparent"
                      aria-label={t.searchNotifications}
                    />
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        className="ml-1 p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </div>

                  <button
                    className={`p-2 rounded-lg border shadow-sm transition-all ${
                      filter !== "all"
                        ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setFilter((f) =>
                        f === "all"
                          ? "unread"
                          : f === "unread"
                          ? "high"
                          : "all"
                      )
                    }
                    title={`${t.toggleFilter}: ${filter === "all" ? t.filterAll : filter === "unread" ? t.filterUnread : t.filterHigh}`}
                    aria-pressed={filter !== "all"}
                  >
                    <FilterIcon className="w-4 h-4" />
                  </button>
                </div>
                {filter !== "all" && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-600">Filter:</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                      {filter === "unread" ? t.filterUnread : t.filterHigh}
                    </span>
                    <button
                      onClick={() => setFilter("all")}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      {t.clear}
                    </button>
                  </div>
                )}
              </div>

              {/* List */}
              <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {loading ? (
                  <div className="p-6 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"
                    />
                    <p className="text-sm text-gray-500">
                      {t.loadingNotifications}
                    </p>
                  </div>
                ) : visibleNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                      <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {query ? t.noResults : t.noNotifications}
                    </p>
                    <p className="text-xs text-gray-500">
                      {query ? "Try different keywords" : "You're all caught up!"}
                    </p>
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        className="mt-4 px-4 py-2 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-medium transition-colors"
                      >
                        {t.clearSearch}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {visibleNotifications.map((notification, idx) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() =>
                          !notification.read && markAsRead(notification.id)
                        }
                        className={`p-3 sm:p-4 flex gap-3 items-start hover:bg-gray-50 cursor-pointer transition-all border-l-4 ${
                          !notification.read
                            ? "bg-emerald-50/50 border-l-emerald-500"
                            : "border-l-transparent"
                        }`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            !notification.read && markAsRead(notification.id);
                        }}
                      >
                        <div
                          className={`p-2 rounded-xl shrink-0 shadow-sm ${getNotificationColor(
                            notification.type,
                            notification.priority
                          )}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4
                                className={`font-medium text-sm ${
                                  !notification.read
                                    ? "text-gray-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>

                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                              <span className="text-xs text-gray-500 font-medium">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm" />
                              )}
                            </div>
                          </div>

                          {notification.priority === "high" && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {t.urgent}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-xs text-gray-600 font-medium">
                  {t.showing ? t.showing.replace("{n}", visibleNotifications.length) : `Showing ${visibleNotifications.length}`}
                </div>
                <div className="flex gap-3">
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        setNotifications([]);
                        setUnreadCount(0);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline"
                    >
                      {t.clearAll}
                    </button>
                  )}
                  <button className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">
                    {t.viewAllNotifications}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;