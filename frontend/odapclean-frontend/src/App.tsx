import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MainPage from './pages/MainPage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import FolderPage from './pages/FolderPage';
import CurriculumPage from './pages/CurriculumPage';
import DashboardPage from './pages/DashboardPage';
import StatisticsPage from './pages/StatisticsPage';
import SolveIndexPage from './pages/SolveIndexPage';
import SolvePage from './pages/SolvePage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/sessions" element={<SolveIndexPage />} />
              <Route path="/problems" element={<MainPage />} />
              <Route path="/folders" element={<FolderPage />} />
              <Route path="/curriculums" element={<CurriculumPage />} />
              <Route path="/problem/:problemId" element={<ProblemDetailPage />} />
            </Route>
            {/* SolvePage independent of Layout for focus mode */}
            <Route path="/solve/:problemId" element={<SolvePage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
