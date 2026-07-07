import { useFetcher } from "react-router";
import type { InquiryStatus } from "../lib/types";

// Lets an agent change an inquiry's status inline. Posts to the /agent action
// via a fetcher and auto-submits on change. RLS allows the update only because
// the inquiry's agent_email matches the signed-in agent.
export function InquiryStatusControl({
  inquiryId,
  status,
}: {
  inquiryId: string;
  status: InquiryStatus;
}) {
  const fetcher = useFetcher();
  const pending = fetcher.state !== "idle";
  const current = (fetcher.formData?.get("status") as InquiryStatus) ?? status;

  return (
    <fetcher.Form method="post" style={{ display: "inline-flex", gap: 8 }}>
      <input type="hidden" name="intent" value="update_inquiry" />
      <input type="hidden" name="inquiry_id" value={inquiryId} />
      <select
        name="status"
        className="select"
        defaultValue={current}
        disabled={pending}
        aria-label="Inquiry status"
        style={{ padding: "6px 10px", fontSize: 13 }}
        onChange={(e) => fetcher.submit(e.currentTarget.form)}
      >
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="closed">Closed</option>
      </select>
    </fetcher.Form>
  );
}
