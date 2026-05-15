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
    <div className="cxq-auth-left">
      <div className="cxq-auth-left-inner">
        <span className="cxq-auth-eyebrow">{eyebrow}</span>
        <h2 className="cxq-auth-headline">{headline}</h2>
        <p className="cxq-auth-body">{body}</p>
        <ul className="cxq-auth-perks">
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
