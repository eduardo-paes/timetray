import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
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

    const cleanups: Array<() => void> = []

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

        // Tray clicks: Rust on_menu_event → window.emit() → window-targeted listeners.
        // Must use getCurrentWebviewWindow().listen(), not global listen(), because
        // WebviewWindow::emit() from Rust targets the specific window (not EventTarget::Any).
        const appWindow = getCurrentWebviewWindow()
        const unlistenSwitch = await appWindow.listen<string>('tray:switch-task', async (event) => {
          console.log('[TimeTray] tray:switch-task received:', event.payload)
          try {
            const session = await svc.sessionService.switchToTask(event.payload, 'tray')
            useAppStore.getState().setActiveSession(session)
            console.log('[TimeTray] switched to task', event.payload)
          } catch (e) {
            console.error('[TimeTray] switchToTask failed:', e)
          }
        })

        const unlistenStop = await appWindow.listen('tray:stop', async () => {
          console.log('[TimeTray] tray:stop received')
          try {
            await svc.sessionService.stopTracking()
            useAppStore.getState().setActiveSession(null)
          } catch (e) {
            console.error('[TimeTray] stopTracking failed:', e)
          }
        })

        cleanups.push(unlistenSwitch, unlistenStop)
        console.log('[TimeTray] tray event listeners registered')

        await trayAdapter.init()
        await trayAdapter.rebuild(tasks, activeSession)
        trayAdapter.startRefreshLoop(() => ({
          tasks: useAppStore.getState().tasks,
          activeSession: useAppStore.getState().activeSession,
        }))
      } catch (e) {
        store.setError(String(e))
        console.error('[TimeTray] Init failed:', e)
      } finally {
        store.setLoading(false)
      }
    })()

    return () => {
      trayAdapter.stopRefreshLoop()
      cleanups.forEach((fn) => fn())
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
