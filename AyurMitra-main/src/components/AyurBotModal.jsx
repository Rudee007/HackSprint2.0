// src/components/AyurBotModal.jsx - ✅ 100% CLEAN
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Dialog, DialogContent, IconButton, Typography, Paper, Avatar,
  useTheme, useMediaQuery
} from '@mui/material';
import {
  SmartToy,          // ✅ Direct import (NO 'as')
  Close             // ✅ Direct import (NO 'as') 
} from '@mui/icons-material';
import AyurBotChat from './AyurBotChat';

const AyurBotModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 1300,
              background: 'rgba(16, 185, 129, 0.6)',
              backdropFilter: 'blur(16px)'
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 32 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <Dialog 
              open={true} 
              onClose={onClose} 
              fullWidth 
              maxWidth={false}
              sx={{
                '& .MuiDialog-paper': {
                  m: 1,
                  height: isMobile ? '95vh' : '85vh',
                  width: isMobile ? 'calc(100vw - 2px)' : '90vw',
                  maxWidth: 1200,
                  borderRadius: isMobile ? 0 : 3,
                  boxShadow: '0 32px 96px rgba(16,185,129,0.3)',
                  overflow: 'hidden'
                },
                '& .MuiDialog-container': {
                  alignItems: isMobile ? 'flex-end' : 'center',
                  p: isMobile ? '8px !important' : '24px !important'
                }
              }}
            >
              {/* Header */}
              <Paper sx={{
                position: 'relative',
                p: { xs: 3, sm: 4 },
                background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                color: 'white',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 24px rgba(16,185,129,0.3)'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 2
                }}>
                  {/* Logo & Title */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Paper sx={{
                      width: 56, height: 56,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                      <SmartToy sx={{ fontSize: 28, color: 'white' }} />
                    </Paper>
                    
                    <Box>
                      <Typography 
                        variant="h5" 
                        sx={{ fontWeight: 800, lineHeight: 1.2 }}
                      >
                        AyurBot
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.95 }}>
                        AI Ayurvedic Assistant
                      </Typography>
                    </Box>
                  </Box>

                  {/* Close Button */}
                  <IconButton
                    onClick={onClose}
                    sx={{
                      color: 'white',
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.25)',
                        transform: 'scale(1.05)',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
                      }
                    }}
                    aria-label="Close AyurBot"
                  >
                    <Close sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Paper>

              {/* Chat Content */}
              <Box sx={{ 
                height: '100%', 
                p: 0, 
                overflow: 'hidden',
                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
              }}>
                <AyurBotChat />
              </Box>
            </Dialog>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AyurBotModal;
