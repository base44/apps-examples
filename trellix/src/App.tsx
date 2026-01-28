import { useEffect, useState } from 'react';
import BoardList from './pages/board-list';
import BoardView from './pages/board-view';
import Profile from './pages/profile';
import AuthPage from './pages/auth';
import BoardModal from './components/board/board-modal';
import Sidebar from './components/sidebar/sidebar';
import AIAssistant from './components/ai-assistant';
import Icon from './components/sidebar/icon';
import { base44, Board } from './sdk-client/base44-client';
import type { View, User, Board as BoardType, BoardColor } from './types';
import './App.css';

function getViewFromUrl(): View {
  if (window.location.pathname === '/profile') return { type: 'profile' };

  const match = window.location.pathname.match(/^\/boards\/(.+)$/);
  if (match) return { type: 'board', name: decodeURIComponent(match[1]) };

  return { type: 'boards' };
}

function getUrlFromView(view: View) {
  let path = '/';
  if (view.type === 'board') path = `/boards/${encodeURIComponent(view.name)}`;
  else if (view.type === 'profile') path = '/profile';

  return path;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(getViewFromUrl());
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    Board.list().then(setBoards);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        setUser(u);
        Board.list().then(setBoards);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const navigate = (newView: View) => {
    const path = getUrlFromView(newView);
    window.history.pushState(null, '', path);
    setView(newView);
  };

  const handleCreateBoard = async (name: string, description: string, color: BoardColor) => {
    const board = await Board.create({ name, description: description || undefined, color });

    setBoards([...boards, board]);
    setIsCreateBoardModalOpen(false);
    navigate({ type: 'board', name: board.name });
  };

  if (loading) {
    return (
      <div className="loading">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        setUser={setUser}
        setBoards={setBoards}
      />
    );
  }

  return (
    <div className="app">
      <Sidebar
        view={view}
        navigate={navigate}
        user={user}
        boards={boards}
        openCreateBoardModal={() => setIsCreateBoardModalOpen(true)}
      />

      <main className="main-content">
        {view.type === 'boards' && (
          <BoardList
            boards={boards}
            setBoards={setBoards}
            onSelectBoard={(name) => navigate({ type: 'board', name })}
          />
        )}
        {view.type === 'board' && (
          <BoardView key={refreshKey} boardName={view.name} onBack={() => navigate({ type: 'boards' })} />
        )}
        {view.type === 'profile' && (
          <Profile user={user} onUpdate={setUser} onBack={() => navigate({ type: 'boards' })} />
        )}
      </main>

      <BoardModal
        isOpen={isCreateBoardModalOpen}
        onClose={() => setIsCreateBoardModalOpen(false)}
        onCreate={handleCreateBoard}
      />

      <button className="ai-fab" onClick={() => setIsAIOpen(true)} title="Chat with Trix">
        <Icon name="trix" size={32} />
      </button>

      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} user={user} onDataChange={refreshData} />
    </div>
  );
}

export default App;
