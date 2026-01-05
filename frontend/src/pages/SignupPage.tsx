import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/use-auth";

export function SignupPage() {
  const navigate = useNavigate();
  const {
    state: { isLoading, error },
    signup,
  } = useAuth();

  const [username, setUsername] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await signup({ username, name, password });
    if (ok) {
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-amber-100">
        <div className="text-sm font-medium text-amber-700">Let’s get cooking</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">Create your Hostmate account</div>
        <div className="mt-1 text-sm text-slate-600">Save dishes, invite guests, and respect allergies.</div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-sm">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            autoComplete="new-password"
          />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {isLoading ? "Creating..." : "Sign up"}
        </button>

        <div className="text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-slate-900 underline">Log in</Link>
        </div>
      </form>
    </div>
  );
}
