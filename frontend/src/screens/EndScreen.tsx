import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;


interface SessionData {
    condition?: string;
    thresholdType?: string;
    threshold?: number;
    completed?: boolean;
  }


function EndScreen() {
    const { sessionId } = useParams();
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch session data');
                }
                const data = await response.json();
                // Convert condition to uppercase if it exists
                if (data.condition) {
                    data.condition = data.condition.toUpperCase();
                }
                setSessionData(data);
            } catch (err) {
                console.error('Error fetching session data:', err);
                setError('Failed to fetch session data. Please refresh the page.');
            }
        };

        fetchSessionData();
    }, [sessionId]);

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return(
        <div className="flex flex-col justify-center items-center text-5xl h-screen  bg-[#fff9e6] gap-10">
            <div>TIME TO {sessionData?.condition || ''}</div>
            <div className="text-9xl">⏰</div>
            <button 
              onClick={() => navigate("/")} 
              className="text-3xl rounded-xl px-4 py-2 bg-green-500 text-white relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <span className="relative z-10">New session</span>
              <span className="absolute inset-0 bg-white opacity-20 transform rotate-12 translate-x-full transition-transform duration-300 ease-out group-hover:translate-x-0"></span>
            </button>
              <p className="text-[20px]"> Made with ♥️ by <a href="https://hyperdiscogirl.netlify.app" target="_blank" rel="noopener noreferrer">Disco</a> </p>
        </div>
    )
}

export default EndScreen