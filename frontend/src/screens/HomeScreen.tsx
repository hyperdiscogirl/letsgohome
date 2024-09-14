import { useNavigate } from 'react-router-dom';
import './../index.css';
import { CircleHelp } from "lucide-react";
import { Tooltip } from 'react-tooltip';

function HomeScreen() {
  const navigate = useNavigate();

  const tooltipContent = `
    <div>
      <p style="font-size: 24px;">What's this?</p>
      <p>A simple app that allows you to coordinate non-verbally and semi-anonymously with your friends. You choose a goal or action, and each person can click the button when they're ready to do it. Then the app will notify everyone when you've all clicked!</p>
    </div>
  `;

  return (
    <div className="flex flex-col justify-center items-center text-2xl text-center bg-[#fff9e6] w-full h-screen gap-4">
      <div className="text-3xl">Let's Go Home!</div>
      <div className="flex flex-col justify-center items-center gap-4">
        <button 
          className="bg-green-500 text-white p-2 rounded-lg w-48 shadow-lg backdrop-filter backdrop-blur-sm border border-green-200 transition-all duration-300 hover:shadow-xl hover:scale-105" 
          onClick={() => navigate('/create')}
        >
          Create session
        </button>
        <button 
          className="bg-blue-500 text-white p-2 rounded-lg w-48 shadow-lg backdrop-filter backdrop-blur-sm border border-blue-200 transition-all duration-300 hover:shadow-xl hover:scale-105" 
          onClick={() => navigate('/join')}
        >
          Join session
        </button>
        <CircleHelp 
          size="30"
          className="ml-2 cursor-pointer"
          data-tooltip-id="home-tooltip" 
          data-tooltip-html={tooltipContent}
        />
      </div>
      <Tooltip 
        id="home-tooltip" 
        place="bottom"
        style={{ 
          maxWidth: '90vw', 
          wordWrap: 'break-word',
          fontSize: '20px',
          zIndex: 1000
        }}
      />
    </div>
  );
}

export default HomeScreen;
