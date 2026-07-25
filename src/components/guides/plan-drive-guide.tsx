import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { customerLoginPath } from '#/lib/auth-model'
import { ArrowRight, Car, Check, MapPin, Pin, X } from 'lucide-react'

import { authClient } from '#/lib/auth-client'

import { GuidePageHeader, GuidePageShell } from './guide-shell'
import { PLAN_SPOTS } from './plan-drive-data'

export function PlanDriveGuide() {
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [day, setDay] = useState<'Day 1' | 'Day 2' | 'Day 3' | 'anyday'>('anyday')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const cats = useMemo(() => ['All', ...Array.from(new Set(PLAN_SPOTS.map((s) => s.cat)))], [])
  const [cat, setCat] = useState<string>('All')

  const list = useMemo(() => PLAN_SPOTS.filter((s) => (cat === 'All' ? true : s.cat === cat)), [cat])

  const pickedList = PLAN_SPOTS.filter((s) => picked[s.id])

  const toggle = (id: string) => setPicked((p) => ({ ...p, [id]: !p[id] }))

  const exportText = useMemo(() => {
    if (!pickedList.length) return ''
    const lines = [
      `My Langkawi drive — XQ Car (${day === 'anyday' ? 'to plan' : day})`,
      `Total stops: ${pickedList.length}`,
      '',
      ...pickedList.map((s, i) => `${String(i + 1).padStart(2, '0')}. ${s.t}\n    ${s.cat} · ${s.drive}\n    ${s.desc}`),
      '',
      'Planned with XQ Car · XQ Car Fleet',
    ]
    return lines.join('\n')
  }, [pickedList, day])

  const copy = () => {
    void navigator.clipboard?.writeText(exportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const saveToProfile = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <GuidePageShell>
      <GuidePageHeader
        kicker="Plan your drive"
        title="Tick where you want to go — we'll prep your route."
        body="Build your day on the island. Pick the places that interest you, then copy the list or save it to your profile. Mention your picks at pickup and we can help preload maps."
      />

      <section className="page-section">
        <div className="plan-shell">
          <div className="plan-list-wrap">
            <div className="plan-cats">
              {cats.map((c) => (
                <button key={c} type="button" className={'chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>
            <div className="plan-list">
              {list.map((s) => (
                <label key={s.id} className={'plan-spot' + (picked[s.id] ? ' on' : '')}>
                  <input type="checkbox" checked={!!picked[s.id]} onChange={() => toggle(s.id)} />
                  <span className="plan-tick">
                    <Check size={12} />
                  </span>
                  <div className="plan-body">
                    <header>
                      <strong>{s.t}</strong>
                      <span className="plan-cat">{s.cat}</span>
                    </header>
                    <p>{s.desc}</p>
                    <div className="plan-meta">
                      <span>
                        <Car size={11} />
                        <span>{s.drive}</span>
                      </span>
                      <span>
                        <Pin size={11} />
                        <span>Open in Maps</span>
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <aside className="plan-side">
            <div className="plan-side-head">
              <h3>My drive</h3>
              <span className="plan-count">
                {pickedList.length}
                <em> picked</em>
              </span>
            </div>

            <div className="plan-day">
              <span className="eyebrow">When are you driving?</span>
              <div className="plan-day-tabs">
                {(['Day 1', 'Day 2', 'Day 3', 'anyday'] as const).map((d) => (
                  <button key={d} type="button" className={day === d ? 'on' : ''} onClick={() => setDay(d)}>
                    {d === 'anyday' ? 'Any day' : d}
                  </button>
                ))}
              </div>
            </div>

            {pickedList.length === 0 ? (
              <div className="plan-side-empty">
                <MapPin size={28} style={{ color: 'var(--muted-2)' }} />
                <p>Pick at least one stop — your route will appear here.</p>
              </div>
            ) : (
              <>
                <ol className="plan-picked-list">
                  {pickedList.map((s, i) => (
                    <li key={s.id}>
                      <span className="plan-picked-num">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{s.t}</strong>
                        <em>
                          {s.cat} · {s.drive}
                        </em>
                      </div>
                      <button type="button" onClick={() => toggle(s.id)} title="Remove">
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ol>

                <div className="plan-export">
                  <span className="eyebrow">Export</span>
                  <textarea readOnly value={exportText} rows={6} />
                  <div className="plan-export-row">
                    <button type="button" className="btn btn-leaf btn-sm" onClick={copy}>
                      {copied ? (
                        <>
                          <Check size={12} /> Copied!
                        </>
                      ) : (
                        <>
                          <ArrowRight size={12} /> Copy text
                        </>
                      )}
                    </button>
                    {user ? (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={saveToProfile}>
                        {saved ? (
                          <>
                            <Check size={12} /> Saved to profile
                          </>
                        ) : (
                          <>Save to my profile</>
                        )}
                      </button>
                    ) : (
                      <Link to={customerLoginPath} className="btn btn-ghost btn-sm" title="Sign in first to save">
                        Sign in to save
                      </Link>
                    )}
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </GuidePageShell>
  )
}
