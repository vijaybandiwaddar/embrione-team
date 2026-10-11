
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

        if (!cancelled) setMembers(membersWithPhotos);
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
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] text-white">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/[0.09] blur-[120px]" />
        <div className="absolute right-0 top-[600px] h-72 w-72 rounded-full bg-blue-500/[0.06] blur-[110px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/[0.08] bg-[#070b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
          <a href="/" className="group text-xl font-bold tracking-[0.12em]">
            EMBRIONE
            <span className="text-cyan-400 transition group-hover:text-cyan-300">
              .
            </span>
          </a>

          <div className="flex items-center gap-3 sm:gap-6">
            <a
              href="/team"
              className="text-sm font-medium text-cyan-300"
            >
              Our team
            </a>
            <a
              href="/register"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
            >
              Join us <span className="text-cyan-400">↗</span>
            </a>
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-14 sm:px-10 sm:pt-20">
        {/* Hero */}
        <section className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            The Embrione · PES University
          </div>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-7xl">
                Great things
                <br />
                happen when
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  people connect.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
                Meet the people behind the ideas. Discover our community,
                explore different domains, and get to know the team building
                what comes next.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/[0.09] bg-white/[0.03] p-5 lg:min-w-48">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-xl text-cyan-300">
                ✳
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {loading ? "—" : filteredMembers.length}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {domainFilter === "All" && positionFilter === "All"
                    ? "Team members"
                    : "Matching members"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-12 rounded-2xl border border-white/[0.09] bg-[#0d1320]/80 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Explore the community</p>
              <p className="mt-1 text-sm text-slate-500">
                Filter members by their domain and position.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                Domain
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="min-w-0 rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
                >
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex min-w-0 flex-col gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                Position
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="min-w-0 rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
                >
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {(domainFilter !== "All" || positionFilter !== "All") && (
            <button
              onClick={() => {
                setDomainFilter("All");
                setPositionFilter("All");
              }}
              className="mt-4 text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              ✕ Clear all filters
            </button>
          )}
        </section>

        {/* Loading state */}
        {loading && (
          <div
            role="status"
            className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6"
              >
                <div className="h-16 w-16 rounded-2xl bg-white/[0.08]" />
                <div className="mt-6 h-5 w-3/4 rounded bg-white/[0.08]" />
                <div className="mt-3 h-3 w-1/2 rounded bg-white/[0.06]" />
                <div className="mt-6 h-3 w-full rounded bg-white/[0.05]" />
                <div className="mt-2 h-3 w-4/5 rounded bg-white/[0.05]" />
              </div>
            ))}
            <span className="sr-only">Loading approved team members...</span>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            role="alert"
            className="mt-10 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10 text-xl text-red-300">
              !
            </div>
            <h2 className="mt-5 text-xl font-semibold">
              We couldn&apos;t load the team.
            </h2>
            <p className="mt-2 break-words text-sm leading-6 text-slate-400">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-[#07111b] transition hover:bg-cyan-300"
            >
              Try again →
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredMembers.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-2xl text-cyan-300">
              ◇
            </div>
            <h2 className="mt-6 text-xl font-semibold">
              No team members found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              {members.length === 0
                ? "There are no approved profiles to display yet. Check back when members have been approved."
                : "No approved members match these filters. Try changing your selection."}
            </p>
            {(domainFilter !== "All" || positionFilter !== "All") && (
              <button
                onClick={() => {
                  setDomainFilter("All");
                  setPositionFilter("All");
                }}
                className="mt-5 rounded-xl border border-cyan-400/30 px-5 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/10"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Member cards */}
        {!loading && !error && filteredMembers.length > 0 && (
          <>
            <div className="mt-10 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-400">
                Showing{" "}
                <span className="font-semibold text-white">
                  {filteredMembers.length}
                </span>{" "}
                {filteredMembers.length === 1 ? "member" : "members"}
              </p>
              <span className="hidden text-xs uppercase tracking-[0.18em] text-slate-600 sm:inline">
                People · Ideas · Innovation
              </span>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_15px_50px_rgba(34,211,238,0.06)]"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent opacity-0 transition group-hover:opacity-100" />

                    <div className="flex items-start justify-between gap-3">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={`${member.full_name}'s profile`}
                          loading="lazy"
                          className="h-16 w-16 rounded-2xl border border-white/10 object-cover ring-4 ring-white/[0.02]"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/10 text-xl font-bold text-cyan-300 ring-4 ring-white/[0.02]">
                          {initials || "TM"}
                        </div>
                      )}

                      <span
                        aria-hidden="true"
                        className="mt-1 h-2 w-2 rounded-full bg-cyan-400/60 transition group-hover:bg-cyan-300 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                      />
                    </div>

                    <div className="mt-6">
                      <h2 className="break-words text-lg font-semibold tracking-tight text-white transition group-hover:text-cyan-50">
                        {member.full_name}
                      </h2>

                      <p className="mt-1 break-words text-sm font-medium text-cyan-300">
                        {member.position}
                      </p>

                      <div className="mt-4 inline-flex max-w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
                        <span className="break-words text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                          {member.domain}
                        </span>
                      </div>
                    </div>

                    {member.bio ? (
                      <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                        {member.bio}
                      </p>
                    ) : (
                      <p className="mt-5 text-sm italic leading-6 text-slate-600">
                        A member of The Embrione community.
                      </p>
                    )}

                    <div className="mt-auto pt-6">
                      <div className="h-px bg-gradient-to-r from-cyan-400/20 via-white/[0.06] to-transparent" />
                      <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600">
                        The Embrione
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-20 border-t border-white/[0.08] pt-7">
          <div className="flex flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/"
              className="w-fit transition hover:text-cyan-300"
            >
              <span className="text-cyan-400">←</span> Back to home
            </a>

            <p>© 2026 The Embrione · PES University</p>

            <a
              href="/register"
              className="w-fit transition hover:text-cyan-300"
            >
              Become a member <span className="text-cyan-400">↗</span>
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
