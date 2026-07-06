import { useFetcher } from "react-router";

type ActionResult = { ok?: boolean; error?: string } | undefined;

// Inquiry form. Submits to the property route's `action` (server-side) via a
// fetcher, so it works with or without JS and never edge-caches (POST). The
// server derives the agent + title from the Property, so a visitor can't spoof
// which agent receives the lead.
export function InquiryForm({
  propertyId,
  agentEmail,
}: {
  propertyId: string;
  agentEmail: string;
}) {
  const fetcher = useFetcher<ActionResult>();
  const submitting = fetcher.state !== "idle";
  const done = fetcher.data?.ok;

  if (done) {
    return (
      <div className="notice notice-ok" role="status">
        Thanks — your message is on its way to the listing agent. They'll reach
        out shortly.
      </div>
    );
  }

  return (
    <fetcher.Form method="post" className="stack-lg">
      <input type="hidden" name="intent" value="inquiry" />
      <input type="hidden" name="property_id" value={propertyId} />
      {/* Advisory only; the server re-reads the true agent from the Property. */}
      <input type="hidden" name="agent_email" value={agentEmail} />

      <div className="field">
        <label htmlFor="iq-name">Your name</label>
        <input id="iq-name" name="name" className="input" required autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="iq-email">Email</label>
        <input
          id="iq-email"
          name="email"
          type="email"
          className="input"
          required
          autoComplete="email"
        />
      </div>
      <div className="field">
        <label htmlFor="iq-phone">Phone (optional)</label>
        <input
          id="iq-phone"
          name="phone"
          type="tel"
          className="input"
          autoComplete="tel"
        />
      </div>
      <div className="field">
        <label htmlFor="iq-message">Message</label>
        <textarea
          id="iq-message"
          name="message"
          className="textarea"
          required
          defaultValue="I'd love to schedule a tour of this home. When are you available?"
        />
      </div>

      {fetcher.data?.error && (
        <div className="notice notice-info" role="alert">
          {fetcher.data.error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={submitting}
      >
        {submitting ? "Sending…" : "Request a tour"}
      </button>
    </fetcher.Form>
  );
}
