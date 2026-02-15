import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TrianglePainter from './pages/TrianglePainter';
import './index.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<TrianglePainter />} />
    </Routes>
  );
}

export default App;
