import { useEffect, useState } from 'react'
import { useAppStore } from '../../app/store/appStore'
import { elapsedSeconds } from '../../domain/session/WorkSession'

export function useTimer(): number {
  const activeSession = useAppStore((s) => s.activeSession)
  const [, tick] = useState(0)

  useEffect(() => {
    if (!activeSession) return
    const interval = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id])

  return activeSession ? elapsedSeconds(activeSession) : 0
}
