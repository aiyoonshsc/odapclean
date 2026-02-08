import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to="/" className="navbar-item" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <div style={{ height: '30px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.svg" alt="OdapClean" style={{ height: '100%', objectFit: 'contain', transform: 'scale(1.4)' }} />
          </div>
        </NavLink>
      </div>
      <div className="navbar-menu">
        <NavLink to="/dashboard" className={({ isActive }) => "navbar-item" + (isActive ? " is-active" : "")}>
          대시보드
        </NavLink>
        <NavLink to="/folders" className={({ isActive }) => "navbar-item" + (isActive ? " is-active" : "")}>
          폴더 관리
        </NavLink>
        <NavLink to="/problems" className={({ isActive }) => "navbar-item" + (isActive ? " is-active" : "")}>
          문제 관리
        </NavLink>
        <NavLink to="/solve" className={({ isActive }) => "navbar-item" + (isActive ? " is-active" : "")}>
          문제 풀이
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
