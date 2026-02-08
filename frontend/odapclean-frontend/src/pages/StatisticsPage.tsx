import React, { useEffect, useState } from 'react';
import { getStatistics } from '../services/api';
import type { StatisticsResponse } from '../types/definitions';
import './StatisticsPage.css';

const StatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const data = await getStatistics();
      setStats(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('통계 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return null;

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>학습 통계</h1>
        <p>나의 학습 현황을 한눈에 확인하세요.</p>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <h3>총 문제 수</h3>
          <div className="value">{stats.total_problems}</div>
          <div className="sub-text">등록된 문제</div>
        </div>
        <div className="stat-card">
          <h3>풀이 완료</h3>
          <div className="value">{stats.solved_count}</div>
          <div className="sub-text">한 번 이상 푼 문제</div>
        </div>
        <div className="stat-card">
          <h3>정답률</h3>
          <div className="value">{stats.correct_rate.toFixed(1)}%</div>
          <div className="sub-text">{stats.correct_count}문제 정답</div>
        </div>
      </div>

      <div className="stats-section">
        <h2>폴더별 정답률</h2>
        <div className="chart-container">
          {stats.by_folder.length > 0 ? (
            stats.by_folder.map((item) => (
              <div key={item.folder_id} className="chart-item">
                <div className="chart-label" title={item.name}>{item.name}</div>
                <div className="chart-bar-area">
                  <div 
                    className="chart-bar" 
                    style={{ width: `${item.correct_rate}%`, backgroundColor: item.correct_rate >= 80 ? '#4caf50' : item.correct_rate >= 50 ? '#ff9800' : '#f44336' }}
                  ></div>
                </div>
                <div className="chart-value">{item.correct_rate.toFixed(1)}%</div>
              </div>
            ))
          ) : (
            <p className="no-data">데이터가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="stats-section">
        <h2>과정별 정답률</h2>
        <div className="chart-container">
          {stats.by_curriculum.length > 0 ? (
            stats.by_curriculum.map((item) => (
              <div key={item.curriculum_id} className="chart-item">
                <div className="chart-label" title={item.name}>{item.name}</div>
                <div className="chart-bar-area">
                  <div 
                    className="chart-bar" 
                    style={{ width: `${item.correct_rate}%`, backgroundColor: item.correct_rate >= 80 ? '#4caf50' : item.correct_rate >= 50 ? '#ff9800' : '#f44336' }}
                  ></div>
                </div>
                <div className="chart-value">{item.correct_rate.toFixed(1)}%</div>
              </div>
            ))
          ) : (
            <p className="no-data">데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
