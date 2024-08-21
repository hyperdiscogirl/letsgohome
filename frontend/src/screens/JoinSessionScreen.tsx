import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = import.meta.env.VITE_API_URL;


function JoinSession() {
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    // Check if a session ID was provided in the URL
    if (params.sessionId) {
      setSessionId(params.sessionId);
      joinSession(params.sessionId);
    }
  }, [params.sessionId]);

  const joinSession = async (sessionId: string) => {
    setError('');
    const guestId = localStorage.getItem('guestId') || uuidv4();

    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestId }),
      });

      if (!response.ok) {
        throw new Error('Failed to join session');
      }

      localStorage.setItem('guestId', guestId);
      navigate(`/sessions/${sessionId}`);
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Failed to join session. Please check the session ID and try again.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId) {
      joinSession(sessionId);
    } else {
      setError('Please enter a session ID');
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