import { AppProvider } from './providers/AppProvider'
import { DashboardLayout } from '../ui/windows/Dashboard/DashboardLayout'
import { useAppStore } from './store/appStore'

function AppContent() {
  const { isReady, error } = useAppStore()

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-red-400">
        <div className="text-center space-y-3 max-w-sm px-4">
          <p className="text-lg font-semibold">TimeTray failed to start</p>
          <p className="text-sm text-gray-500 font-mono">{error}</p>
        </div>
      </div>
    )
  }

  if (!isReady) return null

  return <DashboardLayout />
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
