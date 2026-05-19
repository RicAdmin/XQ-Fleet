import { Check } from 'lucide-react'

type CxqAuthMarketingAsideProps = {
  eyebrow: string
  headline: string
  body: string
  perks: readonly string[]
}

export default function CxqAuthMarketingAside({
  eyebrow,
  headline,
  body,
  perks,
}: CxqAuthMarketingAsideProps) {
  return (
    <div className="auth-left">
      <div className="auth-left-inner">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{headline}</h2>
        <p>{body}</p>
        <ul className="auth-perks">
          {perks.map((perk) => (
            <li key={perk}>
              <Check size={14} strokeWidth={2.5} />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

