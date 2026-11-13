import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './Dashboard';

function App() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [showDashboard, setShowDashboard] = useState(
    () => new URLSearchParams(window.location.search).get('preview') === 'dashboard'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot and Reset Password
  const [resetToken, setResetToken] = useState(
    () => new URLSearchParams(window.location.search).get('resetToken') || ''
  );
  const [authModal, setAuthModal] = useState(
    () => new URLSearchParams(window.location.search).has('resetToken') ? 'reset' : null
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  // Public Project States
  const [publicProject, setPublicProject] = useState(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState('');

  // Handle Login/Register
  const handleSubmit = async (e) => {
    e.preventDefault();

    setAuthError('');
    setIsLoading(true);

    try {
      const endpoint = isSignIn
        ? '/api/auth/login'
        : '/api/auth/register';

      const formData = isSignIn
        ? {
            email: email.trim().toLowerCase(),
            password,
          }
        : {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          };

      const response = await fetch(
        `http://localhost:5000${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      setName(data.user.name);
      setEmail(data.user.email);
      setToken(data.token);

      setShowDashboard(true);

    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };


  // Send password reset email
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    setIsResetLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send reset email.');
      }

      setResetMessage(data.message || 'If an account exists, a password reset link has been sent.');
      setAuthModal('sent');
    } catch (error) {
      setResetError(error.message);
    } finally {
      setIsResetLoading(false);
    }
  };

  // Save the new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');

    if (newPassword.length < 8) {
      setResetError('Password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmResetPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setIsResetLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/reset-password/${encodeURIComponent(resetToken)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to reset password.');
      }

      setResetMessage(data.message || 'Your password has been reset successfully.');
      setNewPassword('');
      setConfirmResetPassword('');
      setResetToken('');

      const url = new URL(window.location.href);
      url.searchParams.delete('resetToken');
      window.history.replaceState({}, '', url);

      setAuthModal('success');
    } catch (error) {
      setResetError(error.message);
    } finally {
      setIsResetLoading(false);
    }
  };

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogle = () => {
      const buttonContainer = document.getElementById("googleSignInButton");

      if (!buttonContainer || !window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setAuthError('');
          setIsLoading(true);

          try {
            const result = await fetch('http://localhost:5000/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            });

            const data = await result.json();

            if (!result.ok) {
              throw new Error(data.message || 'Google login failed');
            }

            setName(data.user.name);
            setEmail(data.user.email);
            setToken(data.token);
            setShowDashboard(true);
          } catch (error) {
            setAuthError(error.message);
          } finally {
            setIsLoading(false);
          }
        },
      });

      buttonContainer.innerHTML = '';

      window.google.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320,
      });
    };

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else if (existingScript) {
      existingScript.addEventListener('load', initializeGoogle);
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      script.onerror = () => setAuthError('Unable to load Google Sign-In');
      document.head.appendChild(script);
    }
  }, []);

  // STEP 5B: Add Public Project Fetch (handleSubmit ke baad)
  useEffect(() => {
    const publicId = new URLSearchParams(window.location.search).get('public');

    if (!publicId) return;

    const fetchPublicProject = async () => {
      setPublicLoading(true);

      try {
        const response = await fetch(
          `http://localhost:5000/api/projects/public/${publicId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Project not found');
        }

        setPublicProject(data.project);
      } catch (error) {
        setPublicError(error.message);
      } finally {
        setPublicLoading(false);
      }
    };

    fetchPublicProject();
  }, []);


  // Public Project Display Logic (if (showDashboard) se just pehle)
  if (new URLSearchParams(window.location.search).has('public')) {
    if (publicLoading) return <h2>Loading public project...</h2>;

    if (publicError) return <h2>{publicError}</h2>;

    if (publicProject) {
      return (
        <main className="public-project-page">
          <h1>{publicProject.title}</h1>
          <p>{publicProject.description || 'No description available.'}</p>

          <p><strong>Status:</strong> {publicProject.status}</p>

          <p>
            <strong>Created:</strong>{' '}
            {new Date(publicProject.createdAt).toLocaleDateString()}
          </p>

          <p>
            <strong>Last Updated:</strong>{' '}
            {new Date(publicProject.updatedAt).toLocaleDateString()}
          </p>

          <p>Public Read-Only Project</p>
        </main>
      );
    }

    return <h2>Loading public project...</h2>;
  }


  // Dashboard Render
  if (showDashboard) {
    return (
      <Dashboard
        name={name}
        email={email}
        token={token}
        onLogout={() => {
          setShowDashboard(false);
          setToken('');
        }}
      />
    );
  }

  // Default Auth Page Render
  return (
    <div className="screen-wrapper">
      <div className="auth-card">

        {/* Left Side: Branding & Features */}
        <div className="hero-side">
          <div className="brand-badge">
            <div className="brand-logo-icon">N</div>
            <span className="brand-name">NARVIX.</span>
          </div>

          <div className="hero-main">
            <span className="tag-pill">✦ AI COLLABORATION PLATFORM</span>
            <h1>
              Great ideas<br />
              deserve to be <span>built.</span>
            </h1>
            <p className="hero-sub">
              Bring your code, notes, and team together. Supercharged with Gemini AI for instant developer productivity.
            </p>

            <div className="features-container">
              <div className="mini-feature">
                <div className="mini-feature-icon">⚡</div>
                <h4>AI Insights</h4>
                <p>Instant code explanation</p>
              </div>
              <div className="mini-feature">
                <div className="mini-feature-icon">❖</div>
                <h4>Workspace</h4>
                <p>Notes & docs synced</p>
              </div>
            </div>
          </div>

          <div className="hero-bottom-text">
            <span className="status-dot"></span> NARVIX INC. © 2026 • ALL SYSTEMS OPERATIONAL
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="form-side">
          <div className="form-header">
            <h2>{isSignIn ? 'Welcome back' : 'Create account'}</h2>
            <p>{isSignIn ? 'Enter your credentials to access your workspace' : 'Get started with Narvix for free'}</p>
          </div>

          <div className="tab-switcher">
            <button
              type="button"
              className={`tab-btn ${isSignIn ? 'active' : ''}`}
              onClick={() => setIsSignIn(true)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`tab-btn ${!isSignIn ? 'active' : ''}`}
              onClick={() => setIsSignIn(false)}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ✅ Full Name field — sirf Register mode mein dikhega */}
            {!isSignIn && (
              <div className="input-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  className="custom-input"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>Email address</label>
              <input
                type="email"
                className="custom-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <div className="input-label-row">
                <label>Password</label>
                {isSignIn && (
                  <button
                    type="button"
                    className="forgot-pass"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                    onClick={() => {
                      setResetError('');
                      setResetMessage('');
                      setAuthModal('forgot');
                    }}
                  >
                    Forgot?
                  </button>
                )}
              </div>

              {/* Password Input with Eye Toggle */}
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="custom-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    /* Eye Off (Hide) Icon */
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    /* Eye On (Show) Icon */
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {isSignIn && (
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="keepSignedIn"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                />
                <label htmlFor="keepSignedIn">Keep me signed in</label>
              </div>
            )}

            {/* ✅ Error message — sirf error hone par dikhega */}
            {authError && (
              <p role="alert" style={{ color: '#f87171', marginBottom: '12px' }}>
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading
                ? 'Please wait...'
                : isSignIn
                  ? 'Sign In to Workspace →'
                  : 'Create Free Account →'}
            </button>
          </form>

          <div className="divider">
            <span></span>
            <p>OR CONTINUE WITH</p>
            <span></span>
          </div>

          {/* Google Sign-In */}
          <div className="social-login">
            <div id="googleSignInButton"></div>
          </div>

          {/* Forgot / Reset Password Modal */}
          {authModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                background: 'rgba(0,0,0,0.78)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  padding: '30px',
                  borderRadius: '18px',
                  background: '#111827',
                  border: '1px solid #374151',
                  color: '#fff',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                {authModal === 'forgot' && (
                  <>
                    <h2>Forgot Password?</h2>
                    <p style={{ color: '#9ca3af', marginBottom: '22px' }}>
                      Enter your registered email. We'll send you a password reset link.
                    </p>

                    <form onSubmit={handleForgotPassword}>
                      <div className="input-group">
                        <label>Email address</label>
                        <input
                          type="email"
                          className="custom-input"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      {resetError && (
                        <p role="alert" style={{ color: '#f87171' }}>{resetError}</p>
                      )}

                      <button className="submit-btn" type="submit" disabled={isResetLoading}>
                        {isResetLoading ? 'Sending...' : 'Send Reset Link →'}
                      </button>
                    </form>
                  </>
                )}

                {authModal === 'reset' && (
                  <>
                    <h2>Set New Password</h2>
                    <p style={{ color: '#9ca3af', marginBottom: '22px' }}>
                      Choose a new password for your Narvix account.
                    </p>

                    <form onSubmit={handleResetPassword}>
                      <div className="input-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          className="custom-input"
                          placeholder="At least 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={8}
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label>Confirm New Password</label>
                        <input
                          type="password"
                          className="custom-input"
                          placeholder="Enter password again"
                          value={confirmResetPassword}
                          onChange={(e) => setConfirmResetPassword(e.target.value)}
                          minLength={8}
                          required
                        />
                      </div>

                      {resetError && (
                        <p role="alert" style={{ color: '#f87171' }}>{resetError}</p>
                      )}

                      <button className="submit-btn" type="submit" disabled={isResetLoading}>
                        {isResetLoading ? 'Updating...' : 'Update Password →'}
                      </button>
                    </form>
                  </>
                )}

                {authModal === 'sent' && (
                  <>
                    <h2>Check Your Email</h2>
                    <p style={{ color: '#9ca3af', margin: '18px 0' }}>{resetMessage}</p>
                    <button className="submit-btn" type="button" onClick={() => setAuthModal(null)}>
                      Back to Sign In
                    </button>
                  </>
                )}

                {authModal === 'success' && (
                  <>
                    <h2>Password Updated!</h2>
                    <p style={{ color: '#9ca3af', margin: '18px 0' }}>{resetMessage}</p>
                    <button className="submit-btn" type="button" onClick={() => setAuthModal(null)}>
                      Continue to Sign In
                    </button>
                  </>
                )}

                {(authModal === 'forgot' || authModal === 'reset') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModal(null);
                      setResetError('');
                    }}
                    style={{
                      marginTop: '16px',
                      padding: '8px 0',
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                    }}
                  >
                    ← Back to Sign In
                  </button>
                )}
              </div>
            </div>
          )}

      </div>
    </div>
    </div>
  );
}

export default App;