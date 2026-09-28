import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFound({ children }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-24 text-center">
      <p className="text-6xl font-semibold tracking-tight">404</p>
      <p className="text-muted-foreground">{children ?? "The page you are looking for does not exist."}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.history.back()}>
          Go back
        </Button>
        <Button asChild>
          <Link to="/">Start over</Link>
        </Button>
      </div>
    </div>
  );
}
