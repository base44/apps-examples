import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

import KanbanColumn from "@/components/board/KanbanColumn";
import BoardHeader from "@/components/board/BoardHeader";
import TaskModal from "@/components/board/TaskModal";
import StatsPanel from "@/components/board/StatsPanel";
import ChatPanel from "@/components/chat/ChatPanel";

export default function Board() {
  const urlParams = new URLSearchParams(window.location.search);
  const boardId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState("todo");
  const [searchQuery, setSearchQuery] = useState("");
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.error("Not logged in:", error);
      }
    };
    loadUser();
  }, []);

  // Fetch board
  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const boards = await base44.entities.Board.filter({ id: boardId });
      return boards[0];
    },
    enabled: !!boardId
  });

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: () => base44.entities.Task.filter({ board_id: boardId }),
    enabled: !!boardId,
    refetchInterval: 3000 // Realtime-ish updates
  });

  // Fetch team members for assignee dropdown
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', board?.team_id],
    queryFn: () => board?.team_id 
      ? base44.entities.TeamMember.filter({ team_id: board.team_id })
      : Promise.resolve([]),
    enabled: !!board?.team_id
  });

  // Fetch subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions', boardId],
    queryFn: () => base44.entities.TaskSubscription.list(),
    enabled: !!boardId
  });

  // Task mutations
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const task = await base44.entities.Task.create({
        ...taskData,
        board_id: boardId,
        position: tasks.filter(t => t.status === taskData.status).length
      });
      
      // Log activity
      await base44.entities.ActivityLog.create({
        task_id: task.id,
        board_id: boardId,
        user_email: user?.email,
        action: "created",
        details: `Created task: ${task.title}`
      });
      
      // Send Slack notification
      try {
        await base44.functions.invoke('sendSlackUpdate', {
          task: task,
          action: "created",
          userEmail: user?.email
        });
      } catch (e) {
        console.log("Slack notification failed:", e);
      }
      
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      toast.success("Task created successfully");
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data, oldStatus }) => {
      await base44.entities.Task.update(id, data);
      
      // Log status change and notify subscribers
      if (oldStatus && data.status !== oldStatus) {
        await base44.entities.ActivityLog.create({
          task_id: id,
          board_id: boardId,
          user_email: user?.email,
          action: "moved",
          old_value: oldStatus,
          new_value: data.status,
          details: `Moved task from ${oldStatus} to ${data.status}`
        });
        
        // Send Slack notification for status change
        try {
          await base44.functions.invoke('sendSlackUpdate', {
            task: data,
            action: "moved",
            oldValue: oldStatus,
            newValue: data.status,
            userEmail: user?.email
          });
        } catch (e) {
          console.log("Slack notification failed:", e);
        }
        
        // Send email notifications to subscribers
        const taskSubscribers = subscriptions.filter(
          s => s.task_id === id && s.notify_on_status_change
        );
        for (const sub of taskSubscribers) {
          if (sub.user_email !== user?.email) {
            try {
              await base44.integrations.Core.SendEmail({
                to: sub.user_email,
                subject: `Task status changed: ${data.title || "Task"}`,
                body: `The task "${data.title}" has been moved from "${oldStatus}" to "${data.status}" by ${user?.email}.`
              });
            } catch (e) {
              console.log("Email notification failed:", e);
            }
          }
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (task) => {
      await base44.entities.Task.delete(task.id);
      await base44.entities.ActivityLog.create({
        task_id: task.id,
        board_id: boardId,
        user_email: user?.email,
        action: "deleted",
        details: `Deleted task: ${task.title}`
      });
      
      // Send Slack notification
      try {
        await base44.functions.invoke('sendSlackUpdate', {
          task: task,
          action: "deleted",
          userEmail: user?.email
        });
      } catch (e) {
        console.log("Slack notification failed:", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      toast.success("Task deleted");
    }
  });

  // Subscribe/unsubscribe mutation
  const toggleSubscriptionMutation = useMutation({
    mutationFn: async (task) => {
      const existing = subscriptions.find(
        s => s.task_id === task.id && s.user_email === user?.email
      );
      if (existing) {
        await base44.entities.TaskSubscription.delete(existing.id);
        return { subscribed: false };
      } else {
        await base44.entities.TaskSubscription.create({
          task_id: task.id,
          user_email: user?.email,
          notify_on_status_change: true,
          notify_on_comment: true
        });
        return { subscribed: true };
      }
    },
    onSuccess: ({ subscribed }) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', boardId] });
      toast.success(subscribed ? "Subscribed to task updates" : "Unsubscribed from task");
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;
    
    updateTaskMutation.mutate({
      id: draggableId,
      data: { status: destination.droppableId },
      oldStatus: source.droppableId
    });
  };

  const handleAddTask = (status) => {
    setDefaultStatus(status);
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setShowTaskModal(true);
  };

  const handleSaveTask = (taskData) => {
    if (editingTask) {
      updateTaskMutation.mutate({ 
        id: editingTask.id, 
        data: taskData,
        oldStatus: editingTask.status 
      });
    } else {
      createTaskMutation.mutate(taskData);
    }
    setEditingTask(null);
  };

  const handleDeleteTask = (task) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(task);
    }
  };

  // Filter tasks by search
  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (boardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Board not found</h2>
        <Link to={createPageUrl("Home")}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Back Navigation */}
      <div className="px-6 pt-4">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Boards
          </Button>
        </Link>
      </div>

      {/* Board Header */}
      <BoardHeader
        board={board}
        onAddTask={() => handleAddTask("todo")}
        onOpenChat={() => setShowChat(true)}
        onOpenStats={() => setShowStats(true)}
        onOpenSettings={() => {}}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        taskCount={tasks.length}
      />

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto px-6 py-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full min-h-[600px]">
            {["todo", "in_progress", "done"].map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={filteredTasks}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onSubscribe={(task) => toggleSubscriptionMutation.mutate(task)}
                subscriptions={subscriptions}
                userEmail={user?.email}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      <TaskModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        task={editingTask}
        onSave={handleSaveTask}
        defaultStatus={defaultStatus}
        boardId={boardId}
        teamMembers={teamMembers}
      />

      <StatsPanel
        open={showStats}
        onOpenChange={setShowStats}
        tasks={tasks}
      />

      <ChatPanel
        open={showChat}
        onOpenChange={setShowChat}
        boardId={boardId}
      />
    </div>
  );
}