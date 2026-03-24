import type { ReactNode } from 'react'

import Footer from '#/components/Footer'
import Header from '#/components/Header'

type PublicPageShellProps = {
  children: ReactNode
  className?: string
}

export default function PublicPageShell({
  children,
  className = 'page-wrap px-4 pb-12 pt-10',
}: PublicPageShellProps) {
  return (
    <>
      <Header />
      <main className={className}>{children}</main>
      <Footer />
    </>
  )
}
