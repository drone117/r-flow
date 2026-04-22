# R-Flow

A visual blueprint/node-based programming editor built with React, inspired by Unreal Engine's Blueprint system. Drag nodes onto a canvas, connect them via typed pins, and execute the graph.

![R-Flow Screenshot](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-6-blue) ![Vite](https://img.shields.io/badge/Vite-8-purple)

## Features

- **Visual node editor** with drag-and-drop from a categorized sidebar palette
- **Typed pin system** — execution pins (white wires) control flow, data pins (colored wires) carry values
- **Auto type conversion** — connecting mismatched compatible types (e.g., float → string) auto-inserts a conversion node
- **Wildcard pins** — math nodes accept any numeric type and resolve their color from connections
- **Execution engine** — recursive graph walker supporting branches, loops (for/while/for-each), delays, and HTTP requests
- **HTTP Request node** — server-side proxy avoids CORS, with collapsible output pins (status, JSON, text, headers, OK)
- **Undo/Redo** — 50-step history with Ctrl+Z / Ctrl+Shift+Z
- **Save/Load** — export and import blueprints as JSON files
- **Minimap** — pannable and zoomable overview of the canvas

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

For production deployment with the Go backend:

```bash
# Build the frontend
npm run build

# Start the Go server (serves static files + API proxy on port 8080)
go run server/main.go
```

## Available Nodes

| Category | Nodes |
|----------|-------|
| **Events** | Start |
| **Functions** | Print String, HTTP Request, Delay |
| **Constants** | String, Float, Int, Bool, JSON |
| **Arrays** | String Array, Float Array, Int Array, Bool Array |
| **Math** | Add, Multiply, Clamp |
| **Flow Control** | Branch, For Loop, While Loop, For Each Loop |
| **Utilities** | Comment, Format Text |

## Pin Data Types

| Type | Color | Description |
|------|-------|-------------|
| Execution | White | Controls flow between nodes |
| Float | Yellow | Decimal numbers |
| Int | Teal | Integer numbers |
| String | Pink | Text strings |
| Bool | Red | Boolean (true/false) |
| JSON | Green | JSON objects/arrays |
| Object | Blue | Opaque objects |
| Wildcard | Gray | Accepts any type |

## Tech Stack

- **React 19** + **TypeScript 6** — UI framework
- **@xyflow/react** — Canvas library for node-based editors
- **Zustand** — Lightweight state management
- **Vite 8** — Build tool and dev server
- **Go** — Production backend for HTTP request proxying

## Architecture

```
src/
├── components/       # UI components (canvas, toolbar, sidebar, node factory)
├── edges/            # Custom edge renderer (bezier curves with glow)
├── engine/           # Graph execution engine (recursive walker)
├── hooks/            # Custom React hooks (drag-and-drop context)
├── nodes/            # Node components (BaseNode + specialized renderers)
├── pins/             # Pin components (data pins, execution pins, labels)
├── sidebar/          # Node palette sidebar
├── store/            # Zustand state stores (flow, execution, output)
├── toolbar/          # Top toolbar (run, undo/redo, save/load, zoom)
├── types/            # TypeScript type definitions
└── utils/            # Utility functions (type conversion)

server/
└── main.go           # Go HTTP server (API proxy + static file serving)
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Delete` / `Backspace` | Delete selected nodes/edges |
| `Shift+Click` | Multi-select |
| `Alt+Click` on edge | Delete edge |

## License

Private project.
