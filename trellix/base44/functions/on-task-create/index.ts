import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task } = await req.json();

    console.log(`[TASK CREATED] ID: ${task.id} | Title: "${task.title}" | Status: ${task.status} | Created by: ${user.email} | Timestamp: ${new Date().toISOString()}`);

    // Log to activity log
    await base44.asServiceRole.entities.ActivityLog.create({
      task_id: task.id,
      board_id: task.board_id,
      user_email: user.email,
      action: "created",
      details: `Task "${task.title}" was created`
    });

    return Response.json({
      success: true,
      message: "Task creation logged successfully",
      task_id: task.id
    });
  } catch (error) {
    console.error("Error in onTaskCreate:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
