import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Users } from "lucide-react";

export default function TeamSelector({ 
  teams, 
  selectedTeamId, 
  onSelectTeam, 
  onCreateTeam 
}) {
  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-slate-400" />
      <Select value={selectedTeamId || ""} onValueChange={onSelectTeam}>
        <SelectTrigger className="w-48 h-9 bg-white/50">
          <SelectValue placeholder="Select team..." />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9"
        onClick={onCreateTeam}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}