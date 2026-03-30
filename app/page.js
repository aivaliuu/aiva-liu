'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';

export default function HomePage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleEmailAuth(e) {
    e.preventDefault();
    if (!supabase) {
      setMessage('Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const action =
        mode === 'signup'
          ? supabase.auth.signUp({ email, password })
          : supabase.auth.signInWithPassword({ email, password });

      const { error } = await action;
      if (error) throw error;

      setMessage(
        mode === 'signup'
          ? 'Account created. Check email if your project requires confirmation.'
          : 'Signed in successfully.'
      );
    } catch (error) {
      setMessage(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!supabase) {
      setMessage('Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      setMessage(error.message || 'Google login failed.');
      setLoading(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage('Signed out.');
  }

  return (
    <main className="page-shell">
      <section className="hero card">
        <div className="hero-copy">
          <div className="eyebrow">Fictional character demo • Auth playground</div>
          <h1>Aiva Liu</h1>
          <p className="lead">
            A fictional virtual influencer concept with a polished auth demo using Supabase email/password login and Google sign-in.
          </p>
          <div className="disclosure">
            Disclosure: Aiva Liu is a fictional persona created for testing and design exploration.
          </div>
        </div>
        <div className="hero-panel card inner-panel">
          <div className="panel-label">Concept preview</div>
          <p>Swap this block later for campaign imagery, reels, or a profile gallery.</p>
        </div>
      </section>

      <section className="content-grid">
        <div className="card auth-card">
          <div className="panel-label">Authentication</div>
          {session ? (
            <div className="signed-in-box">
              <h2>Signed in</h2>
              <p>{session.user?.email}</p>
              <button className="button secondary" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <>
              <div className="tab-row">
                <button
                  className={`tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => setMode('login')}
                >
                  Login
                </button>
                <button
                  className={`tab ${mode === 'signup' ? 'active' : ''}`}
                  onClick={() => setMode('signup')}
                >
                  Sign up
                </button>
              </div>

              <form onSubmit={handleEmailAuth} className="auth-form">
                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </label>

                <button className="button primary" type="submit" disabled={loading}>
                  {loading ? 'Working…' : mode === 'signup' ? 'Create account' : 'Login'}
                </button>
              </form>

              <div className="divider"><span>or</span></div>

              <button className="button google" onClick={handleGoogleLogin} disabled={loading}>
                Continue with Google
              </button>
            </>
          )}

          {message ? <p className="message">{message}</p> : null}
        </div>

        <div className="card setup-card">
          <div className="panel-label">Setup checklist</div>
          <ol>
            <li>Add <code>NEXT_PUBLIC_SUPABASE_URL</code> to <code>.env.local</code></li>
            <li>Add <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code></li>
            <li>In Supabase Auth, enable Email + Google providers</li>
            <li>Add your Vercel URL and localhost to Supabase redirect URLs</li>
            <li>Paste Google OAuth client ID + secret into Supabase, not frontend env</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
