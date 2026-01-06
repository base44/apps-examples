import React from 'react';
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import TaskCard from "./TaskCard";

const columnConfig = {
  todo: { 
    title: "To Do", 
    color: "bg-slate-500",
    bgColor: "bg-slate-50/50"
  },
  in_progress: { 
    title: "In Progress", 
    color: "bg-blue-500",
    bgColor: "bg-blue-50/50"
  },
  done: { 
    title: "Done", 
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50/50"
  }
};

export default function KanbanColumn({ 
  status, 
  tasks, 
  onAddTask, 
  onEditTask, 
  onDeleteTask,
  onSubscribe,
  subscriptions,
  userEmail
}) {
  const config = columnConfig[status];
  const columnTasks = tasks.filter(t => t.status === status);
  
  return (
    <div className="flex flex-col h-full min-w-[300px] w-[300px]">
      {/* Column Header */}
      <div className={cn("rounded-t-xl p-4", config.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", config.color)} />
            <h3 className="font-semibold text-slate-700 text-sm">
              {config.title}
            </h3>
            <span className="text-xs text-slate-400 font-medium bg-white/60 px-2 py-0.5 rounded-full">
              {columnTasks.length}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-slate-400 hover:text-slate-600"
            onClick={() => onAddTask(status)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto p-2 space-y-2 rounded-b-xl transition-colors",
              config.bgColor,
              snapshot.isDraggingOver && "bg-slate-100/80"
            )}
          >
            {columnTasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onSubscribe={onSubscribe}
                      isSubscribed={subscriptions?.some(
                        s => s.task_id === task.id && s.user_email === userEmail
                      )}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {columnTasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No tasks yet
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}