import React, { useState, useEffect } from 'react';
import { 
  getFilteredProblems, createProblem, updateProblem, deleteProblem, 
  getFolders, getCurriculums, reorderProblems,
  createFolder, createCurriculum
} from '../services/api';
import type { Problem, Folder, Curriculum, ProblemCreate } from '../types/definitions';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './ProblemPage.css';

interface SortableProblemItemProps {
  problem: Problem;
  folders: Folder[];
  curriculums: Curriculum[];
  handleEdit: (problem: Problem) => void;
  handleDelete: (problem_id: number) => void;
}

const SortableProblemItem: React.FC<SortableProblemItemProps> = ({
  problem,
  folders,
  curriculums,
  handleEdit,
  handleDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: problem.problem_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="problem-item">
      <div className="problem-header">
        <h3 className="problem-title">{problem.title}</h3>
        <div className="problem-actions" onPointerDown={(e) => e.stopPropagation()}>
          <button className="edit-button" onClick={() => handleEdit(problem)}>수정</button>
          <button className="delete-button" onClick={() => handleDelete(problem.problem_id)}>삭제</button>
        </div>
      </div>
      <div className="problem-meta">
        폴더: {folders.find(f => f.folder_id === problem.folder_id)?.name || '미지정'} | 
        과정: {curriculums.find(c => c.curriculum_id === problem.curriculum_id)?.name || '미지정'}
      </div>
      <div className="problem-content">
        {problem.problem_image_url ? (
          <img src={problem.problem_image_url} alt="Problem" className="problem-image" />
        ) : (
          <span className="no-image">이미지 없음</span>
        )}
      </div>
    </li>
  );
};

