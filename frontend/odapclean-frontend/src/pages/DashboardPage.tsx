import React from 'react';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  return (
    <div className="dashboard-page">
      <h1>대시보드</h1>
      
      <div className="dashboard-card">
        <h3>환영합니다!</h3>
        <p>오늘도 오답 클린과 함께 실력을 키워보세요.</p>
      </div>

      <div className="dashboard-card">
        <h3>학습 현황</h3>
        <p>최근 학습 기록이 없습니다. 새로운 세션을 시작해보세요!</p>
      </div>
    </div>
  );
};

export default DashboardPage;
