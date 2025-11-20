import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanHeading from '../components/PlanMealHeading';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/useAuth';

const LoginPage = () => {
  const [mode, setMode] = useState<'idle' | 'login' | 'signup'>('idle');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  async function submit() {
    setLoading(true);
    setError(null);
    // client-side validation
    if (!username || !password || (mode === 'signup' && !name.trim())) {
      toast.error(mode === 'signup' ? 'Please enter name, username, and password' : 'Please enter both username and password');
      setLoading(false);
      return;
    }
    if (username.length < 4) {
      toast.error('Username must be at least 4 characters');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (mode === 'signup' && name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      setLoading(false);
      return;
    }
    try {
      if (mode === 'signup') {
        // create the account first
        await api.post('/auth/signup', { name: name.trim(), username, password });
      }

      // always attempt login (either after signup or when mode === 'login')
      const loginRes = await api.post('/auth/login', { username, password });

      const { userID, accessToken } = loginRes?.data ?? {};
      setAuth({
        userId: userID ?? null,
        accessToken: accessToken ?? null,
      });

      toast.success(mode === 'login' ? 'Logged in' : 'Signed up and logged in');
      navigate('/home');
    } catch (error: unknown) {
      let message = 'Request failed';
      let status: number | undefined;
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string }; status?: number } }).response;
        message = response?.data?.message ?? message;
        status = response?.status;
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      // friendly messages for common cases
      if (status === 401) {
        toast.error('Invalid username or password');
      } else {
        toast.error(message);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fdf4e3] text-[#3f2a1d]">
      <div className="pointer-events-none absolute -top-40 right-[-120px] h-96 w-96 rounded-full bg-[#f4978e] opacity-35 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-[-160px] left-[-80px] h-96 w-96 rounded-full bg-[#f9c784] opacity-35 blur-3xl"></div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 lg:flex-row lg:items-stretch lg:justify-between lg:px-12">
        <div className="mb-12 max-w-xl space-y-6 lg:mb-0">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#a77044]">HostMate</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#2b1c12] sm:text-5xl">
            Sign in and start curating gatherings your guests will rave about.
          </h1>
          <p className="text-sm leading-relaxed text-[#6f5440]">
            Create an account to save your dishes, remember every guest preference, and design menus that feel heartfelt. Already joined? Log in and pick up where you left off.
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/70 p-8 shadow-glow backdrop-blur">
          <PlanHeading className="mb-6 text-[#2b1c12]" />

          {mode === 'idle' && (
            <div className="space-y-3">
              <button
                type="button"
                className="w-full rounded-full bg-[#d37655] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#d37655]/30 transition hover:-translate-y-0.5"
                onClick={() => setMode('login')}
              >
                Log in
              </button>
              <button
                type="button"
                className="w-full rounded-full border border-[#d37655]/30 px-6 py-3 text-sm font-semibold text-[#d37655] transition hover:bg-[#fbe0d4]"
                onClick={() => setMode('signup')}
              >
                Create an account
              </button>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="space-y-5">
              {mode === 'signup' && (
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044]">Name</span>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-xl border border-[#f5d8b4] bg-white/90 px-4 py-2 text-sm text-[#3f2a1d] focus:outline-none focus:ring-2 focus:ring-[#d37655]/50"
                  />
                </label>
              )}
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044]">Username</span>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-[#f5d8b4] bg-white/90 px-4 py-2 text-sm text-[#3f2a1d] focus:outline-none focus:ring-2 focus:ring-[#d37655]/50"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a77044]">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#f5d8b4] bg-white/90 px-4 py-2 text-sm text-[#3f2a1d] focus:outline-none focus:ring-2 focus:ring-[#d37655]/50"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-[#d37655] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#d37655]/30 transition hover:-translate-y-0.5"
                  onClick={() => submit()}
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
                </button>
                <button
                  type="button"
                  className="text-sm font-semibold text-[#a15a38] underline decoration-[#f5d8b4] underline-offset-4 transition hover:text-[#d37655]"
                  onClick={() => setMode('idle')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
              {error && <div className="text-sm text-red-500">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
