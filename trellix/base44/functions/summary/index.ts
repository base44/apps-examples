import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Allow service role calls (for scheduled tasks)
    if (!user) {
      // When called from scheduled task, use service role
      const tasks = await base44.asServiceRole.entities.Task.list();
      const boards = await base44.asServiceRole.entities.Board.list();

      const totalTasks = tasks.length;
      const todoTasks = tasks.filter(t => t.status === 'todo').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      const doneTasks = tasks.filter(t => t.status === 'done').length;

      const summary = {
        date: new Date().toISOString().split('T')[0],
        total_tasks: totalTasks,
        total_boards: boards.length,
        by_status: {
          todo: todoTasks,
          in_progress: inProgressTasks,
          done: doneTasks
        },
        completion_rate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
      };

      console.log(`[DAILY SUMMARY] ${summary.date} | Total Tasks: ${totalTasks} | Todo: ${todoTasks} | In Progress: ${inProgressTasks} | Done: ${doneTasks} | Completion: ${summary.completion_rate}%`);

      return Response.json({
        success: true,
        summary
      });
    }

    // If called by user, verify admin
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get tasks
    const tasks = await base44.entities.Task.list();
    const boards = await base44.entities.Board.list();

    const totalTasks = tasks.length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;

    const summary = {
      date: new Date().toISOString().split('T')[0],
      total_tasks: totalTasks,
      total_boards: boards.length,
      by_status: {
        todo: todoTasks,
        in_progress: inProgressTasks,
        done: doneTasks
      },
      completion_rate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    };

    console.log(`[DAILY SUMMARY] ${summary.date} | Total Tasks: ${totalTasks} | Todo: ${todoTasks} | In Progress: ${inProgressTasks} | Done: ${doneTasks} | Completion: ${summary.completion_rate}%`);

    return Response.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error("Error in dailySummary:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
