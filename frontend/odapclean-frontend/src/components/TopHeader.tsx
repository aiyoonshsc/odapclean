import React from 'react';
import { Camera, X, Zap, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopHeaderProps {
  onCameraClick?: () => void;
  onCloseClick?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ onCameraClick, onCloseClick }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 16px',
      background: 'white',
      borderBottom: '1px solid #eee',
      height: '50px',
      boxSizing: 'border-box',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <X size={24} color="#333" onClick={onCloseClick} style={{ cursor: 'pointer' }} />
        <Camera size={24} color="#333" onClick={onCameraClick} style={{ cursor: 'pointer' }} />
      </div>
      
      <div style={{ 
        position: 'absolute', 
        left: '50%', 
        transform: 'translateX(-50%)' 
      }}>
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ 
            backgroundColor: '#333', 
            color: 'white', 
            borderRadius: '50%', 
            width: '16px', 
            height: '16px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            fontSize: '10px' 
          }}>P</span>
          업그레이드
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <BookOpen size={24} color="#FF6B00" onClick={() => navigate('/sessions')} style={{ cursor: 'pointer' }} />
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: '#f0f0f0', 
          padding: '4px 8px', 
          borderRadius: '12px',
          gap: '4px'
        }}>
          <Zap size={14} fill="#ff4d4f" color="#ff4d4f" />
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#333' }}>10</span>
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
