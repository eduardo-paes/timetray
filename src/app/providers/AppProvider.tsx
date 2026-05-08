import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { initializeApp, AppServices } from '../bootstrap/init'
import { useAppStore } from '../store/appStore'
import { trayAdapter } from '../../infrastructure/tray/TrayAdapter'

const ServicesContext = createContext<AppServices | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useServices(): AppServices {
  const ctx = useContext(ServicesContext)
  if (!ctx) throw new Error('useServices must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<AppServices | null>(null)
  const initDone = useRef(false)
  const store = useAppStore()

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true
    ;(async () => {
      try {
        store.setLoading(true)
        const svc = await initializeApp()

        const [tasks, activeSession] = await Promise.all([
          svc.taskService.getAllTasks(),
          svc.sessionService.getActiveSession(),
        ])

        store.setTasks(tasks)
        store.setActiveSession(activeSession)
        store.setReady(true)
        setServices(svc)

        await trayAdapter.init()

        const makeCallbacks = () => ({
          onSwitch: async (taskId: string) => {
            const session = await svc.sessionService.switchToTask(taskId, 'tray')
            useAppStore.getState().setActiveSession(session)
          },
          onStop: async () => {
            await svc.sessionService.stopTracking()
            useAppStore.getState().setActiveSession(null)
          },
        })

        const { onSwitch, onStop } = makeCallbacks()

        await trayAdapter.rebuild(tasks, activeSession, onSwitch, onStop)

        trayAdapter.startRefreshLoop(
          () => ({
            tasks: useAppStore.getState().tasks,
            activeSession: useAppStore.getState().activeSession,
          }),
          makeCallbacks().onSwitch,
          makeCallbacks().onStop,
        )
      } catch (e) {
        store.setError(String(e))
        console.error('[TimeTray] Init failed:', e)
      } finally {
        store.setLoading(false)
      }
    })()

    return () => {
      trayAdapter.stopRefreshLoop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!services) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono">Starting TimeTray…</span>
        </div>
      </div>
    )
  }

  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}
