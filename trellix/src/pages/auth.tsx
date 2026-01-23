import { useState } from "react";
import { base44, Board } from "../sdk-client/base44-client";
import type { AuthStep, User, Board as BoardType } from "../types";

interface Props {
  setUser: (user: User) => void;
  setBoards: (boards: BoardType[]) => void;
}

export default function AuthPage({ setUser, setBoards }: Props) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(true);
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await base44.auth.register({ email, password });
        setAuthStep('verify');
      } else {
        await base44.auth.loginViaEmailPassword(email, password);
        const me = await base44.auth.me();
        setUser(me);
        Board.list().then(setBoards);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await base44.auth.verifyOtp({ email, otpCode });
      await base44.auth.loginViaEmailPassword(email, password);
      const me = await base44.auth.me();
      setUser(me);
      Board.list().then(setBoards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };


  if (authStep === 'verify') {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Verify Email</h1>
          <p>We sent a code to {email}</p>
          <form onSubmit={handleVerify}>
            <input
              type="text"
              placeholder="Enter verification code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              autoFocus
              required
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit">Verify & Continue</button>
          </form>
          <p className="toggle-auth">
            <button type="button" onClick={() => setAuthStep('login')}>
              ← Back to login
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Trellix</h1>
        <p>Your all-in-one task management solution</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <p className="toggle-auth">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
