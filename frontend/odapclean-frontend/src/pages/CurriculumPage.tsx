import React, { useState, useEffect } from 'react';
import { getCurriculums, createCurriculum, updateCurriculum, deleteCurriculum, reorderCurriculums } from '../services/api';
import type { Curriculum, CurriculumCreate } from '../types/definitions';
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
import './CurriculumPage.css';

interface SortableCurriculumItemProps {
  curriculum: Curriculum;
  getParentName: (parentId?: number) => string;
  handleEdit: (curriculum: Curriculum) => void;
  handleDelete: (curriculum_id: number) => void;
}

const SortableCurriculumItem: React.FC<SortableCurriculumItemProps> = ({
  curriculum,
  getParentName,
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
  } = useSortable({ id: curriculum.curriculum_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="curriculum-item">
      <div className="curriculum-info">
        <span className="curriculum-name">{curriculum.name}</span>
        <span className="curriculum-meta">
          상위: {getParentName(curriculum.parent_id)} | 레벨: {curriculum.level} | 순서: {curriculum.sort_order}
        </span>
      </div>
      <div className="curriculum-actions" onPointerDown={(e) => e.stopPropagation()}>
        <button className="edit-button" onClick={() => handleEdit(curriculum)}>수정</button>
        <button className="delete-button" onClick={() => handleDelete(curriculum.curriculum_id)}>삭제</button>
      </div>
    </li>
  );
};

const CurriculumPage: React.FC = () => {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
  const [formData, setFormData] = useState<CurriculumCreate>({
    name: '',
    parent_id: undefined,
    level: 0,
    sort_order: 0
  });

  useEffect(() => {
    fetchCurriculums();
  }, []);

  const fetchCurriculums = async () => {
    try {
      setLoading(true);
      const data = await getCurriculums();
      setCurriculums(data);
    } catch (err) {
      setError('커리큘럼을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('이름은 필수입니다.');
      return;
    }

    try {
      if (editingCurriculum) {
        const updated = await updateCurriculum(editingCurriculum.curriculum_id, formData);
        setCurriculums(curriculums.map(c => c.curriculum_id === updated.curriculum_id ? updated : c));
        alert('커리큘럼이 수정되었습니다.');
      } else {
        const created = await createCurriculum(formData);
        setCurriculums([...curriculums, created]);
        alert('커리큘럼이 생성되었습니다.');
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert('작업에 실패했습니다.');
    }
  };

  const handleDelete = async (curriculum_id: number) => {
    if (!window.confirm('정말로 이 커리큘럼을 삭제하시겠습니까? 하위 커리큘럼이나 연결된 문제가 있을 경우 오류가 발생할 수 있습니다.')) return;
    try {
      await deleteCurriculum(curriculum_id);
      setCurriculums(curriculums.filter(c => c.curriculum_id !== curriculum_id));
    } catch (err) {
      alert('삭제에 실패했습니다. 연결된 데이터가 있는지 확인해주세요.');
    }
  };

  const handleEdit = (curriculum: Curriculum) => {
    setEditingCurriculum(curriculum);
    setFormData({
      name: curriculum.name,
      parent_id: curriculum.parent_id,
      level: curriculum.level,
      sort_order: curriculum.sort_order
    });
    setIsFormOpen(true);
    window.scrollTo(0, 0);
  };

  const resetForm = () => {
    setEditingCurriculum(null);
    setFormData({
      name: '',
      parent_id: undefined,
      level: 0,
      sort_order: 0
    });
    setIsFormOpen(false);
  };

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCurriculums((items) => {
        const oldIndex = items.findIndex((item) => item.curriculum_id === active.id);
        const newIndex = items.findIndex((item) => item.curriculum_id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        const reorderItems = newItems.map((item, index) => ({
            curriculum_id: item.curriculum_id,
            sort_order: index
        }));

        reorderCurriculums(reorderItems).catch(console.error);
        
        return newItems;
      });
    }
  };

  const filteredCurriculums = curriculums.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to find parent name
  const getParentName = (parentId?: number) => {
    if (!parentId) return '없음 (최상위)';
    const parent = curriculums.find(c => c.curriculum_id === parentId);
    return parent ? parent.name : 'Unknown';
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="curriculum-page-container">
      <h1>커리큘럼 관리</h1>

      <div className="search-bar">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="커리큘럼 검색..."
          className="curriculum-input"
        />
      </div>

      <button 
        className="toggle-form-button"
        onClick={() => setIsFormOpen(!isFormOpen)}
      >
        {isFormOpen ? '폼 닫기' : '새 커리큘럼 추가'}
      </button>

      {isFormOpen && (
        <div className="create-curriculum-section">
          <h2>{editingCurriculum ? '커리큘럼 수정' : '새 커리큘럼 생성'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>이름</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>상위 커리큘럼</label>
              <select
                name="parent_id"
                value={formData.parent_id || ''}
                onChange={handleInputChange}
              >
                <option value="">없음 (최상위)</option>
                {curriculums
                  .filter(c => c.curriculum_id !== editingCurriculum?.curriculum_id) // Prevent self-parenting
                  .map(c => (
                    <option key={c.curriculum_id} value={c.curriculum_id}>{c.name}</option>
                  ))
                }
              </select>
            </div>

            <div className="form-group">
              <label>레벨 (Level)</label>
              <input
                type="number"
                name="level"
                value={formData.level}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>정렬 순서</label>
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleInputChange}
              />
            </div>

            <div className="button-group">
              <button type="submit">{editingCurriculum ? '수정' : '생성'}</button>
              <button type="button" onClick={resetForm}>취소</button>
            </div>
          </form>
        </div>
      )}

      <ul className="curriculum-list">
        {searchTerm ? (
          filteredCurriculums.map(curriculum => (
            <li key={curriculum.curriculum_id} className="curriculum-item">
              <div className="curriculum-info">
                <span className="curriculum-name">{curriculum.name}</span>
                <span className="curriculum-meta">
                  상위: {getParentName(curriculum.parent_id)} | 레벨: {curriculum.level} | 순서: {curriculum.sort_order}
                </span>
              </div>
              <div className="curriculum-actions">
                <button className="edit-button" onClick={() => handleEdit(curriculum)}>수정</button>
                <button className="delete-button" onClick={() => handleDelete(curriculum.curriculum_id)}>삭제</button>
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
              items={curriculums.map(c => c.curriculum_id)}
              strategy={verticalListSortingStrategy}
            >
              {curriculums.map((curriculum) => (
                <SortableCurriculumItem
                  key={curriculum.curriculum_id}
                  curriculum={curriculum}
                  getParentName={getParentName}
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

export default CurriculumPage;
