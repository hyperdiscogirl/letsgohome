import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import CreateSessionScreen from './screens/CreateSessionScreen';
import JoinSessionScreen from './screens/JoinSessionScreen';
import ButtonScreen from './screens/ButtonScreen';
import EndScreen from './screens/EndScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/create" element={<CreateSessionScreen />} />
        <Route path="/join" element={<JoinSessionScreen />} />
        <Route path="/join/:sessionId" element={<JoinSessionScreen />} />
        <Route path="/session/:sessionId" element={<ButtonScreen />} />
        <Route path="/end/:sessionId" element={<EndScreen />} />
      </Routes>
    </Router>
  );
}

export default App;