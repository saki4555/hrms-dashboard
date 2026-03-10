import { useId } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "./use-auth";

export default function LoginForm() {
  const id = useId();
  const navigate = useNavigate();
  const { login, loginError, loginPending } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const password = e.target.password.value.trim();
    try {
      await login({ username, password });
      navigate("/");
    } catch (_) {}
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex flex-col items-center gap-2">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full border"
          aria-hidden="true"
        >
          <svg
            className="stroke-zinc-800 dark:stroke-zinc-100"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 32 32"
            aria-hidden="true"
          >
            <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
          </svg>
        </div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold sm:text-center">Welcome back</h2>
          <p className="text-sm text-muted-foreground sm:text-center">
            Enter your credentials to login to your account.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="*:not-first:mt-2">
            <Label htmlFor={`${id}-username`}>Username</Label>
            <Input
              id={`${id}-username`}
              name="username"
              type="text"
              placeholder="your_username"
              required
            />
          </div>
          <div className="*:not-first:mt-2">
            <Label htmlFor={`${id}-password`}>Password</Label>
            <Input
              id={`${id}-password`}
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox id={`${id}-remember`} />
            <Label
              htmlFor={`${id}-remember`}
              className="font-normal text-muted-foreground"
            >
              Remember me
            </Label>
          </div>
          <a className="text-sm underline hover:no-underline" href="#">
            Forgot password?
          </a>
        </div>

        {loginError && (
          <p className="text-sm text-destructive">{loginError.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={loginPending}>
          {loginPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}