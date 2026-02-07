import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MainPage from './pages/MainPage';
import SolvePage from './pages/SolvePage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/solve/:problemId" element={<SolvePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
