import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, Paperclip, MessageSquare, MoreHorizontal, 
  Flag, Sparkles, Bell, BellOff 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const priorityConfig = {
  low: { color: "bg-slate-100 text-slate-600", icon: "text-slate-400" },
  medium: { color: "bg-amber-100 text-amber-700", icon: "text-amber-500" },
  high: { color: "bg-rose-100 text-rose-700", icon: "text-rose-500" }
};

const labelColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

export default function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onSubscribe, 
  isSubscribed,
  isDragging 
}) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  
  return (
    <Card 
      className={cn(
        "group cursor-grab active:cursor-grabbing transition-all duration-200",
        "hover:shadow-lg hover:shadow-slate-200/50 border-slate-200/80",
        "bg-white/80 backdrop-blur-sm",
        isDragging && "shadow-2xl shadow-slate-300/50 rotate-2 scale-105"
      )}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1 mb-2">
              {task.labels?.map((label, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className={cn("text-[10px] px-1.5 py-0", labelColors[idx % labelColors.length])}
                >
                  {label}
                </Badge>
              ))}
            </div>
            <h4 className="font-medium text-sm text-slate-800 leading-snug">
              {task.title}
            </h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                Edit task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSubscribe(task)}>
                {isSubscribed ? (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Unsubscribe
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Subscribe to updates
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(task)} 
                className="text-rose-600"
              >
                Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0">
        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.due_date && (
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), "MMM d")}
              </div>
            )}
            {task.attachments?.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Paperclip className="h-3 w-3" />
                {task.attachments.length}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Flag className={cn("h-3 w-3", priority.icon)} />
            {task.assignee_email && (
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-slate-100">
                  {task.assignee_email.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}