
"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "@/lib/supabase";

const MAX_SOURCE_SIZE = 8 * 1024 * 1024;
const MAX_WEBP_SIZE = 2 * 1024 * 1024;

const DOMAINS = [
  "Web Development",
  "Design",
  "Logistics",
  "Operations",
  "Sponsorship",
  "Hospitality",
  "Social Media",
  "Event Management",
];

const POSITIONS = ["Head", "Vice-Head", "Core Member", "Member"];

const BRANCHES = [
  "CSE",
  "AIML",
  "ECE",
  "EEE",
  "ME",
  "Biotech",
  "CSBS",
  "Other",
];

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const INITIAL_FORM = {
  full_name: "",
  domain: "",
  position: "",
  srn: "",
  email: "",
  linkedin_url: "",
  github_url: "",
  branch: "",
  semester: "",
  bio: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function handleChange(
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "srn" ? value.toUpperCase() : value,
    }));
  }

  async function convertToWebP(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);

    try {
      const maxDimension = 1200;
      const scale = Math.min(
        1,
        maxDimension / Math.max(bitmap.width, bitmap.height)
      );

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not process this image.");
      }

      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new Error("WebP conversion failed."));
          },
          "image/webp",
          0.82
        );
      });

      if (blob.type !== "image/webp") {
        throw new Error(
          "Your browser could not convert this image to WebP."
        );
      }

      if (blob.size > MAX_WEBP_SIZE) {
        throw new Error(
          "The converted image exceeds 2 MB. Please choose a smaller image."
        );
      }

      return blob;
    } finally {
      bitmap.close();
    }
  }

  async function handlePhotoChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage("");
    setPhoto(null);
    setPhotoPreview("");
    setConverting(true);

    try {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ) {
        throw new Error("Choose a JPEG, PNG, or WebP image.");
      }

      if (file.size > MAX_SOURCE_SIZE) {
        throw new Error("The original image must be 8 MB or smaller.");
      }

      const webp = await convertToWebP(file);
      setPhoto(webp);
      setPhotoPreview(URL.createObjectURL(webp));
      setMessage("Photo converted to WebP successfully!");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not process this image."
      );
      e.target.value = "";
    } finally {
      setConverting(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!photo) {
      setMessage("Please choose a profile photo first.");
      return;
    }

    setSubmitting(true);

    let uploadedPath: string | null = null;
    let currentStage = "Uploading profile photo";

    try {
      const filePath = `submissions/${crypto.randomUUID()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("team-photos")
        .upload(filePath, photo, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      uploadedPath = filePath;
      currentStage = "Saving application";

      const { error: insertError } = await supabase
        .from("team_members")
        .insert({
          full_name: form.full_name.trim(),
          domain: form.domain,
          position: form.position,
          srn: form.srn.trim().toUpperCase(),
          email: form.email.trim(),
          linkedin_url: form.linkedin_url.trim(),
          github_url: form.github_url.trim(),
          branch: form.branch,
          semester: Number(form.semester),
          bio: form.bio.trim(),
          image_url: uploadedPath,
          status: "pending",
        });

      if (insertError) throw insertError;

      setMessage(
        "Application and photo submitted successfully! Your application is pending admin approval."
      );

      setForm({ ...INITIAL_FORM });
      setPhoto(null);
      setPhotoPreview("");

      const input = document.getElementById(
        "profile-photo"
      ) as HTMLInputElement | null;

      if (input) input.value = "";
    } catch (error) {
      const details =
        error instanceof Error ? error.message : String(error);

      const isDuplicateSRN =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505";

      setMessage(
        isDuplicateSRN
          ? "An application with this SRN already exists. Please check your SRN."
          : `Submission failed during "${currentStage}": ${details}`
      );

      console.error("Registration failed:", {
        stage: currentStage,
        error,
      });

      if (uploadedPath && currentStage === "Saving application") {
        const { error: cleanupError } = await supabase.storage
          .from("team-photos")
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error("Photo cleanup failed:", cleanupError.message);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0a111e] px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-300";

  const sectionClass =
    "text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/[0.09] blur-[120px]" />
        <div className="absolute right-0 top-[600px] h-80 w-80 rounded-full bg-blue-500/[0.06] blur-[120px]" />
      </div>

      <nav className="relative z-10 border-b border-white/[0.08] bg-[#070b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
          <a href="/" className="text-xl font-bold tracking-[0.12em]">
            EMBRIONE<span className="text-cyan-400">.</span>
          </a>
          <a
            href="/team"
            className="text-sm text-slate-400 transition hover:text-cyan-300"
          >
            Meet the team <span className="text-cyan-400">↗</span>
          </a>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Become part of the community
          </div>

          <h1 className="mt-7 text-4xl font-bold tracking-tight sm:text-6xl">
            Your journey
            <br />
            starts{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              here.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
            Share your story, showcase your skills, and take the first
            step toward joining The Embrione community at PES University.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0c1220]/90 shadow-2xl shadow-black/20"
        >
          <div className="border-b border-white/[0.08] px-6 py-6 sm:px-9">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-xl text-cyan-300">
                ✳
              </div>
              <div>
                <h2 className="text-xl font-semibold">Member application</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Fill in your details to apply.
                </p>
              </div>
            </div>
            <p className="mt-6 text-xs text-slate-500">
              <span className="text-cyan-400">*</span> Required fields. Social
              profile links are optional.
            </p>
          </div>

          <div className="space-y-7 p-6 sm:p-9">
            <section>
              <p className={sectionClass}>01 / Personal details</p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="full_name">
                    Full name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    placeholder="Enter your full name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="srn">
                    SRN *
                  </label>
                  <input
                    id="srn"
                    name="srn"
                    type="text"
                    value={form.srn}
                    onChange={handleChange}
                    required
                    placeholder="e.g. PES1UG23CS001"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="email">
                    Email address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <div className="h-px bg-white/[0.07]" />

            <section>
              <p className={sectionClass}>02 / Domain and position</p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="domain">
                    Domain *
                  </label>
                  <select
                    id="domain"
                    name="domain"
                    value={form.domain}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select your domain</option>
                    {DOMAINS.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="position">
                    Position *
                  </label>
                  <select
                    id="position"
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select your position</option>
                    {POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <div className="h-px bg-white/[0.07]" />

            <section>
              <p className={sectionClass}>03 / Academic details</p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="branch">
                    Branch *
                  </label>
                  <select
                    id="branch"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select your branch</option>
                    {BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="semester">
                    Semester *
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={form.semester}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select your semester</option>
                    {SEMESTERS.map((semester) => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <div className="h-px bg-white/[0.07]" />

            <section>
              <p className={sectionClass}>04 / Social profiles (optional)</p>

              <div className="mt-5 space-y-5">
                <div>
                  <label className={labelClass} htmlFor="linkedin_url">
                    LinkedIn URL <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="linkedin_url"
                    name="linkedin_url"
                    type="url"
                    value={form.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://www.linkedin.com/in/your-profile"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="github_url">
                    GitHub URL <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="github_url"
                    name="github_url"
                    type="url"
                    value={form.github_url}
                    onChange={handleChange}
                    placeholder="https://github.com/your-username"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <div className="h-px bg-white/[0.07]" />

            <section>
              <p className={sectionClass}>05 / About you</p>

              <div className="mt-5">
                <label className={labelClass} htmlFor="bio">
                  Description / Bio *
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  rows={4}
                  placeholder="Tell us about your interests, skills, and what excites you..."
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-2 text-right text-xs text-slate-500">
                  {form.bio.length}/200 characters
                </p>
              </div>
            </section>

            <div className="h-px bg-white/[0.07]" />

            <section>
              <p className={sectionClass}>06 / Profile picture</p>

              <label className={`${labelClass} mt-5`} htmlFor="profile-photo">
                Profile picture *
              </label>

              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#101827]">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile photo preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <span className="text-3xl text-cyan-300">＋</span>
                        <p className="mt-1 text-[10px] text-slate-500">
                          PREVIEW
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Upload your profile picture</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      JPEG, PNG, or WebP. Your image will be converted
                      to WebP before submission.
                    </p>
                    <input
                      id="profile-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      disabled={submitting || converting}
                      required={!photo}
                      className="mt-4 block w-full min-w-0 text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2.5 file:font-semibold file:text-[#07111b] hover:file:bg-cyan-300 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="rounded-lg border border-white/[0.08] px-3 py-2">
                    Original: up to 8 MB
                  </span>
                  <span className="rounded-lg border border-white/[0.08] px-3 py-2">
                    WebP: up to 2 MB
                  </span>
                  <span className="rounded-lg border border-white/[0.08] px-3 py-2">
                    Max dimension: 1200 px
                  </span>
                </div>

                {converting && (
                  <p role="status" className="mt-4 text-sm text-cyan-300">
                    <span className="mr-2 inline-block animate-spin">◌</span>
                    Converting your photo to WebP...
                  </p>
                )}

                {photo && (
                  <p className="mt-4 text-xs text-emerald-300">
                    ✓ Photo ready · {(photo.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </section>

            <div className="h-px bg-white/[0.07]" />

            <section>
              <p className={sectionClass}>07 / Live member-card preview</p>
              <div className="mt-5 overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#080f1b] p-5">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#101827]">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Live member preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl text-cyan-300">
                        ✳
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-semibold">
                      {form.full_name || "Your name"}
                    </h3>
                    <p className="mt-1 text-sm text-cyan-300">
                      {form.position || "Position"}
                      {form.domain ? ` · ${form.domain}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {form.branch || "Branch"}
                      {form.semester ? ` · Semester ${form.semester}` : ""}
                    </p>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                  {form.bio || "Your short bio will appear here."}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Preview only. Your profile appears publicly after admin approval.
              </p>
            </section>

            {message && (
              <div
                role="status"
                aria-live="polite"
                className="break-words rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 text-sm leading-6 text-cyan-200"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || converting}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 px-5 py-4 font-bold text-[#07111b] shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:shadow-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {submitting
                ? "Submitting application..."
                : converting
                  ? "Preparing your photo..."
                  : "Submit application"}
              {!submitting && !converting && (
                <span className="transition group-hover:translate-x-1">→</span>
              )}
            </button>

            <p className="text-center text-xs leading-6 text-slate-500">
              Your application will be sent for admin review. Your profile
              will appear on the team page only after approval.
            </p>
          </div>
        </form>

        <footer className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-6 text-sm text-slate-500 sm:flex-row">
          <a href="/" className="transition hover:text-cyan-300">
            <span className="text-cyan-400">←</span> Back to home
          </a>
          <p>© 2026 The Embrione · PES University</p>
        </footer>
      </div>
    </main>
  );
}
