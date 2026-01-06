import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all tasks
    const tasks = await base44.asServiceRole.entities.Task.list();
    const boards = await base44.asServiceRole.entities.Board.list();

    // Calculate stats
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;

    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
    const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium').length;
    const lowPriorityTasks = tasks.filter(t => t.priority === 'low').length;

    // Tasks per board
    const tasksByBoard = boards.map(board => ({
      board_id: board.id,
      board_name: board.name,
      task_count: tasks.filter(t => t.board_id === board.id).length
    }));

    // Overdue tasks
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < new Date();
    }).length;

    const stats = {
      total_tasks: totalTasks,
      total_boards: boards.length,
      by_status: {
        todo: todoTasks,
        in_progress: inProgressTasks,
        done: doneTasks
      },
      by_priority: {
        high: highPriorityTasks,
        medium: mediumPriorityTasks,
        low: lowPriorityTasks
      },
      overdue_tasks: overdueTasks,
      completion_rate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      tasks_by_board: tasksByBoard,
      timestamp: new Date().toISOString()
    };

    console.log(`[BOARD STATS] Total tasks: ${totalTasks} | Boards: ${boards.length} | Completion: ${stats.completion_rate}%`);

    return Response.json(stats);
  } catch (error) {
    console.error("Error in boardStats:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
