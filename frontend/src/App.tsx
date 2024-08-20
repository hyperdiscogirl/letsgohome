import { useState } from 'react'
import './index.css'
import CreateSession from './components/CreateSession'  
import JoinSession from './components/JoinSession'

const API_BASE_URL = 'http://localhost:3000'; // Update this to your server's URL


function App() {
  const [createOrJoin, setCreateOrJoin] = useState<'create' | 'join' | null>(null)

  return (
    <>
      <div className="flex flex-col justify-center items-center text-2xl text-center w-full h-screen gap-4">
        {createOrJoin === null && (
        <>
          <div className="text-3xl">Let's go home!</div>
          <div className="flex flex-col justify-center items-center gap-4">
              <button 
                  className="bg-green-500 text-white p-2 rounded-lg w-48 shadow-lg backdrop-filter backdrop-blur-sm  border border-green-200 transition-all duration-300 hover:shadow-xl hover:scale-105" 
                  onClick={() => setCreateOrJoin('create')}
              >
                  Create session
              </button>
              <button 
                  className="bg-blue-500 text-white p-2 rounded-lg w-48 shadow-lg backdrop-filter backdrop-blur-sm  border border-blue-200 transition-all duration-300 hover:shadow-xl hover:scale-105" 
                  onClick={() => setCreateOrJoin('join')}
              >
                  Join session
              </button>
          </div> 
        </>)}
        {createOrJoin === 'create' && <CreateSession />}
        {createOrJoin === 'join' && <JoinSession />}
      </div>
    </>
  )
}

export default App
