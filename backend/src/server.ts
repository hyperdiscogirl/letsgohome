import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import cors from 'cors';
import fs from 'fs';

console.log('Starting server initialization...');

const app = express();
const server = http.createServer(app);

console.log('Express app and HTTP server created');

// CORS configuration
const allowedOrigins = ['http://localhost:5173', 'https://letsgohome-delta.vercel.app'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

console.log('CORS configuration applied');

const io = new SocketIOServer(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
}); 

console.log('Socket.IO server initialized');

// Firebase setup
let serviceAccount: admin.ServiceAccount;

console.log('Current working directory:', process.cwd());

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.log('Using Firebase service account from environment variable');
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} else {
  console.log('Attempting to load Firebase service account from file');
  serviceAccount = require('./../serviceAccountKey.json');
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://letsgohome-e9509-default-rtdb.firebaseio.com"
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  process.exit(1);
}

const db = admin.database();
console.log('Firebase database reference created');

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('New Socket.IO connection established');
    let currentSessionId: string | null = null;

    socket.on('joinSession', async (data, callback) => {
        console.log('Received joinSession event:', data);
        const { sessionId, guestId } = data;

        if (currentSessionId === sessionId) {
            console.log(`User ${guestId} already in session ${sessionId}`);
            callback({
                success: true,
                message: 'Already joined this session'
            });
            return;
        }

        const sessionRef = db.ref(`sessions/${sessionId}`);

        try {
            const snapshot = await sessionRef.once('value');
            if (!snapshot.exists()) {
                console.log(`Session not found: ${sessionId}`);
                callback({ success: false, error: 'Session not found' });
                return;
            }

            const sessionData = snapshot.val();

            // Check if the user is already in the session
            if (sessionData.participants && sessionData.participants[guestId]) {
                console.log(`User ${guestId} rejoining session ${sessionId}`);
            } else {
                await sessionRef.child('participants').child(guestId).set({
                    clicked: false,
                    joinedAt: admin.database.ServerValue.TIMESTAMP
                });
            }

            if (currentSessionId && currentSessionId !== sessionId) {
                socket.leave(currentSessionId);
            }
            socket.join(sessionId);
            currentSessionId = sessionId;

            const participantCount = Object.keys(sessionData.participants || {}).length;

            console.log(`User ${guestId} joined session ${sessionId}`);
            callback({
                success: true,
                condition: sessionData.condition,
                threshold: sessionData.threshold,
                thresholdType: sessionData.thresholdType,
                participantCount: participantCount
            });

            io.to(sessionId).emit('participantUpdate', { participantCount });
        } catch (error) {
            console.error('Error joining session:', error);
            callback({ success: false, error: 'Failed to join session' });
        }
    });

    socket.on('createSession', async (data, callback) => {
        console.log('Received createSession event:', data);
        const { guestId, condition, threshold, thresholdType } = data;
        const sessionId = uuidv4().substring(0, 8);
        const sessionRef = db.ref(`sessions/${sessionId}`);

        try {
          await sessionRef.set({
            createdAt: admin.database.ServerValue.TIMESTAMP,
            participants: {
              [guestId]: {
                clicked: false,
                joinedAt: admin.database.ServerValue.TIMESTAMP
              }
            },
            condition: condition || "go home",
            thresholdType: thresholdType || "percentage",
            threshold: threshold || 2,
            completed: false
          });

          console.log(`Session created: ${sessionId}`);
          callback({ success: true, sessionId });
        } catch (error) {
          console.error('Error creating session:', error);
          callback({ success: false, error: 'Failed to create session' });
        }
    });   

    socket.on('click', async (data, callback) => {
      console.log('Received click event:', data);
      const { sessionId, guestId } = data;
      const sessionRef = db.ref(`sessions/${sessionId}`);
  
      try {
        const result = await sessionRef.transaction((session) => {
          if (session === null) return null;
  
          if (!session.participants[guestId]) {
            session.participants[guestId] = { clicked: false, joinedAt: admin.database.ServerValue.TIMESTAMP };
          }
  
          session.participants[guestId].clicked = true;
  
          const totalParticipants = Object.keys(session.participants).length;
          const clickedCount = Object.values(session.participants as Record<string, { clicked: boolean }>).filter(p => p.clicked).length;
  
          let thresholdReached = false;
          switch (session.thresholdType.toLowerCase()) {
            case 'percentage':
              const clickedPercentage = (clickedCount / totalParticipants) * 100;
              thresholdReached = clickedPercentage >= session.threshold;
              break;
            case 'n-x':
              thresholdReached = clickedCount >= (totalParticipants - session.threshold);
              break;
            case 'total':
              thresholdReached = clickedCount >= session.threshold;
              break;
          }
  
          if (thresholdReached && !session.completed) {
            session.completed = true;
          }
  
          return session;
        });
  
        if (result.committed) {
          const updatedSession = result.snapshot.val();
          console.log(`Click recorded for user ${guestId} in session ${sessionId}`);
          
          const updateData = {
            success: true, 
            completed: updatedSession.completed,
            clickedCount: Object.values(updatedSession.participants as Record<string, { clicked: boolean }>).filter(p => p.clicked).length,
            totalParticipants: Object.keys(updatedSession.participants).length
          };

          // Emit sessionUpdate to all clients in the room
          io.to(sessionId).emit('sessionUpdate', updateData);

          if (updatedSession.completed) {
            console.log(`Session ${sessionId} completed`);
            // Emit sessionComplete to all clients in the room
            io.to(sessionId).emit('sessionComplete');
          }

          // Send the response back to the client who clicked
          callback(updateData);
        } else {
          console.log(`Failed to record click for user ${guestId} in session ${sessionId}`);
          callback({ success: false, error: 'Failed to record click' });
        }
      } catch (error) {
        console.error('Error recording click:', error);
        callback({ success: false, error: 'Failed to record click' });
      }
    });

    socket.on('unclick', async (data, callback) => {
        console.log('Received unclick event:', data);
        const { sessionId, guestId } = data;
        const sessionRef = db.ref(`sessions/${sessionId}`);

        try {
          await sessionRef.child(`participants/${guestId}/clicked`).set(false);
          console.log(`Unclick recorded for user ${guestId} in session ${sessionId}`);
          callback({ success: true });

          const snapshot = await sessionRef.once('value');
          const sessionData = snapshot.val();

          io.to(sessionId).emit('sessionUpdate', {
            clickedCount: Object.values(sessionData.participants as Record<string, { clicked: boolean }>).filter(p => p.clicked).length,
            totalParticipants: Object.keys(sessionData.participants).length,
            completed: sessionData.completed
          });
        } catch (error) {
          console.error('Error recording unclick:', error);
          callback({ success: false, error: 'Failed to record unclick' });
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket.IO connection closed');
    });
});

// Serve static files from the React app
const staticPath = path.join(__dirname, 'client/build');
console.log('Static file path:', staticPath);
app.use(express.static(staticPath));

// The "catchall" handler
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'client/build', 'index.html');
    console.log('Serving index.html from:', indexPath);
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error('index.html not found at:', indexPath);
        res.status(404).send('Not found');
    }
});

// route to handle session data requests that dont need a socket connection
app.get('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const sessionRef = db.ref(`sessions/${sessionId}`);

  try {
    const snapshot = await sessionRef.once('value');
    if (snapshot.exists()) {
      const sessionData = snapshot.val();
      res.json({
        condition: sessionData.condition,
        thresholdType: sessionData.thresholdType,
        threshold: sessionData.threshold,
        completed: sessionData.completed,
        participantCount: Object.keys(sessionData.participants).length,
        clickedCount: Object.values(sessionData.participants as Record<string, { clicked: boolean }>).filter(p => p.clicked).length
      });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    console.error('Error fetching session data:', error);
    res.status(500).json({ error: 'Failed to fetch session data' });
  }
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Server initialization complete');
});

// Global error handler
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});