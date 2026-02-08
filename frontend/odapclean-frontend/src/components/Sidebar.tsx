import React from 'react';
import type { Folder } from '../types/definitions';
import './Sidebar.css';

interface SidebarProps {
  folders: Folder[];
  selectedFolder: Folder | null;
  newFolderName: string;
  onNewFolderNameChange: (name: string) => void;
  onCreateFolder: () => void;
  onSelectFolder: (folder: Folder) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  folders,
  selectedFolder,
  newFolderName,
  onNewFolderNameChange,
  onCreateFolder,
  onSelectFolder,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h2 className="sidebar-title">폴더 생성</h2>
        <div className="input-group">
          <input
            type="text"
            className="input-field"
            value={newFolderName}
            onChange={(e) => onNewFolderNameChange(e.target.value)}
            placeholder="새 폴더 이름"
          />
          <button className="button" onClick={onCreateFolder}>생성</button>
        </div>
      </div>
      <div className="sidebar-section">
        <h2 className="sidebar-title">폴더 목록</h2>
        <ul className="folder-list">
          {folders.map((folder) => (
            <li
              key={folder.folder_id}
              className={`folder-item ${selectedFolder?.folder_id === folder.folder_id ? 'selected' : ''}`}
              onClick={() => onSelectFolder(folder)}
            >
              {folder.name}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;