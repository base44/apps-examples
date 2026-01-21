import { useState } from 'react';
import type { Task, TaskFormData, TaskPriority, TaskStatus } from '../../types';

interface Props {
  task?: Task | null;
  initialStatus?: TaskStatus;
  onSave: (data: TaskFormData) => void;
  onClose: () => void;
}

export default function TaskModal({ task, initialStatus, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [assignee, setAssignee] = useState(task?.assignee_email || '');
  const [labelsInput, setLabelsInput] = useState(task?.labels?.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title,
      description,
      priority,
      due_date: dueDate || undefined,
      assignee_email: assignee || undefined,
      labels: labelsInput ? labelsInput.split(',').map((l: string) => l.trim()).filter(Boolean) : undefined,
      status: task?.status || initialStatus || 'todo',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{task ? 'Edit Task' : 'Create Task'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Assignee</label>
            <input
              type="email"
              placeholder="assignee@email.com"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Labels</label>
            <input
              type="text"
              placeholder="bug, feature, urgent (comma-separated)"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
