import React from 'react';
import Modal from 'react-modal';
import type { ProblemWithHints } from '../types/definitions';
import './ProblemDetailModal.css';

interface ProblemDetailModalProps {
  problem: ProblemWithHints | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProblemDetailModal: React.FC<ProblemDetailModalProps> = ({ problem, isOpen, onClose }) => {
  if (!problem) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Problem Details"
      className="modal-content problem-detail-modal"
      overlayClassName="modal-overlay"
    >
      <h2>{problem.title}</h2>
      <div className="problem-detail-images">
        <div className="problem-detail-image-container">
          {problem.problem_image_url && (
            <img src={problem.problem_image_url} alt="Problem Content" />
          )}
        </div>
        <div className="problem-detail-image-container">
          <h3>답변 및 해설</h3>
          {problem.answer_image_url && (
            <img src={problem.answer_image_url} alt="Problem Answer" />
          )}
        </div>
      </div>
      <div className="form-actions">
        <button onClick={onClose}>닫기</button>
      </div>
    </Modal>
  );
};

export default ProblemDetailModal;
