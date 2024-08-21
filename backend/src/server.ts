import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const app = express();


const allowedOrigins = ['http://localhost:5173', 'https://letsgohome-delta.vercel.app'];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));


let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} else {
  // Fallback for local development
  serviceAccount = require('./../serviceAccountKey.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://letsgohome-e9509-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.use(express.json());

app.post('/sessions', async (req, res) => {
  const { guestId, condition, threshold, thresholdType } = req.body;
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
      condition: condition || "go home", // Default condition if not provided
      thresholdType: thresholdType || "percentage", // Default threshold type if not provided
      threshold: threshold || 2, // Default threshold if not provided
      completed: false
    });

    res.json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.get('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const sessionRef = db.ref(`sessions/${sessionId}`);

  try {
    const snapshot = await sessionRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = snapshot.val();

    res.json({
      sessionId: sessionId,
      condition: sessionData.condition,
      threshold: sessionData.threshold,
      thresholdType: sessionData.thresholdType,
      completed: sessionData.completed
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});     

app.post('/sessions/:sessionId/join', async (req, res) => {
  const { sessionId } = req.params;
  const { guestId } = req.body;
  const sessionRef = db.ref(`sessions/${sessionId}`);

  try {
    const snapshot = await sessionRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = snapshot.val();

    await sessionRef.child('participants').child(guestId).set({
      clicked: false,
      joinedAt: admin.database.ServerValue.TIMESTAMP
    });

    res.json({
      success: true,
      condition: sessionData.condition,
      threshold: sessionData.threshold,
      thresholdType: sessionData.thresholdType
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

app.post('/sessions/:sessionId/click', async (req, res) => {
    const { sessionId } = req.params;
    const { guestId } = req.body;
    const sessionRef = db.ref(`sessions/${sessionId}`);
  
    console.log(`Click request received for session ${sessionId}, guest ${guestId}`);
  
    try {
      const result = await sessionRef.transaction((session) => {
        console.log('Transaction started', { sessionId, guestId, currentSession: session });
  
        if (session === null) {
          console.log('Session not found', { sessionId });
          return null;
        }
  
        if (!session.participants[guestId]) {
          console.log('Adding new participant', { sessionId, guestId });
          session.participants[guestId] = { clicked: false, joinedAt: admin.database.ServerValue.TIMESTAMP };
        }
  
        session.participants[guestId].clicked = true;
  
        const totalParticipants = Object.keys(session.participants).length;
        const clickedCount = Object.values(session.participants as Record<string, { clicked: boolean }>).filter(p => p.clicked).length;
  
        console.log('Calculated counts', { sessionId, totalParticipants, clickedCount });
  
        let thresholdReached = false;
        switch (session.thresholdType.toLowerCase()) {
          case 'percentage':
            const clickedPercentage = (clickedCount / totalParticipants) * 100;
            thresholdReached = clickedPercentage >= session.threshold;
            console.log('Percentage threshold check', { 
              sessionId, 
              clickedPercentage, 
              threshold: session.threshold, 
              thresholdReached 
            });
            break;
          case 'n-x':
            // n-x: threshold is reached when clickedCount equals (totalParticipants - threshold)
            thresholdReached = clickedCount >= (totalParticipants - session.threshold);
            console.log('N-X threshold check', { 
              sessionId, 
              clickedCount, 
              totalParticipants,
              threshold: session.threshold, 
              requiredClicks: totalParticipants - session.threshold,
              thresholdReached 
            });
            break;
          case 'total':
            // total: threshold is reached when clickedCount equals or exceeds the threshold
            thresholdReached = clickedCount >= session.threshold;
            console.log('Total threshold check', { 
              sessionId, 
              clickedCount, 
              threshold: session.threshold, 
              thresholdReached 
            });
            break;
          default:
            console.log('Unknown threshold type', { sessionId, thresholdType: session.thresholdType });
            break;
        }
  
        if (thresholdReached && !session.completed) {
          session.completed = true;
          console.log(`Threshold reached! Condition: ${session.condition}`, { sessionId });
        }
  
        return session;
      });
    
      if (result.committed) {
        const updatedSession = result.snapshot.val();
        console.log('Transaction committed', { sessionId, updatedSession });
        res.json({ 
          success: true, 
          completed: updatedSession.completed,
          clickedCount: Object.values(updatedSession.participants as Record<string, { clicked: boolean }>).filter(p => p.clicked).length,
          totalParticipants: Object.keys(updatedSession.participants).length,
          thresholdReached: updatedSession.completed,
          thresholdType: updatedSession.thresholdType,
          threshold: updatedSession.threshold
        });
      } else {
        console.log('Transaction not committed', { sessionId });
        res.status(404).json({ error: 'Session not found or update failed' });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error recording click:', error);
        res.status(500).json({ error: 'Failed to record click', details: error.message });
      } else {
        console.error('Unknown error:', error);
        res.status(500).json({ error: 'Failed to record click', details: 'Unknown error' });
      }
    }
  });

// Debug endpoint to fetch session state
app.get('/debug/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const sessionRef = db.ref(`sessions/${sessionId}`);

  try {
    const snapshot = await sessionRef.once('value');
    if (snapshot.exists()) {
      res.json(snapshot.val());
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    console.error('Error fetching session for debug:', error);
    res.status(500).json({ error: 'Failed to fetch session', details: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/sessions/:sessionId/unclick', async (req, res) => {
  const { sessionId } = req.params;
  const { guestId } = req.body;
  const sessionRef = db.ref(`sessions/${sessionId}`);

  try {
    const snapshot = await sessionRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = snapshot.val();

    await sessionRef.child(`participants/${guestId}/clicked`).set(false);

    res.json({ success: true, sessionData });
  } catch (error) {
    console.error('Error recording unclick:', error);
    res.status(500).json({ error: 'Failed to record unclick' });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});