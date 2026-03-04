import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export function NotFoundError() {
  const navigate = useNavigate();

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">404</h1>
        <span className="font-medium">Page Not Found</span>
        <p className="text-center text-muted-foreground">
          The page you're looking for doesn't exist or you <br />
          don't have permission to access it.
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    </div>
  );
}



