# Sideline

A beautiful desktop app that shows live NBA scores right at the top of your screen, just like Apple's Dynamic Island. It stays out of your way until you need it—hover to expand and see detailed game info, or keep it collapsed as a minimal score ticker.

## What It Does

Sideline displays live NBA game scores in a sleek, always-on-top window at the top-center of your screen. When collapsed, it shows a compact score line. Hover over it to expand and see:

- Live scores with real-time updates
- Game clock and quarter information
- Last play details
- A game selector to switch between multiple games
- Beautiful animations when scores change (including a flying basketball!)

The app runs quietly in your system tray, so you can keep tabs on your favorite teams without interrupting your workflow.

## Features

- **Dynamic Island UI** - Collapses to a minimal notch, expands smoothly on hover
- **Live NBA Scores** - Real-time updates from ESPN's API
- **Game Selector** - Browse and switch between multiple games with a horizontal carousel
- **System Tray Integration** - Click the tray icon to show/hide the window
- **Persistent Settings** - Your favorite team and preferences are saved automatically
- **Circuit Breaker** - Automatically slows down polling if the API is having issues
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

This starts both the development server and the Electron window. The app will appear at the top-center of your screen.

## Building for Production

To create distributable installers:

```bash
npm run dist
```

This will:
1. Build the app (`npm run build`)
2. Package it into platform-specific installers using electron-builder

The installers will be created in the `dist/` folder:
- **macOS**: `.dmg` file (for both Intel and Apple Silicon)
- **Windows**: `.exe` installer (NSIS)
- **Linux**: `.AppImage` file

### Icons

Before building, you'll want to add app icons. See `build/README.md` for detailed instructions on creating icons for each platform. The build will work without custom icons, but it's recommended to add them for a professional look.

**Quick icon setup:**
1. Create a square icon design (1024x1024 PNG recommended)
2. Generate platform-specific formats:
   - macOS: `.icns` file → place in `build/icon.icns`
   - Windows: `.ico` file → place in `build/icon.ico`
   - Linux: `.png` file → place in `build/icon.png`
3. Run `npm run dist` again

See `build/README.md` for detailed icon generation instructions.

## Usage

### First Launch

When you first open Sideline, it will:
- Show "No games on right now" if there are no live games
- Display the first available game if games are scheduled
- Start polling for score updates every 15 seconds (configurable)

### Interacting with the Notch

- **Hover** - Expands the notch to show full game details
- **Click "Games"** - Opens the game selector to browse all available games
- **System Tray** - Right-click the tray icon for options (Settings, Quit)

### Demo Mode

If you want to see the UI in action without waiting for real games:
- Click "Simulate" when you see "No games on right now"
- Or click "Simulate a game" in the Games selector

Demo mode creates a fake game that updates scores every 5 seconds so you can see the animations and UI in action.

## Configuration

Settings are stored locally and persist between sessions:

- **Favorite Team** - Prioritizes this team when selecting which game to show (default: "SF 49ers")
- **Refresh Rate** - How often to check for score updates in milliseconds (default: 15000ms / 15 seconds)
- **Start at Login** - Automatically launch Sideline when you log in (default: false)

Settings are managed through the system tray context menu (coming soon) or by editing the stored preferences directly.

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **React + TypeScript** - UI framework with type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **electron-store** - Persistent settings storage

## Project Structure

```
├── electron/
│   ├── main.js          # Main Electron process (window, tray, IPC)
│   └── preload.js       # IPC bridge between main and renderer
├── src/
│   ├── components/      # React components
│   │   ├── DynamicIsland.tsx
│   │   └── GameSelector.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useLiveGame.ts
│   │   └── useGameClock.ts
│   ├── services/        # API and business logic
│   │   └── api.ts       # ESPN API integration
│   ├── context/         # React context providers
│   │   └── SettingsContext.tsx
│   ├── types/           # TypeScript type definitions
│   └── App.tsx          # Main app component
└── package.json
```

## API

Sideline uses ESPN's public NBA scoreboard API:
- Endpoint: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`
- No API key required
- Rate limiting handled automatically with circuit breaker pattern

## Development

```bash
npm run dev              # Start Vite dev server only
npm run electron         # Run Electron with built files
npm run electron:dev     # Run both (recommended for development)
npm run build            # Build for production (creates .vite/build/)
npm run dist             # Build and create distributable installers
npm run pack             # Create distributable packages (requires build first)
```

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
