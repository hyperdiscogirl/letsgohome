import { useNavigate } from 'react-router-dom';
import './../index.css';

function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-center items-center text-2xl text-center w-full h-screen gap-4">
      <div className="text-3xl">Let's go home!</div>
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
      </div>
    </div>
  );
}

export default HomeScreen;
