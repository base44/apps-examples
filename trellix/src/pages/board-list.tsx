import { useState } from 'react';
import { Board } from '../sdk-client/base44-client';
import Icon from '../components/sidebar/icon';
import type { Board as BoardType, BoardColor } from '../types';

const COLORS: BoardColor[] = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan'];

interface Props {
  boards: BoardType[];
  setBoards: (boards: BoardType[]) => void;
  onSelectBoard: (name: string) => void;
}

export default function BoardList({ boards, setBoards, onSelectBoard }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState<BoardColor>('blue');
  
  const [editingBoard, setEditingBoard] = useState<BoardType | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState<BoardColor>('blue');

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

  const openEditModal = (board: BoardType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoard(board);
    setEditName(board.name);
    setEditDescription(board.description || '');
    setEditColor(board.color || 'blue');
  };

  const updateBoard = async () => {
    if (!editName.trim() || !editingBoard) return;
    const updated = await Board.update(editingBoard.id, {
      name: editName,
      description: editDescription || undefined,
      color: editColor,
    });
    setBoards(boards.map((b) => (b.id === editingBoard.id ? updated : b)));
    setEditingBoard(null);
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

      {editingBoard && (
        <div className="modal-overlay" onClick={() => setEditingBoard(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Board</h3>
            <div className="form-group">
              <label>Board Name</label>
              <input
                type="text"
                placeholder="Enter board name..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="Optional description..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Cover Color</label>
              <div className="color-picker">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-btn ${c} ${editColor === c ? 'selected' : ''}`}
                    onClick={() => setEditColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setEditingBoard(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={updateBoard}>Save Changes</button>
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
            <div className="board-card-content">
              <div className="board-card-header">
                <span className={`board-color-dot ${board.color || 'blue'}`} />
                <h3>{board.name}</h3>
              </div>
              {board.description && <p>{board.description}</p>}
            </div>
            <div className="board-card-actions">
              <button 
                className="card-action-btn"
                onClick={(e) => openEditModal(board, e)}
              >
                Edit
              </button>
              <button 
                className="card-action-btn danger" 
                onClick={(e) => deleteBoard(board.id, e)}
              >
                Delete
              </button>
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
