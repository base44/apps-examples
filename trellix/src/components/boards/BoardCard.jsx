import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  LayoutGrid, 
  Users,
  Calendar
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
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const colorConfig = {
  blue: "from-blue-500 to-blue-600",
  green: "from-emerald-500 to-emerald-600",
  purple: "from-violet-500 to-violet-600",
  orange: "from-orange-500 to-orange-600",
  pink: "from-pink-500 to-pink-600",
  cyan: "from-cyan-500 to-cyan-600",
};

export default function BoardCard({ board, taskCount, onEdit, onDelete }) {
  const gradient = colorConfig[board.color] || colorConfig.blue;
  
  return (
    <Link to={createPageUrl(`Board?id=${board.id}`)}>
      <Card className="group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer overflow-hidden border-slate-200/80">
        <div className={cn("h-24 bg-gradient-to-br relative", gradient)}>
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
          <div className="absolute bottom-3 left-4">
            <LayoutGrid className="h-8 w-8 text-white/80" />
          </div>
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(board); }}>
                  Edit Board
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.preventDefault(); onDelete(board); }}
                  className="text-rose-600"
                >
                  Delete Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800 truncate">
            {board.name}
          </CardTitle>
          {board.description && (
            <p className="text-sm text-slate-500 line-clamp-1">{board.description}</p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <LayoutGrid className="h-3 w-3" />
                {taskCount} tasks
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(board.created_date), "MMM d")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}