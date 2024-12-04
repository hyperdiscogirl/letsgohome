import React, { useState, useEffect } from 'react';
import { useParams} from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useSocketManager } from '../useSocketService';

function JoinSession() {
  const [sessionId, setSessionId] = useState('');
  const { error, joinSession } = useSocketManager(sessionId);
  const params = useParams<{ sessionId?: string }>();

  useEffect(() => {
    if (params.sessionId) {
      setSessionId(params.sessionId);
      handleJoin(params.sessionId);
    }
  }, [params.sessionId]);

  const handleJoin = (sessionIdToJoin: string) => {
    const guestId = localStorage.getItem('guestId') || uuidv4();
    localStorage.setItem('guestId', guestId);
    joinSession(sessionIdToJoin, guestId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId) {
      handleJoin(sessionId);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center bg-[#fff9e6] h-screen">
      <h1 className="text-3xl mb-6">Join a Session</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Enter session ID"
          className="border-2 border-gray-300 rounded-lg p-2 w-64"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-lg w-64 shadow-lg backdrop-filter backdrop-blur-sm border border-blue-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
        >
          Join Session
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

export default JoinSession;