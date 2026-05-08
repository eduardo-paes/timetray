# TimeTray

Zero-friction time tracker for software engineers. Lives in the system tray — one click to switch tasks, every session persisted to SQLite.

## Features

- **System tray**: always accessible, never in the way
- **1-click task switching**: atomic session handoff with no gaps
- **Automatic crash recovery**: open sessions are closed on restart
- **Dashboard**: calendar, per-day history, task management
- **Fully offline**: SQLite, no external services

## Stack

| Layer | Tech |
|-------|------|
| Desktop shell | Tauri v2 (Rust + WebView2) |
| UI | React 19 + TypeScript |
| State | Zustand |
| Database | SQLite via `@tauri-apps/plugin-sql` |
| Styling | TailwindCSS v3 |
| Bundler | Vite |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (stable toolchain)
- Windows: Visual Studio Build Tools 2022 + Windows 10 SDK 10.0.19041

### Install

```bash
git clone https://github.com/you/timetray
cd timetray
npm install
```

### Dev

```bash
npm run tauri dev
```

The tray icon appears in the system tray. Click it to open the dashboard. Close the window to hide it — the app keeps running in the tray.

### Build

```bash
npm run tauri build
```

Produces a signed installer under `src-tauri/target/release/bundle/`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server only |
| `npm run tauri dev` | Start full app (Vite + Rust) |
| `npm run tauri build` | Build production installer |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting without writing |

## Project structure

```
src/
├── app/
│   ├── App.tsx                  # Root component
│   ├── bootstrap/init.ts        # DB init + crash recovery
│   ├── providers/AppProvider.tsx # Service wiring + tray startup
│   └── store/appStore.ts        # Zustand store
├── application/services/
│   ├── HistoryService.ts        # Day summaries, calendar data
│   ├── SessionService.ts        # switchToTask, stopTracking, recovery
│   └── TaskService.ts
├── domain/                      # Pure domain types (no I/O)
│   ├── calendar/CalendarDay.ts
│   ├── session/WorkSession.ts
│   ├── summary/DaySummary.ts
│   └── task/Task.ts
├── infrastructure/
│   ├── db/database.ts           # SQLite singleton + migrations
│   ├── persistence/             # TaskRepository, SessionRepository
│   └── tray/TrayAdapter.ts      # Tray menu rebuild loop (1s interval)
├── shared/utils.ts              # formatDuration, nowIso, generateId
└── ui/
    ├── components/              # Calendar, DaySummary, SessionTimeline, TaskList, TaskForm
    ├── hooks/                   # useTimer, useTrayRefresh
    └── windows/Dashboard/       # DashboardLayout, SidebarLeft, SidebarRight
src-tauri/
├── src/main.rs                  # Tray icon, hide-on-close, prevent-exit
├── capabilities/default.json    # Tauri v2 permissions
└── tauri.conf.json
```

## Key design decisions

- **All DB logic in TypeScript** — `plugin-sql` talks to SQLite directly; no custom Rust commands.
- **Atomic session switch** — `BEGIN IMMEDIATE` / `COMMIT` wraps end-old + start-new so there's never a gap.
- **Tray menu rebuilt every second** — native menu objects can't be mutated; `TrayAdapter` recreates them on a 1 s interval.
- **Window hides on close** — `CloseRequested` is intercepted in Rust; JS runtime stays alive for tray updates.

## IDE setup

Install these VS Code extensions for the best experience:

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
