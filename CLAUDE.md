# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

R-Flow is a visual blueprint/node-based programming editor built with React and @xyflow/react (React Flow). Users drag nodes onto a canvas, connect them via typed pins, and execute the graph. The visual style is inspired by Unreal Engine's Blueprint system.

## Commands

- `npm run dev` — Start Vite dev server (default port 5173, accessible at http://localhost:5173)
- `npm run build` — Type-check (tsc) then build for production
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build

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
- `BaseNode.tsx` — Shared rendering for function, event, variable, math, branch, loop, pure nodes
- `StartNode.tsx`, `CommentNode.tsx`, `ConstantNode.tsx`, `ConversionNode.tsx`, `ArrayNode.tsx`, `MapNode.tsx` — Custom renderers for nodes with unique layouts

Node templates live in `src/components/nodeFactory.ts`, which also defines sidebar categories and the `createNodeFromType()` factory function.

### Pin Type System

Defined in `src/types/nodes.ts`. Two pin kinds: **execution** (white, controls flow) and **data** (colored by type). Data types: `float`, `int`, `string`, `bool`, `object`, `json`, `wildcard`. The `wildcard` type resolves its color from connected pins at render time (see `BaseNode.tsx` `resolvedPinColors`).

### Connection & Type Conversion

When a user connects two pins of different but compatible data types, `flowStore.onConnect` auto-inserts a `ConversionNode` between them. Conversion logic lives in `src/utils/conversionUtils.ts`.

### Execution Engine

`src/engine/executor.ts` — Walks the graph from Start nodes following execution pins. Supports branching, loops (for/while/for-each with index/value outputs), and a 1000-step safety limit. The engine is purely visual/educational — it resolves values through connected pins and emits messages to the output console.

### Adding a New Node Type

1. Add a template to `src/components/nodeFactory.ts` (`templates` map + `sidebarCategories` array)
2. If it needs custom rendering, create a component in `src/nodes/` and register it in `src/nodes/nodeTypes.ts`
3. If it has new execution behavior, add a case in `src/engine/executor.ts` `processNode()`
4. If it introduces a new data type, update `PinDataType` and `PIN_COLORS` in `src/types/nodes.ts`

## Workflow

After completing a task, always commit all changes with a descriptive commit message. Do not leave uncommitted work.
