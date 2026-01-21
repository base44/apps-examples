import { useEffect, useState } from 'react';
import { Board, Task, ActivityLog } from '../sdk-client/base44-client';
import TaskCard from '../components/task/task-card';
import TaskModal from '../components/task/task-modal';
import Icon from '../components/sidebar/icon';
import type { Board as BoardType, Task as TaskType, TaskFormData, TaskStatus } from '../types';

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
] as const;

interface Props {
  boardName: string;
  onBack: () => void;
}

export default function BoardView({ boardName }: Props) {
  const [board, setBoard] = useState<BoardType>();
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [showCreate, setShowCreate] = useState<TaskStatus | null>(null);
  const [draggedTask, setDraggedTask] = useState<TaskType | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  useEffect(() => {
    Board.filter({ name: boardName }).then((boards) => {
      const b = boards[0];
      if (b) {
        setBoard(b);
        Task.filter({ board_id: b.id }).then(setTasks);
      }
    });
  }, [boardName]);

  const createTask = async (data: TaskFormData) => {
    const task = await Task.create({ ...data, board_id: board!.id });
    setTasks([...tasks, task]);
    await ActivityLog.create({ task_id: task.id, board_id: board!.id, action: 'created' });
    setShowCreate(null);
  };

  const updateTask = async (id: string, data: Partial<TaskFormData>) => {
    const updated = await Task.update(id, data);
    setTasks(tasks.map((t) => (t.id === id ? updated : t)));
    await ActivityLog.create({ task_id: id, board_id: board!.id, action: 'updated' });
    setEditingTask(null);
  };

  const deleteTask = async (id: string) => {
    await Task.delete(id);
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = async (status: string) => {
    setDragOverColumn(null);
    if (!draggedTask || draggedTask.status === status) return;
    const oldStatus = draggedTask.status;
    const updated = await Task.update(draggedTask.id, { status });
    setTasks(tasks.map((t) => (t.id === draggedTask.id ? updated : t)));
    await ActivityLog.create({
      task_id: draggedTask.id,
      board_id: board!.id,
      action: 'moved',
      old_value: oldStatus,
      new_value: status,
    });
    setDraggedTask(null);
  };

  if (!board) return <div className="loading">Loading board...</div>;

  return (
    <div className="board-view">
      <div className="kanban">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="column"
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={() => handleDrop(col.id)}
            style={{
              borderColor: dragOverColumn === col.id ? 'var(--accent)' : undefined,
            }}
          >
            <div className="column-header">
              <div className="column-title">
                <span className={`status-dot ${col.id}`} />
                <h3>{col.label}</h3>
              </div>
              <span className="column-count">
                {tasks.filter((t) => t.status === col.id).length}
              </span>
            </div>
            <div className="column-body">
              {tasks
                .filter((t) => t.status === col.id)
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => deleteTask(task.id)}
                    onDragStart={() => setDraggedTask(task)}
                    onDragEnd={() => setDraggedTask(null)}
                    isDragging={draggedTask?.id === task.id}
                  />
                ))}
              <button className="add-task-btn" onClick={() => setShowCreate(col.id)}>
                <Icon name="plus" size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(showCreate || editingTask) && (
        <TaskModal
          task={editingTask}
          initialStatus={showCreate || undefined}
          onSave={(data) =>
            editingTask ? updateTask(editingTask.id, data) : createTask(data)
          }
          onClose={() => {
            setShowCreate(null);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
