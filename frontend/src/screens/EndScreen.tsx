import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useSocketManager } from '../useSocketService';

function EndScreen() {
    const { sessionId } = useParams();
    const { sessionData, loading, error } = useSocketManager(sessionId || null);
    const navigate = useNavigate();

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }


    return (
        <div className="flex flex-col justify-center items-center text-4xl h-screen bg-[#fff9e6] gap-10">
            {!loading && <div>TIME TO {sessionData?.condition || ''}!! </div>}
            <div className="text-9xl animate-vibrate">⏰</div>
            <button 
              onClick={() => navigate("/")} 
              className="text-3xl rounded-xl px-4 py-2 bg-green-500 text-white relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <span className="relative z-10">New session</span>
              <span className="absolute inset-0 bg-white opacity-20 transform rotate-12 translate-x-full transition-transform duration-300 ease-out group-hover:translate-x-0"></span>
            </button>
            <p className="text-[20px]"> Made with ♥️ by <a href="https://hyperdiscogirl.netlify.app" target="_blank" rel="noopener noreferrer">Disco</a> </p>
        </div>
    );
}

export default EndScreen;