
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  full_name: string;
  email: string;
  domain: string;
  position: string;
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

  const loadApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select(
        "id, full_name, email, domain, position, bio, image_url, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as Application[];

    const withPhotos = await Promise.all(
      rows.map(async (app) => {
        if (!app.image_url) return app;

        const { data: photoData, error: photoError } =
          await supabase.storage
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

    checkExistingSession();

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

  async function handleLogout() {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setApplications([]);
    setMessage("You have been signed out.");
  }

  const pending = applications.filter((a) => a.status === "pending").length;
  const approved = applications.filter((a) => a.status === "approved").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  const inputClass =
    "w-full rounded-lg border border-white/15 bg-white/5 p-3 text-white outline-none focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-[#080b12] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-sm font-semibold tracking-[0.3em] text-cyan-400">
          THE EMBRIONE
        </p>

        <h1 className="text-3xl font-bold md:text-4xl">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-gray-400">
          Manage team applications and membership approvals.
        </p>

        {message && (
          <p
            role="status"
            aria-live="polite"
            className="mt-5 break-words rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
          >
            {message}
          </p>
        )}

        {!loggedIn ? (
          <form
            onSubmit={handleLogin}
            className="mt-8 max-w-md space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <h2 className="text-xl font-semibold">Admin Sign In</h2>

            <div>
              <label htmlFor="admin-email" className="mb-2 block">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-400 p-3 font-bold text-black disabled:opacity-60"
            >
              {loading ? "Checking access..." : "Sign In"}
            </button>
          </form>
        ) : (
          <>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleLogout}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              >
                Sign Out
              </button>
            </div>

            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "Pending", count: pending },
                { label: "Approved", count: approved },
                { label: "Rejected", count: rejected },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.count}</p>
                </div>
              ))}
            </section>

            <section className="mt-10">
              <h2 className="mb-5 text-2xl font-semibold">
                Applications
              </h2>

              {applications.length === 0 ? (
                <p className="rounded-xl border border-white/10 p-6 text-gray-400">
                  No applications found.
                </p>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {applications.map((app) => (
                    <article
                      key={app.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                    >
                      <div className="flex items-start gap-4">
                        {app.photoUrl ? (
                          <img
                            src={app.photoUrl}
                            alt={`${app.full_name}'s profile`}
                            className="h-20 w-20 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/10 text-xs text-gray-400">
                            No photo
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-lg font-semibold">
                            {app.full_name}
                          </h3>
                          <p className="break-all text-sm text-gray-400">
                            {app.email}
                          </p>
                          <p className="mt-1 text-sm text-cyan-300">
                            {app.domain} · {app.position}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            Status: {app.status}
                          </p>
                        </div>
                      </div>

                      {app.bio && (
                        <p className="mt-4 whitespace-pre-wrap break-words text-sm text-gray-300">
                          {app.bio}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-gray-500">
                        Submitted: {new Date(app.created_at).toLocaleString()}
                      </p>

                      {app.status === "pending" && (
                        <div className="mt-5 flex gap-3">
                          <button
                            disabled={workingId === app.id}
                            onClick={() => changeStatus(app, "approved")}
                            className="flex-1 rounded-lg bg-cyan-400 p-3 font-semibold text-black disabled:opacity-50"
                          >
                            {workingId === app.id ? "Working..." : "Approve"}
                          </button>
                          <button
                            disabled={workingId === app.id}
                            onClick={() => changeStatus(app, "rejected")}
                            className="flex-1 rounded-lg border border-red-400/50 p-3 font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                          >
                            {workingId === app.id ? "Working..." : "Reject"}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
