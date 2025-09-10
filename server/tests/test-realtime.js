// test-realtime.js
const { io } = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmM3YjAwNjEyODAxYjVkZjYzYjM5ZSIsImVtYWlsIjoiYWRtaW5AcGFuY2hha2FybWEuY29tIiwicm9sZSI6ImFkbWluIiwiaXNBZG1pbiI6dHJ1ZSwicGVybWlzc2lvbnMiOlsidXNlcl9tYW5hZ2VtZW50IiwiYXBwb2ludG1lbnRfbWFuYWdlbWVudCIsInByb3ZpZGVyX21hbmFnZW1lbnQiLCJzeXN0ZW1fYW5hbHl0aWNzIiwibm90aWZpY2F0aW9uX21hbmFnZW1lbnQiLCJhdWRpdF9sb2dzIl0sImlhdCI6MTc1NzE5MTA2MCwiZXhwIjoxNzU3Mjc3NDYwfQ.jkUQevrmHWYDIrG3ft7a8DuMovlcU7xLDNvK0-alaOI'; // Your admin JWT token
const TEST_SESSION_ID = 'test-session-123';

console.log('🧪 Starting Real-Time Session Tracking Test...\n');

// Test Function
async function testRealtimeTracking() {
  
  // ============ Test 1: Admin Connection ============
  console.log('📡 Test 1: Connecting as Admin...');
  
  const adminSocket = io(SERVER_URL, {
    auth: { token: ADMIN_TOKEN },
    transports: ['websocket']
  });

  adminSocket.on('connect', () => {
    console.log('✅ Admin connected successfully');
    console.log('🏠 Joining session room:', TEST_SESSION_ID);
    adminSocket.emit('join_session', TEST_SESSION_ID);
  });

  adminSocket.on('connect_error', (error) => {
    console.log('❌ Admin connection failed:', error.message);
  });

  // ============ Test 2: Listen for Session Updates ============
  adminSocket.on('session_status_update', (data) => {
    console.log('📨 Received session update:', {
      sessionId: data.sessionId,
      status: data.status,
      timestamp: data.timestamp,
      updatedBy: data.updatedBy
    });
  });

  adminSocket.on('user_joined_session', (data) => {
    console.log('👤 User joined session:', data.userEmail);
  });

  adminSocket.on('user_left_session', (data) => {
    console.log('👋 User left session:', data.userEmail);
  });

  // ============ Test 3: Simulate Session Status Changes ============
  setTimeout(() => {
    console.log('\n🚀 Test 3: Simulating session status changes...');
    
    // Test session start
    testSessionStatusUpdate('in_progress', 'Session started by test');
    
    // Test countdown update after 3 seconds
    setTimeout(() => {
      testCountdownUpdate(1800); // 30 minutes remaining
    }, 3000);
    
    // Test session pause after 6 seconds
    setTimeout(() => {
      testSessionStatusUpdate('paused', 'Test pause');
    }, 6000);
    
    // Test session completion after 9 seconds
    setTimeout(() => {
      testSessionStatusUpdate('completed', 'Test completed');
    }, 9000);
    
  }, 2000);

  // ============ Helper Functions ============
  function testSessionStatusUpdate(status, reason) {
    console.log(`🔄 Emitting status update: ${status}`);
    
    // This simulates what your backend would do
    adminSocket.emit('test_session_update', {
      sessionId: TEST_SESSION_ID,
      status: status,
      reason: reason,
      timestamp: new Date(),
      updatedBy: 'Test Admin'
    });
  }

  function testCountdownUpdate(remainingSeconds) {
    console.log(`⏱️  Emitting countdown update: ${remainingSeconds}s`);
    
    adminSocket.emit('test_countdown_update', {
      sessionId: TEST_SESSION_ID,
      type: 'countdown_update',
      remainingSeconds: remainingSeconds,
      remainingMinutes: Math.ceil(remainingSeconds / 60)
    });
  }

  // ============ Test 4: Multi-User Scenario ============
  setTimeout(() => {
    console.log('\n👥 Test 4: Testing multi-user scenario...');
    createSecondUser();
  }, 12000);

  function createSecondUser() {
    const patientSocket = io(SERVER_URL, {
      auth: { token: ADMIN_TOKEN }, // Using same token for test
      transports: ['websocket']
    });

    patientSocket.on('connect', () => {
      console.log('✅ Second user (patient) connected');
      patientSocket.emit('join_session', TEST_SESSION_ID);
      
      // Test participant updates
      setTimeout(() => {
        console.log('👋 Second user leaving session...');
        patientSocket.emit('leave_session', TEST_SESSION_ID);
        patientSocket.disconnect();
      }, 3000);
    });

    patientSocket.on('session_status_update', (data) => {
      console.log('📨 Patient received update:', data.status);
    });
  }

  // ============ Test 5: Error Handling ============
  setTimeout(() => {
    console.log('\n❌ Test 5: Testing error scenarios...');
    
    // Test invalid session ID
    adminSocket.emit('join_session', 'invalid-session-id');
    
    // Test without authentication
    const unauthSocket = io(SERVER_URL);
    unauthSocket.on('connect_error', (error) => {
      console.log('✅ Correctly rejected unauthenticated connection:', error.message);
    });
    
  }, 15000);

  // ============ Cleanup ============
  setTimeout(() => {
    console.log('\n🧹 Cleaning up test connections...');
    adminSocket.disconnect();
    console.log('✅ Test completed successfully!');
    process.exit(0);
  }, 20000);
}

// Run the test
testRealtimeTracking().catch(console.error);
