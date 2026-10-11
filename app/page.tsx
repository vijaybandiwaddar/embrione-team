
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050b16] text-white">
      {/* Background lighting */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

      {/* Navigation */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-white/[0.08] px-6 py-5 sm:px-10 lg:px-12">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-xl font-bold text-cyan-300">
            E
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-[0.16em]">
              EMBRIONE<span className="text-cyan-400">.</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              People · Ideas · Innovation
            </p>
          </div>
        </a>

        <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          <a href="/" className="text-white transition hover:text-cyan-300">
            Home
          </a>
          <a href="/team" className="transition hover:text-cyan-300">
            Our Team
          </a>
          <a href="/register" className="transition hover:text-cyan-300">
            Join Us
          </a>
        </div>

        <a
          href="/team"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
        >
          Explore <span className="text-cyan-300">↗</span>
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid min-h-[660px] max-w-7xl items-center gap-14 px-6 py-20 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-24">
        <div>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 text-xs font-medium tracking-wide text-cyan-200">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" />
            THE EMBRIONE TEAM PORTAL
          </div>

          <h2 className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Great things
            <br />
            happen when
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              people connect.
            </span>
          </h2>

          <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
            Meet the minds behind the mission. Discover the people,
            skills, and ideas shaping the Embrione community at PES University.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/team"
              className="group inline-flex items-center gap-3 rounded-xl bg-cyan-300 px-6 py-3.5 font-semibold text-slate-950 shadow-[0_0_35px_rgba(34,211,238,0.12)] transition hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              Meet the team
              <span className="transition group-hover:translate-x-1">→</span>
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3.5 font-semibold text-white transition hover:border-cyan-300/30 hover:bg-white/[0.07]"
            >
              Become a member <span className="text-cyan-300">↗</span>
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="text-cyan-300">✦</span> One community
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-2">
              <span className="text-cyan-300">✦</span> Many perspectives
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-2">
              <span className="text-cyan-300">✦</span> Shared ambition
            </span>
          </div>
        </div>

        {/* Abstract team illustration made with CSS */}
        <div className="relative mx-auto flex aspect-square w-full max-w-[470px] items-center justify-center">
          <div className="absolute inset-[8%] rounded-full border border-cyan-300/10" />
          <div className="absolute inset-[17%] rounded-full border border-dashed border-cyan-300/15" />
          <div className="absolute h-[70%] w-[70%] rounded-full bg-cyan-400/[0.07] blur-3xl" />

          <div className="absolute inset-[25%] rounded-[35%] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/[0.10] via-blue-500/[0.04] to-transparent shadow-[inset_0_0_50px_rgba(34,211,238,0.04)] [transform:rotate(45deg)]" />

          <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-3xl border border-cyan-200/30 bg-[#0b1b2b] shadow-[0_0_70px_rgba(34,211,238,0.16)] sm:h-36 sm:w-36">
            <div className="text-center">
              <div className="text-5xl font-semibold text-cyan-300 sm:text-6xl">
                E<span className="text-white">.</span>
              </div>
              <div className="mt-1 text-[9px] tracking-[0.25em] text-slate-400">
                TOGETHER
              </div>
            </div>
          </div>

          <div className="absolute left-[3%] top-[28%] rounded-2xl border border-white/10 bg-[#0b1525]/90 px-4 py-3 shadow-xl backdrop-blur">
            <div className="text-xs text-slate-400">Built on</div>
            <div className="mt-1 text-sm font-semibold text-white">Creativity</div>
          </div>

          <div className="absolute right-[0%] top-[36%] rounded-2xl border border-cyan-300/20 bg-[#0b1525]/95 px-4 py-3 shadow-xl backdrop-blur">
            <div className="text-xs text-slate-400">Driven by</div>
            <div className="mt-1 text-sm font-semibold text-cyan-200">People</div>
          </div>

          <div className="absolute bottom-[16%] left-[16%] rounded-2xl border border-white/10 bg-[#0b1525]/95 px-4 py-3 shadow-xl backdrop-blur">
            <div className="text-xs text-slate-400">Focused on</div>
            <div className="mt-1 text-sm font-semibold text-white">Innovation ↗</div>
          </div>

          <div className="absolute right-[18%] top-[12%] h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_24px_#22d3ee]" />
          <div className="absolute bottom-[24%] right-[8%] h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_20px_#60a5fa]" />
          <div className="absolute left-[23%] bottom-[12%] h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_18px_#67e8f9]" />
        </div>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 sm:px-10 lg:px-12">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Everything in one place
            </p>
            <h3 className="mt-3 text-2xl font-semibold sm:text-3xl">
              A community worth knowing.
            </h3>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500">
            Discover the people, explore different skills, and find your place
            in the Embrione community.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/team"
            className="group rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.055] to-transparent p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-xl text-cyan-300">
              ◈
            </div>
            <h4 className="mt-6 text-lg font-semibold">Meet our people</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Get to know the individuals and skills that make our community
              unique.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
              Explore the team <span className="transition group-hover:translate-x-1">→</span>
            </span>
          </a>

          <a
            href="/register"
            className="group rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.055] to-transparent p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-xl text-cyan-300">
              ↗
            </div>
            <h4 className="mt-6 text-lg font-semibold">Join the community</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Share your interests, introduce yourself, and take the first step
              toward connecting.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
              Register now <span className="transition group-hover:translate-x-1">→</span>
            </span>
          </a>

          <div className="rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.055] to-transparent p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-xl text-cyan-300">
              ✧
            </div>
            <h4 className="mt-6 text-lg font-semibold">Grow together</h4>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Bring different perspectives together, exchange ideas, and create
              opportunities to learn.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-300">
              People · Ideas · Innovation
            </span>
          </div>
        </div>

        <footer className="mt-16 flex flex-col gap-3 border-t border-white/[0.08] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
           © 2026 The Embrione · PES University
          </p>
          <div className="flex gap-5">
            <a href="/team" className="transition hover:text-cyan-300">
              Team
            </a>
            <a href="/register" className="transition hover:text-cyan-300">
              Register
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
}
