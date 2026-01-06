import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const COLORS = ['#94a3b8', '#3b82f6', '#10b981'];

export default function StatsPanel({ open, onOpenChange, tasks }) {
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  
  const statusData = [
    { name: 'To Do', value: todoCount, color: '#94a3b8' },
    { name: 'In Progress', value: inProgressCount, color: '#3b82f6' },
    { name: 'Done', value: doneCount, color: '#10b981' },
  ];
  
  const priorityData = [
    { name: 'High', count: tasks.filter(t => t.priority === 'high').length },
    { name: 'Medium', count: tasks.filter(t => t.priority === 'medium').length },
    { name: 'Low', count: tasks.filter(t => t.priority === 'low').length },
  ];
  
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    return new Date(t.due_date) < new Date();
  }).length;
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">Board Statistics</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completionRate}%</p>
                    <p className="text-xs text-slate-500">Completion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{inProgressCount}</p>
                    <p className="text-xs text-slate-500">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-100">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{overdueTasks}</p>
                    <p className="text-xs text-slate-500">Overdue Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <TrendingUp className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{total}</p>
                    <p className="text-xs text-slate-500">Total Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Status Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {statusData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Priority Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">By Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Progress Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Progress Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">To Do</span>
                  <span className="font-medium">{todoCount}</span>
                </div>
                <Progress value={total > 0 ? (todoCount / total) * 100 : 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">In Progress</span>
                  <span className="font-medium">{inProgressCount}</span>
                </div>
                <Progress value={total > 0 ? (inProgressCount / total) * 100 : 0} className="h-2 [&>div]:bg-blue-500" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Done</span>
                  <span className="font-medium">{doneCount}</span>
                </div>
                <Progress value={total > 0 ? (doneCount / total) * 100 : 0} className="h-2 [&>div]:bg-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}