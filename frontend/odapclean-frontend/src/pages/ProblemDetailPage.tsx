import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProblem, updateProblem } from '../services/api';
import type { ProblemWithHints } from '../types/definitions';
import './ProblemDetailPage.css';

const ProblemDetailPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const [problem, setProblem] = useState<ProblemWithHints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) return;
      try {
        setLoading(true);
        const problemData = await getProblem(Number(problemId));
        setProblem(problemData);
        setEditedTitle(problemData.title);
      } catch (err) {
        setError('문제 정보를 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!problemId || !problem) return;

    try {
      // Hints update logic might need adjustment if backend expects list of strings
      const updatedData = await updateProblem(Number(problemId), {
        title: editedTitle,
        // hints: problem.hints.map(h => h.content) // Removing hints update for now as it might require specific handling
      });
      // Merge updated data
      setProblem({ ...problem, ...updatedData });
      setIsEditing(false);
    } catch (err) {
      setError('문제 업데이트에 실패했습니다.');
      console.error(err);
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!problem) {
    return <div>문제를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="problem-detail-container">
      {isEditing ? (
          <div className="title-section">
            <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="title-input" />
            <div style={{ marginTop: '10px' }}>
              <button onClick={handleSave}>저장</button>
              <button onClick={handleEditToggle}>취소</button>
            </div>
          </div>
        ) : (
          <div className="title-section">
            <h1 style={{ margin: '0 0 5px 0', fontSize: '1.5rem' }}>{problem.title}</h1>
            <button onClick={handleEditToggle}>제목 수정</button>
          </div>
        )}

        {problem.problem_image_url && (
          <div className="problem-image-container">
            {/* Header removed for cleaner look, or make it optional */}
            <img src={problem.problem_image_url} alt="Problem content" className="problem-image-full" />
          </div>
        )}
        {problem.answer_image_url && (
          <div className="problem-image-container">
            <h2>답변 및 해설</h2>
            <img src={problem.answer_image_url} alt="Answer content" className="problem-image-full" />
          </div>
        )}
      
      <div className="hints-section">
        <h2>힌트</h2>
        <ul>
          {problem.hints.map((hint) => (
            <li key={hint.hint_id}>{hint.content}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
