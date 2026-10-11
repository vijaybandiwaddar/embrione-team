
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Member = {
  id: string;
  full_name: string;
  domain: string;
  position: string;
  bio: string | null;
  image_url: string | null;
  created_at: string;
  photoUrl?: string | null;
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [domainFilter, setDomainFilter] = useState("All");
  const [positionFilter, setPositionFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setLoading(true);
      setError("");

      try {
        const { data, error: fetchError } = await supabase.rpc(
          "get_approved_team_members"
        );

        if (fetchError) throw fetchError;

        const rows = (data ?? []) as Member[];

        const membersWithPhotos = await Promise.all(
          rows.map(async (member) => {
            if (!member.image_url) return member;

            const { data: photo, error: photoError } =
              await supabase.storage
                .from("team-photos")
                .createSignedUrl(member.image_url, 300);

            return {
              ...member,
              photoUrl: photoError ? null : photo?.signedUrl ?? null,
            };
          })
        );

        if (!cancelled) {
          setMembers(membersWithPhotos);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load team members."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, []);

  const domains = useMemo(
    () => [
      "All",
      ...Array.from(new Set(members.map((m) => m.domain))).sort(),
    ],
    [members]
  );

  const positions = useMemo(
    () => [
      "All",
      ...Array.from(new Set(members.map((m) => m.position))).sort(),
    ],
    [members]
  );

  const filteredMembers = members.filter(
    (member) =>
      (domainFilter === "All" || member.domain === domainFilter) &&
      (positionFilter === "All" || member.position === positionFilter)
  );

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          The Embrione · PES University
        </p>

        <h1 className="mt-4 text-4xl font-bold sm:text-6xl">
          Meet the team<span className="text-cyan-400">.</span>
        </h1>

        <p className="mt-4 max-w-xl text-zinc-400">
          The people, ideas, and teamwork behind what we create.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Domain
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Position
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && (
          <p className="mt-10 text-zinc-400">
            Loading approved team members...
          </p>
        )}

        {!loading && error && (
          <div className="mt-10 rounded-xl border border-red-400/30 bg-red-400/5 p-5">
            <p className="font-semibold text-red-300">
              Could not load the team.
            </p>
            <p className="mt-2 break-words text-sm text-zinc-400">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-zinc-950"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredMembers.length === 0 && (
          <div className="mt-10 rounded-2xl border border-white/10 p-8 text-center">
            <h2 className="text-xl font-semibold">
              No team members found
            </h2>
            <p className="mt-2 text-zinc-400">
              No approved members match these filters yet.
            </p>
            <button
              onClick={() => {
                setDomainFilter("All");
                setPositionFilter("All");
              }}
              className="mt-4 text-sm text-cyan-300 hover:text-cyan-200"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filteredMembers.length > 0 && (
          <p className="mt-8 text-sm text-zinc-500">
            Showing {filteredMembers.length}{" "}
            {filteredMembers.length === 1 ? "member" : "members"}
          </p>
        )}

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredMembers.map((member) => {
            const initials = member.full_name
              .trim()
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <article
                key={member.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-cyan-400/50"
              >
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={`${member.full_name}'s profile`}
                    className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-xl font-bold text-cyan-300">
                    {initials || "TM"}
                  </div>
                )}

                <h2 className="mt-5 break-words text-xl font-semibold">
                  {member.full_name}
                </h2>

                <p className="mt-1 text-sm text-cyan-300">
                  {member.position}
                </p>

                <p className="mt-3 text-xs uppercase tracking-wider text-zinc-500">
                  {member.domain}
                </p>

                {member.bio && (
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">
                    {member.bio}
                  </p>
                )}
              </article>
            );
          })}
        </div>

        <a
          href="/"
          className="mt-10 inline-block text-sm text-zinc-400 hover:text-cyan-300"
        >
          ← Back to home
        </a>
      </div>
    </main>
  );
}
