import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log("[DAILY AI SUMMARY] Starting daily AI summary generation...");

    // Get all in-progress tasks
    const inProgressTasks = await base44.asServiceRole.entities.Task.filter({
      status: 'in_progress'
    });

    console.log(`[DAILY AI SUMMARY] Found ${inProgressTasks.length} in-progress tasks`);

    if (inProgressTasks.length === 0) {
      console.log("[DAILY AI SUMMARY] No in-progress tasks to summarize");
      return Response.json({
        success: true,
        message: "No in-progress tasks to summarize",
        tasks_processed: 0
      });
    }

    // Group tasks by board for better summaries
    const tasksByBoard = {};
    for (const task of inProgressTasks) {
      if (!tasksByBoard[task.board_id]) {
        tasksByBoard[task.board_id] = [];
      }
      tasksByBoard[task.board_id].push(task);
    }

    console.log(`[DAILY AI SUMMARY] Processing ${Object.keys(tasksByBoard).length} boards`);

    let summariesCreated = 0;

    // Generate AI summary for each board's in-progress tasks
    for (const [boardId, tasks] of Object.entries(tasksByBoard)) {
      try {
        // Get board info
        const boards = await base44.asServiceRole.entities.Board.filter({ id: boardId });
        const board = boards[0];

        if (!board) continue;

        console.log(`[DAILY AI SUMMARY] Generating summary for board: ${board.name} (${tasks.length} tasks)`);

        // Prepare task data for AI
        const taskList = tasks.map(t =>
          `- ${t.title} (Priority: ${t.priority || 'medium'}, ${t.assignee_email ? `Assigned to: ${t.assignee_email}` : 'Unassigned'})`
        ).join('\n');

        // Generate AI summary
        const aiSummary = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `You are a project manager. Generate a concise daily summary for the following in-progress tasks on the "${board.name}" board:

          ${taskList}

          Provide:
          1. A brief overview of progress
          2. Key priorities for today
          3. Any potential blockers or concerns
          4. Recommendations for focus areas

          Keep it professional, actionable, and under 200 words.`,
        });

        // Update each task with AI insight
        for (const task of tasks) {
          const currentDesc = task.description || '';
          const aiNote = `\n\n---\n**AI Daily Summary (${new Date().toISOString().split('T')[0]})**\n${aiSummary}`;

          // Only add if not already present today
          if (!currentDesc.includes(new Date().toISOString().split('T')[0])) {
            await base44.asServiceRole.entities.Task.update(task.id, {
              description: currentDesc + aiNote
            });
            summariesCreated++;
          }
        }

        console.log(`[DAILY AI SUMMARY] Summary generated for board: ${board.name}`);

      } catch (error) {
        console.error(`[DAILY AI SUMMARY] Error processing board ${boardId}:`, error);
      }
    }

    console.log(`[DAILY AI SUMMARY] Completed. Summaries created: ${summariesCreated}`);

    return Response.json({
      success: true,
      message: "Daily AI summaries generated successfully",
      tasks_processed: inProgressTasks.length,
      summaries_created: summariesCreated,
      boards_processed: Object.keys(tasksByBoard).length
    });

  } catch (error) {
    console.error("[DAILY AI SUMMARY] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
