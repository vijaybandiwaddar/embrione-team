
const members = [
  {
    name: "Aarav Sharma",
    role: "Web Development Head",
    domain: "Web Development",
    initials: "AS",
    bio: "Building useful digital experiences with code and creativity.",
  },
  {
    name: "Diya Nair",
    role: "Core Member",
    domain: "Design",
    initials: "DN",
    bio: "Turning ideas into thoughtful and intuitive designs.",
  },
  {
    name: "Rohan Patel",
    role: "Core Member",
    domain: "Web Development",
    initials: "RP",
    bio: "Learning, experimenting, and building for the web.",
  },
  {
    name: "Meera Rao",
    role: "Member",
    domain: "Operations",
    initials: "MR",
    bio: "Helping teams turn plans into successful events.",
  },
];

export default function TeamPage() {
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

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member) => (
            <article
              key={member.name}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-cyan-400/50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-xl font-bold text-cyan-300">
                {member.initials}
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                {member.name}
              </h2>

              <p className="mt-1 text-sm text-cyan-300">
                {member.role}
              </p>

              <p className="mt-3 text-xs uppercase tracking-wider text-zinc-500">
                {member.domain}
              </p>

              <p className="mt-4 text-sm leading-6 text-zinc-400">
                {member.bio}
              </p>
            </article>
          ))}
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
