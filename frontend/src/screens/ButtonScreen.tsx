import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Link, X, LucideUndo } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface SessionData {
  condition?: string;
  thresholdType?: string;
  threshold?: number;
  completed?: boolean;
}

function ShareModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [copiedMessage, setCopiedMessage] = useState('');

  const showCopiedMessage = (message: string) => {
    setCopiedMessage(message);
    setTimeout(() => setCopiedMessage(''), 2000);
  };

  const copySessionLink = () => {
    const link = `${window.location.origin}/join/${sessionId}`;
    navigator.clipboard.writeText(link);
    showCopiedMessage('Link copied!');
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    showCopiedMessage('ID copied!');
  };

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-4 rounded-lg shadow-lg w-64">
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-4 h-4 bg-white"></div>
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <p>{sessionId}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm">Copy session ID</p>
          <button onClick={copySessionId} className="text-blue-500 hover:text-blue-700">
            <Copy size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm">Copy session link</p>
          <button onClick={copySessionLink} className="text-blue-500 hover:text-blue-700">
            <Copy size={18} />
          </button>
        </div>
        {copiedMessage && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white px-2 py-1 rounded text-sm">
            {copiedMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function Button() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [clicked, setClicked] = useState(() => {
    // Initialize clicked state from local storage
    const storedClickState = localStorage.getItem(`clicked_${sessionId}`);
    return storedClickState === 'true';
  });
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  const joinSession = async () => {
    try {
      const guestId = localStorage.getItem('guestId');
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

      const data = await response.json();
      setSessionData(data);
      console.log('Joined session:', data);
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Failed to join session. Please try again.');
    }
  };

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch session data');
      }
      const data = await response.json();
      setSessionData(data);
      
      // Check if the session is completed and navigate to the end screen
      if (data.completed) {
        navigate(`/end/${sessionId}`);
      }
    } catch (err) {
      console.error('Error fetching session data:', err);
      setError('Failed to fetch session data. Please refresh the page.');
    }
  };

  const handleClick = async () => {
    if (clicked) return;

    try {
      const guestId = localStorage.getItem('guestId');
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestId }),
      });

      if (!response.ok) {
        console.error('Error recording click:', error)
        throw new Error('Failed to record click')
      }

      setClicked(true);
      const data = await response.json();
      localStorage.setItem(`clicked_${sessionId}`, 'true');

      if (data.completed) {
        // Handle session completion (navigate to a results page)
        navigate(`/end/${sessionId}`);
      }
    } catch (err) {
      console.error('Error recording click:', err);
      setError('Failed to record click. Please try again.');
    }
  };

  const handleUnclick = async () => {
    try {
      const guestId = localStorage.getItem('guestId');
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/unclick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestId }),
      }); 

      if (!response.ok) {
        console.error('Error recording unclick:', error)
        throw new Error('Failed to record unclick')
      }

      setClicked(false);
      localStorage.setItem(`clicked_${sessionId}`, 'false');


    } catch (err) {
      console.error('Error recording unclick:', err);
      setError('Failed to record unclick. Please try again.');
    }
  };

  useEffect(() => {
    const joinAndFetchData = async () => {
      await joinSession();
      await fetchSessionData();
    };
  
    joinAndFetchData();
  
    const intervalId = setInterval(fetchSessionData, 5000); // Poll every 5 seconds
  
    return () => clearInterval(intervalId);
  }, [sessionId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !(modalRef.current as any).contains(event.target)) {
        setShowModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#fff9e6] gap-4">
      <div className="text-5xl"> Let's {sessionData?.condition || ''}!</div>
      <button 
        className={`${clicked ? 'bg-red-300' : 'bg-red-500'} border-outset border-red-500 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition duration-300 hover:scale-105 active:scale-95 border-2 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50 w-72 h-72 flex items-center justify-center`}
        onClick={handleClick} >
      </button>
      {clicked && (
        <div className="flex flex-col gap-4 items-center">
          <div> You've clicked! </div>
          <div> Waiting on the rest of your group to be ready... </div>
          <button onClick={handleUnclick}> <LucideUndo /> </button>
        </div>
      )}
      <div className="relative">
        <button onClick={() => setShowModal(!showModal)} className="flex gap-2">
          Share session <Link />
        </button>
        {showModal && (
          <div ref={modalRef}>
            <ShareModal sessionId={sessionId!} onClose={() => setShowModal(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Button;