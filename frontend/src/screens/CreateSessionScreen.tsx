import { useState } from "react"
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { CircleHelp } from "lucide-react";
import { Tooltip } from 'react-tooltip';

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
        
        <div className="flex flex-col justify-center items-center bg-[#fff9e6] h-screen p-10">
            <form className="flex flex-col gap-10 items-center" onSubmit={createSession}>
                <div className="text-4xl text-green-700 text-center">Create Session</div>

                <div className="flex flex-col items-center gap-4">
                    <div className="text-3xl flex items-center">
                        Condition 
                        <CircleHelp 
                            className="ml-2 cursor-help" 
                            data-tooltip-id="condition-tooltip" 
                            data-tooltip-content="The condition is what we're agreeing to do when everyone clicks the button! E.g. 'go home', 'end this meeting', 'beat up Dave'"
                        />
                    </div>
                    <div className="flex items-center">
                        <span className="mr-2">Let's</span>
                        <input 
                            className="border-2 border-gray-300 rounded-lg p-2 text-center" 
                            type="text" 
                            placeholder="go home!" 
                            onChange={(e) => setCondition(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="text-3xl flex items-center">
                        Threshold 
                        <CircleHelp 
                            className="ml-2 cursor-help" 
                            data-tooltip-id="threshold-tooltip" 
                            data-tooltip-content="The threshold determines how many participants have to click before the session ends. It can be a percentage, N - x (where x is the number subtracted from the total participants), or a total number needed. Default is 100%."
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            className="border-2 border-gray-300 rounded-lg p-2 text-center" 
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
                    className="rounded-lg bg-green-600 text-4xl text-white px-4 py-2 relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                    <span className="relative z-10">Create</span>
                </button>
                {error && <div className="text-red-700 text-xl">{error}</div>}
            </form>
            <Tooltip id="condition-tooltip" style={{ maxWidth: '90vw', wordWrap: 'break-word' }} />
            <Tooltip id="threshold-tooltip" style={{ maxWidth: '90vw', wordWrap: 'break-word' }} />
        </div>
    );
}

export default CreateSession