// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Menu,
  X,
  User,
  UserPlus,
  LogOut,
  Activity,
  Shield,
  Home,
  Info,
  Phone,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext"; // Use our AuthContext
import { useI18n } from "../utils/i18n.jsx";

// NEW: include LanguageSwitcher and NotificationCenter in navbar
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationCenter from "./NotificationCenter";

const Navbar = () => {
  // Get authentication state from context
  const { isAuthenticated, user, loading, logout } = useAuth();

  // Local state for UI
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  
  const { language, setLanguage } = useI18n();

  const navigate = useNavigate();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation items based on authentication status and location
  const getNavigationItems = () => {
    const isDashboard = window.location.pathname.includes("dashboard");

    if (!isAuthenticated) {
      // Guest navigation - always show public pages
      return [
        { name: "Home", path: "/", icon: Home },
        { name: "About Us", path: "/about-us", icon: Info },
        { name: "Services", path: "/service", icon: Briefcase },
        { name: "Contact", path: "/contact", icon: Phone },
      ];
    } else if (isDashboard) {
      // Dashboard navigation - hide items, sidebar handles it
      return [];
    } else {
      // Authenticated but not on dashboard - show public pages + dashboard link
      const userRole = user?.role || "patient";
      const dashboardPath =
        userRole === "patient"
          ? "/patient-dashboard"
          : userRole === "doctor"
          ? "/doctor-dashboard"
          : userRole === "therapist"
          ? "/therapist-dashboard"
          : "/patient-dashboard";

      return [
        { name: "Home", path: "/", icon: Home },
        { name: "About Us", path: "/about-us", icon: Info },
        { name: "Services", path: "/service", icon: Briefcase },
        { name: "Contact", path: "/contact", icon: Phone },
        { name: "Dashboard", path: dashboardPath, icon: Activity },
      ];
    }
  };

  const loginOptions = [
    {
      name: "Patient",
      path: "/patient-login",
      icon: User,
      description: "Book appointments & track wellness",
      color: "from-emerald-500 to-teal-600",
    },
    {
      name: "Vaidya",
      path: "/doctor-login",
      icon: Activity,
      description: "Manage patients & consultations",
      color: "from-green-500 to-emerald-600",
    },
    {
      name: "Therapist",
      path: "/therapist-login",
      icon: Shield,
      description: "Schedule therapy sessions",
      color: "from-teal-500 to-cyan-600",
    },
    {
      name: "Admin",
      path: "/admin-login",
      icon: Shield,
      description: "Admin panel",
      color: "from-teal-500 to-cyan-600",
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    logout && logout();
    setShowSignOutConfirm(false);
    navigate("/");
  };

  const navigationItems = getNavigationItems();

  const onLanguageChange = (lang) => {
    setLanguage(lang);
  };

  // Show loading state
  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-white shadow-xl py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="animate-pulse bg-gray-200 h-12 w-48 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-2xl shadow-2xl border-b border-emerald-100/50 py-2"
            : "bg-gradient-to-r from-white/90 via-emerald-50/30 to-white/90 backdrop-blur-xl shadow-xl py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo Section */}
            <motion.div
              className="flex items-center space-x-12"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
                onClick={() => handleNavigation("/")}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <img
                        src="/img/logo.png"
                        alt="AyurMitra Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div className="w-8 h-8 text-white font-bold text-lg hidden items-center justify-center">
                        ॐ
                      </div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse opacity-80"></div>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 bg-clip-text text-transparent tracking-tight">
                      AyurMitra
                    </h1>
                    <p className="text-xs text-emerald-600/70 font-semibold tracking-wide uppercase">
                      Wellness Journey
                    </p>
                  </div>
                </div>
              </div>

              {/* Desktop Navigation */}
              {navigationItems.length > 0 && (
                <div className="hidden lg:flex items-center space-x-2">
                  {navigationItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.name}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        onClick={() => handleNavigation(item.path)}
                        className="group relative px-4 py-2.5 text-gray-700 hover:text-emerald-700 font-semibold text-sm transition-all duration-300 rounded-xl hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50"
                      >
                        <span className="relative z-10 flex items-center space-x-2">
                          <Icon className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                          <span>{item.name}</span>
                        </span>
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-4/5 transition-all duration-300 rounded-full"></div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Authentication + tools Section */}
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Language switcher always present for logged in users */}
              <div className="hidden md:flex items-center gap-3 mr-2">
                <LanguageSwitcher
                  currentLanguage={language}
                  onLanguageChange={onLanguageChange}
                />
              </div>

              {isAuthenticated && user ? (
                /* Logged In State */
                <>
                  {/* User Status Display */}
                  <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/50 backdrop-blur-sm">
                    <div className="relative">
                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                        {user.initial}
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-800 leading-tight">
                        {user.name}
                      </p>
                      <p className="text-xs text-emerald-600 leading-tight capitalize">
                        {user.role} • Online
                      </p>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSignOutConfirm(true)}
                    className="group flex items-center space-x-2 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 text-red-700 hover:text-red-800 border border-red-200 hover:border-red-300 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </motion.button>
                </>
              ) : (
                /* Logged Out State */
                <>
                  {/* Sign Up Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigation("/register")}
                    className="group flex items-center space-x-2 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border-2 border-emerald-200 hover:border-emerald-300 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </motion.button>

                  {/* Login Dropdown */}
                  <DropdownMenu
                    open={isLoginOpen}
                    onOpenChange={setIsLoginOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="group flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl border border-emerald-500/20"
                      >
                        <User className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span>Login</span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-all duration-300 group-hover:scale-110",
                            isLoginOpen && "rotate-180"
                          )}
                        />
                      </motion.button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      className="w-80 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-emerald-100 mt-3 p-3"
                      sideOffset={8}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-4 py-3 text-center border-b border-emerald-100/50 mb-3">
                          <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            Choose Your Portal
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Select your role to continue
                          </p>
                        </div>

                        <div className="space-y-2">
                          {loginOptions.map((option, index) => {
                            const IconComponent = option.icon;
                            return (
                              <DropdownMenuItem
                                key={option.name}
                                className="p-0 cursor-pointer"
                                onClick={() => handleNavigation(option.path)}
                              >
                                <motion.div
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`w-full p-4 rounded-xl bg-gradient-to-r ${option.color} hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 group`}
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                      <IconComponent className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-white font-bold text-base">
                                        {option.name}
                                      </h4>
                                      <p className="text-white/80 text-sm mt-1">
                                        {option.description}
                                      </p>
                                    </div>
                                    <ChevronDown className="w-5 h-5 text-white/70 -rotate-90 group-hover:translate-x-1 transition-transform duration-300" />
                                  </div>
                                </motion.div>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>

                        <div className="mt-4 pt-3 border-t border-emerald-100/50 text-center">
                          <p className="text-xs text-gray-500">
                            New to AyurMitra?{" "}
                            <button
                              className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                              onClick={() => handleNavigation("/register")}
                            >
                              Create Account
                            </button>
                          </p>
                        </div>
                      </motion.div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all duration-300"
                  aria-label="Toggle mobile menu"
                >
                  <AnimatePresence mode="wait">
                    {isMobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="w-6 h-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="w-6 h-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden"
            >
              <div className="px-4 py-6 bg-gradient-to-br from-white/98 to-emerald-50/50 backdrop-blur-2xl border-t border-emerald-100/50 shadow-inner">
                {/* Mobile User Status */}
                {isAuthenticated && user && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {user.initial}
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                      </div>
                      <div>
                        <p className="font-bold text-emerald-800">
                          {user.name}
                        </p>
                        <p className="text-sm text-emerald-600 capitalize">
                          {user.role} • Online
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Mobile Navigation */}
                {navigationItems.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {navigationItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleNavigation(item.path)}
                          className="w-full flex items-center space-x-4 px-4 py-3 text-gray-700 hover:text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 rounded-xl transition-all duration-300 font-semibold text-left"
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Mobile Language Switcher */}
                <div className="flex items-center gap-3 mb-4">
                  <LanguageSwitcher
                    currentLanguage={language}
                    onLanguageChange={onLanguageChange}
                  />
                </div>

                {/* Mobile Authentication */}
                <div className="pt-4 border-t border-emerald-100">
                  {isAuthenticated ? (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setShowSignOutConfirm(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-red-700 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-300 font-semibold"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </motion.button>
                  ) : (
                    <div className="space-y-3">
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleNavigation("/register")}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border-2 border-emerald-200 hover:border-emerald-300 rounded-xl font-bold transition-all duration-300"
                      >
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </motion.button>

                      <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide px-4 py-2">
                        Login Options:
                      </div>

                      {loginOptions.map((option, index) => {
                        const IconComponent = option.icon;
                        return (
                          <motion.button
                            key={option.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.1 }}
                            onClick={() => handleNavigation(option.path)}
                            className={`w-full p-4 rounded-xl bg-gradient-to-r ${option.color} hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 group`}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 text-left">
                                <h4 className="text-white font-bold">
                                  {option.name}
                                </h4>
                                <p className="text-white/80 text-sm">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={() => setShowSignOutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200/50">
                  <LogOut className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  End Session?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You'll be safely signed out of your AyurMitra account. Your
                  wellness data will remain secure.
                </p>
              </div>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex-1 px-6 py-3 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Sign Out
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;