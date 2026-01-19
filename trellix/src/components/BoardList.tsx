import { useState } from 'react';
import { Board } from '../base44Client';
import Icon from './Icon';

const COLORS = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan'] as const;

interface Props {
  boards: any[];
  setBoards: (boards: any[]) => void;
  onSelectBoard: (name: string) => void;
}

export default function BoardList({ boards, setBoards, onSelectBoard }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState<string>('blue');

  const createBoard = async () => {
    if (!newName.trim()) return;
    const board = await Board.create({ 
      name: newName, 
      description: newDescription || undefined,
      color: newColor 
    });
    setBoards([...boards, board]);
    setNewName('');
    setNewDescription('');
    setNewColor('blue');
    setShowCreate(false);
  };

  const deleteBoard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await Board.delete(id);
    setBoards(boards.filter((b) => b.id !== id));
  };

  return (
    <div className="board-list">
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Board</h3>
            <div className="form-group">
              <label>Board Name</label>
              <input
                type="text"
                placeholder="Enter board name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="Optional description..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Cover Color</label>
              <div className="color-picker">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-btn ${c} ${newColor === c ? 'selected' : ''}`}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createBoard}>Create Board</button>
            </div>
          </div>
        </div>
      )}

      <div className="boards-grid">
        {boards.map((board) => (
          <div
            key={board.id}
            className="board-card"
            onClick={() => onSelectBoard(board.name)}
          >
            <div className={`board-card-cover ${board.color || 'blue'}`}>
              <button 
                className="delete-btn" 
                onClick={(e) => deleteBoard(board.id, e)}
              >
                ×
              </button>
            </div>
            <div className="board-card-body">
              <h3>{board.name}</h3>
              {board.description && <p>{board.description}</p>}
            </div>
          </div>
        ))}
        
        <div className="board-card add-board-card" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={32} />
        </div>
      </div>
    </div>
  );
}
