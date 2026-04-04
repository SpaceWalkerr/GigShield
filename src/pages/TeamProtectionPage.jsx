import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "../utils/session";
import { getLocalTeamState, hydrateTeamState, saveTeamState } from "../utils/teamProtection";

function buildCode() {
  return `GS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export default function TeamProtectionPage() {
  const [session] = useState(() => getSession());
  const [teamState, setTeamState] = useState(() => getLocalTeamState());
  const [memberName, setMemberName] = useState("");

  const discountPct = useMemo(() => Math.min(18, teamState.members.length * 2), [teamState.members.length]);

  useEffect(() => {
    let alive = true;

    const syncTeam = async () => {
      const hydrated = await hydrateTeamState({ workerId: session?.workerId });
      if (!alive) return;
      setTeamState(hydrated);
    };

    syncTeam();

    return () => {
      alive = false;
    };
  }, [session?.workerId]);

  const handleCreateTeam = () => {
    const next = {
      ...teamState,
      teamName: teamState.teamName || "City Shield Squad",
      inviteCode: teamState.inviteCode || buildCode(),
    };
    setTeamState(next);
    saveTeamState(next, { workerId: session?.workerId });
  };

  const handleAddMember = () => {
    if (!memberName.trim()) return;
    const next = {
      ...teamState,
      inviteCode: teamState.inviteCode || buildCode(),
      members: [...(teamState.members || []), { id: `${Date.now()}`, name: memberName.trim(), verified: true }],
    };
    setTeamState(next);
    saveTeamState(next, { workerId: session?.workerId });
    setMemberName("");
  };

  return (
    <main className="min-h-screen bg-[#f4f5f7] pb-24 text-gray-900">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight">GIGSHIELD.</Link>
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200">
            Team Protection
          </span>
        </div>
        <Link to="/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <section className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Referral + Team Protection</p>
          <h1 className="text-3xl font-black tracking-tight">Protect together, pay less together</h1>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={teamState.teamName}
              onChange={(event) => setTeamState((prev) => ({ ...prev, teamName: event.target.value }))}
              placeholder="Team name"
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold focus:border-gray-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCreateTeam}
              className="h-11 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800"
            >
              Create or refresh invite code
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Invite Code</p>
            <p className="text-xl font-black tracking-tight">{teamState.inviteCode || "Not generated"}</p>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Team Roster</p>
            <span className="text-xs font-black text-emerald-700">Discount unlocked: {discountPct}%</span>
          </div>

          <div className="flex gap-3">
            <input
              value={memberName}
              onChange={(event) => setMemberName(event.target.value)}
              placeholder="Add verified member name"
              className="flex-1 h-10 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold focus:border-gray-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddMember}
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-700"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {(teamState.members || []).length === 0 ? (
              <p className="text-sm text-gray-500">No members yet.</p>
            ) : (
              teamState.members.map((member) => (
                <div key={member.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Verified</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
