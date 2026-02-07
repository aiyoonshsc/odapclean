import React, { useState, useEffect } from 'react';
import type { ProblemWithHints, ProblemCreate, Hint } from '../types';
import { createProblem, getProblems } from '../services/api';
import './MainPage.css';

const MainPage: React.FC = () => {
  const [problems, setProblems] = useState<ProblemWithHints[]>([]);
  const [newProblemTitle, setNewProblemTitle] = useState('');
  const [newProblemContent, setNewProblemContent] = useState('');
  const [newProblemHints, setNewProblemHints] = useState('');
  const [newProblemImage, setNewProblemImage] = useState<File | null>(null);

  const fetchProblems = async () => {
    try {
      const fetchedProblems = await getProblems();
      setProblems(fetchedProblems);
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewProblemImage(e.target.files[0]);
    }
  };

  const handleCreateProblem = async () => {
    if (newProblemTitle.trim() === '' || (newProblemContent.trim() === '' && !newProblemImage)) return;

    const formData = new FormData();
    formData.append('title', newProblemTitle);
    formData.append('content', newProblemContent);
    newProblemHints.split(',').forEach(hint => {
      if (hint.trim()) {
        formData.append('hints', hint.trim());
      }
    });
    if (newProblemImage) {
      formData.append('image', newProblemImage);
    }

    try {
      const newProblem = await createProblem(formData);
      setProblems([...problems, newProblem]);
      setNewProblemTitle('');
      setNewProblemContent('');
      setNewProblemHints('');
      setNewProblemImage(null);
    } catch (error) {
      console.error('Error creating problem:', error);
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <div className="dashboard-container">
          <h2>대시보드</h2>
          <div className="dashboard-item">
            <h3>총 문제 수</h3>
            <p>{problems.length}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="form-container">
          <h2>새 문제 생성</h2>
          <div className="input-group">
            <label>제목</label>
            <input
              type="text"
              className="input-field"
              value={newProblemTitle}
              onChange={(e) => setNewProblemTitle(e.target.value)}
              placeholder="문제 제목"
            />
          </div>
          <div className="input-group">
            <label>내용</label>
            <textarea
              className="textarea-field"
              value={newProblemContent}
              onChange={(e) => setNewProblemContent(e.target.value)}
              placeholder="문제 내용"
            />
          </div>
          <div className="input-group">
            <label>이미지</label>
            <input
              type="file"
              accept="image/*"
              className="input-field"
              onChange={handleImageChange}
            />
          </div>
          <div className="input-group">
            <label>힌트 (쉼표로 구분)</label>
            <input
              type="text"
              className="input-field"
              value={newProblemHints}
              onChange={(e) => setNewProblemHints(e.target.value)}
              placeholder="예: 힌트1, 힌트2"
            />
          </div>
          <button className="button" onClick={handleCreateProblem}>문제 생성</button>
        </div>
      </div>

      <div className="card">
        <div className="problem-list-container">
          <h2>문제 목록</h2>
          {problems.map((problem) => (
            <div key={problem.id} className="problem-item">
              <h3>{problem.title}</h3>
              <p>{problem.content}</p>
              {problem.hints && problem.hints.length > 0 && (
                <div className="hints-container">
                  <h4>힌트</h4>
                  <ul className="hint-list">
                    {problem.hints.map((hint: Hint, index: number) => (
                      <li key={index} className="hint-item">{hint.content}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainPage;