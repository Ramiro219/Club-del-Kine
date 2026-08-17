import type { ReactNode } from 'react'

export type BadgeTone = 'green' | 'blue' | 'amber' | 'red' | 'gray'

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
