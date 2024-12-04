import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

interface SessionData {
  condition?: string;
  thresholdType?: string;
  threshold?: number;
  completed?: boolean;
  participantCount?: number;
}

export function useSocketManager(initialSessionId: string | null) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const joinAttempts = useRef(0);

  const connectSocket = (sessionId: string) => {
    if (socketRef.current) {
      console.log('Socket already exists, disconnecting...');
      socketRef.current.disconnect();
    }

    console.log(`Connecting to socket with sessionId: ${sessionId}`);
    socketRef.current = io(SOCKET_URL, {
      query: { sessionId },
      transports: ['websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current.on('connect', () => {
      console.log(`Connected to session: ${sessionId}`);
      setLoading(false);
      joinAttempts.current = 0;
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Failed to connect to the server. Please try again.');
      setLoading(false);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, you need to reconnect manually
        connectSocket(sessionId);
      }
    });

    // ... (other event listeners)
  };

  useEffect(() => {
    if (initialSessionId) {
      connectSocket(initialSessionId);
    } else {
      setLoading(false);
    }

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
      }
    };
  }, [initialSessionId]);

  const createSession = (sessionDetails: any) => {
    setLoading(true);
    setError('');
    
    if (!socketRef.current) {
      connectSocket('create'); // Use a placeholder sessionId for creation
    }

    socketRef.current!.emit('createSession', sessionDetails, (response: any) => {
      if (response.success) {
        navigate(`/sessions/${response.sessionId}`);
      } else {
        setError('Failed to create session. Please try again.');
      }
      setLoading(false);
    });
  };

  const joinSession = (sessionId: string, guestId: string) => {
    if (joinAttempts.current >= 3) {
      console.log('Max join attempts reached');
      setError('Failed to join session after multiple attempts. Please refresh and try again.');
      return;
    }

    joinAttempts.current++;
    console.log(`Attempting to join session: ${sessionId}, attempt: ${joinAttempts.current}`);

    if (!socketRef.current || !socketRef.current.connected) {
      console.log('Socket not connected, reconnecting...');
      connectSocket(sessionId);
    }

    socketRef.current!.emit('joinSession', { sessionId, guestId }, (response: any) => {
      if (response.success) {
        console.log('Join session successful:', response);
        setSessionData(response);
        navigate(`/sessions/${sessionId}`);
      } else {
        console.error('Failed to join session:', response.error);
        setError('Failed to join session. Please try again.');
      }
      setLoading(false);
    });
  };

  const emitAction = async (action: string, data: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (socketRef.current) {
        socketRef.current.emit(action, data, (response: any) => {
          if (response.success) {
            resolve();
          } else {
            setError(response.error || 'An error occurred');
            reject(new Error(response.error || 'An error occurred'));
          }
        });
      } else {
        const errorMsg = 'Not connected to a session.';
        setError(errorMsg);
        reject(new Error(errorMsg));
      }
    });
  };

  return { sessionData, error, loading, createSession, joinSession, emitAction };
}