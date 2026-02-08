import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TopHeader from './TopHeader';
import BottomNavBar from './BottomNavBar';
import { X } from 'lucide-react';

const Navigation: React.FC = () => {
    const { logout } = useAuth();
    const location = useLocation();

    const linkStyle = (path: string) => ({
        display: 'inline-block',
        padding: '10px 15px',
        textDecoration: 'none',
        color: '#333',
        fontWeight: location.pathname === path || location.pathname.startsWith(path + '/') ? 'bold' : 'normal',
        borderBottom: location.pathname === path || location.pathname.startsWith(path + '/') ? '3px solid #007bff' : '3px solid transparent',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap' as const,
    });

    return (
        <nav style={{ 
            width: '100%', 
            background: '#fff', 
            padding: '10px 20px', 
            display: 'flex', 
            flexDirection: 'row', 
            alignItems: 'center', 
            borderBottom: '1px solid #ddd',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            overflowX: 'auto'
        }}>
            <div style={{ height: '40px', overflow: 'hidden', marginRight: '20px', display: 'flex', alignItems: 'center' }}>
                <img src="/logo.svg" alt="OdapClean" style={{ height: '100%', objectFit: 'contain', transform: 'scale(1.4)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
                <Link to="/" style={linkStyle('/')}>Dashboard</Link>
                <Link to="/statistics" style={linkStyle('/statistics')}>Statistics</Link>
                <Link to="/sessions" style={linkStyle('/sessions')}>학습하기</Link>
                <Link to="/problems" style={linkStyle('/problems')}>Problems</Link>
                <Link to="/folders" style={linkStyle('/folders')}>Folders</Link>
                <Link to="/curriculums" style={linkStyle('/curriculums')}>Curriculums</Link>
            </div>
            <div style={{ marginLeft: '10px' }}>
                <button 
                    onClick={logout}
                    style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#FF6B00', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '12px', 
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

const Layout: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleCameraClick = () => {
        navigate('/problems?action=create'); 
        // In a real app, this would trigger the camera modal
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f5f7fa' }}>
            <div className="desktop-nav">
                <Navigation />
            </div>

            <div className="mobile-header">
                <TopHeader 
                    onCameraClick={handleCameraClick}
                    onCloseClick={() => navigate(-1)}
                />
            </div>

            <main className="main-content-layout" style={{ flex: 1, overflowY: 'auto', width: '100%', margin: '0 auto' }}>
                <Outlet />
            </main>

            <div className="mobile-bottom-nav">
                <BottomNavBar onMenuClick={() => setIsMenuOpen(true)} />
            </div>

            {isMenuOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000
                }} onClick={() => setIsMenuOpen(false)}>
                    <div style={{
                        width: '70%', height: '100%', backgroundColor: 'white', padding: '20px',
                        boxSizing: 'border-box', position: 'absolute', left: 0, top: 0,
                        display: 'flex', flexDirection: 'column', gap: '20px',
                        boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ height: '50px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                                <img src="/logo.svg" alt="OdapClean" style={{ height: '100%', objectFit: 'contain', transform: 'scale(1.4)' }} />
                            </div>
                            <X onClick={() => setIsMenuOpen(false)} style={{ cursor: 'pointer' }} />
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#333', fontSize: '1.1rem', padding: '10px 0', borderBottom: '1px solid #eee' }}>대시보드</Link>
                            <Link to="/sessions" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#333', fontSize: '1.1rem', padding: '10px 0', borderBottom: '1px solid #eee' }}>학습하기</Link>
                            <Link to="/problems" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#333', fontSize: '1.1rem', padding: '10px 0', borderBottom: '1px solid #eee' }}>문제 관리</Link>
                            <Link to="/folders" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#333', fontSize: '1.1rem', padding: '10px 0', borderBottom: '1px solid #eee' }}>폴더 관리</Link>
                            <Link to="/curriculums" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#333', fontSize: '1.1rem', padding: '10px 0', borderBottom: '1px solid #eee' }}>커리큘럼</Link>
                            <Link to="/statistics" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: '#333', fontSize: '1.1rem', padding: '10px 0', borderBottom: '1px solid #eee' }}>통계</Link>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                             <button 
                                onClick={() => { logout(); setIsMenuOpen(false); }}
                                style={{ 
                                    width: '100%', padding: '12px', backgroundColor: '#FF6B00', 
                                    color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
