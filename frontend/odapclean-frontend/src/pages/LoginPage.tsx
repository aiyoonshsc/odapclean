import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [rememberId, setRememberId] = useState(false);
    const [rememberPassword, setRememberPassword] = useState(false);

    React.useEffect(() => {
        const savedUsername = localStorage.getItem('savedUsername');
        const savedPassword = localStorage.getItem('savedPassword');
        
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberId(true);
        }
        if (savedPassword) {
            setPassword(savedPassword);
            setRememberPassword(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                if (rememberId) {
                    localStorage.setItem('savedUsername', username);
                } else {
                    localStorage.removeItem('savedUsername');
                }

                if (rememberPassword) {
                    localStorage.setItem('savedPassword', password);
                } else {
                    localStorage.removeItem('savedPassword');
                }

                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                await login(formData);
                navigate('/');
            } else {
                await register({ username, password, email });
                setIsLogin(true);
                alert('회원가입이 완료되었습니다! 로그인해주세요.');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || '오류가 발생했습니다.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div style={{ height: '60px', overflow: 'hidden', margin: '0 auto 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img src="/logo.svg" alt="OdapClean" style={{ height: '100%', objectFit: 'contain', transform: 'scale(1.4)' }} />
                </div>
                <h2>{isLogin ? '로그인' : '회원가입'}</h2>
                {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>아이디</label>
                        <input 
                            type="text" 
                            name="username"
                            autoComplete="username"
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    </div>
                    {!isLogin && (
                        <div className="form-group">
                            <label>이메일</label>
                            <input 
                                type="email" 
                                name="email"
                                autoComplete="email"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>비밀번호</label>
                        <input 
                            type="password" 
                            name="password"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    {isLogin && (
                        <div className="checkbox-container">
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="rememberId"
                                    checked={rememberId}
                                    onChange={(e) => setRememberId(e.target.checked)}
                                />
                                <label htmlFor="rememberId">아이디 저장</label>
                            </div>
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="rememberPassword"
                                    checked={rememberPassword}
                                    onChange={(e) => setRememberPassword(e.target.checked)}
                                />
                                <label htmlFor="rememberPassword">비밀번호 저장</label>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn-primary">
                        {isLogin ? '로그인' : '가입하기'}
                    </button>
                </form>

                <div className="auth-switch">
                    {isLogin ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
                    <button 
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                    >
                        {isLogin ? '회원가입' : '로그인'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
