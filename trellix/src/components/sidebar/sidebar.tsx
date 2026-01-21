import { useEffect, useState } from 'react';
import Icon from './icon';
import type { View, User, Board } from '../../types';

interface Props {
  view: View;
  navigate: (newView: View) => void;
  user: User;
  boards: Board[];
  openCreateBoardModal: () => void;
}

export default function Sidebar({ view, navigate, user, boards, openCreateBoardModal }: Props) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(window.innerWidth < 768 || localStorage.getItem('sidebarCollapsed') === 'true');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const currentTheme = localStorage.getItem('theme') ?? 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);

    setTheme(currentTheme as 'dark' | 'light');
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    setTheme(newTheme as 'dark' | 'light');
  };

  return (
    <div className="app">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && <h1 onClick={() => navigate({ type: 'boards' })}>Trellix</h1>}
          <button
            className="theme-toggle"
            onClick={handleThemeToggle}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>

        <button
          className="collapse-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '›' : '‹'}
        </button>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {!isCollapsed && <div className="nav-section-title">Workspace</div>}
            <div
              className={`nav-item active`}
              onClick={() => navigate({ type: 'boards' })}
              title="All Boards"
            >
              <span className="icon"><Icon name="board" size={18} /></span>
              {!isCollapsed && 'All Boards'}
            </div>
          </div>

          <div className="nav-section">
            {!isCollapsed && <div className="nav-section-title">Your Boards</div>}
            {boards.map((board) => {
              const colorMap: Record<string, string> = {
                blue: '#3b82f6',
                green: '#22c55e',
                purple: '#8b5cf6',
                orange: '#f59e0b',
                pink: '#ec4899',
                cyan: '#06b6d4',
              };
              return (
                <div
                  key={board.id}
                  className={`nav-item ${view.type === 'board' && view.name === board.name ? 'active' : ''}`}
                  onClick={() => navigate({ type: 'board', name: board.name })}
                  title={board.name}
                >
                  <span
                    className="board-dot"
                    style={{ background: colorMap[board.color] || colorMap.blue }}
                  />
                  {!isCollapsed && board.name}
                </div>
              );
            })}
            <div
              className="nav-item add-board-btn"
              onClick={openCreateBoardModal}
              title="New Board"
            >
              <Icon name="plus" size={16} />
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={() => navigate({ type: 'profile' })} title={user.email}>
            <div className="user-avatar">
              {(user.full_name || user.email)[0].toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="user-info">
                <div className="user-name">{user.full_name || 'Set your name'}</div>
                <div className="user-email">{user.email}</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
