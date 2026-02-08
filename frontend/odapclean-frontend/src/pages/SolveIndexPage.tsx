import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getFolders, getFilteredProblems, getCurriculums, 
  getSessions, createSession, deleteSession, getSessionProblems 
} from '../services/api';
import type { Folder, Curriculum, StudySession } from '../types/definitions';
import './SolveIndexPage.css';

const SolveIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'simple' | 'session'>('simple');
  
  // Common Data
  const [folders, setFolders] = useState<Folder[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  
  // Simple Mode State
  const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>(undefined);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Session Mode State
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionMode, setNewSessionMode] = useState<'all' | 'wrong' | 'not_attempted'>('all');
  const [newSessionCurriculums, setNewSessionCurriculums] = useState<number[]>([]);
  const [newSessionFolders, setNewSessionFolders] = useState<number[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFolders().then(setFolders).catch(console.error);
    getCurriculums().then(setCurriculums).catch(console.error);
    loadSessions();
  }, []);

  const loadSessions = () => {
    getSessions().then(setSessions).catch(console.error);
  };

  const handleStartSimple = async () => {
    setLoading(true);
    try {
      const problems = await getFilteredProblems(filterStatus, selectedFolderId, selectedCurriculumId);
      startSolveSession(problems, filterStatus);
    } catch (e) {
      console.error(e);
      alert('문제 목록을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const handleStartSession = async (sessionId: number, mode: string) => {
    setLoading(true);
    try {
      const problems = await getSessionProblems(sessionId);
      startSolveSession(problems, mode);
    } catch (e) {
      console.error(e);
      alert('세션 문제를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const startSolveSession = (problems: any[], status: string) => {
    if (problems.length === 0) {
      alert('조건에 맞는 문제가 없습니다.');
      setLoading(false);
      return;
    }
    
    const problemIds = problems.map(p => p.problem_id);
    localStorage.setItem('solveSession', JSON.stringify({
      problemIds,
      currentIndex: 0,
      status
    }));
    
    navigate(`/solve/${problemIds[0]}`);
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      alert('세션 이름을 입력해주세요.');
      return;
    }
    
    try {
      await createSession({
        name: newSessionName,
        mode: newSessionMode,
        curriculum_ids: newSessionCurriculums,
        folder_ids: newSessionFolders
      });
      alert('세션이 생성되었습니다.');
      setIsCreatingSession(false);
      setNewSessionName('');
      setNewSessionCurriculums([]);
      setNewSessionFolders([]);
      loadSessions();
    } catch (e) {
      console.error(e);
      alert('세션 생성 실패');
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteSession(id);
        loadSessions();
      } catch (e) {
        console.error(e);
        alert('삭제 실패');
      }
    }
  };

  const toggleSelection = (id: number, list: number[], setList: (l: number[]) => void) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  return (
    <div className="solve-index-page">
      <h1>학습하기</h1>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'simple' ? 'active' : ''}`}
          onClick={() => setActiveTab('simple')}
        >
          간편 설정
        </button>
        <button 
          className={`tab ${activeTab === 'session' ? 'active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          학습 세션 (저장됨)
        </button>
      </div>

      {activeTab === 'simple' ? (
        <div className="filter-container">
          <p>일회성으로 풀이 범위를 설정합니다.</p>
          <div className="filter-group">
            <label htmlFor="folder-select">폴더 선택</label>
            <select 
              id="folder-select"
              onChange={(e) => setSelectedFolderId(Number(e.target.value) || undefined)} 
              value={selectedFolderId || ''}
            >
              <option value="">전체 폴더</option>
              {folders.map(f => (
                <option key={f.folder_id} value={f.folder_id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="curriculum-select">수학 과정</label>
            <select 
              id="curriculum-select"
              onChange={(e) => setSelectedCurriculumId(Number(e.target.value) || undefined)} 
              value={selectedCurriculumId || ''}
            >
              <option value="">전체 과정</option>
              {curriculums.map(c => (
                <option key={c.curriculum_id} value={c.curriculum_id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-select">풀이 대상</label>
            <select 
              id="status-select"
              onChange={(e) => setFilterStatus(e.target.value)} 
              value={filterStatus}
            >
              <option value="all">모든 문제 (전체 복습)</option>
              <option value="wrong">오답 노트 (틀린 문제만)</option>
              <option value="not_attempted">새로운 문제 (안 푼 문제)</option>
            </select>
          </div>
          
          <div className="action-area">
            <button className="start-button" onClick={handleStartSimple} disabled={loading}>
              {loading ? '로딩 중...' : '문제 풀이 시작'}
            </button>
          </div>
        </div>
      ) : (
        <div className="session-container">
          {!isCreatingSession ? (
            <>
              <button className="create-session-btn" onClick={() => setIsCreatingSession(true)}>
                + 새 학습 세션 만들기
              </button>
              
              <div className="session-list">
                {sessions.map(session => (
                  <div key={session.study_session_id} className="session-card">
                    <div className="session-info">
                      <h3>{session.name}</h3>
                      <p>모드: {session.mode === 'all' ? '전체' : session.mode === 'wrong' ? '오답' : '미풀이'}</p>
                      <p className="sub-info">
                        과정 {session.curriculum_ids?.length || 0}개 / 폴더 {session.folder_ids?.length || 0}개 포함
                      </p>
                    </div>
                    <div className="session-actions">
                      <button className="start-btn" onClick={() => handleStartSession(session.study_session_id, session.mode)} disabled={loading}>
                        시작
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteSession(session.study_session_id)}>
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && <p className="empty-msg">저장된 세션이 없습니다.</p>}
              </div>
            </>
          ) : (
            <div className="create-session-form">
              <h3>새 세션 만들기</h3>
              
              <div className="form-group">
                <label>세션 이름</label>
                <input 
                  type="text" 
                  value={newSessionName} 
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="예: 25년 1학기 중간고사 대비"
                />
              </div>
              
              <div className="form-group">
                <label>풀이 모드</label>
                <select value={newSessionMode} onChange={(e) => setNewSessionMode(e.target.value as 'all' | 'wrong' | 'not_attempted')}>
                  <option value="all">모든 문제</option>
                  <option value="wrong">오답 노트 (틀린 것만)</option>
                  <option value="not_attempted">새로운 문제 (안 푼 것만)</option>
                </select>
              </div>
              
              <div className="multi-select-group">
                <label>수학 과정 선택 (복수 선택)</label>
                <div className="checkbox-list">
                  {curriculums.map(c => (
                    <div key={c.curriculum_id} className="checkbox-item">
                      <input 
                        type="checkbox" 
                        id={`curr-${c.curriculum_id}`}
                        checked={newSessionCurriculums.includes(c.curriculum_id)}
                        onChange={() => toggleSelection(c.curriculum_id, newSessionCurriculums, setNewSessionCurriculums)}
                      />
                      <label htmlFor={`curr-${c.curriculum_id}`}>{c.name}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="multi-select-group">
                <label>폴더 선택 (복수 선택)</label>
                <div className="checkbox-list">
                  {folders.map(f => (
                    <div key={f.folder_id} className="checkbox-item">
                      <input 
                        type="checkbox" 
                        id={`folder-${f.folder_id}`}
                        checked={newSessionFolders.includes(f.folder_id)}
                        onChange={() => toggleSelection(f.folder_id, newSessionFolders, setNewSessionFolders)}
                      />
                      <label htmlFor={`folder-${f.folder_id}`}>{f.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-actions">
                <button onClick={() => setIsCreatingSession(false)}>취소</button>
                <button className="save-btn" onClick={handleCreateSession}>저장</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SolveIndexPage;
