# Sideline

A desktop app that shows live NBA scores at the top of your screen, just like Apple's Dynamic Island. It stays out of your way until you need it. Hover to expand and see detailed game info, or keep it collapsed as a minimal score ticker.

## What It Does

Sideline displays live NBA game scores in a sleek window at the top-center of your screen. When collapsed, it shows a compact score line. Hover over it to expand and see live scores, game clock, last play details, and a game selector to switch between multiple games.

The app runs quietly in your system tray, so you can keep tabs on your favorite teams without interrupting your workflow.

## Features

- **Dynamic Island UI** - Collapses to a minimal notch, expands smoothly on hover
- **Live NBA Scores** - Real-time updates from ESPN's API
- **Game Selector** - Browse and switch between multiple games
- **System Tray Integration** - Click the tray icon to show/hide the window
- **Persistent Settings** - Your preferences are saved automatically
- **Demo Mode** - Try it out even when there are no live games

## Installation

### Prerequisites

- Node.js 18+ and npm
- macOS, Windows, or Linux

### Setup

1. Clone the repository:
```bash
git clone https://github.com/amish-gaur/Sideline.git
cd Sideline
```

2. Install dependencies:
```bash
npm install
```

3. Run the app:
```bash
npm run electron:dev
```

The app will appear at the top-center of your screen.

## Building for Production

To create distributable installers:

```bash
npm run dist
```

This builds the app and packages it into platform-specific installers in the `dist/` folder:
- **macOS**: `.dmg` file
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` file

See `build/README.md` for icon setup instructions (optional but recommended).

## Usage

When you first open Sideline, it will show "No games on right now" if there are no live games, or display the first available game if games are scheduled.

- **Hover** over the notch to expand and see full game details
- **Click "Games"** to browse all available games
- **Right-click the tray icon** for options (Settings, Quit)

### Demo Mode

Want to see the UI in action? Click "Simulate" when you see "No games on right now" or click "Simulate a game" in the Games selector. Demo mode creates a fake game that updates scores every 5 seconds.

## Configuration

Settings are stored locally and persist between sessions:
- **Favorite Team** - Prioritizes this team when selecting which game to show
- **Refresh Rate** - How often to check for score updates (default: 15 seconds)
- **Start at Login** - Automatically launch Sideline when you log in

## Tech Stack

- Electron, React, TypeScript, Vite, Tailwind CSS, Framer Motion

## Development

```bash
npm run electron:dev    # Run in development mode
npm run build           # Build for production
npm run dist            # Create distributable installers
```

## License

MIT