const ProblemPage: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [formData, setFormData] = useState<ProblemCreate>({
    title: '',
    folder_id: undefined,
    curriculum_id: undefined,
    hints: [],
    problem_image_url: '',
    answer_image_url: ''
  });
  const [currentHint, setCurrentHint] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [problemsData, foldersData, curriculumsData] = await Promise.all([
        getFilteredProblems('all'),
        getFolders(),
        getCurriculums()
      ]);
      setProblems(problemsData);
      setFolders(foldersData);
      setCurriculums(curriculumsData);
    } catch (err) {
      setError('데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'folder_id' || name === 'curriculum_id' ? Number(value) : value
    }));
  };

  const handleAddHint = () => {
    if (!currentHint.trim()) return;
    setFormData(prev => ({
      ...prev,
      hints: [...prev.hints, currentHint]
    }));
    setCurrentHint('');
  };

  const handleRemoveHint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('제목은 필수입니다.');
      return;
    }

    try {
      if (editingProblem) {
        const updated = await updateProblem(editingProblem.problem_id, formData);
        setProblems(problems.map(p => p.problem_id === updated.problem_id ? updated : p));
        alert('문제가 수정되었습니다.');
      } else {
        const data = new FormData();
        data.append('title', formData.title);
        if (formData.folder_id) data.append('folder_id', String(formData.folder_id));
        if (formData.curriculum_id) data.append('curriculum_id', String(formData.curriculum_id));
        if (formData.problem_image_url) data.append('problem_image_url', formData.problem_image_url);
        if (formData.answer_image_url) data.append('answer_image_url', formData.answer_image_url);
        
        // Backend expects hints as a comma-separated string
        if (formData.hints.length > 0) {
          data.append('hints', formData.hints.join(','));
        }

        const created = await createProblem(data);
        setProblems([created, ...problems]);
        alert('문제가 생성되었습니다.');
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert('작업에 실패했습니다.');
    }
  };

  const handleDelete = async (problem_id: number) => {
    if (!window.confirm('정말로 이 문제를 삭제하시겠습니까?')) return;
    try {
      await deleteProblem(problem_id);
      setProblems(problems.filter(p => p.problem_id !== problem_id));
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem);
    setFormData({
      title: problem.title,
      folder_id: problem.folder_id,
      curriculum_id: problem.curriculum_id,
      hints: [], // Hints fetching logic might be needed if hints are not in Problem type
      problem_image_url: problem.problem_image_url || '',
      answer_image_url: problem.answer_image_url || ''
    });
    setIsFormOpen(true);
    window.scrollTo(0, 0);
  };

  const resetForm = () => {
    setEditingProblem(null);
    setFormData({
      title: '',
      folder_id: undefined,
      curriculum_id: undefined,
      hints: [],
      problem_image_url: '',
      answer_image_url: ''
    });
    setIsFormOpen(false);
  };

  const handleAddFolder = async () => {
    const name = window.prompt('새 폴더 이름을 입력하세요:');
    if (!name) return;
    try {
      const newFolder = await createFolder(name);
      setFolders([...folders, newFolder]);
      setFormData(prev => ({ ...prev, folder_id: newFolder.folder_id }));
    } catch (e) {
      alert('폴더 생성 실패');
    }
  };

  const handleAddCurriculum = async () => {
    const name = window.prompt('새 커리큘럼 이름을 입력하세요:');
    if (!name) return;
    try {
      // Provide default values for level and sort_order
      const newCurriculum = await createCurriculum({ name, level: 1, sort_order: 0 });
      setCurriculums([...curriculums, newCurriculum]);
      setFormData(prev => ({ ...prev, curriculum_id: newCurriculum.curriculum_id }));
    } catch (e) {
      alert('커리큘럼 생성 실패');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProblems((items) => {
        const oldIndex = items.findIndex((item) => item.problem_id === active.id);
        const newIndex = items.findIndex((item) => item.problem_id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        const reorderItems = newItems.map((item, index) => ({
            problem_id: item.problem_id,
            sort_order: index
        }));

        reorderProblems(reorderItems).catch(console.error);
        
        return newItems;
      });
    }
  };

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="problem-page-container">
      <h1>문제 관리</h1>

      <div className="search-bar">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="문제 검색 (제목, 내용)..."
          className="problem-input"
        />
      </div>

      <button 
        className="toggle-form-button"
        onClick={() => setIsFormOpen(!isFormOpen)}
      >
        {isFormOpen ? '폼 닫기' : '새 문제 추가'}
      </button>

      {isFormOpen && (
        <div className="create-problem-section">
          <h2>{editingProblem ? '문제 수정' : '새 문제 생성'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>제목</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>문제 이미지 URL</label>
              <input
                type="text"
                name="problem_image_url"
                value={formData.problem_image_url || ''}
                onChange={handleInputChange}
                placeholder="https://example.com/problem.jpg"
              />
            </div>

            <div className="form-group">
              <label>해설 이미지 URL</label>
              <input
                type="text"
                name="answer_image_url"
                value={formData.answer_image_url || ''}
                onChange={handleInputChange}
                placeholder="https://example.com/answer.jpg"
              />
            </div>

            <div className="form-group">
              <label>폴더</label>
              <div className="select-with-button">
                <select
                  name="folder_id"
                  value={formData.folder_id || ''}
                  onChange={handleInputChange}
                >
                  <option value="">폴더 선택</option>
                  {folders.map(f => (
                    <option key={f.folder_id} value={f.folder_id}>{f.name}</option>
                  ))}
                </select>
                <button type="button" className="add-button" onClick={handleAddFolder} title="새 폴더 추가">+</button>
              </div>
            </div>

            <div className="form-group">
              <label>커리큘럼</label>
              <div className="select-with-button">
                <select
                  name="curriculum_id"
                  value={formData.curriculum_id || ''}
                  onChange={handleInputChange}
                >
                  <option value="">커리큘럼 선택</option>
                  {curriculums.map(c => (
                    <option key={c.curriculum_id} value={c.curriculum_id}>{c.name}</option>
                  ))}
                </select>
                <button type="button" className="add-button" onClick={handleAddCurriculum} title="새 커리큘럼 추가">+</button>
              </div>
            </div>

            {!editingProblem && (
              <div className="form-group">
                <label>힌트 (생성 시에만 추가 가능)</label>
                <div className="hint-input-group">
                  <input
                    type="text"
                    value={currentHint}
                    onChange={(e) => setCurrentHint(e.target.value)}
                    placeholder="힌트 입력"
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddHint}>추가</button>
                </div>
                <ul className="hint-list">
                  {formData.hints.map((hint, idx) => (
                    <li key={idx} className="hint-item">
                      {hint}
                      <button type="button" className="delete-hint-btn" onClick={() => handleRemoveHint(idx)}>×</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="button-group">
              <button type="submit" className="btn-primary">{editingProblem ? '수정' : '생성'}</button>
              <button type="button" className="btn-secondary" onClick={resetForm}>취소</button>
            </div>
          </form>
        </div>
      )}

      <ul className="problem-list">
        {searchTerm ? (
          filteredProblems.map(problem => (
            <li key={problem.problem_id} className="problem-item">
              <div className="problem-header">
                <h3 className="problem-title">{problem.title}</h3>
                <div className="problem-actions">
                  <button className="edit-button" onClick={() => handleEdit(problem)}>수정</button>
                  <button className="delete-button" onClick={() => handleDelete(problem.problem_id)}>삭제</button>
                </div>
              </div>
              <div className="problem-meta">
                폴더: {folders.find(f => f.folder_id === problem.folder_id)?.name || '미지정'} | 
                과정: {curriculums.find(c => c.curriculum_id === problem.curriculum_id)?.name || '미지정'}
              </div>
              <div className="problem-content">
                {problem.problem_image_url ? (
                  <img src={problem.problem_image_url} alt="Problem" className="problem-image" />
                ) : (
                  <span className="no-image">이미지 없음</span>
                )}
              </div>
            </li>
          ))
        ) : (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={problems.map(p => p.problem_id)}
              strategy={verticalListSortingStrategy}
            >
              {problems.map((problem) => (
                <SortableProblemItem
                  key={problem.problem_id}
                  problem={problem}
                  folders={folders}
                  curriculums={curriculums}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </ul>
    </div>
  );
};

export default ProblemPage;
