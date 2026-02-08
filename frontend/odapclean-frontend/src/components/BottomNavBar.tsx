import React from 'react';
import { Menu, Home, BookOpen, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavBarProps {
  onMenuClick: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const itemStyle = (active: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '8px 0',
    color: active ? '#007bff' : '#999',
    cursor: 'pointer',
    fontSize: '0.75rem',
    gap: '4px'
  });

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '60px',
      backgroundColor: 'white',
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom)', // Support safe area
      boxShadow: '0 -1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={itemStyle(false)} onClick={onMenuClick}>
        <Menu size={24} />
        <span>메뉴</span>
      </div>
      <div style={itemStyle(isActive('/'))} onClick={() => navigate('/')}>
        <Home size={24} />
        <span>홈</span>
      </div>
      <div style={itemStyle(isActive('/problems'))} onClick={() => navigate('/problems')}>
        <BookOpen size={24} />
        <span>문제</span>
      </div>
      <div style={itemStyle(isActive('/mypage'))} onClick={() => navigate('/mypage')}>
        <User size={24} />
        <span>마이</span>
      </div>
    </div>
  );
};

export default BottomNavBar;
