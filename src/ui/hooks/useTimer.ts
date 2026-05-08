import { useEffect, useState } from 'react'
import { useAppStore } from '../../app/store/appStore'
import { elapsedSeconds } from '../../domain/session/WorkSession'

export function useTimer(): number {
  const activeSession = useAppStore((s) => s.activeSession)
  const [elapsed, setElapsed] = useState(
    activeSession ? elapsedSeconds(activeSession) : 0
  )

  useEffect(() => {
    if (!activeSession) {
      setElapsed(0)
      return
    }
    setElapsed(elapsedSeconds(activeSession))
    const interval = setInterval(() => {
      setElapsed(elapsedSeconds(activeSession))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeSession?.id])

  return elapsed
}
