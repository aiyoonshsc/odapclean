import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getProblem, solveProblem } from '../services/api';
import type { ProblemWithHints } from '../types/definitions';
import { Clock, Play } from 'lucide-react';
import './SolvePage.css';

const SolvePage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<ProblemWithHints | null>(null);
  const [solution, setSolution] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (completedCrop) {
        console.log('Crop completed:', completedCrop);
    }
  }, [completedCrop]);

  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // New state for start overlay
  const [hasStarted, setHasStarted] = useState(false);

  // Timer State
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [timeElapsed, setTimeElapsed] = useState(0); // seconds
  const timerRef = useRef<any>(null);

  // Hints State
  const [hintsRevealed, setHintsRevealed] = useState(0);

  useEffect(() => {
    // Reset states when problemId changes
    setShowAnswer(false);
    setIsSubmitted(false);
    setSolution('');
    setImageSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setHintsRevealed(0);
    setHasStarted(false); // Reset start state
    
    // Timer reset
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeElapsed(0);
    setTimerState('idle');

    const fetchProblem = async () => {
      if (problemId) {
        try {
          const fetchedProblem = await getProblem(parseInt(problemId, 10));
          setProblem(fetchedProblem);
          // Do NOT auto-start timer. Wait for user to click Start.
        } catch (error) {
          console.error('Error fetching problem:', error);
        }
      }
    };
    fetchProblem();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [problemId]);

  // Timer Effect
  useEffect(() => {
    if (timerState === 'running') {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setHasStarted(true);
    setTimerState('running');
  };

  const toggleTimer = () => {
    if (timerState === 'running') setTimerState('paused');
    else setTimerState('running');
  };

  const handleShowHint = () => {
    if (problem && hintsRevealed < problem.hints.length) {
      setHintsRevealed(prev => prev + 1);
    }
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCheckAnswer = () => {
    setShowAnswer(true);
    setTimerState('paused'); // Pause timer on check
  };

  const handleGrade = async (isCorrect: boolean) => {
    if (!problemId) return;
    
    try {
      await solveProblem(parseInt(problemId, 10), solution, isCorrect, timeElapsed);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error solving problem:', error);
      alert('결과 저장 실패');
    }
  };

  const handleNext = () => {
      const sessionStr = localStorage.getItem('solveSession');
      if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const currentIndex = session.problemIds.indexOf(parseInt(problemId || '0'));
          
          if (currentIndex !== -1 && currentIndex < session.problemIds.length - 1) {
              const nextId = session.problemIds[currentIndex + 1];
              navigate(`/solve/${nextId}`);
          } else {
              alert('모든 문제를 풀었습니다!');
              navigate('/solve');
          }
      } else {
          navigate('/solve');
      }
  };

  if (!problem) return <div className="solve-page">Loading...</div>;

  return (
    <div className="solve-page">
      {!hasStarted && (
        <div className="start-overlay">
          <h2 style={{ marginBottom: '20px', color: '#333' }}>준비되셨나요?</h2>
          <button className="start-btn" onClick={handleStart}>
            <Play size={24} fill="white" />
            문제 풀이 시작
          </button>
        </div>
      )}

      <div className="solve-header">
        <h2>문제 풀이</h2>
        <div className="timer-controls">
          <div className="timer-display">
              <Clock size={16} color="#666" />
              <span className="timer-text">
                  {formatTime(timeElapsed)}
              </span>
          </div>
          <button onClick={toggleTimer} className="timer-btn">
            {timerState === 'running' ? '일시정지' : '재개'}
          </button>
        </div>
      </div>

      <div className="problem-content">
        <h3>{problem.title}</h3>
        {problem.problem_image_url && <img src={problem.problem_image_url} alt="Problem" />}
      </div>
      
      {/* Hints Section */}
      <div className="hints-section">
        <div className="hints-header">
          <h4>힌트 ({hintsRevealed} / {problem.hints.length})</h4>
          {hintsRevealed < problem.hints.length && (
            <button className="hint-btn" onClick={handleShowHint}>힌트 보기</button>
          )}
        </div>
        <div className="hints-list">
          {problem.hints.slice(0, hintsRevealed).map((hint) => (
            <div key={hint.hint_id} className="hint-item">
              <strong>Step {hint.step_number}:</strong> {hint.content}
            </div>
          ))}
          {hintsRevealed === 0 && <div style={{ color: '#999', fontSize: '0.9rem' }}>필요하면 힌트를 확인하세요.</div>}
        </div>
      </div>

      <div className="solve-area">
        <textarea 
          className="solve-textarea"
          value={solution} 
          onChange={(e) => setSolution(e.target.value)} 
          placeholder="풀이를 입력하세요..."
          rows={5}
        />
        
        <div className="image-upload">
          <input type="file" accept="image/*" onChange={onSelectFile} />
          {imageSrc && (
            <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
              <img ref={imgRef} src={imageSrc} alt="Upload" />
            </ReactCrop>
          )}
        </div>

        {!showAnswer ? (
            <button className="check-btn" onClick={handleCheckAnswer}>정답 확인</button>
        ) : (
            <div className="grading-area">
                <div className="answer-reveal">
                    <h4>정답 / 해설</h4>
                    {problem.answer_image_url && <img src={problem.answer_image_url} alt="Answer" />}
                </div>
                
                {!isSubmitted ? (
                    <div className="grade-buttons">
                        <button className="correct-btn" onClick={() => handleGrade(true)}>맞음 (O)</button>
                        <button className="wrong-btn" onClick={() => handleGrade(false)}>틀림 (X)</button>
                    </div>
                ) : (
                    <div className="next-action">
                        <p>결과가 저장되었습니다.</p>
                        <button className="next-btn" onClick={handleNext}>다음 문제</button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default SolvePage;
