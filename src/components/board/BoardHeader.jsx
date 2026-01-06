import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Users, 
  Settings, 
  Search,
  MessageSquare,
  BarChart3,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const colorConfig = {
  blue: "from-blue-500 to-blue-600",
  green: "from-emerald-500 to-emerald-600",
  purple: "from-violet-500 to-violet-600",
  orange: "from-orange-500 to-orange-600",
  pink: "from-pink-500 to-pink-600",
  cyan: "from-cyan-500 to-cyan-600",
};

export default function BoardHeader({ 
  board, 
  onAddTask, 
  onOpenChat,
  onOpenStats,
  onOpenSettings,
  searchQuery,
  onSearchChange,
  taskCount
}) {
  const gradient = colorConfig[board?.color] || colorConfig.blue;
  
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
              gradient
            )}>
              <span className="text-white font-bold text-lg">
                {board?.name?.[0]?.toUpperCase() || "B"}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{board?.name || "Board"}</h1>
              <p className="text-sm text-slate-500">
                {taskCount} tasks • {board?.description || "No description"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tasks..."
                className="pl-9 w-64 h-9 bg-slate-50 border-slate-200"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenChat}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              AI Assistant
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenStats}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Stats
            </Button>
            
            <Button
              onClick={onAddTask}
              size="sm"
              className="gap-2 bg-slate-800 hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onOpenSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Board Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}