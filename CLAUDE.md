# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

R-Flow is a visual blueprint/node-based programming editor built with React and @xyflow/react (React Flow). Users drag nodes onto a canvas, connect them via typed pins, and execute the graph. The visual style is inspired by Unreal Engine's Blueprint system.

## Commands

- `npm run dev` — Start Vite dev server (port 5173, includes built-in `/api/request` proxy)
- `npm run build` — Type-check (tsc) then build for production
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build
- `go run server/main.go` — Start standalone Go backend (port 8080, for production use)

No test framework is configured.

## Architecture

### State Management (Zustand)

Three stores in `src/store/`:
- **`flowStore.ts`** — Nodes, edges, undo/redo (50-step history), snap-to-grid, minimap toggle, drag-and-drop node creation, auto-insertion of conversion nodes on type-mismatched connections
- **`executionStore.ts`** — Active node/edge during execution, running/stopped state
- **`outputStore.ts`** — Output console messages

### Node System

All node types are registered in `src/nodes/nodeTypes.ts`. Most nodes delegate to `BaseNode.tsx`, which renders a header (with category color and icon) and a dynamic pin layout with inline value editors.

Key node component files and what they wrap:
- `BaseNode.tsx` — Shared rendering for function, event, math, branch, loop, pure nodes
- `StartNode.tsx`, `CommentNode.tsx`, `ConstantNode.tsx`, `ConversionNode.tsx`, `ArrayNode.tsx`, `RequestNode.tsx` — Custom renderers for nodes with unique layouts

Node templates live in `src/components/nodeFactory.ts`, which also defines sidebar categories and the `createNodeFromType()` factory function.

### Pin Type System

Defined in `src/types/nodes.ts`. Two pin kinds: **execution** (white, controls flow) and **data** (colored by type). Data types: `float`, `int`, `string`, `bool`, `object`, `json`, `wildcard`. The `wildcard` type resolves its color from connected pins at render time (see `BaseNode.tsx` `resolvedPinColors`).

### Connection & Type Conversion

When a user connects two pins of different but compatible data types, `flowStore.onConnect` auto-inserts a `ConversionNode` between them. Conversion logic lives in `src/utils/conversionUtils.ts`.

### Execution Engine

`src/engine/executor.ts` — Walks the graph from Start nodes following execution pins. Supports branching, loops (for/while/for-each with index/value outputs), HTTP requests (proxied through Go backend), and a 1000-step safety limit.

### Go Backend Proxy

`server/main.go` — Standalone Go server for production use. Proxies HTTP requests via `POST /api/request` and serves static files from `./dist`.

### Vite Request Proxy Plugin

`vite.config.ts` — A Vite plugin (`requestProxy()`) that adds the same `/api/request` endpoint to the dev server via `configureServer`. This eliminates the need for a separate Go process during development.

### Adding a New Node Type

1. Add a template to `src/components/nodeFactory.ts` (`templates` map + `sidebarCategories` array)
2. If it needs custom rendering, create a component in `src/nodes/` and register it in `src/nodes/nodeTypes.ts`
3. If it has new execution behavior, add a case in `src/engine/executor.ts` `processNode()`
4. If it introduces a new data type, update `PinDataType` and `PIN_COLORS` in `src/types/nodes.ts`

## Workflow

After completing a task, always commit all changes with a descriptive commit message. Do not leave uncommitted work.
