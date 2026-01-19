import { useEffect, useState, useRef } from 'react';
import { base44, Board } from './base44Client';
import BoardList from './components/BoardList';
import BoardView from './components/BoardView';
import Profile from './components/Profile';
import Icon from './components/Icon';
import './App.css';

type View = { type: 'boards' } | { type: 'board'; name: string } | { type: 'profile' };
type AuthStep = 'login' | 'verify';

function getInitialView(): View {
  if (window.location.pathname === '/profile') return { type: 'profile' };
  const match = window.location.pathname.match(/^\/boards\/(.+)$/);
  if (match) return { type: 'board', name: decodeURIComponent(match[1]) };
  return { type: 'boards' };
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(getInitialView);
  const [boards, setBoards] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => 
    (localStorage.getItem('theme') as 'dark' | 'light') || 'light'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('sidebarCollapsed') === 'true'
  );
  const authChecked = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;
    
    base44.auth.me()
      .then((u) => {
        setUser(u);
        Board.list().then(setBoards);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handlePopState = () => setView(getInitialView());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newView: View) => {
    let path = '/';
    if (newView.type === 'board') path = `/boards/${encodeURIComponent(newView.name)}`;
    else if (newView.type === 'profile') path = '/profile';
    window.history.pushState(null, '', path);
    setView(newView);
  };

  const handleQuickCreate = async (name: string, description: string, color: string) => {
    const board = await Board.create({ name, description: description || undefined, color });
    setBoards([...boards, board]);
    setShowQuickCreate(false);
    navigate({ type: 'board', name: board.name });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await base44.auth.register({ email, password });
      setAuthStep('verify');
    } else {
      await base44.auth.loginViaEmailPassword(email, password);
      const me = await base44.auth.me();
      setUser(me);
      Board.list().then(setBoards);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await base44.auth.verifyOtp({ email, otpCode });
    await base44.auth.loginViaEmailPassword(email, password);
    const me = await base44.auth.me();
    setUser(me);
    Board.list().then(setBoards);
  };

  if (loading) return <div className="loading">Loading...</div>;

  if (!user) {
    if (authStep === 'verify') {
      return (
        <div className="login-container">
          <div className="login-card">
            <h1>Verify Email</h1>
            <p>We sent a code to {email}</p>
            <form onSubmit={handleVerify}>
              <input
                type="text"
                placeholder="Enter verification code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                autoFocus
                required
              />
              <button type="submit">Verify & Continue</button>
            </form>
            <p className="toggle-auth">
              <button type="button" onClick={() => setAuthStep('login')}>
                ← Back to login
              </button>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Trellix</h1>
          <p>Your all-in-one task management solution</p>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">{isSignUp ? 'Create Account' : 'Sign In'}</button>
          </form>
          <p className="toggle-auth">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!sidebarCollapsed && <h1 onClick={() => navigate({ type: 'boards' })}>Trellix</h1>}
          <button 
            className="theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
        
        <button 
          className="collapse-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            {!sidebarCollapsed && <div className="nav-section-title">Workspace</div>}
            <div 
              className={`nav-item ${view.type === 'boards' ? 'active' : ''}`}
              onClick={() => navigate({ type: 'boards' })}
              title="All Boards"
            >
              <span className="icon"><Icon name="board" size={18} /></span>
              {!sidebarCollapsed && 'All Boards'}
            </div>
          </div>
          
          <div className="nav-section">
            {!sidebarCollapsed && <div className="nav-section-title">Your Boards</div>}
            {boards.map((board) => (
              <div
                key={board.id}
                className={`nav-item ${view.type === 'board' && view.name === board.name ? 'active' : ''}`}
                onClick={() => navigate({ type: 'board', name: board.name })}
                title={board.name}
              >
                <span 
                  className="board-dot" 
                  style={{ 
                    background: `var(--${board.color === 'blue' ? 'accent' : 
                      board.color === 'green' ? 'success' : 
                      board.color === 'orange' ? 'warning' : 
                      board.color === 'pink' || board.color === 'purple' ? 'accent' : 'accent'})` 
                  }}
                />
                {!sidebarCollapsed && board.name}
              </div>
            ))}
            <div 
              className="nav-item add-board-btn"
              onClick={() => setShowQuickCreate(true)}
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
            {!sidebarCollapsed && (
              <div className="user-info">
                <div className="user-name">{user.full_name || 'Set your name'}</div>
                <div className="user-email">{user.email}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        {view.type === 'boards' && (
          <BoardList 
            boards={boards} 
            setBoards={setBoards}
            onSelectBoard={(name) => navigate({ type: 'board', name })} 
          />
        )}
        {view.type === 'board' && (
          <BoardView boardName={view.name} onBack={() => navigate({ type: 'boards' })} />
        )}
        {view.type === 'profile' && (
          <Profile user={user} onUpdate={setUser} onBack={() => navigate({ type: 'boards' })} />
        )}
      </main>

      {showQuickCreate && (
        <QuickCreateModal 
          onClose={() => setShowQuickCreate(false)} 
          onCreate={handleQuickCreate} 
        />
      )}
    </div>
  );
}

function QuickCreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, description: string, color: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onCreate(name, description, color);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>New Board</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              placeholder="Board name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="Optional description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-btn ${c} ${color === c ? 'selected' : ''}`}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
