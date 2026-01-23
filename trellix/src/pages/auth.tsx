import { useState } from "react";
import { base44, Board } from "../sdk-client/base44-client";
import type { AuthStep, User, Board as BoardType } from "../types";

type SocialProvider = 'google' | 'microsoft' | 'facebook';

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

  const handleSocialLogin = (provider: SocialProvider) => {
    base44.auth.loginWithProvider(provider);
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

        <div className="social-divider">
          <span>or continue with</span>
        </div>

        <div className="social-buttons">
          <button
            type="button"
            className="social-btn google"
            onClick={() => handleSocialLogin('google')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
        </div>

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
