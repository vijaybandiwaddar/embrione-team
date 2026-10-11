
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  full_name: string;
  email: string;
  domain: string;
  position: string;
  srn: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  branch: string | null;
  semester: number | null;
  bio: string | null;
  image_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  photoUrl?: string;
};

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const loadApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select(
        "id, full_name, email, domain, position, srn, linkedin_url, github_url, branch, semester, bio, image_url, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as Application[];

    const withPhotos = await Promise.all(
      rows.map(async (app) => {
        if (!app.image_url) return app;

        const { data: photoData, error: photoError } = await supabase.storage
          .from("team-photos")
          .createSignedUrl(app.image_url, 300);

        if (photoError) {
          console.error("Could not create photo URL:", photoError.message);
          return app;
        }

        return { ...app, photoUrl: photoData.signedUrl };
      })
    );

    setApplications(withPhotos);
  }, []);

  const verifyAdmin = useCallback(async () => {
    const { data, error } = await supabase.rpc("is_admin");

    if (error) throw error;

    if (data !== true) {
      await supabase.auth.signOut();
      setLoggedIn(false);
      throw new Error("This account is not authorized as an admin.");
    }

    setLoggedIn(true);
    await loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      const { data } = await supabase.auth.getSession();

      if (!active || !data.session) return;

      try {
        await verifyAdmin();
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not verify admin access."
          );
        }
      }
    }

    void checkExistingSession();

    return () => {
      active = false;
    };
  }, [verifyAdmin]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await verifyAdmin();
      setPassword("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Sign-in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(
    app: Application,
    status: "approved" | "rejected"
  ) {
    const action = status === "approved" ? "approve" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${app.full_name}'s application?`
      )
    ) {
      return;
    }

    setWorkingId(app.id);
    setMessage("");

    try {
      const { data: updated, error } = await supabase
        .from("team_members")
        .update({ status })
        .eq("id", app.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!updated) {
        throw new Error(
          "No application was updated. It may already have been reviewed, or your permissions may be insufficient."
        );
      }

      setMessage(`Application ${status} successfully.`);
      await loadApplications();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update the application."
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteApplication(app: Application) {
    const confirmed = window.confirm(
      `Permanently delete ${app.full_name}'s profile?\n\nThis action cannot be undone. The application and its uploaded photo will be removed where permissions allow.`
    );

    if (!confirmed) return;

    setWorkingId(app.id);
    setMessage("");

    try {
      // Delete the application first. Supabase RLS must authorize this.
      const { data: deleted, error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", app.id)
        .select("id")
        .maybeSingle();

      if (error) throw error;

      if (!deleted) {
        throw new Error(
          "Profile was not deleted. Check admin permissions and try again."
        );
      }

      // image_url stores the Storage object path, not its signed URL.
      if (app.image_url) {
        const { error: photoError } = await supabase.storage
          .from("team-photos")
          .remove([app.image_url]);

        if (photoError) {
          console.error(
            "Profile photo cleanup failed:",
            photoError.message
          );

          setApplications((current) =>
            current.filter((item) => item.id !== app.id)
          );

          setMessage(
            "Profile deleted, but its photo could not be removed. Check Storage permissions."
          );
          return;
        }
      }

      setApplications((current) =>
        current.filter((item) => item.id !== app.id)
      );

      setMessage(`Profile for ${app.full_name} deleted successfully.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete this profile."
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    setLoggedIn(false);
    setApplications([]);
    setEmail("");
    setPassword("");
    setFilter("all");
    setMessage("You have been signed out.");
  }

  const pending = applications.filter((a) => a.status === "pending").length;
  const approved = applications.filter((a) => a.status === "approved").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  const filteredApplications =
    filter === "all"
      ? applications
      : applications.filter((app) => app.status === filter);

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10";

  const stats = [
    {
      label: "Total applications",
      count: applications.length,
      icon: "◈",
      color: "text-white",
      accent: "border-white/10",
    },
    {
      label: "Pending review",
      count: pending,
      icon: "◷",
      color: "text-amber-300",
      accent: "border-amber-400/20",
    },
    {
      label: "Approved members",
      count: approved,
      icon: "✓",
      color: "text-cyan-300",
      accent: "border-cyan-400/20",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#070b14] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/[0.07] blur-[120px]" />
        <div className="absolute right-0 top-[40%] h-72 w-72 rounded-full bg-blue-500/[0.04] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        {/* Navigation */}
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-lg font-black text-cyan-300 transition group-hover:bg-cyan-400/20">
              E
            </div>

            <div>
              <p className="text-sm font-bold tracking-[0.18em]">
                EMBRIONE
              </p>
              <p className="mt-0.5 text-[10px] tracking-[0.2em] text-slate-500">
                PES UNIVERSITY
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/team"
              className="hidden rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white sm:block"
            >
              View Team
            </Link>

            <span className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-2 text-xs font-medium text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Admin Portal
            </span>
          </div>
        </header>

        {/* Page heading */}
        <section className="pb-8 pt-10 sm:pt-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
            <span className="text-cyan-300">✳</span>
            Team Management System
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Admin{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            Review applications, manage membership approvals, and keep your
            team up to date.
          </p>
        </section>

        {/* Notifications */}
        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
              message.toLowerCase().includes("successfully") ||
              message.toLowerCase().includes("signed out")
                ? "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-200"
                : "border-white/10 bg-white/[0.04] text-slate-300"
            }`}
          >
            <span className="mt-0.5 text-base">
              {message.toLowerCase().includes("successfully") ||
              message.toLowerCase().includes("signed out")
                ? "✓"
                : "ⓘ"}
            </span>
            <p className="break-words">{message}</p>
          </div>
        )}

        {!loggedIn ? (
          /* Login */
          <section className="grid gap-8 pb-16 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-16">
            <div className="max-w-xl">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.08] text-2xl text-cyan-300">
                ◈
              </div>

              <h2 className="text-2xl font-semibold sm:text-3xl">
                Welcome back, admin.
              </h2>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
                Sign in with your authorized administrator account to review
                submissions and manage the Embrione team.
              </p>

              <div className="mt-8 space-y-4 text-sm text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                    ✓
                  </span>
                  Secure administrator verification
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                    ✓
                  </span>
                  Application review and approval
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                    ✓
                  </span>
                  Team membership management
                </div>
              </div>
            </div>

            <form
              onSubmit={handleLogin}
              className="rounded-2xl border border-white/[0.09] bg-[#0b111d]/90 p-6 shadow-2xl shadow-black/20 sm:p-8"
            >
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Restricted access
                </p>
                <h3 className="mt-2 text-xl font-semibold">Admin sign in</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your administrator credentials.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email address
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    placeholder="admin@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-bold text-[#071019] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Verifying access..." : "Sign in to dashboard"}
                  {!loading && (
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  )}
                </button>
              </div>

              <p className="mt-6 text-center text-xs leading-5 text-slate-500">
                Access is limited to authorized administrators.
              </p>
            </form>
          </section>
        ) : (
          <>
            {/* Dashboard toolbar */}
            <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  Administrator session active
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Review submissions and manage team membership.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    loadApplications().catch((error) =>
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "Could not refresh applications."
                      )
                    )
                  }
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:bg-white/[0.04] hover:text-white"
                >
                  ↻ Refresh
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-red-400/20 px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-400/[0.08]"
                >
                  Sign out
                </button>
              </div>
            </section>

            {/* Statistics */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className={`rounded-2xl border ${stat.accent} bg-[#0b111d]/80 p-5 transition hover:bg-white/[0.035] sm:p-6`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-xl ${stat.color}`}
                    >
                      {stat.icon}
                    </span>
                  </div>

                  <p
                    className={`mt-5 text-4xl font-semibold tracking-tight ${stat.color}`}
                  >
                    {stat.count}
                  </p>

                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full ${
                        stat.label === "Pending review"
                          ? "bg-amber-300"
                          : stat.label === "Approved members"
                            ? "bg-cyan-300"
                            : "bg-blue-400"
                      }`}
                      style={{
                        width:
                          applications.length > 0
                            ? `${Math.min(
                                100,
                                (stat.count / applications.length) * 100
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                </article>
              ))}
            </section>

            {/* Application list */}
            <section className="pb-16 pt-12">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Membership
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Applications
                    <span className="ml-3 align-middle text-sm font-normal text-slate-500">
                      {filteredApplications.length}
                    </span>
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Review each application before making a decision.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    ["all", "pending", "approved", "rejected"] as const
                  ).map((item) => {
                    const selected = filter === item;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setFilter(item)}
                        aria-pressed={selected}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition ${
                          selected
                            ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
                            : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        {item}
                        {item === "pending" && pending > 0
                          ? ` (${pending})`
                          : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-2xl text-slate-400">
                    ◈
                  </div>
                  <h3 className="mt-5 text-lg font-medium">
                    No applications yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    New team submissions will appear here when someone
                    completes the registration form.
                  </p>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-14 text-center">
                  <h3 className="text-lg font-medium">
                    No {filter} applications
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Try another filter to view more applications.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="mt-4 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    View all applications →
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {filteredApplications.map((app) => (
                    <article
                      key={app.id}
                      className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b111d]/80 transition hover:border-white/[0.14]"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex items-start gap-4">
                          {app.photoUrl ? (
                            <img
                              src={app.photoUrl}
                              alt={`${app.full_name}'s profile`}
                              className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-xs text-slate-500">
                              No photo
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="break-words text-lg font-semibold">
                                {app.full_name}
                              </h3>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize tracking-wide ${
                                  app.status === "approved"
                                    ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
                                    : app.status === "rejected"
                                      ? "border-red-400/20 bg-red-400/[0.07] text-red-300"
                                      : "border-amber-400/20 bg-amber-400/[0.07] text-amber-200"
                                }`}
                              >
                                {app.status}
                              </span>
                            </div>

                            <p className="mt-1 break-all text-sm text-slate-400">
                              {app.email}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.05] px-2.5 py-1 text-xs text-cyan-200">
                                {app.domain}
                              </span>
                              <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300">
                                {app.position}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Additional registration details */}
                        <div className="mt-4 grid gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-4 sm:grid-cols-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                              SRN
                            </p>
                            <p className="mt-1 break-all text-sm text-slate-300">
                              {app.srn || "Not provided"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                              Branch
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                              {app.branch || "Not provided"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                              Semester
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                              {app.semester ?? "Not provided"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                              Profile links
                            </p>
                            <div className="mt-1 flex flex-wrap gap-3 text-sm">
                              {app.linkedin_url && (
                                <a
                                  href={app.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-300 hover:text-cyan-200"
                                >
                                  LinkedIn ↗
                                </a>
                              )}

                              {app.github_url && (
                                <a
                                  href={app.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-300 hover:text-cyan-200"
                                >
                                  GitHub ↗
                                </a>
                              )}

                              {!app.linkedin_url && !app.github_url && (
                                <span className="text-slate-500">
                                  No links provided
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {app.bio && (
                          <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/10 p-4">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              About the applicant
                            </p>
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                              {app.bio}
                            </p>
                          </div>
                        )}

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                              Submitted
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(app.created_at).toLocaleString()}
                            </p>
                          </div>

                          <span className="text-[10px] text-slate-600">
                            ID: {app.id.slice(0, 8)}
                          </span>
                        </div>

                        {app.status === "pending" && (
                          <div className="mt-5 grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              disabled={workingId === app.id}
                              onClick={() => changeStatus(app, "approved")}
                              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-3 py-3 text-sm font-bold text-[#071019] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {workingId === app.id ? (
                                "Working..."
                              ) : (
                                <>
                                  <span>✓</span> Approve
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={workingId === app.id}
                              onClick={() => changeStatus(app, "rejected")}
                              className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.04] px-3 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {workingId === app.id ? (
                                "Working..."
                              ) : (
                                <>
                                  <span>×</span> Reject
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {app.status !== "pending" && (
                          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center text-xs text-slate-500">
                            This application has already been reviewed.
                          </div>
                        )}

                        {/* Delete profile */}
                        <button
                          type="button"
                          disabled={workingId === app.id}
                          onClick={() => deleteApplication(app)}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-400/[0.05] px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {workingId === app.id
                            ? "Working..."
                            : "Delete Profile"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="flex flex-col gap-3 border-t border-white/[0.08] py-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 The Embrione · PES University</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="transition hover:text-cyan-300">
              Home
            </Link>
            <Link href="/team" className="transition hover:text-cyan-300">
              Meet the Team
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
