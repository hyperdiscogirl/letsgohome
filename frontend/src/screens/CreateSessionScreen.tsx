import { useState } from "react"
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function CreateSession() {
    const [condition, setCondition] = useState('')
    const [thresholdType, setThresholdType] = useState('Percentage')
    const [threshold, setThreshold] = useState('100')
    const [_, setSessionId] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate();

    const createSession = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log({ condition, thresholdType, threshold });

        const guestId = uuidv4();

        try {
            const response = await fetch(`${API_BASE_URL}/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    guestId,
                    condition,
                    thresholdType,
                    threshold: parseInt(threshold),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const data = await response.json();
            setSessionId(data.sessionId);

            localStorage.setItem('guestId', guestId);
            navigate(`/sessions/${data.sessionId}`);
    
        } catch (error) {
            console.error('Error creating session:', error);
            setError('Oops! There was an issue creating this session. Please try again.');
            
        }
    }

    return (
        
        <div className="flex flex-col justify-center items-center bg-[#fff9e6] h-screen">
            <form className="flex flex-col gap-10 items-start" onSubmit={createSession}>
                <div className="text-5xl text-green-700 flex self-center">Create a session</div>

                <div className="flex gap-10"> 
                    <div className="text-3xl"> Condition </div>
                    <span> Let's <input 
                                    className="border-2 border-gray-300 rounded-lg p-2" 
                                    type="text" placeholder="go home!" 
                                    onChange={(e) => setCondition(e.target.value)} /> </span>
                </div> 

                <div className="flex gap-10">
                    <div className="text-3xl"> Threshold</div> 
                    <div> 
                        <select 
                            className="border-2 border-gray-300 rounded-lg p-2" 
                            onChange={(e) => setThresholdType(e.target.value)}
                        > 
                            <option>Percentage</option>
                            <option>N - x</option>
                            <option>Total</option>            
                        </select>
                        <input 
                            className="border-2 border-gray-300 rounded-lg p-2" 
                            type="number" 
                            placeholder="Enter number" 
                            onChange={(e) => setThreshold(e.target.value)}
                        /> 
                    </div>
                </div>
                <button 
                    type="submit" 
                    className="rounded-lg bg-green-600 text-4xl text-white px-4 py-2 self-center relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                    <span className="relative z-10">Create</span>
                </button>
                {error && <div className="text-red-700 text-xl">{error}</div>}
            </form>
        </div>
    );
}

export default CreateSession