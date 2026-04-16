import { useEffect, useMemo, useState } from "react";
import { getSession } from "../utils/session";
import { getLocalTeamState, hydrateTeamState, saveTeamState } from "../utils/teamProtection";
import { AppPageShell, AppSurface } from "../components/ui/app-page-shell";

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
    <AppPageShell badge="Team Protection" backTo="/dashboard" backLabel="Dashboard">
      <div className="mx-auto max-w-4xl space-y-6 px-0 py-4">
        <AppSurface className="space-y-4 p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Referral + Team Protection</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Protect together, pay less together</h1>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={teamState.teamName}
              onChange={(event) => setTeamState((prev) => ({ ...prev, teamName: event.target.value }))}
              placeholder="Team name"
              className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCreateTeam}
              className="h-11 rounded-xl bg-white text-xs font-black uppercase tracking-widest text-zinc-950 hover:bg-zinc-200"
            >
              Create or refresh invite code
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Invite Code</p>
            <p className="text-xl font-black tracking-tight text-white">{teamState.inviteCode || "Not generated"}</p>
          </div>
        </AppSurface>

        <AppSurface className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Team Roster</p>
            <span className="text-xs font-black text-emerald-300">Discount unlocked: {discountPct}%</span>
          </div>

          <div className="flex gap-3">
            <input
              value={memberName}
              onChange={(event) => setMemberName(event.target.value)}
              placeholder="Add verified member name"
              className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddMember}
              className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[10px] font-black uppercase tracking-widest text-zinc-100"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {(teamState.members || []).length === 0 ? (
              <p className="text-sm text-zinc-400">No members yet.</p>
            ) : (
              teamState.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm font-semibold text-zinc-100">{member.name}</p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Verified</span>
                </div>
              ))
            )}
          </div>
        </AppSurface>
      </div>
    </AppPageShell>
  );
}
