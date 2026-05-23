import { Img } from '@react-email/components'

import { brandLogoUrl } from '#/lib/brand'

type EmailBrandMarkProps = {
  size?: number
  label?: string
  labelColor?: string
  labelSize?: string
}

export function EmailBrandMark({
  size = 30,
  label = 'XQCar',
  labelColor = '#FFFFFF',
  labelSize = '17px',
}: EmailBrandMarkProps) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td style={{ paddingRight: '10px', verticalAlign: 'middle' }}>
            <Img
              src={brandLogoUrl()}
              alt="XQ Car"
              width={size}
              height={size}
              style={{
                display: 'block',
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
              }}
            />
          </td>
          <td
            style={{
              fontSize: labelSize,
              fontWeight: 600,
              color: labelColor,
              letterSpacing: '-0.01em',
              verticalAlign: 'middle',
            }}
          >
            {label}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
