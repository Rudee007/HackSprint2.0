// src/components/AyurBotChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  IconButton, 
  Avatar, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Paper, 
  CircularProgress,
  ThemeProvider,
  createTheme,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Chat as ChatIcon,
  PersonSearch as DoctorIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  MedicalServices as MedicalServicesIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

// API Setup
const api = axios.create({
  baseURL: "http://localhost:3003/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Constants
const API_BASE = 'http://localhost:3003';

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#14b8a6',
      light: '#2dd4bf',
      dark: '#0f766e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
        },
      },
    },
  },
});

// MessageBubble component
const MessageBubble = ({ message, isUser }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 1,
          maxWidth: '85%',
        }}
      >
        {!isUser && (
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              mt: 0.5,
            }}
          >
            <BotIcon sx={{ width: 22, height: 22 }} />
          </Avatar>
        )}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            bgcolor: isUser ? 'primary.main' : 'grey.50',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
            boxShadow: isUser 
              ? '0 4px 12px rgba(16, 185, 129, 0.2)' 
              : '0 2px 8px rgba(0,0,0,0.06)',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <Box sx={{ 
                    borderRadius: 1, 
                    overflow: 'hidden',
                    my: 1,
                    '& pre': { 
                      margin: '0 !important',
                      borderRadius: '8px !important',
                      fontSize: '0.85rem !important',
                    }
                  }}>
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </Box>
                ) : (
                  <code 
                    className={className} 
                    style={{
                      background: isUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                      padding: '0.2em 0.5em',
                      borderRadius: 4,
                      fontSize: '0.9em',
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              p: ({node, ...props}) => <p style={{ margin: '0.5em 0', lineHeight: 1.6 }} {...props} />,
              strong: ({node, ...props}) => <strong style={{ fontWeight: 700 }} {...props} />,
            }}
          >
            {message.text}
          </ReactMarkdown>
        </Paper>
      </Box>
    </motion.div>
  );
};

