import React, { useState, useEffect } from 'react';
import { getFolders, createFolder, updateFolder, deleteFolder, reorderFolders } from '../services/api';
import type { Folder } from '../types/definitions';
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
import './FolderPage.css';

interface SortableFolderItemProps {
  folder: Folder;
  editingFolder: Folder | null;
  editingFolderName: string;
  setEditingFolderName: (name: string) => void;
  handleUpdateFolder: (e: React.FormEvent) => void;
  handleCancelEdit: () => void;
  handleStartEdit: (folder: Folder) => void;
  handleDeleteFolder: (folder_id: number) => void;
}
const SortableFolderItem: React.FC<SortableFolderItemProps> = ({
  folder,
  editingFolder,
  editingFolderName,
  setEditingFolderName,
  handleUpdateFolder,
  handleCancelEdit,
  handleStartEdit,
  handleDeleteFolder
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: folder.folder_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="folder-item">
      {editingFolder && editingFolder.folder_id === folder.folder_id ? (
        <form onSubmit={handleUpdateFolder} className="edit-folder-form" onPointerDown={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editingFolderName}
            onChange={(e) => setEditingFolderName(e.target.value)}
            className="folder-input"
          />
          <button type="submit">저장</button>
          <button type="button" onClick={handleCancelEdit}>취소</button>
        </form>
      ) : (
        <div className="folder-item-content">
          <span className="folder-name">{folder.name}</span>
          <div className="folder-actions" onPointerDown={(e) => e.stopPropagation()}>
            <button onClick={() => handleStartEdit(folder)}>수정</button>
            <button onClick={() => handleDeleteFolder(folder.folder_id)} className="delete-button">삭제</button>
          </div>
        </div>
      )}
    </li>
  );
};

const FolderPage: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const data = await getFolders();
      setFolders(data);
      setError(null);
    } catch (err) {
      setError('폴더를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const newFolder = await createFolder(newFolderName);
      setFolders([...folders, newFolder]);
      setNewFolderName('');
    } catch (err) {
      setError('폴더 생성에 실패했습니다.');
    }
  };

  const handleDeleteFolder = async (folder_id: number) => {
    if (window.confirm('정말로 이 폴더를 삭제하시겠습니까? 폴더 안의 모든 문제도 함께 삭제됩니다.')) {
      try {
        await deleteFolder(folder_id);
        setFolders(folders.filter((folder) => folder.folder_id !== folder_id));
      } catch (err) {
        setError('폴더 삭제에 실패했습니다.');
      }
    }
  };

  const handleStartEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setEditingFolderName(folder.name);
  };

  const handleCancelEdit = () => {
    setEditingFolder(null);
    setEditingFolderName('');
  };

  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !editingFolderName.trim()) return;
    
    try {
      const updated = await updateFolder(editingFolder.folder_id, editingFolderName);
      setFolders(folders.map((f) => {
        return f.folder_id === updated.folder_id ? updated : f;
      }));
      handleCancelEdit();
    } catch (err) {
      setError('폴더 이름 수정에 실패했습니다.');
    }
  };

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFolders((items) => {
        const oldIndex = items.findIndex((item) => item.folder_id === active.id);
        const newIndex = items.findIndex((item) => item.folder_id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        const reorderItems = newItems.map((item, index) => ({
            folder_id: item.folder_id,
            sort_order: index
        }));

        reorderFolders(reorderItems).catch(console.error);
        
        return newItems;
      });
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="folder-page-container">
      <h1>폴더 관리</h1>
      
      <div className="search-bar">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="폴더 검색..."
          className="folder-input"
        />
      </div>

      <form onSubmit={handleCreateFolder} className="create-folder-form">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="새 폴더 이름"
          className="folder-input"
        />
        <button type="submit">폴더 추가</button>
      </form>

      <ul className="folder-list">
        {searchTerm ? (
          filteredFolders.map((folder) => {
            return (
              <li key={folder.folder_id} className="folder-item">
                {editingFolder && editingFolder.folder_id === folder.folder_id ? (
                  <form onSubmit={handleUpdateFolder} className="edit-folder-form">
                    <input
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      className="folder-input"
                    />
                    <button type="submit">저장</button>
                    <button type="button" onClick={handleCancelEdit}>취소</button>
                  </form>
                ) : (
                  <div className="folder-item-content">
                    <span className="folder-name">{folder.name}</span>
                    <div className="folder-actions">
                      <button onClick={() => handleStartEdit(folder)}>수정</button>
                      <button onClick={() => handleDeleteFolder(folder.folder_id)} className="delete-button">삭제</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })
        ) : (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={folders.map(f => f.folder_id)}
              strategy={verticalListSortingStrategy}
            >
              {folders.map((folder) => (
                <SortableFolderItem
                  key={folder.folder_id}
                  folder={folder}
                  editingFolder={editingFolder}
                  editingFolderName={editingFolderName}
                  setEditingFolderName={setEditingFolderName}
                  handleUpdateFolder={handleUpdateFolder}
                  handleCancelEdit={handleCancelEdit}
                  handleStartEdit={handleStartEdit}
                  handleDeleteFolder={handleDeleteFolder}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </ul>
    </div>
  );
};

export default FolderPage;
