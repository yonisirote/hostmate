export function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome home</h1>
        <p className="mt-1 text-sm text-slate-600">
          Plan warm, inviting meals that work for everyone.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <div className="text-sm font-medium">Upcoming meals</div>
        <div className="mt-2 text-sm text-slate-600">(Next step: load from `GET /api/meals`)</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm font-medium">Guests</div>
          <div className="mt-2 text-sm text-slate-600">Create guests and manage allergies.</div>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm font-medium">Dishes</div>
          <div className="mt-2 text-sm text-slate-600">Save dishes you can cook.</div>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm font-medium">Meals</div>
          <div className="mt-2 text-sm text-slate-600">Invite guests and get a menu suggestion.</div>
        </div>
      </div>
    </div>
  );
}
