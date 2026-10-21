import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listEntries, signGuestbook } from "@/lib/server-fns";

export const Route = createFileRoute("/")({
  loader: () => listEntries(),
  head: () => ({ meta: [{ title: "TanStack Guestbook" }] }),
  component: GuestbookPage,
});

function GuestbookPage() {
  const entries = Route.useLoaderData();
  const router = useRouter();
  const sign = useServerFn(signGuestbook);
  const mutation = useMutation({
    mutationFn: (data) => sign({ data }),
    onSuccess: () => router.invalidate(),
    onError: () => toast.error("Couldn't sign the guestbook. Try again."),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const { name, message } = Object.fromEntries(new FormData(form));
    mutation.mutate({ name, message }, { onSuccess: () => form.reset() });
  };

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Guestbook</h1>
        <p className="text-muted-foreground">
          Server-rendered with TanStack Start, stored in a Base44 entity.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3" data-testid="guestbook-form">
        <Input name="name" placeholder="Your name" maxLength={60} required data-testid="guestbook-name" />
        <Textarea name="message" placeholder="Leave a message" maxLength={280} required data-testid="guestbook-message" />
        <Button type="submit" disabled={mutation.isPending} data-testid="guestbook-submit">
          {mutation.isPending ? "Signing…" : "Sign the guestbook"}
        </Button>
      </form>

      <ul className="space-y-4" data-testid="guestbook-entries">
        {entries.length === 0 && <li className="text-muted-foreground">No entries yet. Be the first.</li>}
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-lg border p-4">
            <p className="whitespace-pre-wrap">{entry.message}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {entry.name} · <time dateTime={entry.created_date}>{new Date(entry.created_date).toLocaleDateString()}</time>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
