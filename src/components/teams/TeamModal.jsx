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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { X, Plus, UserPlus, Loader2 } from "lucide-react";

export default function TeamModal({ 
  open, 
  onOpenChange, 
  team, 
  members = [],
  onSave,
  userEmail 
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [pendingMembers, setPendingMembers] = useState([]);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || "",
        description: team.description || "",
      });
      setPendingMembers([]);
    } else {
      setFormData({ name: "", description: "" });
      setPendingMembers([]);
    }
  }, [team]);

  const addPendingMember = () => {
    if (newMemberEmail && !pendingMembers.find(m => m.email === newMemberEmail)) {
      setPendingMembers([...pendingMembers, { 
        email: newMemberEmail, 
        role: newMemberRole 
      }]);
      setNewMemberEmail("");
      setNewMemberRole("member");
    }
  };

  const removePendingMember = (email) => {
    setPendingMembers(pendingMembers.filter(m => m.email !== email));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    setIsInviting(true);
    try {
      await onSave(formData, pendingMembers);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save team:", error);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{team ? "Edit Team" : "Create New Team"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter team name..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Team description..."
              rows={2}
            />
          </div>
          
          {/* Add Members */}
          <div className="space-y-3">
            <Label>Invite Members</Label>
            <div className="flex gap-2">
              <Input
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Email address..."
                className="flex-1"
              />
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={addPendingMember}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Existing Members */}
            {members.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-slate-500 font-medium">Current Members</p>
                <div className="space-y-1">
                  {members.map((member, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm"
                    >
                      <span>{member.user_email}</span>
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Pending Invites */}
            {pendingMembers.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-slate-500 font-medium">Pending Invites</p>
                <div className="space-y-1">
                  {pendingMembers.map((member, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 bg-blue-50 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-3 w-3 text-blue-500" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removePendingMember(member.email)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim() || isInviting}>
            {isInviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {team ? "Save Changes" : "Create Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}