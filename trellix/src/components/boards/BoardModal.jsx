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
import { cn } from "@/lib/utils";

const colors = [
  { name: "blue", class: "bg-blue-500" },
  { name: "green", class: "bg-emerald-500" },
  { name: "purple", class: "bg-violet-500" },
  { name: "orange", class: "bg-orange-500" },
  { name: "pink", class: "bg-pink-500" },
  { name: "cyan", class: "bg-cyan-500" },
];

export default function BoardModal({ 
  open, 
  onOpenChange, 
  board, 
  onSave,
  teamId 
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "blue",
    team_id: teamId
  });

  useEffect(() => {
    if (board) {
      setFormData({
        name: board.name || "",
        description: board.description || "",
        color: board.color || "blue",
        team_id: board.team_id || teamId
      });
    } else {
      setFormData({
        name: "",
        description: "",
        color: "blue",
        team_id: teamId
      });
    }
  }, [board, teamId]);

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{board ? "Edit Board" : "Create New Board"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Board Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter board name..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Board description..."
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.name })}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    color.class,
                    formData.color === color.name 
                      ? "ring-2 ring-offset-2 ring-slate-400 scale-110" 
                      : "hover:scale-105"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            {board ? "Save Changes" : "Create Board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}