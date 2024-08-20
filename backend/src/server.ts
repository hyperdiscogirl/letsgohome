import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const app = express();

const serviceAccount = require("./../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://letsgohome-e9509-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.use(cors());
app.use(express.json());

app.post('/sessions', async (req, res) => {
  const { guestId, condition, threshold, thresholdType } = req.body;
  const sessionId = uuidv4();
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

app.post('/sessions/:sessionId/join', async (req, res) => {
  const { sessionId } = req.params;
  const { guestId } = req.body;
  const sessionRef = db.ref(`sessions/${sessionId}`);

  try {
    const snapshot = await sessionRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await sessionRef.child('participants').child(guestId).set({
      clicked: false,
      joinedAt: admin.database.ServerValue.TIMESTAMP
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

app.post('/sessions/:sessionId/click', async (req, res) => {
  const { sessionId } = req.params;
  const { guestId } = req.body;
  const sessionRef = db.ref(`sessions/${sessionId}`);

  try {
    const snapshot = await sessionRef.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = snapshot.val();

    await sessionRef.child(`participants/${guestId}/clicked`).set(true);

    // Check if the threshold has been reached
    const participantsSnapshot = await sessionRef.child('participants').once('value');
    const clickedCount = Object.values(participantsSnapshot.val()).filter(p => p.clicked).length;

    if (clickedCount >= sessionData.threshold) {
      await sessionRef.child('completed').set(true);
      console.log(`Threshold reached! Condition: ${sessionData.condition}`);
    }

    res.json({ success: true, completed: clickedCount >= sessionData.threshold });
  } catch (error) {
    console.error('Error recording click:', error);
    res.status(500).json({ error: 'Failed to record click' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});