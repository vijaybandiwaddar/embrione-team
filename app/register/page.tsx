
"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "@/lib/supabase";

const MAX_SOURCE_SIZE = 8 * 1024 * 1024;
const MAX_WEBP_SIZE = 2 * 1024 * 1024;

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    domain: "",
    position: "",
    bio: "",
  });

  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function handleChange(
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
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
      canvas.width = Math.max(
        1,
        Math.round(bitmap.width * scale)
      );
      canvas.height = Math.max(
        1,
        Math.round(bitmap.height * scale)
      );

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not process this image.");
      }

      context.drawImage(
        bitmap,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("WebP conversion failed."));
            }
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
        !["image/jpeg", "image/png", "image/webp"].includes(
          file.type
        )
      ) {
        throw new Error("Choose a JPEG, PNG, or WebP image.");
      }

      if (file.size > MAX_SOURCE_SIZE) {
        throw new Error(
          "The original image must be 8 MB or smaller."
        );
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

      // Stage 1: Upload the profile photo.
      const { error: uploadError } = await supabase.storage
        .from("team-photos")
        .upload(filePath, photo, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPath = filePath;

      // Stage 2: Save the application in the database.
      currentStage = "Saving application";

      const { error: insertError } = await supabase
        .from("team_members")
        .insert({
          ...form,
          image_url: uploadedPath,
          status: "pending",
        });

      if (insertError) {
        throw insertError;
      }

      setMessage(
        "Application and photo submitted successfully! Your application is pending admin approval."
      );

      setForm({
        full_name: "",
        email: "",
        domain: "",
        position: "",
        bio: "",
      });

      setPhoto(null);
      setPhotoPreview("");

      const input = document.getElementById(
        "profile-photo"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }
    } catch (error) {
      const details =
        error instanceof Error
          ? error.message
          : String(error);

      setMessage(
        `Submission failed during "${currentStage}": ${details}`
      );

      console.error("Registration failed:", {
        stage: currentStage,
        error,
      });

      // If the photo uploaded but the database insert failed,
      // attempt to remove the unused photo.
      if (
        uploadedPath &&
        currentStage === "Saving application"
      ) {
        const { error: cleanupError } = await supabase.storage
          .from("team-photos")
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error(
            "Photo cleanup failed:",
            cleanupError.message
          );
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/15 bg-white/5 p-3 text-white outline-none focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-[#080b12] px-5 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-sm font-semibold tracking-[0.3em] text-cyan-400">
          THE EMBRIONE
        </p>

        <h1 className="text-4xl font-bold">Join Our Team</h1>

        <p className="mt-3 text-gray-400">
          Tell us about yourself and apply to become a team member.
        </p>

        <form
          className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="mb-2 block" htmlFor="full_name">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block" htmlFor="domain">
              Domain
            </label>
            <select
              id="domain"
              name="domain"
              value={form.domain}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-white/15 bg-[#101522] p-3 outline-none focus:border-cyan-400"
            >
              <option value="">Select your domain</option>
              <option value="Technology">Technology</option>
              <option value="Design">Design</option>
              <option value="Management">Management</option>
              <option value="Marketing">Marketing</option>
              <option value="Content">Content</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block" htmlFor="position">
              Position
            </label>
            <input
              id="position"
              name="position"
              value={form.position}
              onChange={handleChange}
              required
              placeholder="e.g. Developer, Designer"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block" htmlFor="bio">
              Short Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us a little about yourself..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block" htmlFor="profile-photo">
              Profile Photo
            </label>

            <input
              id="profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              disabled={submitting || converting}
              required={!photo}
              className="w-full rounded-lg border border-white/15 bg-white/5 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:font-semibold file:text-black"
            />

            <p className="mt-2 text-xs text-gray-400">
              JPEG, PNG, or WebP. Original image up to 8 MB;
              converted WebP must be no larger than 2 MB.
            </p>

            {converting && (
              <p className="mt-3 text-sm text-cyan-300">
                Converting your photo to WebP...
              </p>
            )}

            {photoPreview && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-gray-300">
                  Photo preview
                </p>

                <img
                  src={photoPreview}
                  alt="Profile photo preview"
                  className="h-32 w-32 rounded-xl border border-white/15 object-cover"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Converted size:{" "}
                  {(photo?.size ?? 0) / 1024 < 1
                    ? `${photo?.size ?? 0} bytes`
                    : `${(
                        (photo?.size ?? 0) / 1024
                      ).toFixed(1)} KB`}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || converting}
            className="w-full rounded-lg bg-cyan-400 px-5 py-3 font-bold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Submitting application..."
              : "Submit Application"}
          </button>

          {message && (
            <p
              role="status"
              aria-live="polite"
              className="break-words rounded-lg bg-white/5 p-3 text-sm text-cyan-300"
            >
              {message}
            </p>
          )}

          <p className="text-center text-xs text-gray-500">
            Applications require admin approval before appearing
            on the team page.
          </p>
        </form>
      </div>
    </main>
  );
}
