import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Camera, Image as ImageIcon, Clipboard } from 'lucide-react';
import Modal from 'react-modal';
import ProblemDetailModal from '../components/ProblemDetailModal';
import ImageCropModal from '../components/ImageCropModal';
import type { Folder, Problem, ProblemWithHints, Curriculum } from '../types/definitions';
import { getFolders, getProblems, getProblem, createProblem, deleteProblem, updateProblem, getCurriculums } from '../services/api';
import './MainPage.css';

Modal.setAppElement('#root');

const MainPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(() => {
    const savedFolderId = localStorage.getItem('lastSelectedFolderId');
    return savedFolderId ? parseInt(savedFolderId, 10) : null;
  });
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Data States
  const [editingProblem, setEditingProblem] = useState<ProblemWithHints | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<ProblemWithHints | null>(null);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | null>(null);
  const [selectedL1Id, setSelectedL1Id] = useState<number | null>(null);
  const [selectedL2Id, setSelectedL2Id] = useState<number | null>(null);
  const [selectedL3Id, setSelectedL3Id] = useState<number | null>(null);
  
  // Filter States
  const [filterCurriculumId, setFilterCurriculumId] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastFilterCurriculumId');
    return saved ? parseInt(saved, 10) : null;
  });
  const [filterL1Id, setFilterL1Id] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastFilterL1Id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [filterL2Id, setFilterL2Id] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastFilterL2Id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [filterL3Id, setFilterL3Id] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastFilterL3Id');
    return saved ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    if (filterCurriculumId) localStorage.setItem('lastFilterCurriculumId', filterCurriculumId.toString());
    else localStorage.removeItem('lastFilterCurriculumId');
  }, [filterCurriculumId]);

  useEffect(() => {
    if (filterL1Id) localStorage.setItem('lastFilterL1Id', filterL1Id.toString());
    else localStorage.removeItem('lastFilterL1Id');
  }, [filterL1Id]);

  useEffect(() => {
    if (filterL2Id) localStorage.setItem('lastFilterL2Id', filterL2Id.toString());
    else localStorage.removeItem('lastFilterL2Id');
  }, [filterL2Id]);

  useEffect(() => {
    if (filterL3Id) localStorage.setItem('lastFilterL3Id', filterL3Id.toString());
    else localStorage.removeItem('lastFilterL3Id');
  }, [filterL3Id]);

  const [sortBy] = useState<string>('date_desc');
  const [folderSearchTerm, setFolderSearchTerm] = useState('');

  // Form & Crop States
  const [title, setTitle] = useState('');
  const [modalFolderId, setModalFolderId] = useState<number | null>(null);
  const [hints, setHints] = useState('');
  const [contentImage, setContentImage] = useState<File | null>(null);
  const [answerImage, setAnswerImage] = useState<File | null>(null);
  const [contentImagePreview, setContentImagePreview] = useState<string | null>(null);
  const [answerImagePreview, setAnswerImagePreview] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'content' | 'answer' | null>(null);

  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const answerImageInputRef = useRef<HTMLInputElement>(null);
  const contentCameraInputRef = useRef<HTMLInputElement>(null);
  const answerCameraInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    fetchFolders();
    fetchCurriculums();
  }, []);

  useEffect(() => {
    if (selectedFolderId) {
      localStorage.setItem('lastSelectedFolderId', selectedFolderId.toString());
      fetchProblems(selectedFolderId, filterCurriculumId, sortBy);
    } else {
      localStorage.removeItem('lastSelectedFolderId');
      setProblems([]);
    }
  }, [selectedFolderId, filterCurriculumId, sortBy]);

  const fetchFolders = async () => {
    try {
      const data = await getFolders();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      // Folders fail silently or show minimal error
    }
  };

  const fetchCurriculums = async () => {
    try {
      const data = await getCurriculums();
      setCurriculums(data);
    } catch (error) {
      console.error('Error fetching curriculums:', error);
    }
  };

  const fetchProblems = async (folderId: number, curriculumId: number | null, sort: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProblems(folderId, curriculumId || undefined, sort);
      setProblems(data);
    } catch (error: any) {
      console.error('Error fetching problems:', error);
      setError('문제를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setHints('');
    setContentImage(null);
    setAnswerImage(null);
    setContentImagePreview(null);
    setAnswerImagePreview(null);
    setEditingProblem(null);
    setSelectedCurriculumId(null);
    setSelectedL1Id(null);
    setSelectedL2Id(null);
    setSelectedL3Id(null);
    setModalFolderId(selectedFolderId || (folders.length > 0 ? (folders[0].folder_id || null) : null));
  };

  const findAncestors = (curriculumId: number, allCurriculums: Curriculum[]) => {
    const current = allCurriculums.find(c => c.curriculum_id === curriculumId);
    if (!current) return { l1: null, l2: null, l3: null };

    if (current.level === 3) {
      const parent = allCurriculums.find(c => c.curriculum_id === current.parent_id);
      const grandParent = parent ? allCurriculums.find(c => c.curriculum_id === parent.parent_id) : null;
      return { 
        l1: grandParent?.curriculum_id || null, 
        l2: parent?.curriculum_id || null, 
        l3: current.curriculum_id || null
      };
    } else if (current.level === 2) {
      const parent = allCurriculums.find(c => c.curriculum_id === current.parent_id);
      return { 
        l1: parent?.curriculum_id || null, 
        l2: current.curriculum_id || null, 
        l3: null 
      };
    } else {
      return { l1: current.curriculum_id || null, l2: null, l3: null };
    }
  };

  const handleOpenCreateModal = () => {
    resetForm();
    
    // Explicitly set modal folder to current folder if selected
    if (selectedFolderId) {
      setModalFolderId(selectedFolderId);
    }
    
    // Apply defaults from filters
    if (filterL1Id) setSelectedL1Id(filterL1Id);
    if (filterL2Id) setSelectedL2Id(filterL2Id);
    if (filterL3Id) setSelectedL3Id(filterL3Id);
    if (filterCurriculumId) setSelectedCurriculumId(filterCurriculumId);
    
    setIsModalOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'create') {
      handleOpenCreateModal();
      navigate('/problems', { replace: true });
    }
  }, [location, navigate]);

  const handleOpenEditModal = async (problem: Problem) => {
    resetForm();
    try {
      const fullProblem = await getProblem(problem.problem_id);
      setEditingProblem(fullProblem);
      setTitle(fullProblem.title);
      setModalFolderId(fullProblem.folder_id || null);
      setHints(fullProblem.hints.map(h => h.content).join(', '));
      setContentImagePreview(fullProblem.problem_image_url || null);
      setAnswerImagePreview(fullProblem.answer_image_url || null);
      
      if (fullProblem.curriculum_id) {
        const { l1, l2, l3 } = findAncestors(fullProblem.curriculum_id, curriculums);
        setSelectedL1Id(l1);
        setSelectedL2Id(l2);
        setSelectedL3Id(l3);
        setSelectedCurriculumId(fullProblem.curriculum_id);
      }

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching problem details:", error);
      alert("문제 정보를 불러오는데 실패했습니다.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenDetailModal = async (problem: Problem) => {
    try {
      const fullProblem = await getProblem(problem.problem_id);
      setSelectedProblem(fullProblem);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Error fetching problem details:", error);
      alert("문제 상세 정보를 불러오는데 실패했습니다.");
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProblem(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'content' | 'answer') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string);
        setCropTarget(target);
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
    // Reset the input value to allow re-selecting the same file
    e.target.value = '';
  };

  const handleCropComplete = (croppedImage: File) => {
    if (cropTarget === 'content') {
      setContentImage(croppedImage);
      setContentImagePreview(URL.createObjectURL(croppedImage));
    } else if (cropTarget === 'answer') {
      setAnswerImage(croppedImage);
      setAnswerImagePreview(URL.createObjectURL(croppedImage));
    }
    setIsCropModalOpen(false);
    setImageToCrop(null);
    setCropTarget(null);
  };

  const handlePaste = async (target: 'content' | 'answer') => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
         alert('이 브라우저에서는 클립보드 이미지 붙여넣기를 지원하지 않습니다.');
         return;
      }

      const clipboardItems = await navigator.clipboard.read();
      let foundImage = false;

      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted-image.png", { type: blob.type });
          
          const reader = new FileReader();
          reader.addEventListener('load', () => {
            setImageToCrop(reader.result as string);
            setCropTarget(target);
            setIsCropModalOpen(true);
          });
          reader.readAsDataURL(file);
          foundImage = true;
          break; 
        }
      }
      
      if (!foundImage) {
        alert('클립보드에 이미지가 없습니다.');
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      alert('클립보드 내용을 읽을 수 없습니다. 권한을 허용해주세요.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProblem) {
      // Update logic
      try {
        const updateData: any = { title };
        if (selectedCurriculumId) updateData.curriculum_id = selectedCurriculumId;
        if (modalFolderId) updateData.folder_id = modalFolderId;
        // Hints update is trickier as backend expects full replacement or specific logic, 
        // but current API might not support hints update easily via this endpoint if it's just ProblemUpdate.
        // Assuming we just update problem fields for now.
        
        await updateProblem(editingProblem.problem_id, updateData);
        alert('수정되었습니다.');
        handleCloseModal();
        if (selectedFolderId) fetchProblems(selectedFolderId, filterCurriculumId, sortBy);
      } catch (error) {
        console.error('Error updating problem:', error);
        alert('수정 중 오류가 발생했습니다.');
      }
    } else {
      // Create
      if (!modalFolderId) {
        alert('폴더를 선택해주세요.');
        return;
      }
      if (!contentImage || !answerImage) {
        alert('문제 내용과 답변 이미지를 모두 등록해야 합니다.');
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('hints', hints);
      formData.append('folder_id', modalFolderId.toString());
      if (selectedCurriculumId) {
        formData.append('curriculum_id', selectedCurriculumId.toString());
      }
      formData.append('content_image', contentImage);
      formData.append('answer_image', answerImage);

      try {
        await createProblem(formData);
        alert('생성되었습니다.');
        handleCloseModal();
        if (selectedFolderId) fetchProblems(selectedFolderId, filterCurriculumId, sortBy);
      } catch (error) {
        console.error('Error creating problem:', error);
        alert('생성 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('정말로 삭제하시겠습니까?')) {
      try {
        await deleteProblem(id);
        if (selectedFolderId) fetchProblems(selectedFolderId, filterCurriculumId, sortBy);
      } catch (error) {
        console.error('Error deleting problem:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(folderSearchTerm.toLowerCase())
  );

  const selectedFolderName = folders.find(f => f.folder_id === selectedFolderId)?.name || '폴더 선택';

  const l1Curriculums = curriculums.filter(c => c.level === 1);
  const l2Curriculums = selectedL1Id ? curriculums.filter(c => c.level === 2 && c.parent_id === selectedL1Id) : [];
  const l3Curriculums = selectedL2Id ? curriculums.filter(c => c.level === 3 && c.parent_id === selectedL2Id) : [];

  const filterL1Curriculums = curriculums.filter(c => c.level === 1);
  const filterL2Curriculums = filterL1Id ? curriculums.filter(c => c.level === 2 && c.parent_id === filterL1Id) : [];
  const filterL3Curriculums = filterL2Id ? curriculums.filter(c => c.level === 3 && c.parent_id === filterL2Id) : [];

  return (
    <div className="main-page-container">
      <div className="content-area full-width">
        <div className="top-bar">
          <div className="folder-selector">
            <span className="current-folder-label">현재 폴더: </span>
            <button className="folder-select-btn" onClick={() => setIsFolderModalOpen(true)}>
              {selectedFolderName} ▼
            </button>
          </div>
          
          <div className="filter-controls">
            <select 
              value={filterL1Id || ''} 
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setFilterL1Id(val);
                setFilterL2Id(null);
                setFilterL3Id(null);
                setFilterCurriculumId(val);
              }}
              className="filter-select"
            >
              <option value="">대분류</option>
              {filterL1Curriculums.map(c => (
                <option key={c.curriculum_id} value={c.curriculum_id}>{c.name}</option>
              ))}
            </select>

            <select 
              value={filterL2Id || ''} 
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setFilterL2Id(val);
                setFilterL3Id(null);
                setFilterCurriculumId(val || filterL1Id);
              }}
              className="filter-select"
              disabled={!filterL1Id}
            >
              <option value="">중분류</option>
              {filterL2Curriculums.map(c => (
                <option key={c.curriculum_id} value={c.curriculum_id}>{c.name}</option>
              ))}
            </select>

            <select 
              value={filterL3Id || ''} 
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setFilterL3Id(val);
                setFilterCurriculumId(val || filterL2Id);
              }}
              className="filter-select"
              disabled={!filterL2Id}
            >
              <option value="">소분류</option>
              {filterL3Curriculums.map(c => (
                <option key={c.curriculum_id} value={c.curriculum_id}>{c.name}</option>
              ))}
            </select>
          </div>

        </div>

        {selectedFolderId ? (
          <>
            {loading ? (
              <p>로딩 중...</p>
            ) : error ? (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => fetchProblems(selectedFolderId, filterCurriculumId, sortBy)}>다시 시도</button>
              </div>
            ) : (
              <div className="problems-grid">
                {problems.map(problem => (
                  <div key={problem.problem_id} className="problem-card" onClick={() => handleOpenDetailModal(problem)}>
                    <div className="problem-info">
                      <h3>{problem.title}</h3>
                      {/* Meta info placed here to match the card style */}
                      <div className="problem-meta">
                        <span>풀이 {problem.solve_count}회</span>
                        <span>·</span>
                        <span>정답률 {Math.round(problem.correct_rate)}%</span>
                        <span>·</span>
                        <span>{problem.latest_status === 'correct' ? '성공' : problem.latest_status === 'wrong' ? '실패' : '미응시'}</span>
                      </div>
                    </div>
                    {problem.problem_image_url && (
                      <div className="problem-image">
                        <img src={problem.problem_image_url} alt={problem.title} />
                      </div>
                    )}
                    <div className="problem-actions">
                      <button className="btn-edit" onClick={(e) => { e.stopPropagation(); handleOpenEditModal(problem); }}>수정</button>
                      <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(problem.problem_id); }}>삭제</button>
                    </div>
                  </div>
                ))}
                {problems.length === 0 && <p className="empty-state">등록된 문제가 없습니다.</p>}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>상단의 버튼을 눌러 폴더를 선택해주세요.</p>
          </div>
        )}
      </div>

      <button 
        className="btn-primary btn-add-problem" 
        onClick={handleOpenCreateModal} 
        aria-label="신규 문제 추가"
      >
        <Plus size={24} />
      </button>

      {/* Folder Selection Modal */}
      <Modal
        isOpen={isFolderModalOpen}
        onRequestClose={() => setIsFolderModalOpen(false)}
        contentLabel="Folder Selection Modal"
        className="modal-content folder-modal"
        overlayClassName="modal-overlay"
      >
        <h2>폴더 선택</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="폴더 검색..."
            value={folderSearchTerm}
            onChange={(e) => setFolderSearchTerm(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>
        <ul className="folder-select-list">
          {filteredFolders.map(folder => (
            <li 
              key={folder.folder_id} 
              className={`folder-select-item ${selectedFolderId === folder.folder_id ? 'active' : ''}`}
              onClick={() => {
                setSelectedFolderId(folder.folder_id);
                setIsFolderModalOpen(false);
                setFolderSearchTerm('');
              }}
            >
              {folder.name}
            </li>
          ))}
          {filteredFolders.length === 0 && <li className="no-results">검색 결과가 없습니다.</li>}
        </ul>
        <div className="form-actions">
          <button onClick={() => setIsFolderModalOpen(false)}>닫기</button>
        </div>
      </Modal>

      {/* Problem Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        contentLabel="Problem Modal"
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <h2>{editingProblem ? '문제 수정' : '새 문제 생성'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>폴더</label>
            <select
              value={modalFolderId || ''}
              onChange={(e) => setModalFolderId(Number(e.target.value))}
              required
              className="form-select"
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="" disabled>폴더 선택</option>
              {folders.map(f => (
                <option key={f.folder_id} value={f.folder_id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>수학 과정</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select 
                value={selectedL1Id || ''} 
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setSelectedL1Id(val);
                  setSelectedL2Id(null);
                  setSelectedL3Id(null);
                  setSelectedCurriculumId(val);
                }}
                className="form-select"
                style={{ flex: 1, padding: '8px', minWidth: 0 }}
              >
                <option value="">과목 (대분류)</option>
                {l1Curriculums.map(c => (
                  <option key={c.curriculum_id} value={c.curriculum_id}>{c.name}</option>
                ))}
              </select>

              {selectedL1Id && l2Curriculums.length > 0 && (
                <select 
                  value={selectedL2Id || ''} 
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedL2Id(val);
                    setSelectedL3Id(null);
                    setSelectedCurriculumId(val);
                  }}
                  className="form-select"
                  style={{ flex: 1, padding: '8px', minWidth: 0 }}
                >
                  <option value="">단원 (중분류)</option>
                  {l2Curriculums.map(c => (
                    <option key={c.curriculum_id} value={c.curriculum_id}>{c.name}</option>
                  ))}
                </select>
              )}

              {selectedL2Id && l3Curriculums.length > 0 && (
                <select 
                  value={selectedL3Id || ''} 
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedL3Id(val);
                    setSelectedCurriculumId(val);
                  }}
                  className="form-select"
                  style={{ flex: 1, padding: '8px', minWidth: 0 }}
                >
                  <option value="">소단원 (소분류)</option>
                  {l3Curriculums.map(c => (
                    <option key={c.curriculum_id} value={c.curriculum_id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>제목</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>
          
          {!editingProblem && (
            <div className="image-upload-area">
              <div className="form-group">
                <label>문제 이미지</label>
                <div className="file-input-group">
                  <button type="button" className="btn-secondary btn-icon" onClick={() => contentCameraInputRef.current?.click()} title="사진 촬영">
                    <Camera size={20} />
                  </button>
                  <button type="button" className="btn-secondary btn-icon" onClick={() => contentImageInputRef.current?.click()} title="이미지 선택">
                    <ImageIcon size={20} />
                  </button>
                  <button type="button" className="btn-secondary btn-icon" onClick={() => handlePaste('content')} title="클립보드 붙여넣기">
                    <Clipboard size={20} />
                  </button>
                </div>
                <input 
                  ref={contentImageInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'content')}
                  style={{ display: 'none' }}
                />
                <input 
                  ref={contentCameraInputRef}
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={(e) => handleFileChange(e, 'content')}
                  style={{ display: 'none' }}
                />
                {contentImagePreview && <img src={contentImagePreview} alt="Content Preview" className="image-preview" />}
              </div>
              <div className="form-group">
                <label>답변 이미지</label>
                <div className="file-input-group">
                  <button type="button" className="btn-secondary btn-icon" onClick={() => answerCameraInputRef.current?.click()} title="사진 촬영">
                    <Camera size={20} />
                  </button>
                  <button type="button" className="btn-secondary btn-icon" onClick={() => answerImageInputRef.current?.click()} title="이미지 선택">
                    <ImageIcon size={20} />
                  </button>
                  <button type="button" className="btn-secondary btn-icon" onClick={() => handlePaste('answer')} title="클립보드 붙여넣기">
                    <Clipboard size={20} />
                  </button>
                </div>
                <input 
                  ref={answerImageInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'answer')}
                  style={{ display: 'none' }}
                />
                <input 
                  ref={answerCameraInputRef}
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={(e) => handleFileChange(e, 'answer')}
                  style={{ display: 'none' }}
                />
                {answerImagePreview && <img src={answerImagePreview} alt="Answer Preview" className="image-preview" />}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>힌트 (쉼표로 구분)</label>
            <input 
              type="text" 
              value={hints} 
              onChange={(e) => setHints(e.target.value)} 
              placeholder="힌트1, 힌트2"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleCloseModal}>취소</button>
            <button type="submit" className="btn-primary">
              {editingProblem ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Problem Detail Modal */}
      <ProblemDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        problem={selectedProblem}
      />

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default MainPage;
