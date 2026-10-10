
export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between border-b border-white/10 px-8 py-5">
        <h1 className="text-xl font-bold tracking-wide">
          EMBRIONE<span className="text-cyan-400">.</span>
        </h1>
        <span className="text-sm text-zinc-400">Team Portal</span>
      </nav>

      <section className="mx-auto flex min-h-[75vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
          PEOPLE · IDEAS · INNOVATION
        </p>

        <h2 className="text-5xl font-bold tracking-tight sm:text-7xl">
          Meet the people
          <br />
          <span className="text-cyan-400">behind the vision.</span>
        </h2>

        <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
          A central space to discover our team, celebrate our members,
          and connect with the people building something meaningful.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/team"
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-300"
          >
            Meet the team →
          </a>
          <a
            href="/register"
            className="rounded-xl border border-white/20 px-6 py-3 font-semibold transition hover:bg-white/10"
          >
            Register as a member
          </a>
        </div>

        <p className="mt-12 text-sm text-zinc-600">
          The Embrione · PES University
        </p>
      </section>
    </main>
  );
}
