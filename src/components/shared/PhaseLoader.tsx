import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Phase = {
  id: string
  label: string
  icon: LucideIcon
  duration: number
}

type Props = {
  phases: Phase[]
  onComplete: () => void
}

export default function PhaseLoader({ phases, onComplete }: Props) {
  const [phaseIdx, setPhaseIdx] = useState(0)

  useEffect(() => {
    if (phaseIdx >= phases.length) {
      onComplete()
      return
    }
    const duration = phases[phaseIdx].duration * (0.4 + Math.random() * 0.3)
    const timer = setTimeout(() => setPhaseIdx(i => i + 1), duration)
    return () => clearTimeout(timer)
  }, [phaseIdx, phases, onComplete])

  const currentLabel = phaseIdx < phases.length ? phases[phaseIdx].label : ''

  return (
    <div className="flex items-center gap-2 py-1">
      <Loader2 size={14} className="text-muted3 animate-spin" />
      <span className="text-[12px] text-muted2">{currentLabel}</span>
    </div>
  )
}
