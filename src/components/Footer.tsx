export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-[var(--line)] px-4 pb-12 pt-8 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0">&copy; {year} XQ Car Fleet. Built for fast, paper-free rental operations.</p>
        <p className="m-0 font-semibold tracking-[0.16em] text-[var(--kicker)] uppercase">
          Langkawi operations platform
        </p>
      </div>
    </footer>
  )
}