// InputArea component
const InputArea = ({ value, onChange, onSubmit, loading, placeholder }) => {
  const [isListening, setIsListening] = useState(false);
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupportsSpeech(false);
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-IN';

    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript || '')
        .join('');
      onChange({ target: { value: transcript } });
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSubmit(e);
    }
  };
  
  return (
    <Box sx={{ 
      position: 'relative', 
      bgcolor: 'white', 
      borderTop: '1px solid #e5e7eb',
      boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)',
    }}>
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2.5 }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder={placeholder || 'Type or speak your message...'}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          multiline
          maxRows={4}
          InputProps={{
            startAdornment: browserSupportsSpeech && (
              <InputAdornment position="start">
                <Tooltip title={isListening ? 'Stop listening' : 'Start voice input'}>
                  <IconButton
                    onClick={toggleSpeechRecognition}
                    color={isListening ? 'error' : 'default'}
                    sx={{
                      '&:hover': {
                        bgcolor: isListening ? 'error.lighter' : 'action.hover',
                      }
                    }}
                  >
                    {isListening ? <MicOffIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="submit"
                  disabled={!value.trim() || loading}
                  sx={{
                    color: 'white',
                    backgroundColor: 'primary.main',
                    '&:hover': { 
                      backgroundColor: 'primary.dark',
                      transform: 'scale(1.05)',
                    },
                    '&.Mui-disabled': { 
                      backgroundColor: 'grey.300',
                      color: 'grey.500',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '28px',
              bgcolor: 'grey.50',
              fontSize: '0.95rem',
              '& fieldset': { 
                border: '2px solid transparent',
              },
              '&:hover fieldset': {
                border: '2px solid #e5e7eb',
              },
              '&.Mui-focused fieldset': {
                border: '2px solid',
                borderColor: 'primary.main',
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

// 🔥 NEW: Doctor Card Component with Booking
const DoctorCard = ({ doctor, index, onBook, isBooking }) => {
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  const handleBookClick = () => {
    setShowBookingDialog(true);
  };

  const confirmBooking = () => {
    onBook(doctor);
    setShowBookingDialog(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)',
              transform: 'translateY(-4px)',
              borderColor: 'primary.main',
            },
          }}
        >
          <CardContent sx={{ flexGrow: 1, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  mr: 2,
                }}
              >
                {doctor.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {doctor}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    4.8 • Ayurvedic Specialist
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                icon={<MedicalServicesIcon />}
                label="15+ years exp"
                size="small"
                sx={{ bgcolor: 'primary.lighter' }}
              />
              <Chip
                label="Panchakarma Expert"
                size="small"
                sx={{ bgcolor: 'secondary.lighter' }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Specialized in traditional Panchakarma therapies and holistic wellness treatments.
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'grey.50',
              borderRadius: 2,
              p: 1.5,
            }}>
              <CalendarIcon sx={{ fontSize: 20, color: 'primary.main', mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Available Today
              </Typography>
            </Box>
          </CardContent>

          <CardActions sx={{ p: 3, pt: 0 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleBookClick}
              disabled={isBooking}
              startIcon={isBooking ? <CircularProgress size={20} /> : <CalendarIcon />}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                },
              }}
            >
              {isBooking ? 'Booking...' : 'Book Appointment'}
            </Button>
          </CardActions>
        </Card>
      </motion.div>

      {/* Booking Confirmation Dialog */}
      <Dialog
        open={showBookingDialog}
        onClose={() => setShowBookingDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <CalendarIcon />
          Confirm Appointment
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 700,
                mx: 'auto',
                mb: 2,
              }}
            >
              {doctor.charAt(0)}
            </Avatar>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              {doctor}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ayurvedic Specialist
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'left', bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Appointment Details:
              </Typography>
              <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Duration:</Typography>
                  <Typography variant="body2" fontWeight={600}>30 minutes</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Type:</Typography>
                  <Typography variant="body2" fontWeight={600}>In-Person Therapy</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Consultation Fee:</Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    ₹1,500
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
              You will be redirected to select a time slot after confirmation.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setShowBookingDialog(false)}
            variant="outlined"
            size="large"
            fullWidth
          >
            Cancel
          </Button>
          <Button
            onClick={confirmBooking}
            variant="contained"
            size="large"
            fullWidth
            startIcon={<CheckIcon />}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Main Chat Component
const AyurBotChat = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      type: 'bot',
      text: 'Namaste! 🙏 I am **AyurBot**, your Ayurvedic health assistant.\n\nI can help you with:\n\n• **Panchakarma Therapies**: Learn about treatments\n• **Health Guidance**: Get personalized advice\n• **Find Doctors**: Connect with specialists\n\nHow can I assist you today?'
    }
  ]);
  const messagesEndRef = useRef(null);

  // Doctor finder states
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  
  // Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Get user data
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data?.success) {
          setUser(response.data.data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatLoading(true);

    setChatMessages(prev => [...prev, { type: 'user', text: userMsg }]);

    try {
      const history = chatMessages.slice(-10).map(msg => ({
        user: msg.type === 'user' ? msg.text : '',
        assistant: msg.type === 'bot' ? msg.text : ''
      }));

      const response = await fetch(`${API_BASE}/api/panchakarma-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get response');

      setChatMessages(prev => [...prev, { type: 'bot', text: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        text: `Sorry, I encountered an error: ${err.message}` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!age || !gender || !symptoms) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'warning',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/panchakarma-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: Number(age),
          gender,
          complaint: symptoms,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get recommendation');

      setResult(data);
      setAge('');
      setGender('');
      setSymptoms('');
      
      setSnackbar({
        open: true,
        message: '✨ Recommendations generated successfully!',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || 'Failed to get recommendations',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: Handle Doctor Booking
  const handleBookDoctor = async (doctorName) => {
    if (!user?.id) {
      setSnackbar({
        open: true,
        message: 'Please login to book an appointment',
        severity: 'warning',
      });
      return;
    }

    setBookingDoctor(doctorName);

    try {
      // Note: You'll need to map doctor names to their IDs
      // For now, using a placeholder ID - replace with actual doctor lookup
      const bookingData = {
        providerId: '6933dbd018c9eeeda37c7f35', // Replace with actual doctor ID
        patientId: user.id || user._id,
        startTime: new Date().toISOString(), // You can enhance this with a time picker
        duration: 30,
        type: "in_person",
        providerType: "therapist",
        fee: 1500,
        sessionType: "therapy",
        meetingLink: "",
        notes: `Booking with ${doctorName} for ${result?.procedure || 'therapy'}`
      };

      const response = await api.post("/booking/create", bookingData);

      if (response.data?.success) {
        setSnackbar({
          open: true,
          message: `🎉 Appointment booked successfully with ${doctorName}!`,
          severity: 'success',
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Booking failed. Please try again.',
        severity: 'error',
      });
    } finally {
      setBookingDoctor(null);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: 280,
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ 
            p: 3, 
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BotIcon />
              AyurBot
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              AI-Powered Health Assistant
            </Typography>
          </Box>

          <List sx={{ p: 2 }}>
            <ListItem
              button
              selected={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
              sx={{
                borderRadius: 2,
                mb: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
                transition: 'all 0.2s',
              }}
            >
              <ListItemIcon>
                <ChatIcon color={activeTab === 'chat' ? 'inherit' : 'action'} />
              </ListItemIcon>
              <ListItemText 
                primary="Chat with AyurBot" 
                primaryTypographyProps={{ fontWeight: activeTab === 'chat' ? 600 : 400 }}
              />
            </ListItem>

            <ListItem
              button
              selected={activeTab === 'doctor'}
              onClick={() => setActiveTab('doctor')}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
                transition: 'all 0.2s',
              }}
            >
              <ListItemIcon>
                <DoctorIcon color={activeTab === 'doctor' ? 'inherit' : 'action'} />
              </ListItemIcon>
              <ListItemText 
                primary="Find a Doctor" 
                primaryTypographyProps={{ fontWeight: activeTab === 'doctor' ? 600 : 400 }}
              />
            </ListItem>
          </List>

          <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">
                💡 <strong>Tip:</strong> Ask me anything about Panchakarma therapies, doshas, or health concerns!
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === 'chat' ? (
            <>
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 3,
                  bgcolor: 'background.default',
                }}
              >
                {chatMessages.map((msg, index) => (
                  <MessageBubble
                    key={index}
                    message={msg}
                    isUser={msg.type === 'user'}
                  />
                ))}
                <div ref={messagesEndRef} />
              </Box>

              <InputArea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onSubmit={handleChatSubmit}
                loading={chatLoading}
              />
            </>
          ) : (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 4, bgcolor: 'background.default' }}>
              <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                    Find Your Perfect Ayurvedic Specialist
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Share your symptoms to get personalized therapy recommendations and connect with expert doctors
                  </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 4, borderRadius: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
                  <Box component="form" onSubmit={handleDoctorSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      label="Age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      fullWidth
                      InputProps={{
                        inputProps: { min: 1, max: 120 }
                      }}
                    />

                    <TextField
                      select
                      label="Gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                      fullWidth
                      SelectProps={{ native: true }}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </TextField>

                    <TextField
                      label="Health Concerns / Symptoms"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      multiline
                      rows={4}
                      required
                      fullWidth
                      placeholder="Describe your symptoms, health concerns, or conditions..."
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <DoctorIcon />}
                      sx={{ 
                        py: 1.5,
                        fontSize: '1rem',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      {loading ? 'Analyzing Your Symptoms...' : 'Get Recommendations'}
                    </Button>
                  </Box>
                </Paper>

                {/* Results Section */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 4, 
                        borderRadius: 3, 
                        background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                        color: 'white',
                        mb: 4,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 56, height: 56 }}>
                          <MedicalServicesIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Recommended Therapy
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            {result.procedure}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Based on your symptoms and profile, this therapy will provide optimal healing and balance.
                      </Typography>
                    </Paper>

                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                      Recommended Specialists ({result.vaidya_list.length})
                    </Typography>

                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
                      gap: 3,
                    }}>
                      {result.vaidya_list.map((vaidya, index) => (
                        <DoctorCard
                          key={index}
                          doctor={vaidya}
                          index={index}
                          onBook={handleBookDoctor}
                          isBooking={bookingDoctor === vaidya}
                        />
                      ))}
                    </Box>
                  </motion.div>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ minWidth: 300 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default AyurBotChat;
