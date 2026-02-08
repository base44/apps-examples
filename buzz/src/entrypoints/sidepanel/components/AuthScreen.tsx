import { useState, FormEvent } from "react";
import { base44 } from "../../../api/base44Client";
import { Icons } from "./Icons";
import type { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<"signup" | "login" | "verify">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await base44.auth.loginViaEmailPassword(email, password);
      const user = await base44.auth.me();
      onAuthSuccess(user as User);
    } catch (err) {
      setError((err as Error).message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await base44.auth.register({ email, password });
      setMode("verify");
    } catch (err) {
      setError((err as Error).message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await base44.auth.verifyOtp({ email, otpCode: otp });
      await base44.auth.loginViaEmailPassword(email, password);
      const user = await base44.auth.me();
      onAuthSuccess(user as User);
    } catch (err) {
      setError((err as Error).message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      setError("Code resent to your email");
    } catch (err) {
      setError((err as Error).message || "Failed to resend code");
    }
  };

  return (
    <div className="h-screen flex flex-col sidebar-container p-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-3" style={{ backgroundColor: "var(--accent)", borderRadius: "12px" }}>
            <Icons.Bolt />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Buzz</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Your AI browser sidekick</p>
        </div>

        {/* Form */}
        <form onSubmit={mode === "verify" ? handleVerifyOtp : mode === "login" ? handleLogin : handleSignup}>
          {mode === "verify" ? (
            <>
              <p className="text-sm text-center mb-4" style={{ color: "var(--text-secondary)" }}>
                Enter the code sent to {email}
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter code"
                className="auth-input"
                autoFocus
              />
              <button
                type="button"
                onClick={handleResendOtp}
                className="auth-link text-xs mt-2 w-full text-center"
              >
                Resend code
              </button>
            </>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="auth-input"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="auth-input"
                required
                minLength={6}
              />
            </>
          )}

          {error && (
            <p className="text-xs mt-2" style={{ color: error.includes("resent") ? "var(--accent)" : "#ef4444" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="auth-button mt-4"
          >
            {isLoading ? (
              <Icons.Loader />
            ) : mode === "verify" ? (
              "Verify"
            ) : mode === "login" ? (
              "Log in"
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        {/* Toggle mode */}
        {mode !== "verify" && (
          <p className="text-sm text-center mt-4" style={{ color: "var(--text-tertiary)" }}>
            {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}
              className="auth-link"
            >
              {mode === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
