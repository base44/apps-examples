import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  LayoutGrid,
  Users,
  MessageCircle,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import TeamSelector from "@/components/teams/TeamSelector";
import TeamModal from "@/components/teams/TeamModal";
import BoardCard from "@/components/boards/BoardCard";
import BoardModal from "@/components/boards/BoardModal";

export default function Home() {
  const [user, setUser] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingBoard, setEditingBoard] = useState(null);
  
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

  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', selectedTeamId],
    queryFn: () => selectedTeamId 
      ? base44.entities.TeamMember.filter({ team_id: selectedTeamId })
      : Promise.resolve([]),
    enabled: !!selectedTeamId
  });

  // Fetch boards
  const { data: boards = [], isLoading: boardsLoading } = useQuery({
    queryKey: ['boards', selectedTeamId],
    queryFn: () => selectedTeamId
      ? base44.entities.Board.filter({ team_id: selectedTeamId })
      : base44.entities.Board.list()
  });

  // Fetch tasks for counting
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  // Set default team
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  // Team mutations
  const createTeamMutation = useMutation({
    mutationFn: async ({ teamData, pendingMembers }) => {
      const team = await base44.entities.Team.create({
        ...teamData,
        owner_email: user?.email
      });
      
      // Add creator as admin
      await base44.entities.TeamMember.create({
        team_id: team.id,
        user_email: user?.email,
        role: "admin"
      });
      
      // Invite pending members
      for (const member of pendingMembers) {
        await base44.entities.TeamMember.create({
          team_id: team.id,
          user_email: member.email,
          role: member.role
        });
        // Invite user to app
        try {
          await base44.users.inviteUser(member.email, "user");
        } catch (e) {
          console.log("User might already exist:", e);
        }
      }
      
      return team;
    },
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setSelectedTeamId(team.id);
    }
  });

  // Board mutations
  const createBoardMutation = useMutation({
    mutationFn: (boardData) => base44.entities.Board.create({
      ...boardData,
      owner_email: user?.email
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] })
  });

  const updateBoardMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Board.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] })
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (id) => base44.entities.Board.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] })
  });

  const handleCreateTeam = async (teamData, pendingMembers) => {
    await createTeamMutation.mutateAsync({ teamData, pendingMembers });
  };

  const handleSaveBoard = (boardData) => {
    if (editingBoard) {
      updateBoardMutation.mutate({ id: editingBoard.id, data: boardData });
    } else {
      createBoardMutation.mutate({ ...boardData, team_id: selectedTeamId });
    }
    setEditingBoard(null);
  };

  const handleDeleteBoard = (board) => {
    if (confirm("Are you sure you want to delete this board?")) {
      deleteBoardMutation.mutate(board.id);
    }
  };

  const filteredBoards = boards.filter(board =>
    board.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    board.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTaskCount = (boardId) => tasks.filter(t => t.board_id === boardId).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
                  <LayoutGrid className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  TaskFlow
                </h1>
              </div>
              
              <TeamSelector
                teams={teams}
                selectedTeamId={selectedTeamId}
                onSelectTeam={setSelectedTeamId}
                onCreateTeam={() => setShowTeamModal(true)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Link to={createPageUrl("Assistant")}>
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  AI Chat
                </Button>
              </Link>
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-sm font-medium text-slate-600">
                  {user?.email?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search boards..."
              className="pl-9 w-72 h-10 bg-white border-slate-200"
            />
          </div>
          
          <Button 
            onClick={() => { setEditingBoard(null); setShowBoardModal(true); }}
            className="gap-2 bg-slate-800 hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            New Board
          </Button>
        </div>

        {/* Boards Grid */}
        {boardsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <LayoutGrid className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              No boards yet
            </h3>
            <p className="text-slate-500 mb-6">
              Create your first board to start organizing tasks
            </p>
            <Button 
              onClick={() => { setEditingBoard(null); setShowBoardModal(true); }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Board
            </Button>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.05 }
              }
            }}
          >
            <AnimatePresence>
              {filteredBoards.map((board) => (
                <motion.div
                  key={board.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                >
                  <BoardCard
                    board={board}
                    taskCount={getTaskCount(board.id)}
                    onEdit={(b) => { setEditingBoard(b); setShowBoardModal(true); }}
                    onDelete={handleDeleteBoard}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* WhatsApp Integration Banner */}
        <div className="mt-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Manage tasks via WhatsApp</h3>
                <p className="text-white/80 text-sm">
                  Connect your WhatsApp to create and update tasks on the go
                </p>
              </div>
            </div>
            <a 
              href={base44.agents.getWhatsAppConnectURL('task_assistant')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" className="bg-white text-emerald-600 hover:bg-white/90">
                Connect WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </main>

      {/* Modals */}
      <TeamModal
        open={showTeamModal}
        onOpenChange={setShowTeamModal}
        team={editingTeam}
        members={teamMembers}
        onSave={handleCreateTeam}
        userEmail={user?.email}
      />
      
      <BoardModal
        open={showBoardModal}
        onOpenChange={setShowBoardModal}
        board={editingBoard}
        onSave={handleSaveBoard}
        teamId={selectedTeamId}
      />
    </div>
  );
}