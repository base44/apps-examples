import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { task, action, oldValue, newValue, userEmail } = await req.json();

    if (!task) {
      return Response.json({ error: 'Task data required' }, { status: 400 });
    }

    console.log(`[SLACK] Preparing to send update for task: ${task.title}`);

    // Get Slack access token
    let accessToken;
    try {
      accessToken = await base44.asServiceRole.connectors.getAccessToken("slack");
    } catch (error) {
      console.log("[SLACK] Slack not connected:", error.message);
      return Response.json({
        success: false,
        message: "Slack not connected"
      });
    }

    // Prepare message based on action
    let message = "";
    let emoji = "📋";

    switch (action) {
      case "created":
        emoji = "✨";
        message = `*New Task Created*\n\n*${task.title}*\nStatus: ${task.status}\nPriority: ${task.priority || 'medium'}\nCreated by: ${userEmail}`;
        break;
      case "moved":
        emoji = "🔄";
        message = `*Task Status Changed*\n\n*${task.title}*\n${oldValue} → ${newValue}\nUpdated by: ${userEmail}`;
        break;
      case "updated":
        emoji = "✏️";
        message = `*Task Updated*\n\n*${task.title}*\nUpdated by: ${userEmail}`;
        break;
      case "deleted":
        emoji = "🗑️";
        message = `*Task Deleted*\n\n*${task.title}*\nDeleted by: ${userEmail}`;
        break;
      default:
        message = `*Task Activity*\n\n*${task.title}*\nAction: ${action}\nBy: ${userEmail}`;
    }

    if (task.description) {
      message += `\n\n_${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}_`;
    }

    // Get channel from environment or use default
    const channel = Deno.env.get("SLACK_CHANNEL") || "#general";

    // Send to Slack
    const slackResponse = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        channel: channel,
        text: `${emoji} ${message}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${emoji} ${message}`
            }
          }
        ]
      })
    });

    const result = await slackResponse.json();

    if (!result.ok) {
      console.error("[SLACK] Error:", result.error);
      return Response.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    console.log(`[SLACK] Message sent successfully to ${channel}`);

    return Response.json({
      success: true,
      message: "Slack notification sent",
      channel: channel
    });

  } catch (error) {
    console.error("[SLACK] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
