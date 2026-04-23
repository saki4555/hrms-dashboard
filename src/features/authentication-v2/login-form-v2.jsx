// src/features/authentication-v2/login-form-v2.jsx

import { useId } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthV2 } from "./use-auth-v2";
import pqcLogo from "@/assets/pqc-logo.jpg";

export default function LoginFormV2() {
  const id = useId();
  const navigate = useNavigate();
  const { login, loginError, loginPending } = useAuthV2();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const password = e.target.password.value.trim();
    try {
      await login({ username, password });
      navigate("/");
    // eslint-disable-next-line no-empty, no-unused-vars
    } catch (_) {}
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex flex-col items-center gap-2">
         <img
          src={pqcLogo}
          alt="PQC Logo"
          className="w-11 shadow-xl  object-contain"
          aria-hidden="true"
        />
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold sm:text-center">Welcome back</h2>
          <p className="text-sm text-muted-foreground sm:text-center">
            Enter your credentials to login to your account.
          </p>
          {/* Visual indicator so you know which version you're on */}
          {/* <span className="inline-block mt-1 text-xs text-amber-500 font-medium">
            Demo mode (token-based)
          </span> */}
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