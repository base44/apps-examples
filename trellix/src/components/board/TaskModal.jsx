import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Loader2, 
  Upload, 
  X, 
  Paperclip 
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function TaskModal({ 
  open, 
  onOpenChange, 
  task, 
  onSave, 
  defaultStatus = "todo",
  boardId,
  teamMembers = []
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: defaultStatus,
    priority: "medium",
    assignee_email: "",
    due_date: "",
    labels: [],
    attachments: [],
    board_id: boardId
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || defaultStatus,
        priority: task.priority || "medium",
        assignee_email: task.assignee_email || "",
        due_date: task.due_date || "",
        labels: task.labels || [],
        attachments: task.attachments || [],
        board_id: task.board_id || boardId
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: defaultStatus,
        priority: "medium",
        assignee_email: "",
        due_date: "",
        labels: [],
        attachments: [],
        board_id: boardId
      });
    }
  }, [task, defaultStatus, boardId]);

  const handleGenerateContent = async () => {
    if (!formData.title) return;
    
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a detailed task description for a task titled "${formData.title}". 
        The description should be:
        - 2-3 sentences
        - Actionable and clear
        - Include success criteria if applicable
        
        Return only the description text, no additional formatting.`,
      });
      
      setFormData(prev => ({ ...prev, description: result }));
    } catch (error) {
      console.error("Failed to generate content:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          name: file.name,
          url: file_url,
          type: file.type
        };
      });
      
      const uploaded = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...uploaded]
      }));
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const addLabel = () => {
    if (newLabel && !formData.labels.includes(newLabel)) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, newLabel]
      }));
      setNewLabel("");
    }
  };

  const removeLabel = (label) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(l => l !== label)
    }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {task ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title..."
              className="h-10"
            />
          </div>
          
          {/* Description with AI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateContent}
                disabled={!formData.title || isGenerating}
                className="h-7 text-xs text-violet-600 hover:text-violet-700"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Generate with AI
              </Button>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the task..."
              rows={3}
            />
          </div>
          
          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Assignee and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Assignee</Label>
              <Select
                value={formData.assignee_email}
                onValueChange={(value) => setFormData({ ...formData, assignee_email: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_email} value={member.user_email}>
                      {member.user_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date 
                      ? format(new Date(formData.due_date), "PPP")
                      : "Pick a date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? new Date(formData.due_date) : undefined}
                    onSelect={(date) => setFormData({ 
                      ...formData, 
                      due_date: date ? format(date, "yyyy-MM-dd") : "" 
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Labels */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Labels</Label>
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add label..."
                className="h-9"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLabel())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addLabel}>
                Add
              </Button>
            </div>
            {formData.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.labels.map((label, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeLabel(label)}
                  >
                    {label}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Attachments</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => document.getElementById("file-upload").click()}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Files
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            {formData.attachments?.length > 0 && (
              <div className="space-y-1 mt-2">
                {formData.attachments.map((file, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm"
                  >
                    <Paperclip className="h-4 w-4 text-slate-400" />
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 text-blue-600 hover:underline truncate"
                    >
                      {file.name}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeAttachment(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
            {task ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}