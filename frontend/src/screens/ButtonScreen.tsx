import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Link, X, LucideUndo } from 'lucide-react';
import ButtonRed  from '../../Button-Red.svg';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface SessionData {
  condition?: string;
  thresholdType?: string;
  threshold?: number;
  completed?: boolean;
  participantCount?: number;
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

function LoadingDots() {
  return (
    <div className="flex space-x-2">
      <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce"></div>
      <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
      setLoading(false);
      
      // Check if the session is completed and navigate to the end screen
      if (data.completed) {
        navigate(`/end/${sessionId}`);
      }
    } catch (err) {
      console.error('Error fetching session data:', err);
      setError('Failed to fetch session data. Please refresh the page.');
      setLoading(false);
    }
  };

  const handleClick = async () => {
    if (clicked) return;

    if (sessionData?.participantCount === 1) {
      setShowConfirmation(true);
      return;
    }

    await recordClick();
  };

  const recordClick = async () => {
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
  
    const intervalId = setInterval(fetchSessionData, 2500); // Poll every 2.5 seconds
  
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

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#fff9e6]">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#fff9e6] gap-4">
      <div className="text-5xl mb-10"> Let's {sessionData?.condition || ''}!</div>
      <img 
        src={ButtonRed} 
        alt="Button" 
        className={`w-72 h-72 cursor-pointer transform transition duration-300 ${clicked ? "" : "hover:scale-105 active:scale-95"} ${clicked ? 'filter-red' : ''}`}
        onClick={handleClick} 
      />
      {clicked && (
        <div className="flex flex-col gap-4 items-center">
          <div> You've clicked! </div>
          <div> Waiting on the rest of your group to be ready... </div>
          <button onClick={handleUnclick}> <LucideUndo /> </button>
        </div>
      )}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-10">
          <div className="bg-white p-6 rounded-lg">
            <p>You're the only one here, so clicking will end the session! Proceed?</p>
            <div className="flex justify-end mt-4">
              <button 
                className="mr-2 px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-red-500 text-white rounded hover:animate-pulse"
                onClick={() => {
                  setShowConfirmation(false);
                  recordClick();
                }}
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="relative flex flex-col gap-4 mt-10">
        <div className="flex self-center"> {sessionData?.participantCount} {sessionData?.participantCount === 1 ? 'person' : 'people'} {sessionData?.participantCount === 1 ? 'is' : 'are'} here! </div>
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