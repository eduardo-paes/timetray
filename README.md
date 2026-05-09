# TimeTray

Zero-friction time tracker for software engineers. Lives in the system tray - one click to switch tasks, every session persisted locally in SQLite.

## Features

- **System tray** - always accessible, never in the way
- **1-click task switching** - atomic session handoff with no gaps or overlaps
- **Daily overview** - bar chart breakdown of time per task for any selected day
- **Session history** - full log with start/end times, browsable by calendar
- **Automatic crash recovery** - open sessions are closed cleanly on next startup
- **Fully offline** - SQLite, no accounts, no cloud, no telemetry

## Installation

Download the latest release:

| Platform              | Installer                          |
|-----------------------|------------------------------------|
| Windows (recommended) | `TimeTray_0.1.0_x64-setup.exe`     |
| Windows (MSI)         | `TimeTray_0.1.0_x64_en-US.msi`     |

Installs per-user by default - no administrator rights required.

**Data location:** `%APPDATA%\com.timetray.app\timetray.db`

## Stack

| Layer | Tech |
|-------|------|
| Desktop shell | Tauri v2 (Rust + WebView2) |
| UI | React 19 + TypeScript |
| State | Zustand |
| Database | SQLite via `tauri-plugin-sql` |
| Styling | Tailwind CSS - *Obsidian + Copper* design system |
| Fonts | Inter (UI) · JetBrains Mono (timers) |
| Bundler | Vite |

## Development

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

The tray icon appears in the system tray. Click it to open the dashboard. Closing the window hides it - the app keeps running in the tray.

### Build

```bash
npm run tauri build
```

Produces installers under `src-tauri/target/release/bundle/nsis/` and `bundle/msi/`.

## Scripts

| Command               | Description                    |
|-----------------------|--------------------------------|
| `npm run dev`         | Start Vite dev server only     |
| `npm run tauri dev`   | Start full app (Vite + Rust)   |
| `npm run tauri build` | Build production installers    |
| `npm run lint`        | Run ESLint                     |
| `npm run lint:fix`    | Auto-fix lint errors           |
| `npm run format`      | Format with Prettier           |

## Project structure

```
src/
├── app/
│   ├── App.tsx                   # Root component
│   ├── bootstrap/init.ts         # DB init + crash recovery
│   ├── providers/AppProvider.tsx # Service wiring + tray startup
│   └── store/appStore.ts         # Zustand global store
├── application/services/
│   ├── HistoryService.ts         # Day summaries, calendar data
│   ├── SessionService.ts         # switchToTask, stopTracking, recovery
│   └── TaskService.ts
├── domain/                       # Pure domain types (no I/O)
│   ├── calendar/CalendarDay.ts
│   ├── session/WorkSession.ts
│   ├── summary/DaySummary.ts
│   └── task/Task.ts
├── infrastructure/
│   ├── db/database.ts            # SQLite singleton + migrations
│   ├── persistence/              # TaskRepository, SessionRepository
│   └── tray/TrayAdapter.ts       # Tray icon + menu rebuild loop
├── shared/utils.ts               # formatDuration, nowIso, generateId
└── ui/
    ├── components/               # Calendar, DayOverview, DaySummary,
    │                             #   SessionTimeline, TaskForm, TaskList
    ├── hooks/                    # useTimer
    └── windows/Dashboard/        # DashboardLayout, SidebarLeft, SidebarRight
src-tauri/
├── src/main.rs                   # Tray init, hide-on-close
├── capabilities/default.json     # Tauri v2 permission allowlist
└── tauri.conf.json
```

## Key design decisions

- **All DB logic in TypeScript** - `plugin-sql` talks to SQLite directly; no custom Rust commands needed.
- **Atomic session switch** - `BEGIN IMMEDIATE` / `COMMIT` wraps end-old + start-new so there is never a gap.
- **Light vs full tray rebuild** - label/enabled updates happen in-place every second; the full `setMenu()` call only runs when the task list changes, so an open tray menu is never dismissed mid-read.
- **Window hides on close** - `CloseRequested` is intercepted in Rust so the JS runtime stays alive for tray updates.
- **Canvas-generated tray icon** - the tray icon is drawn at runtime via HTML Canvas, bypassing OS icon cache on startup.

## IDE setup

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
