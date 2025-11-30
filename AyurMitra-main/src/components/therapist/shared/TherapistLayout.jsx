// src/components/therapist/shared/TherapistLayout.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import TherapistSidebar from './TherapistSidebar';
import TherapistHeader from './TherapistHeader';
import { Toaster } from 'react-hot-toast';

const TherapistLayout = ({ children, activeView, onViewChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <Toaster position="top-right" />
      
      {/* Headerf */}
      <TherapistHeader 
        onMenuClick={() => {
          setIsSidebarOpen(!isSidebarOpen);
          setIsMobileSidebarOpen(!isMobileSidebarOpen);
        }}
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Desktop Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="hidden lg:block"
            >
              <TherapistSidebar 
                activeView={activeView}
                onViewChange={onViewChange}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="fixed left-0 top-0 h-full z-50 lg:hidden"
              >
                <TherapistSidebar 
                  activeView={activeView}
                  onViewChange={(view) => {
                    onViewChange(view);
                    setIsMobileSidebarOpen(false);
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TherapistLayout;
