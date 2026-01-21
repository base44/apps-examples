import Icon from '../sidebar/icon';
import type { Task } from '../../types';

interface Props {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export default function TaskCard({ task, onEdit, onDelete, onDragStart, onDragEnd, isDragging }: Props) {
  return (
    <div
      className="task-card"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onEdit}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="task-card-header">
        <h4>{task.title}</h4>
        <button 
          className="delete-btn" 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          ×
        </button>
      </div>
      
      {task.description && <p className="description">{task.description}</p>}
      
      <div className="task-card-footer">
        <span className={`priority-badge ${task.priority || 'medium'}`}>
          {task.priority || 'medium'}
        </span>
        
        {(task.due_date || task.assignee_email) && (
          <div className="task-meta">
            {task.due_date && (
              <span><Icon name="calendar" size={14} /> {task.due_date}</span>
            )}
            {task.assignee_email && (
              <span><Icon name="user" size={14} /> {task.assignee_email.split('@')[0]}</span>
            )}
          </div>
        )}
      </div>
      
      {task.labels && task.labels.length > 0 && (
        <div className="labels">
          {task.labels.map((label: string) => (
            <span key={label} className="label">{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
