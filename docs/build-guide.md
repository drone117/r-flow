# Building a Visual Node Editor from Scratch

A comprehensive guide for recreating R-Flow, a visual blueprint/node-based programming editor. Written for developers with backend or systems programming experience who are new to React and frontend development.

---

## Table of Contents

1. [What We're Building](#1-what-were-building)
2. [Technology Stack](#2-technology-stack)
3. [React Primer for Non-Frontend Developers](#3-react-primer-for-non-frontend-developers)
4. [Step 1: Project Setup](#4-step-1-project-setup)
5. [Step 2: State Management with Zustand](#5-step-2-state-management-with-zustand)
6. [Step 3: The Canvas — React Flow Basics](#6-step-3-the-canvas--react-flow-basics)
7. [Step 4: The Pin Type System](#7-step-4-the-pin-type-system)
8. [Step 5: Node Components](#8-step-5-node-components)
9. [Step 6: Edge (Wire) Components](#9-step-6-edge-wire-components)
10. [Step 7: Connection Logic](#10-step-7-connection-logic)
11. [Step 8: The Execution Engine](#11-step-8-the-execution-engine)
12. [Step 9: Drag and Drop from Sidebar](#12-step-9-drag-and-drop-from-sidebar)
13. [Step 10: Keyboard Shortcuts and Clipboard](#13-step-10-keyboard-shortcuts-and-clipboard)
14. [Step 11: HTTP Request Proxying (Backend)](#14-step-11-http-request-proxying-backend)
15. [Architecture Overview](#15-architecture-overview)

---

## 1. What We're Building

A visual node editor where users:

1. **Drag nodes** from a sidebar palette onto a canvas
2. **Connect nodes** by dragging wires between pins (small circles on node edges)
3. **Edit values** by typing into inline input fields on nodes
4. **Execute the graph** by pressing a Run button — the engine walks from Start nodes following execution wires

The visual style is inspired by Unreal Engine's Blueprint system. Here's the key mental model:

```
┌──────────┐   exec wire (white)   ┌──────────┐   data wire (colored)
│  Start   │ ──────────────────► │  Print    │
│          │                     │  String  │◄── "Hello"
└──────────┘                     └──────────┘
```

- **White wires** (execution pins) control the order of operations
- **Colored wires** (data pins) carry typed values between nodes
- Nodes have **pins** on their left (inputs) and right (outputs) edges
- The **executor** walks the graph from Start nodes, following white wires

---

## 2. Technology Stack

| Technology | What it does | Why this project uses it |
|---|---|---|
| **React 19** | UI framework — renders components that react to state changes | The entire UI is built from React components |
| **TypeScript 6** | JavaScript with static type annotations | Catches bugs at compile time instead of runtime |
| **Vite 8** | Build tool — bundles code, runs dev server, hot-reloads | Fast development experience, handles TypeScript/JSX compilation |
| **@xyflow/react** | React Flow library — provides the node/edge canvas | Handles panning, zooming, drag-and-drop, wire drawing, minimap |
| **Zustand** | Lightweight state management (like Redux but simpler) | Stores nodes, edges, execution state, output messages |
| **Go** | Systems programming language | Production backend for proxying HTTP requests |

### Why These Choices?

- **React + React Flow**: React Flow is the most mature open-source node editor library for React. It handles all the hard canvas math (pan, zoom, bezier curves, hit testing) so you can focus on your domain logic.
- **Zustand over Redux**: Zustand has ~1/10th the boilerplate. No actions, reducers, dispatchers, or providers. You write a store object and call setter functions directly.
- **Vite**: Faster than Webpack, zero-config TypeScript support, instant hot module replacement.
- **Go for backend**: The HTTP proxy needs to run server-side to avoid CORS. Go produces a single static binary — no runtime dependencies needed.

---

## 3. React Primer for Non-Frontend Developers

This section explains the React concepts used throughout the project. If you already know React, skip to Step 1.

### Quick Reference: Python → JavaScript/React Rosetta Stone

If you're coming from Python (or Go), here's a map of the key concepts:

| Python / Go Concept | React / JavaScript Equivalent | Where in R-Flow |
|---|---|---|
| `class Widget:` / `struct Node {}` | `function Component() { return JSX }` | Every `.tsx` file |
| `self.x = 5` / `n.X = 5` | `const [x, setX] = useState(5)` | Local node state |
| `def on_mount():` / `func init()` | `useEffect(() => { ... }, [])` | Event listeners, timers |
| `self._cache = {}` (private attribute) | `const ref = useRef(initial)` | Selection tracking, mouse position |
| `@functools.lru_cache` | `useCallback(fn, deps)` | Memoized event handlers |
| `dataclass` / `struct` | `interface` / `type` | `src/types/nodes.ts` |
| `dict[str, Any]` / `map[string]any` | `Record<string, unknown>` | Pin configs, store state |
| `Optional[str]` / `*string` | `string \| null` or `string?` (with `?`) | Optional properties |
| `copy.deepcopy(obj)` | `structuredClone(obj)` | Copy/paste nodes |
| `import json` / `encoding/json` | `JSON.parse()` / `JSON.stringify()` | Save/load blueprints |
| Global variable in module | `let x` outside any function | Clipboard, mouse position |
| Flask/Django template | JSX (`<div>{expression}</div>`) | All component return values |
| Flask `request` / Go `http.Request` | `KeyboardEvent`, `DragEvent`, etc. | Event handlers |
| `try/except` / `if err != nil` | `try { } catch (err) { }` | HTTP proxy, JSON parsing |
| `asyncio` / goroutines | `async/await` | Execution engine |
| `List[str]` / `[]string` | `string[]` | Pin arrays, node lists |
| `Union[str, int]` | `'str' \| 'int'` (union type) | `PinDataType` |
| `TypedDict` / Go struct tags | `interface { field: type }` | `BlueprintNodeData` |
| `lambda x: x * 2` | `(x) => x * 2` | Inline callbacks |
| `flask.session` / cookies | Zustand store (`create()`) | `flowStore`, `executionStore` |
| `__init__.py` module-level state | Module-level `let`/`const` | Clipboard, dragging set |
| `Enum` / Go `iota` | Union type literal (`'a' \| 'b' \| 'c'`) | `PinDataType`, `NodeCategory` |
| `abc.ABC` / Go `interface{}` | Generic type parameter `<T>` | `Node<T = BlueprintNodeData>` |

### 3.1 Components

A **component** is a function that returns UI markup (called JSX). Think of it as a reusable widget.

```tsx
// A simple component
function MyButton() {
  return <button>Click me</button>;
}

// A component that accepts data through "props"
function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}!</p>;
}

// Usage: <Greeting name="World" />
```

**Key concept**: Components are functions. They receive input data through **props** (short for "properties") and return a tree of HTML-like elements. React calls your function whenever the data changes, and the UI updates automatically.

<details>
<summary><b>Python equivalent</b></summary>

If you've used a Python web framework, think of a React component as a function that returns HTML instead of using a template file:

```python
# Django-style template (separate file: widget.html)
# <div><span>{{ name }}</span></div>

# Flask-style
@app.route("/widget/<name>")
def widget(name: str):
    return render_template("widget.html", name=name)

# React — no separate template file, it's all in one function
# function Greeting({ name }) {
#   return <p>Hello, {name}!</p>;
# }
```

The key difference: in Flask/Django, the template is a separate `.html` file with `{{ }}` placeholders. In React, the "template" is JSX — it lives right inside the JavaScript function and can contain arbitrary expressions, not just variable interpolation.

In Go (Gin/templ), it would be:
```go
// Go template (separate file)
// <p>Hello, {{ .Name }}</p>

// React equivalent
// function Greeting({ name: string }) {
//   return <p>Hello, {name}!</p>;
// }
```
</details>

### 3.2 JSX — JavaScript XML Syntax

JSX looks like HTML but it's actually JavaScript. You can embed expressions inside `{}` braces:

```tsx
function NodeHeader({ label, color }) {
  return (
    <div style={{ backgroundColor: color }}>
      <span>{label}</span>
    </div>
  );
}
```

The `style={{ backgroundColor: color }}` syntax passes a JavaScript object as the `style` prop. The double braces are: outer `{}` for JSX expression, inner `{}` for object literal.

<details>
<summary><b>Python / Go equivalent</b></summary>

JSX is not HTML — it's JavaScript that *looks* like HTML. At build time, Vite transforms it into function calls:

```tsx
// What you write (JSX)
<div style={{ backgroundColor: color }}><span>{label}</span></div>

// What it becomes at build time (JavaScript)
React.createElement('div', { style: { backgroundColor: color } },
  React.createElement('span', null, label)
)
```

In Python terms, imagine if Django templates were replaced by nested function calls:

```python
# Instead of: <div style="..."><span>{{ label }}</span></div>
div(style={"background-color": color}, children=[
    span(children=[label])
])
```

In Go (templ):
```go
// Instead of: <div><span>{ label }</span></div>
templ.Component(func(ctx context.Context, w io.Writer) error {
    templ_7745c5c_WriteEscaped(w, label)
    return nil
})
```
</details>

### 3.3 useState — Local Component State

```tsx
import { useState } from 'react';

function Counter() {
  // state: current value; setState: function to update it
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

`useState` returns an array: `[value, setter]`. When you call `setCount(newValue)`, React re-renders the component with the new value. The array destructuring `[count, setCount]` extracts the two items by position.

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — a simple class with a getter/setter
class Counter:
    def __init__(self):
        self.count = 0

    def increment(self):
        self.count += 1
        self.render()  # manually trigger re-render
```

```go
// Go — a struct with methods
type Counter struct {
    count int
}

func (c *Counter) Increment() {
    c.count++
    c.Render() // manually trigger re-render
}
```

```tsx
// React — useState does all of the above automatically
function Counter() {
  const [count, setCount] = useState(0); // declare + initialize
  // When setCount is called, React re-renders this component automatically
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

The critical difference: in Python/Go, you must manually call `render()` after changing state. In React, calling the setter (`setCount`) automatically triggers a re-render. You never call a render function yourself — React handles it.

Think of `[count, setCount]` as Python's `(self.count, self.set_count)` but with automatic re-rendering baked in.
</details>

### 3.4 useEffect — Side Effects

```tsx
import { useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // This runs once after the component first renders
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);

    // The return function is the cleanup — runs when component unmounts
    return () => clearInterval(id);
  }, []); // Empty array = run once

  return <p>{seconds}s elapsed</p>;
}
```

`useEffect(callback, dependencies)` runs `callback` whenever a dependency changes. The cleanup function (returned from callback) runs before the next execution and on unmount. This is the React equivalent of "register event listener, remember to unregister."

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — setup/teardown with a context manager
class Timer:
    def __enter__(self):
        self._id = setInterval(lambda: self.tick(), 1000)  # register
        return self

    def __exit__(self, *args):
        clearInterval(self._id)  # cleanup

    # Or in a GUI framework (tkinter):
    def __init__(self):
        self._after_id = self.root.after(1000, self.tick)

    def destroy(self):
        if self._after_id:
            self.root.after_cancel(self._after_id)  # cleanup
```

```go
// Go — setup/teardown pattern
func startTimer(tick func()) (cancel func()) {
    ticker := time.NewTicker(1 * time.Second)
    go func() {
        for range ticker.C {
            tick()
        }
    }()
    cancel = func() { ticker.Stop() } // cleanup function
    return
}
```

```tsx
// React — useEffect combines setup + cleanup in one place
useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000); // setup
    return () => clearInterval(id);                                 // cleanup
}, []); // empty array = run setup once, cleanup on unmount
```

The dependency array `[]` controls *when* the effect re-runs:
- `[]` — run once on mount, cleanup on unmount (like `__init__` / `__del__`)
- `[url]` — run when `url` changes (cleanup old, setup new)
- omitted — run after every render (rarely what you want)

This is similar to how `useEffect(() => {}, [query])` is like a Python `@property` setter that watches for changes to `self.query`.
</details>

### 3.5 useRef — Mutable Values That Don't Trigger Re-renders

```tsx
import { useRef } from 'react';

function Log() {
  const countRef = useRef(0); // persists across renders, doesn't cause re-render

  const handleClick = () => {
    countRef.current += 1;  // mutate directly, no re-render
    console.log(countRef.current);
  };

  return <button onClick={handleClick}>Log</button>;
}
```

`useRef` is like `useState` but changing the value does NOT re-render the component. Use it for values you need to read in event handlers but don't need to display. In R-Flow, this is used for:
- Tracking the selected node IDs (we only read them on Ctrl+C, no need to render them)
- Tracking the mouse cursor position for paste-at-cursor

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — a private attribute that doesn't trigger any notification
class Canvas:
    def __init__(self):
        self._selected_ids: set[str] = set()  # internal cache, no observers
        self._mouse_pos = None                # tracking variable

    def handle_copy(self):
        selected = self._selected_ids  # read it when needed
        ...

    def on_select_change(self, new_ids: set[str]):
        self._selected_ids = new_ids  # update silently, no re-render
```

```go
// Go — unexported field, no event system
type Canvas struct {
    selectedIds map[string]bool // internal state, not exposed
    mousePos    *Point          // tracking variable
}
```

```tsx
// React — useRef is exactly this: a mutable box that doesn't trigger re-render
const selectedIdsRef = useRef<Set<string>>(new Set());

// Read it
const handleCopy = () => {
    const selected = selectedIdsRef.current;
};

// Write it — no re-render happens
selectedIdsRef.current = new Set(['node-1', 'node-2']);
```

The mental model: `useRef` = a Python instance attribute (`self._x`) that is invisible to React's rendering system. It's a "side channel" for storing data that the UI doesn't need to display.
</details>

### 3.6 useCallback — Memoized Functions

```tsx
import { useCallback } from 'react';

function Search({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  // useCallback memoizes the function — only recreates if dependencies change
  const doSearch = useCallback(() => {
    onSearch(query);
  }, [query, onSearch]); // only recreates when query or onSearch changes

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={doSearch}>Search</button>
    </div>
  );
}
```

`useCallback` prevents a function from being recreated on every render. This matters when you pass functions as props to child components — if the function reference changes every render, the child re-renders even if its data didn't change.

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — @cached_property or functools.lru_cache
from functools import lru_cache

class Search:
    def __init__(self):
        self.query = ""

    @property
    def do_search(self):
        # This creates a new function object every time it's accessed
        return lambda: self._perform_search()

    # With caching, you'd do something like:
    @lru_cache(maxsize=1)
    def get_search_fn(self, query):
        return lambda: self._perform_search(query)
```

```go
// Go — not really a concept in Go; functions are just values
// You'd typically pass method values directly
type Search struct {
    query string
}
func (s *Search) DoSearch() { /* ... */ }
handler(s.DoSearch) // passes a method value
```

```tsx
// React — useCallback memoizes the function identity
const doSearch = useCallback(() => {
    onSearch(query);
}, [query, onSearch]); // new function ONLY when query or onSearch changes
```

Think of it as `@lru_cache` for function objects. Without `useCallback`, React creates a brand new function object on every render (like creating a new `lambda` each time). With `useCallback`, it reuses the same function object until a dependency changes.
</details>

### 3.7 useStore — Reading Zustand State Without Re-rendering

```tsx
import { useStore } from 'zustand';

// Zustand store defined elsewhere
const useFlowStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

function Counter() {
  // Subscribe to a specific field — only re-renders when count changes
  const count = useFlowStore((s) => s.count);
  // Get the increment function — stable reference, no re-render
  const increment = useFlowStore((s) => s.increment);

  return <button onClick={increment}>{count}</button>;
}
```

`useStore(selector)` is Zustand's equivalent of `useRef` + `useEffect` — it reads from the store but only triggers a re-render when the selected value changes. This is critical for performance: a canvas with 100 nodes doesn't need to re-render every time any node changes.

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — a global dictionary (naive state management)
store = {
    "nodes": [],
    "edges": [],
    "count": 0,
}

def increment():
    store["count"] += 1

# Problem: every component that reads `store` would need to poll or use
# some pub/sub mechanism to know when `count` changed but `nodes` didn't.
```

```go
// Go — a struct with a mutex
type Store struct {
    mu    sync.RWMutex
    Nodes []Node
    Edges []Edge
    Count int
}

func (s *Store) Increment() {
    s.mu.Lock()
    s.Count++
    s.mu.Unlock()
}
```

```tsx
// React + Zustand — selector-based subscriptions
const count = useFlowStore((s) => s.count);  // re-renders ONLY when count changes
const nodes = useFlowStore((s) => s.nodes);  // re-renders ONLY when nodes changes
```

Zustand's selector pattern is like having a database trigger that only fires when the specific column you're watching changes. In Python, you'd need something like SQLAlchemy's `AttributeEvent` or a custom pub/sub system. Zustand gives you this for free.

The store itself is analogous to a Python global dict or a Go struct — it's just a plain object in memory. The magic is in the `useStore(selector)` hook, which tells React "re-render me when this specific piece of state changes."
</details>

### 3.8 Module-Level Variables

```tsx
// Outside any component — persists for the lifetime of the module
let clipboard: Node[] | null = null;

function Canvas() {
  const handleCopy = () => { clipboard = [...]; };
  const handlePaste = () => { /* read clipboard */ };
}
```

Module-level variables (declared outside functions) are shared across all component instances. They persist through re-renders and hot-reloads. In R-Flow, the clipboard for copy/paste is a module-level variable — it doesn't need to trigger re-renders when set.

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — a module-level variable in clipboard.py
clipboard: list[Node] | None = None

def copy(nodes: list[Node]):
    global clipboard
    clipboard = nodes

def paste() -> list[Node] | None:
    return clipboard

# Works exactly the same: shared across all imports, persists for process lifetime
```

```go
// Go — a package-level variable
package clipboard

var data *Clipboard

func Copy(nodes []Node) { data = &Clipboard{Nodes: nodes} }
func Paste() *Clipboard { return data }
```

```tsx
// JavaScript — identical concept
let clipboard: Node[] | null = null; // module-level, shared everywhere
```

This is the same pattern in every language. Module-level state in JavaScript works exactly like module-level variables in Python or package-level variables in Go. No surprises here — just don't use this for state that needs to trigger UI updates.
</details>

### 3.9 structuredClone — Deep Copying Objects

```tsx
const original = { items: [{ id: 'a', value: 'hello' }] };
const copy = structuredClone(original);

copy.items[0].value = 'world';
// original.items[0].value is still 'hello' — structuredClone creates an independent copy
```

`structuredClone` is a built-in browser API that deep-copies any JavaScript value. It handles nested objects, arrays, Maps, Sets, and circular references. In R-Flow, it's used to copy nodes and their data (which contain nested objects like `values`, `items`, `inputs`, `outputs`).

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — copy.deepcopy
import copy

original = {"items": [{"id": "a", "value": "hello"}]}
cloned = copy.deepcopy(original)

cloned["items"][0]["value"] = "world"
# original["items"][0]["value"] is still "hello" ✓

# IMPORTANT: NOT the same as dict.copy() or {...original}
shallow = dict(original)          # or {**original}
shallow["items"][0]["value"] = " "world"
# original["items"][0]["value"] is NOW "world" too — shallow copy! ✗
```

```go
// Go — no built-in deep copy; you'd serialize/deserialize
import "encoding/json"

original := map[string]any{"items": []map[string]string{{"id": "a", "value": "hello"}}}
data, _ := json.Marshal(original)
var cloned map[string]any
json.Unmarshal(data, &cloned)
// cloned is now independent of original
```

```tsx
// JavaScript — structuredClone (built-in, no imports needed)
const original = { items: [{ id: 'a', value: 'hello' }] };
const cloned = structuredClone(original);
// cloned is independent of original ✓

// IMPORTANT: NOT the same as spread
const shallow = { ...original };       // shallow copy — nested objects are shared! ✗
const alsoShallow = Object.assign({}, original); // same problem ✗
```

Why this matters in R-Flow: when you copy a node, its `data` object contains nested arrays (`inputs`, `outputs`, `items`) and nested objects (`values`). A shallow copy would share these nested structures between the original and the copy — editing one would mutate the other.
</details>

### 3.10 Arrow Functions and Closures

```tsx
// Arrow function — the kind used everywhere in React
const double = (x: number) => x * 2;

// Arrow function as a method — common in event handlers
const handleClick = (e: React.MouseEvent) => {
  e.stopPropagation(); // prevent the event from bubbling up to parent elements
};

// Closure — a function that "remembers" variables from its surrounding scope
function createCounter() {
  let count = 0; // This variable is "closed over"
  return () => ++count; // Each call increments the same `count`
}

const counter = createCounter();
counter(); // 1
counter(); // 2
```

Closures are fundamental to how Zustand works — the store's `set` function closes over the state object, and each action closes over `set`.

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — closures work the same way
def create_counter():
    count = 0  # "closed over" variable
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = create_counter()
counter()  # 1
counter()  # 2
```

```go
// Go — closures work the same way
func createCounter() func() int {
    count := 0 // "closed over" variable
    return func() int {
        count++
        return count
    }
}

counter := createCounter()
counter() // 1
counter() // 2
```

```tsx
// JavaScript — identical pattern
function createCounter() {
    let count = 0;
    return () => ++count;
}
```

Closures work the same in all three languages. The JavaScript arrow function `() => expr` is just a shorter syntax for `function() { return expr; }` — equivalent to Python's `lambda` (but with a body, since JS arrow functions can have blocks).
</details>

### 3.11 Interfaces and Types

```tsx
// Interface — describes the shape of an object
interface PinConfig {
  id: string;
  label: string;
  direction: 'source' | 'target'; // union type — only these two values allowed
  dataType: PinDataType;         // reference to another type
}

// Type alias — shorthand for complex types
type PinDataType = 'float' | 'int' | 'string' | 'bool' | 'json' | 'wildcard' | 'object' | 'execution';

// Generic type — works with any type parameter
interface Node<T = Record<string, unknown>> {
  id: string;
  position: { x: number; y: number };
  data: T;
}

// Optional properties with `?`
interface Config {
  name: string;
  description?: string; // may be undefined
}
```

TypeScript interfaces are like structs in Go — they define the shape of data. They don't generate runtime code; the TypeScript compiler uses them for type-checking. The `?` suffix makes a property optional (can be `undefined`).

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — dataclass + type hints
from dataclasses import dataclass
from typing import Literal, Optional

PinDataType = Literal['float', 'int', 'string', 'bool', 'json', 'wildcard', 'object', 'execution']

@dataclass
class PinConfig:
    id: str
    label: str
    direction: Literal['source', 'target']
    data_type: PinDataType
    description: Optional[str] = None  # optional field
```

```go
// Go — struct + type alias
type PinDataType string
const (
    PinFloat    PinDataType = "float"
    PinInt      PinDataType = "int"
    PinString   PinDataType = "string"
    PinBool     PinDataType = "bool"
    PinJSON     PinDataType = "json"
    PinWildcard PinDataType = "wildcard"
    PinObject   PinDataType = "object"
    PinExec     PinDataType = "execution"
)

type PinConfig struct {
    ID        string      `json:"id"`
    Label     string      `json:"label"`
    Direction string      `json:"direction"` // "source" or "target"
    DataType  PinDataType `json:"dataType"`
    // No optional fields in Go — use pointers: *string
}
```

```tsx
// TypeScript — interface + type alias
type PinDataType = 'float' | 'int' | 'string' | 'bool' | 'json' | 'wildcard' | 'object' | 'execution';

interface PinConfig {
    id: string;
    label: string;
    direction: 'source' | 'target'; // union type = Python's Literal, Go's const string
    dataType: PinDataType;
    description?: string; // ? = Python's Optional[str], Go's *string
}
```

Key differences:
- TypeScript interfaces compile away — they don't exist at runtime (like Python type hints, unlike Go structs)
- TypeScript uses `|` for union types (Python: `Literal['a', 'b']`, Go: `const` strings)
- TypeScript uses `?` for optional fields (Python: `Optional[T]` or `= None`, Go: `*T` pointer)
- TypeScript uses `Record<K, V>` for dict-like types (Python: `dict[K, V]`, Go: `map[K]V`)
</details>

### 3.12 CSS Custom Properties (Variables)

```css
.blueprint-node {
  /* Define a variable scoped to this element and its children */
  --header-color: #2d5baa;

  /* Use it */
  background-color: var(--header-color);
}
```

In R-Flow, CSS custom properties are used to pass dynamic colors from React into CSS. The `style` prop sets the variable, and CSS reads it:

```tsx
<div style={{ '--header-color': headerColor } as React.CSSProperties}>
```

The `as React.CSSProperties` cast tells TypeScript that `--header-color` is a valid CSS property (TypeScript doesn't know about custom properties by default).

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — there's no direct equivalent since Python doesn't have CSS.
# But the concept is similar to passing config through context:
# Think of CSS custom properties as a "context variable" that child
# elements can read without being explicitly passed as props.

# The pattern is: set a variable at one level, read it at a deeper level.
# In Python, you'd do this with threading.local() or contextvars:
import contextvars

header_color = contextvars.ContextVar('header_color')

def parent():
    header_color.set('#2d5baa')  # set the variable
    child()                      # child reads it

def child():
    color = header_color.get()   # reads the parent's value
```

```go
// Go — similar to using context.Context to pass values
ctx := context.WithValue(parentCtx, "header-color", "#2d5baa")
child(ctx) // child reads from context

func child(ctx context.Context) {
    color := ctx.Value("header-color").(string)
}
```

In CSS, custom properties cascade down the DOM tree — just like `contextvars` in Python or `context.Context` in Go cascade down the call stack. A child element inherits the variable unless it overrides it.
</details>

---

## 4. Step 1: Project Setup

### 4.1 Create the Project

```bash
npm create vite@latest r-flow -- --template react-ts
cd r-flow
npm install
```

This creates a Vite project with React and TypeScript pre-configured. The key files:

```
r-flow/
├── index.html          # Entry HTML file — loads src/main.tsx
├── src/
│   ├── main.tsx        # App entry point — renders <App /> into the DOM
│   ├── App.tsx         # Root component — wraps everything
│   ├── App.css         # Global styles
│   └── index.css       # Base styles (Tailwind, resets, etc.)
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
├── package.json
└── public/             # Static assets (favicon, etc.)
```

### 4.2 Install Dependencies

```bash
npm install @xyflow/react zustand
```

- `@xyflow/react` — The canvas library. Exports `<ReactFlow>`, `<Handle>`, hooks like `useReactFlow`, and utility functions.
- `zustand` — State management. Exports `create()` for making stores.

### 4.3 The Entry Point

`src/main.tsx` — Mounts the React app:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- `StrictMode` runs components twice in development to catch bugs (pure functions, missing keys). No effect in production.
- `createRoot(document.getElementById('root')!)` — the `!` tells TypeScript "this element definitely exists, don't warn about null."
- `.render(<App />)` — React renders the component tree into the DOM.

### 4.4 Vite Configuration

`vite.config.ts` — Minimal config for a React + TypeScript project:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

The `@vitejs/plugin-react` plugin handles:
- Transforming JSX syntax into `React.createElement()` calls
- Fast Refresh (HMR) during development
- TypeScript type checking via `tsc`

---

## 5. Step 2: State Management with Zustand

### 5.1 Why Not Redux?

Redux requires: actions, reducers, action creators, a dispatch function, middleware, and often a `combineReducers` helper. For a node editor, that's a lot of boilerplate for what amounts to "store an array of nodes."

Zustand's approach is simpler: define a store object with state and actions in one place.

<details>
<summary><b>Python / Go equivalent — what state management means here</b></summary>

In a Python web app, "state" is typically stored in:
- A database (SQLAlchemy, Django ORM)
- The session (`flask.session`, `request.session`)
- A global dictionary (simple in-memory state)

In a Go web app:
- A database (sql.DB, GORM)
- In-memory struct with a mutex
- Redis or similar

In React, **state is just variables in memory** — like a Python global dict or a Go struct. The twist is that React automatically re-renders the UI when state changes. You don't manually call `render()` — you just update the variable, and React figures out what changed and updates only the affected parts of the DOM.

```python
# Python — naive state management (no auto-re-render)
nodes = []
edges = []

def add_node(node):
    global nodes
    nodes.append(node)
    render()  # you'd have to manually trigger this

def undo():
    global nodes, edges
    nodes, edges = past.pop()
    render()  # manually trigger
```

```tsx
// React + Zustand — same logic, but re-render is automatic
const useFlowStore = create((set, get) => ({
    nodes: [],
    edges: [],
    addNode: (node) => set({ nodes: [...get().nodes, node] }),
    // calling set() automatically re-renders all subscribed components
}));
```
</details>

### 5.2 Creating a Store

```tsx
import { create } from 'zustand';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  // ... other state
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],

  addNode: (node: Node) => {
    set({ nodes: [...get().nodes, node] });
  },
}));
```

**How it works:**
- `create()` accepts a function that receives `set` (replace state entirely) and `get` (read current state).
- `set()` triggers a re-render of all components subscribed to this store.
- `get()` reads the current state synchronously (useful in actions that need the current state).

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — a class-based store with manual change notification
class FlowStore:
    def __init__(self):
        self._nodes: list[Node] = []
        self._edges: list[Edge] = []
        self._listeners: list[Callable] = []

    def add_node(self, node: Node):
        self._nodes.append(node)
        self._notify()  # manually notify all listeners

    def subscribe(self, listener: Callable):
        self._listeners.append(listener)

    def _notify(self):
        for fn in self._listeners:
            fn()  # each listener re-renders its component
```

```go
// Go — a struct with mutex + observer pattern
type FlowStore struct {
    mu       sync.RWMutex
    nodes    []Node
    edges    []Edge
    onChange []func()
}

func (s *FlowStore) AddNode(n Node) {
    s.mu.Lock()
    s.nodes = append(s.nodes, n)
    s.mu.Unlock()
    for _, fn := range s.onChange { fn() }
}
```

```tsx
// Zustand — all of the above in 5 lines
export const useFlowStore = create<FlowState>((set, get) => ({
    nodes: [],
    edges: [],
    addNode: (node) => set({ nodes: [...get().nodes, node] }),
    // set() = mutate state + notify all subscribers automatically
    // get() = read current state (like acquiring the read lock)
}));
```

The key insight: `set()` does three things at once — updates the state, notifies all subscribers, and triggers re-renders. In Python/Go, you'd write the notification logic yourself.
</details>

### 5.3 Subscribing to Specific State

```tsx
function NodeCounter() {
  // Only re-renders when `nodes` changes — ignores `edges`, `past`, etc.
  const nodes = useFlowStore((s) => s.nodes);

  return <p>{nodes.length} nodes</p>;
}
```

**This is critical for performance.** A canvas with 100 nodes doesn't re-render when you change a single edge, because the `NodeCounter` component only subscribes to `nodes`.

### 5.4 Undo/Redo Pattern

```tsx
interface FlowState {
  nodes: Node[];
  edges: Edge[];
  past: { nodes: Node[]; edges: Edge[] }[];
  future: { nodes: Node[]; edges: Edge[] }[];
}

function saveSnapshot(state: FlowState) {
  return {
    past: [...state.past, { nodes: state.nodes, edges: state.edges }].slice(-50),
    future: [], // Any redo history is invalidated on new change
  };
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [...future, { nodes, edges }],
      nodes: previous.nodes,
      edges: previous.edges,
    });
  },
}));
```

The undo system works like a stack of snapshots:
- Before every destructive change, push `{ nodes, edges }` onto `past`
- On undo: pop from `past`, push current state onto `future`
- On redo: pop from `future`, push current state onto `past`
- `slice(-50)` caps history at 50 entries to prevent memory issues

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — same pattern with two lists as stacks
class UndoManager:
    def __init__(self, max_history=50):
        self.past: list[Snapshot] = []   # undo stack
        self.future: list[Snapshot] = [] # redo stack
        self.max_history = max_history

    def save_snapshot(self, nodes, edges):
        self.past.append(Snapshot(nodes, edges))
        if len(self.past) > self.max_history:
            self.past = self.past[-self.max_history:]
        self.future.clear()  # invalidate redo on new change

    def undo(self, nodes, edges):
        if not self.past:
            return None
        previous = self.past.pop()
        self.future.append(Snapshot(nodes, edges))
        return previous

    def redo(self, nodes, edges):
        if not self.future:
            return None
        next_state = self.future.pop()
        self.past.append(Snapshot(nodes, edges))
        return next_state
```

```go
// Go — same with slices
type UndoManager struct {
    past   []Snapshot
    future []Snapshot
}

func (u *UndoManager) Save(nodes []Node, edges []Edge) {
    u.past = append(u.past, Snapshot{nodes, edges})
    if len(u.past) > 50 { u.past = u.past[len(u.past)-50:] }
    u.future = u.future[:0] // clear redo
}
```

The pattern is identical across all three languages — two stacks (lists/slices), push on change, swap on undo/redo. The only difference is that in React, calling `set()` after popping from the stack automatically re-renders the UI.
</details>

### 5.5 Handling React Flow Changes

```tsx
import { type OnNodesChange } from '@xyflow/react';

interface FlowState {
  onNodesChange: OnNodesChange;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  onNodesChange: (changes) => {
    const isRemove = changes.some((c) => c.type === 'remove');
    if (isRemove) {
      set({ ...saveSnapshot(get()), nodes: applyNodeChanges(changes, get().nodes) });
      return;
    }
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
}));
```

React Flow calls `onNodesChange` when the user drags, selects, or deletes nodes. `applyNodeChanges` is a utility from React Flow that applies an array of changes to the node array. The store wraps it to:
- Save an undo snapshot before deletions
- Forward other changes (position, selection) directly

---

## 6. Step 3: The Canvas — React Flow Basics

### 6.1 Core Concepts

React Flow's canvas is managed by the `<ReactFlow>` component. The three fundamental concepts:

**Nodes** are boxes on the canvas. Each node has:
- An `id` (unique string)
- A `position` (`{ x: number, y: number }`)
- A `data` object (your custom data — label, pins, values, etc.)
- A `type` string (maps to a React component for rendering)

**Edges** are wires connecting nodes. Each edge has:
- An `id` (unique string)
- `source` and `target` (node IDs)
- `sourceHandle` and `targetHandle` (pin handle IDs on the nodes)
- A `data` object (edge metadata like wire color)

**Handles** are the connection points on nodes. They're invisible circles rendered by the `<Handle>` component. Each handle has:
- An `id` (must be unique within the node)
- A `type`: `'source'` (output, right side) or `'target'` (input, left side)
- A `position`: `Position.Left` or `Position.Right`

### 6.2 Minimal Canvas Setup

```tsx
import { ReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

function Canvas() {
  const nodes = [
    {
      id: 'node-1',
      type: 'customNode',  // maps to a component in nodeTypes
      position: { x: 100, y: 100 },
      data: { label: 'My Node' },
    },
  ];

  return (
    <ReactFlowProvider>
      <ReactFlow nodes={nodes} edges={[]} />
    </ReactFlowProvider>
  );
}
```

**`ReactFlowProvider`** is required for any component that uses React Flow hooks (`useReactFlow`, `useStore`, `useOnSelectionChange`). It must be an ancestor of `<ReactFlow>`, not a sibling.

### 6.3 Node Type Registry

React Flow requires a mapping from `type` strings to React components:

```tsx
import { MyNode } from './MyNode';

const nodeTypes = {
  customNode: MyNode,   // when node.type === 'customNode', render <MyNode />
  otherNode: OtherNode,
};

<ReactFlow nodes={nodes} nodeTypes={nodeTypes} />
```

### 6.4 Handles (Pins)

```tsx
import { Handle, Position } from '@xyflow/react';

function MyNode({ data, id }) {
  return (
    <div>
      {/* Input pin on the left */}
      <Handle type="target" position={Position.Left} id="input-1" />

      <span>{data.label}</span>

      {/* Output pin on the right */}
      <Handle type="source" position={Position.Right} id="output-1" />
    </div>
  );
}
```

When the user drags from one handle to another, React Flow creates an edge connecting them. The edge's `sourceHandle` matches the source node's handle `id`, and `targetHandle` matches the target node's handle `id`.

### 6.5 Custom Edges

```tsx
import { BaseEdge, getBezierPath } from '@xyflow/react';

function CustomEdge({ id, sourceX, sourceY, targetX, targetY, style }) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, curvature: 0.4 });
  return <BaseEdge id={id} path={path} style={style} />;
}

const edgeTypes = { custom: CustomEdge };

<ReactFlow nodes={nodes} edges={edges} edgeTypes={edgeTypes} />
```

`getBezierPath` calculates a smooth bezier curve between two points. `BaseEdge` renders the path as an SVG `<path>`. The `curvature` parameter controls how much the curve bows (0 = straight line, 1 = very curved).

### 6.6 Panels (Toolbar, Minimap, Console)

React Flow provides `<Panel>` for positioning overlays on the canvas:

```tsx
import { Panel } from '@xyflow/react';

<ReactFlow nodes={nodes} edges={edges}>
  <Panel position="top-center">
    <div className="toolbar">...</div>
  </Panel>
  <Panel position="bottom-right">
    <div className="console">...</div>
  </Panel>
  <Panel position="bottom-left">
    <MiniMap />
  </Panel>
</ReactFlow>
```

### 6.7 Key React Flow Hooks

| Hook | Purpose |
|---|---|
| `useReactFlow()` | Access React Flow instance — `getNodes()`, `setNodes()`, `screenToFlowPosition()`, `zoomIn()`, `fitView()` |
| `useStore(selector)` | Read from React Flow's internal state (selected nodes, viewport, etc.) without subscribing |
| `useOnSelectionChange({ onChange })` | Fire a callback whenever the selection changes |

---

## 7. Step 4: The Pin Type System

### 7.1 Two Kinds of Pins

R-Flow has two fundamentally different pin types:

1. **Execution pins** (white) — control the order of operations. An execution wire means "do this next." Every node that participates in execution has at least one execution input and one execution output.

2. **Data pins** (colored) — carry typed values between nodes. A data wire means "use this value." The color indicates the data type.

### 7.2 Data Types

```ts
type PinDataType =
  | 'execution'  // white — controls flow
  | 'float'      // yellow — decimal numbers
  | 'int'        // teal — integer numbers
  | 'string'     // pink — text strings
  | 'bool'       // red — true/false
  | 'json'       // green — JSON objects/arrays
  | 'object'     // blue — opaque/structural types
  | 'wildcard';  // gray — accepts any type
```

### 7.3 Pin Color Map

```ts
export const PIN_COLORS: Record<PinDataType, string> = {
  execution: '#ffffff',
  float: '#e8d44d',
  int: '#1bc6a0',
  string: '#f050a0',
  bool: '#cc0000',
  json: '#50c878',
  object: '#0066ff',
  wildcard: '#aaaaaa',
};
```

Each pin is rendered with a background color matching its type. This is applied via a CSS custom property:

```tsx
<Handle
  type="target"
  position={Position.Left}
  id={pin.id}
  className="ue-handle ue-handle--data"
  data-datatype={pin.dataType}
  style={color ? { '--pin-bg': color } as React.CSSProperties : undefined}
/>
```

The CSS then reads `--pin-bg`:

```css
.ue-handle--data {
  background: var(--pin-bg, #aaaaaa);
}
```

### 7.4 Wildcard Pins

Wildcard pins accept any data type. They don't have a fixed color — instead, they resolve their color from whatever is connected to them.

The resolution happens in `BaseNode.tsx`:

```tsx
// For each connected edge, check if either pin is wildcard
const effectiveType = sourceType === 'wildcard' ? targetType : sourceType;
const color = PIN_COLORS[effectiveType];

// If this edge targets our node and our pin is wildcard, store the resolved color
if (localTargetPin.dataType === 'wildcard') {
  colors.set(e.targetHandle!, color);
}
```

This means if you connect a float output (yellow) to a wildcard input, that input pin turns yellow. If you later disconnect it, it goes back to gray.

### 7.5 Node Category Colors

Each node category has a header color:

```ts
export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  start: '#1a8b3c',
  function: '#2d5baa',
  event: '#8b1a1a',
  math: '#1a6b6b',
  branch: '#555566',
  loop: '#555566',
  comment: '#c8a832',
  pure: '#3d3d5c',
};
```

This is applied via CSS custom property on the node's header div:

```tsx
<div style={{ '--header-color': CATEGORY_COLORS[category] } as React.CSSProperties}>
  <div className="blueprint-node__header">{label}</div>
  ...
</div>
```

---

## 8. Step 5: Node Components

### 8.1 BaseNode — The Shared Renderer

Most node types (function, math, branch, loop, pure, event) share the same visual layout. Instead of writing 6 nearly-identical components, they all delegate to `BaseNode`.

```tsx
function BaseNode({ id, data }: { id: string; data: BlueprintNodeData }) {
  const { label, category, inputs = [], outputs = [], values = {} } = data;
  const headerColor = CATEGORY_COLORS[category] ?? '#3a3a5c';

  return (
    <div className="blueprint-node" style={{ '--header-color': headerColor }}>
      <div className="blueprint-node__header">
        <NodeIcon category={category} label={label} />
        <span>{label}</span>
      </div>
      <div className="blueprint-node__body">
        {inputs.map((input, i) => (
          <div key={i}>
            <DataPin id={input.id} type="target" dataType={input.dataType} />
            <PinLabel label={input.label} />
            {/* Only show inline editor when pin is NOT connected */}
            {!connectedInputIds.has(input.id) && (
              <input value={values[input.id] ?? ''} onChange={...} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Key detail**: When a pin has an incoming edge, the inline value editor is hidden — the value comes from the upstream node instead. The `connectedInputIds` set is computed from the current edge state:

```tsx
const connectedInputIds = useStore((s) => {
  const ids = new Set<string>();
  for (const e of s.edges) {
    if (e.target === id) ids.add(e.targetHandle!);
  }
  return ids;
});
```

### 8.2 Inline Value Editing

When a pin is unconnected, the user can type a value directly into the node. The value is stored in `node.data.values[pinId]`:

```tsx
const onValueChange = (pinId: string, value: string) => {
  setNodes((nds) =>
    nds.map((n) => {
      if (n.id !== id) return n;
      return {
        ...n,
        data: {
          ...n.data,
          values: { ...(n.data as BlueprintNodeData).values, [pinId]: value },
        },
      };
    }),
  );
};
```

**Important**: The `nodrag` CSS class on input fields prevents React Flow from interpreting clicks on inputs as node drags:

```tsx
<input className="blueprint-node__pin-input nodrag" ... />
```

Without this, clicking an input field would start dragging the node.

### 8.3 Specialized Node Components

Some nodes have unique layouts that don't fit BaseNode's pattern:

- **StartNode** — No input pins, only output pins. Custom renderer because the left side is empty.
- **ConstantNode** — Type-specific editors (dropdown for bool, textarea for JSON, text input for string/float/int). Header badge shows the data type.
- **CommentNode** — Free-text annotation. Auto-resizing textarea, horizontal resize handle.
- **ArrayNode** — Dynamic list of items with add/remove buttons. Each item has its own input pin.
- **ConversionNode** — Minimal layout: one input pin, one output pin, no inline editor.
- **RequestNode** — URL input, method dropdown, JSON textareas with validation, collapsible output pins.

### 8.4 The `nodrag` CSS Class

```tsx
<input className="blueprint-node__pin-input nodrag" onClick={(e) => e.stopPropagation()} />
```

Three things prevent React Flow from treating input interactions as node drags:
1. `nodrag` CSS class — tells React Flow's internal drag handler to ignore this element
2. `onClick={(e) => e.stopPropagation()}` — prevents the click from bubbling up
3. `onMouseDown={(e) => e.stopPropagation()}` — prevents mousedown from starting a drag

---

## 9. Step 6: Edge (Wire) Components

### 9.1 Edge Data Structure

```tsx
const edge = {
  id: 'e-start-func1',
  source: 'start-1',          // source node ID
  sourceHandle: 'exec-out', // source pin handle ID
  target: 'func-1',            // target node ID
  targetHandle: 'exec-in',  // target pin handle ID
  type: 'blueprint',         // maps to BlueprintEdge component
  data: {
    dataType: 'execution',  // the pin type of this wire
    pinColor: '#ffffff',   // the resolved color for rendering
  },
};
```

### 9.2 Custom Edge Rendering

```tsx
function BlueprintEdge({ id, sourceX, sourceY, targetX, targetY, data, style }) {
  // Calculate a smooth bezier curve between the two endpoints
  const [edgePath] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    curvature: 0.4, // how much the curve bows
  });

  const edgeColor = (data as { pinColor?: string }).pinColor ?? '#b1b1b7';

  return (
    <>
      {/* The visible wire */}
      <BaseEdge id={id} path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: isExecution ? 3 : 2,
          filter: `drop-shadow(0 0 3px ${edgeColor}40)`,
          ...style,
        }}
      />
      {/* Invisible wider hit area for easier clicking */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={14}
        onClick={(e) => { /* Alt+Click to delete */ }} />
    </>
  );
}
```

### 9.3 Wildcard Edge Color Resolution

When a wildcard pin is connected to a typed pin, the edge needs to show the typed pin's color (not gray). This is resolved at render time:

```tsx
const { resolvedColor } = useStore((s) => {
  const sourcePin = sourceNode?.data?.outputs?.find(p => p.id === e.sourceHandle);
  const targetType = (targetPin?.dataType) ?? 'wildcard';

  // If one side is wildcard, use the other side's type
  const effectiveType = sourceType === 'wildcard' ? targetType : sourceType;
  const color = PIN_COLORS[effectiveType] ?? storedColor;
  return color;
});
```

### 9.4 Array Edge Diamond Marker

Edges connected to ArrayNode nodes display a small diamond marker at the midpoint of the wire. This is rendered as an SVG polygon at the label position calculated by `getBezierPath`:

```tsx
{isArray && (
  <polygon
    points={`${labelX},${labelY - s} ${labelX + s},${labelY} ${labelX},${labelY + s} ${labelX - s},${labelY}`}
    fill={edgeColor}
  />
)}
```

---

## 10. Step 7: Connection Logic

### 10.1 Connection Validation

When the user drags a wire between two pins, React Flow calls `isValidConnection(connection)`. The function returns `true` (allow) or `false` (reject).

```tsx
<ReactFlow
  isValidConnection={(connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;

    // Rule 1: No self-connections
    if (source === target) return false;

    // Look up the pin types on both sides
    const sourceType = getPinType(sourceNode, sourceHandle);
    const targetType = getPinType(targetNode, targetHandle);

    // Rule 2: Wildcard accepts anything
    if (sourceType === 'wildcard' || targetType === 'wildcard') return true;

    // Rule 3: Same type always valid
    if (sourceType === targetType) return true;

    // Rule 4: Execution only connects to execution
    if (sourceType === 'execution' || targetType === 'execution') return false;

    // Rule 5: Object doesn't convert
    if (sourceType === 'object' || targetType === 'object') return false;

    // Rule 6: Check if types are convertible (e.g., float → string)
    return isConvertible(sourceType, targetType);
  }}
/>
```

<details>
<summary><b>Python equivalent — type checking logic</b></summary>

The validation logic is pure type checking — no React-specific concepts here. In Python, it would look almost identical:

```python
def is_valid_connection(
    source: str, target: str,
    source_type: PinDataType, target_type: PinDataType,
) -> bool:
    # Rule 1: No self-connections
    if source == target:
        return False
    # Rule 2: Wildcard accepts anything
    if source_type == "wildcard" or target_type == "wildcard":
        return True
    # Rule 3: Same type always valid
    if source_type == target_type:
        return True
    # Rule 4: Execution only connects to execution
    if source_type == "execution" or target_type == "execution":
        return False
    # Rule 5: Object doesn't convert
    if source_type == "object" or target_type == "object":
        return False
    # Rule 6: Check convertibility
    return is_convertible(source_type, target_type)
```

The logic maps 1:1. The only React-specific part is *where* this function is called — React Flow invokes it automatically when the user drags a wire. In a Python desktop app (e.g., PyQt, tkinter), you'd call the same logic in a mouse event handler.
</details>

### 10.2 Auto-Inserting Conversion Nodes

When `isValidConnection` returns `true` for a type mismatch that's convertible (e.g., float output → string input), the connection handler in `flowStore.onConnect` doesn't just create an edge — it inserts a ConversionNode between them:

```
Before:  [Float Output] ──────────────► [String Input]
After:   [Float Output] ──► [Float→String] ──► [String Input]
```

```tsx
onConnect: (connection) => {
  if (isConvertible(sourceType, targetType)) {
    // Create a conversion node at the midpoint between source and target
    const convNode = {
      id: `conv-${Date.now()}-...`,
      type: 'conversionNode',
      position: { x: midX, y: midY },
      data: {
        label: getConversionLabel(sourceType, targetType), // e.g., "Float → String"
        category: 'conversion',
        sourceType,
        targetType,
        inputs: [{ id: 'value-in', direction: 'target', dataType: sourceType }],
        outputs: [{ id: 'value-out', direction: 'source', dataType: targetType }],
      },
    };

    // Create two edges: source→converter and converter→target
    const edge1 = buildEdge({ source, sourceHandle, target: convId, targetHandle: 'value-in' }, sourceType);
    const edge2 = buildEdge({ source: convId, sourceHandle: 'value-out', target, targetHandle }, targetType);

    set({ nodes: [...nodes, convNode], edges: addEdge(edge2, addEdge(edge1, edges)) });
    return;
  }

  // Direct connection for same-type or wildcard
  set({ edges: addEdge(buildEdge(connection, resolvedType), edges) });
};
```

### 10.3 Conversion Logic

```tsx
// Can these types be converted?
export function isConvertible(from: PinDataType, to: PinDataType): boolean {
  if (from === to) return false;          // Same type — no conversion needed
  if (from === 'wildcard' || to === 'wildcard') return false;  // Wildcard accepts anything
  if (from === 'execution' || to === 'execution') return false; // Only execution ↔ execution
  if (from === 'object' || to === 'object') return false;       // Object is opaque
  if (from === 'json' && to !== 'string') return false;     // JSON only → string
  if (to === 'json') return false;                          // Nothing → JSON
  return CONVERTIBLE_TYPES.has(from) && CONVERTIBLE_TYPES.has(to);
}

// Actually perform the conversion
export function convertValue(value: string, from: PinDataType, to: PinDataType): string {
  switch (to) {
    case 'string': return value;                                    // Everything has a string representation
    case 'int': return String(parseInt(value, 10) || 0);                // "42" → 42
    case 'float': return String(parseFloat(value) || 0);                // "3.14" → 3.14
    case 'bool': return value !== '' && value !== 'false' ? 'true' : 'false'; // "0" → "false"
  }
}
```

<details>
<summary><b>Python / Go equivalent</b></summary>

```python
# Python — same conversion logic
def convert_value(value: str, from_type: PinDataType, to_type: PinDataType) -> str:
    match to_type:
        case "string":
            return value
        case "int":
            try:
                return str(int(value))
            except ValueError:
                return "0"
        case "float":
            try:
                return str(float(value))
            except ValueError:
                return "0.0"
        case "bool":
            return "true" if value not in ("", "false", "0") else "false"
```

```go
// Go — same logic with a switch
func convertValue(value string, to PinDataType) string {
    switch to {
    case "string":
        return value
    case "int":
        if n, err := strconv.Atoi(value); err == nil { return strconv.Itoa(n) }
        return "0"
    case "float":
        if f, err := strconv.ParseFloat(value, 64); err == nil { return strconv.FormatFloat(f, 'f', -1, 64) }
        return "0"
    case "bool":
        if value == "" || value == "false" || value == "0" { return "false" }
        return "true"
    default:
        return value
    }
}
```

Note: R-Flow stores all values as strings internally (even numbers and booleans). This simplifies the type system — every pin carries a string, and the execution engine converts when needed. This is a common pattern in node editors (Unreal Engine Blueprints do the same thing with a `FString`-based pin system).
</details>

---

## 11. Step 8: The Execution Engine

### 11.1 Overview

The executor walks the graph starting from Start nodes, following execution wires (white wires). At each node, it performs the node's action and then follows all outgoing execution edges.

```
Start → Print String → Branch → [true path] → HTTP Request → Print String → ...
                                   └→ [false path] → Delay → Print String → ...
```

<details>
<summary><b>Python / Go equivalent</b></summary>

If you were to implement this in Python, the graph would be a dict of nodes and a list of edges, and the executor would be a recursive function:

```python
from dataclasses import dataclass
from typing import Any

@dataclass
class Node:
    id: str
    data: dict[str, Any]

@dataclass
class Edge:
    id: str
    source: str
    source_handle: str
    target: str
    target_handle: str

@dataclass
class ExecCtx:
    nodes: list[Node]
    edges: list[Edge]
    ancestors: set[str]   # for loop detection
    steps: int            # safety counter

def resolve_input(ctx: ExecCtx, node_id: str, handle_id: str) -> str:
    """Follow edges to find the value, or fall back to stored value."""
    edge = next((e for e in ctx.edges
                 if e.target == node_id and e.target_handle == handle_id), None)
    if edge:
        return resolve_output(ctx, edge.source, edge.source_handle)
    node = next(n for n in ctx.nodes if n.id == node_id)
    return node.data.get("values", {}).get(handle_id, "")

async def execute(ctx: ExecCtx, node_id: str):
    if ctx.steps >= 1000 or node_id in ctx.ancestors:
        return
    ctx.ancestors.add(node_id)
    ctx.steps += 1

    node = next(n for n in ctx.nodes if n.id == node_id)
    category = node.data["category"]
    label = node.data["label"]

    if category == "function" and label == "Print String":
        value = resolve_input(ctx, node_id, "string-in")
        print(value)

    # Follow all outgoing execution edges
    for edge in ctx.edges:
        if edge.source == node_id and edge.source_handle == "exec-out":
            await execute(ExecCtx(ctx.nodes, ctx.edges, set(ctx.ancestors), ctx.steps))
```

The JavaScript/TypeScript version in R-Flow is structurally identical — the only differences are syntax (`async/await`, `for...of`, `Map` vs `dict`). The algorithm (recursive walk, ancestors set for loop detection, value resolution by following edges) is the same in every language.
</details>

### 11.2 Execution Context

All state for a single execution run is stored in a context object:

```tsx
interface ExecCtx {
  nodes: Node[];
  edges: Edge[];
  emit: (msg: string) => void;           // Print to output console
  onNodeActive: (nodeId: string) => void; // Highlight node on canvas
  onEdgeActive: (edgeId: string) => void; // Highlight wire on canvas
  delay: number;                            // Animation delay between nodes

  // Per-node state:
  loopIndex: Map<string, number>;   // Current loop iteration index
  loopValue: Map<string, string>;   // Current loop element value
  requestResults: Map<string, {    // HTTP response data
    status: number;
    headers: string;
    json: string;
    text: string;
    ok: boolean;
  }>;
}
```

### 11.3 Value Resolution

When a node needs an input value, the executor resolves it:

```tsx
function resolveInputValue(ctx, nodeId, handleId): string {
  // Check if an edge is connected to this pin
  const edge = ctx.edges.find(
    (e) => e.target === nodeId && e.targetHandle === handleId,
  );

  if (edge) {
    // Follow the edge to the source node and get its output value
    return resolveOutputValue(ctx, edge.source, edge.sourceHandle!);
  }

  // No edge connected — use the user's typed value from the node's data
  const node = ctx.nodes.find((n) => n.id === nodeId);
  return node?.data?.values?.[handleId] ?? '';
}
```

This is a recursive function: resolving a value may trigger resolution of upstream values, forming a chain. For example:

```
Constant "Hello" → Format Text arg1 → Print String string-in
```

Resolving `string-in` on Print String finds the edge to Format Text, calls `resolveOutputValue` for Format Text's `result` pin, which resolves `arg1` by finding the edge to Constant, which returns `"Hello"`.

### 11.4 Execution Walk

```tsx
async function executeNode(ctx, nodeId, ancestors, steps) {
  if (steps.count >= 1000) return;       // Safety limit
  if (ancestors.has(nodeId)) return;   // Infinite loop detection

  ancestors.add(nodeId);
  steps.count++;

  // Highlight this node, pause for animation
  ctx.onNodeActive(nodeId);
  await wait(ctx.delay);

  switch (data.category) {
    case 'function':
      if (data.label === 'Print String') {
        const value = resolveInputValue(ctx, nodeId, 'string-in');
        ctx.emit(value);
      }
      if (data.label === 'HTTP Request') {
        // Make the request, store result in ctx.requestResults
        const response = await fetch('/api/request', { ... });
        ctx.requestResults.set(nodeId, { ... });
      }
      // Follow ALL outgoing execution edges (fan-out)
      for (const target of followExecAll(ctx, nodeId, 'exec-out')) {
        await executeNode(ctx, target.targetId, new Set(ancestors), steps);
      }
      break;

    case 'branch':
      const condition = resolveInputValue(ctx, nodeId, 'condition');
      const isTrue = condition !== '' && condition !== 'false' && condition !== '0';
      // Follow ONLY the chosen branch
      const pin = isTrue ? 'true' : 'false';
      for (const target of followExecAll(ctx, nodeId, pin)) {
        await executeNode(ctx, target.targetId, new Set(ancestors), steps);
      }
      break;

    case 'loop':
      for (let i = first; i <= last; i++) {
        ctx.loopIndex.set(nodeId, i);
        // Execute loop body for this iteration
        for (const target of followExecAll(ctx, nodeId, 'body')) {
          await executeNode(ctx, target.targetId, new Set(ancestors), steps);
        }
      }
      ctx.loopIndex.delete(nodeId);
      // Follow 'completed' output after all iterations
      for (const target of followExecAll(ctx, nodeId, 'completed')) {
        await executeNode(ctx, target.targetId, new Set(ancestors), steps);
      }
      break;
  }
}
```

### 11.5 Fan-Out (One Output → Multiple Targets)

`followExecAll` returns ALL edges from an execution pin, not just the first:

```tsx
function followExecAll(ctx, nodeId, handleId): { targetId: string; edgeId: string }[] {
  return ctx.edges
    .filter((e) => e.source === nodeId && e.sourceHandle === handleId)
    .map((e) => ({ targetId: e.target, edgeId: e.id }));
}
```

This means a single output can trigger multiple branches — useful for fan-out patterns:

```
Start → Print "A"
Start → Print "B"
```

### 11.6 Infinite Loop Detection

The `ancestors` set tracks the execution path on the current branch. If a node appears twice on the SAME branch, it's an infinite loop. But a node CAN appear on different branches (diamond pattern):

```
Start → Branch(true) → Print "A" → Join → Print "C"
      └→ Branch(false) → Print "B" ────────┘
```

Each branch gets its own `new Set(ancestors)` copy, so the "Join" node appearing on both branches is legal.

---

## 12. Step 9: Drag and Drop from Sidebar

### 12.1 The DnD Context

A React context shares the "currently dragged node type" between the sidebar and the canvas:

```tsx
const DnDContext = createContext({ draggedType: null, setDraggedType: () => {} });

export function DnDProvider({ children }) {
  const [draggedType, setDraggedType] = useState<string | null>(null);
  return (
    <DnDContext.Provider value={{ draggedType, setDraggedType }}>
      {children}
    </DnDContext.Provider>
  );
}

export function useDnD() {
  return useContext(DnDContext);
}
```

<details>
<summary><b>Python / Go equivalent</b></summary>

React Context solves the "prop drilling" problem — when a deeply nested component needs data from a high-level ancestor, you'd normally have to pass it through every intermediate component. Context lets you skip the middlemen.

```python
# Python — global variable (simplest approach, same effect)
_dragged_type: str | None = None

def set_dragged_type(t: str | None):
    global _dragged_type
    _dragged_type = t

def get_dragged_type() -> str | None:
    return _dragged_type

# Or with contextvars (Python 3.7+)
import contextvars
dragged_type: contextvars.ContextVar[str | None] = contextvars.ContextVar('dragged_type', default=None)
```

```go
// Go — a struct in a shared package
package dnd

var (
    mu         sync.RWMutex
    draggedType string
)

func Set(t string) { mu.Lock(); draggedType = t; mu.Unlock() }
func Get() string  { mu.RLock(); defer mu.RUnlock(); return draggedType }
```

In Python or Go, you'd just use a global/package-level variable. React can't do this easily because React's rendering model needs to know when state changes so it can re-render. That's why React has `createContext` + `Provider` — it connects the state to React's rendering system while making it accessible to any nested component without prop drilling.
</details>

### 12.2 Sidebar Item — Drag Source

```tsx
function SidebarItem({ type, label }) {
  const { setDraggedType } = useDnD();

  const onDragStart = (event) => {
    // Store the node type in the drag data transfer
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedType(type);
  };

  const onDragEnd = () => {
    setDraggedType(null);
  };

  return <button draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>{label}</button>;
}
```

### 12.3 Canvas — Drop Target

```tsx
function Canvas() {
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useFlowStore((s) => s.addNode);

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    // Convert screen coordinates to canvas coordinates
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const newNode = createNodeFromType(type, position);
    addNode(newNode);
  };

  return (
    <ReactFlow onDragOver={onDragOver} onDrop={onDrop} />
  );
}
```

### 12.4 Node Factory

The factory maps template keys to complete node objects:

```tsx
const templates: Record<string, NodeTemplate> = {
  printString: {
    type: 'functionNode',
    data: {
      label: 'Print String',
      category: 'function',
      inputs: [
        { id: 'exec-in', label: '', direction: 'target', dataType: 'execution' },
        { id: 'string-in', label: 'In String', direction: 'target', dataType: 'string' },
      ],
      outputs: [
        { id: 'exec-out', label: '', direction: 'source', dataType: 'execution' },
      ],
    },
  },
  // ... more templates
};

export function createNodeFromType(type: string, position: XYPosition): Node {
  const template = templates[type];
  return {
    id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: template.type,
    position,
    data: { ...template.data }, // Shallow copy of the data object
  };
}
```

The template data is shallow-copied (spread operator). This works because the data is mostly string literals and arrays of simple objects. Mutable state (like `values`) is empty at creation time and gets populated by user interaction later.

<details>
<summary><b>Python / Go equivalent — the factory pattern</b></summary>

```python
# Python — same factory pattern with a dict of templates
import uuid
from dataclasses import dataclass, field, asdict

@dataclass
class NodeTemplate:
    type: str
    label: str
    category: str
    inputs: list[dict] = field(default_factory=list)
    outputs: list[dict] = field(default_factory=list)

templates: dict[str, NodeTemplate] = {
    "printString": NodeTemplate(
        type="functionNode",
        label="Print String",
        category="function",
        inputs=[
            {"id": "exec-in", "label": "", "direction": "target", "dataType": "execution"},
            {"id": "string-in", "label": "In String", "direction": "target", "dataType": "string"},
        ],
        outputs=[
            {"id": "exec-out", "label": "", "direction": "source", "dataType": "execution"},
        ],
    ),
}

def create_node(template_key: str, x: float, y: float) -> dict:
    template = templates[template_key]
    return {
        "id": f"node-{uuid.uuid4().hex[:8]}",
        "type": template.type,
        "position": {"x": x, "y": y},
        "data": asdict(template),  # shallow copy of template data
    }
```

```go
// Go — factory with a map
type NodeTemplate struct {
    Type    string
    Label   string
    Category string
    Inputs  []PinConfig
    Outputs []PinConfig
}

var templates = map[string]NodeTemplate{
    "printString": {
        Type: "functionNode", Label: "Print String", Category: "function",
        Inputs:  []PinConfig{{ID: "exec-in", DataType: "execution"}},
        Outputs: []PinConfig{{ID: "exec-out", DataType: "execution"}},
    },
}

func createNode(key string, x, y float64) Node {
    t := templates[key]
    return Node{
        ID:       fmt.Sprintf("node-%d", time.Now().UnixNano()),
        Type:     t.Type,
        Position: XYPosition{X: x, Y: y},
        Data:     t, // Go copies structs by value — no need for explicit clone
    }
}
```

The pattern is the same: a dictionary/map of templates, a factory function that looks up the template and returns a new object. The JavaScript spread operator `{ ...template.data }` is equivalent to Python's `asdict()` or Go's implicit struct copy.
</details>

---

## 13. Step 10: Keyboard Shortcuts and Clipboard

### 13.1 Global Keydown Handler

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if (e.key === 'z' && e.shiftKey)  { e.preventDefault(); redo(); return; }
    if (e.key === 'y')                 { e.preventDefault(); redo(); return; }
    if (e.key === 'c')                 { e.preventDefault(); copy(); return; }
    if (e.key === 'v')                 { e.preventDefault(); paste(); return; }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, redo, nodes, edges, pasteNodes, setNodes]);
```

**Important**: The dependency array must include all values read inside the handler (closure variables that can change between renders). If you omit a dependency, the handler will use stale values.

### 13.2 Selection Tracking

```tsx
const selectedIdsRef = useRef<Set<string>>(new Set());

useOnSelectionChange({
  onChange: ({ nodes: selectedNodes }) => {
    selectedIdsRef.current = new Set(selectedNodes.map((n) => n.id));
  },
});
```

`useOnSelectionChange` fires whenever the user selects or deselects nodes. We use a ref (not state) because we only need the selection data when Ctrl+C is pressed — there's no need to re-render the canvas on every selection change.

### 13.3 Copy Implementation

```tsx
function copy() {
  const selectedIds = selectedIdsRef.current;
  const selectedNodes = nodes.filter((n) => selectedIds.has(n.id));

  // Deep-clone nodes (preserves data.values, data.items, etc.)
  const clonedNodes = selectedNodes.map((n) => structuredClone(n));

  // Find the top-left corner of the selection (for relative positioning)
  const minX = Math.min(...clonedNodes.map((n) => n.position.x));
  const minY = Math.min(...clonedNodes.map((n) => n.position.y));

  // Collect internal edges (both endpoints in the selection)
  const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
  const clonedEdges = edges
    .filter((e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target))
    .map((e) => structuredClone(e));

  clipboard = { nodes: clonedNodes, edges: clonedEdges, origin: { x: minX, y: minY } };
}
```

**Key design decision**: Only "internal" edges are copied (both endpoints in the selection). Edges that connect to nodes outside the selection are dropped — they wouldn't make sense on the copy.

### 13.4 Paste-at-Cursor

```tsx
function paste() {
  if (!clipboard) return;

  // Generate new IDs for all nodes
  const idMap = new Map<string, string>();
  for (const node of clipboard.nodes) {
    idMap.set(node.id, generateId());
  }

  // Use last known mouse position as the paste anchor
  const anchor = lastMouseFlowPos ?? { x: 0, y: 0 };

  // Reposition nodes so their bounding box origin aligns with cursor
  const newNodes = clipboard.nodes.map((n) => ({
    ...structuredClone(n),
    id: idMap.get(n.id)!,
    position: {
      x: n.position.x - clipboard.origin.x + anchor.x,
      y: n.position.y - clipboard.origin.y + anchor.y,
    },
    selected: true,
  }));

  // Remap edge source/target IDs to new node IDs
  const newEdges = clipboard.edges.map((e) => ({
    ...structuredClone(e),
    id: generateEdgeId(),
    source: idMap.get(e.source)!,
    target: idMap.get(e.target)!,
  }));

  // Deselect existing nodes, paste new ones
  setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
  pasteNodes(newNodes, newEdges);
}
```

The position formula `n.position.x - clipboard.origin.x + anchor.x` means: "take this node's position, subtract the selection's top-left corner (making it relative to 0,0), then add the cursor position (placing it at the cursor)." This preserves the relative layout of copied nodes.

### 13.5 Mouse Position Tracking

```tsx
// Module-level variable — persists across renders, no re-renders
let lastMouseFlowPos: { x: number; y: number } | null = null;

// Inside CanvasInner component
useEffect(() => {
  const onMouseMove = (e: MouseEvent) => {
    lastMouseFlowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
  };
  window.addEventListener('mousemove', onMouseMove);
  return () => window.removeEventListener('mousemove', onMouseMove);
}, [screenToFlowPosition]);
```

`screenToFlowPosition` converts screen pixels to canvas coordinates, accounting for pan and zoom. This is why paste works correctly even when the canvas is panned or zoomed.

### 13.6 pasteNodes — Batch Insert

The `pasteNodes` action in the store inserts all nodes and edges in a single operation with one undo snapshot:

```tsx
pasteNodes: (newNodes, newEdges) => {
  const { past, future } = saveSnapshot(get());
  set({
    nodes: [...get().nodes, ...newNodes],
    edges: [...get().edges, ...newEdges],
    past,
    future,
  });
},
```

This is important because calling `addNode` N times would save N undo snapshots, meaning the user would need to press Ctrl+Z N times to undo a paste.

---

## 14. Step 11: HTTP Request Proxying (Backend)

### 14.1 The Problem: CORS

Browsers enforce the Same-Origin Policy — a webpage at `localhost:5173` cannot make fetch requests to `https://api.example.com` because the target server doesn't send the permissive `Access-Control-Allow-Origin` header.

Solution: make the request server-side instead of from the browser.

### 14.2 Go Backend

```go
package main

import (
  "encoding/json"
  "net/http"
)

type ProxyRequest struct {
    URL    string            `json:"url"`
    Method string            `json:"method"`
    Params map[string]string `json:"params"`
    Body   string            `json:"body"`
}

type ProxyResponse struct {
    Status  int               `json:"status"`
    Headers map[string]string `json:"headers"`
    Body    string            `json:"body"`
    OK      bool              `json:"ok"`
}

func handleProxy(w http.ResponseWriter, r *http.Request) {
    // 1. Decode the request body
    var req ProxyRequest
    json.NewDecoder(r.Body).Decode(&req)

    // 2. Parse the target URL
    parsedURL, err := url.Parse(req.URL)

    // 3. Append query parameters
    if len(req.Params) > 0 {
      q := parsedURL.Query()
      for k, v := range req.Params) { q.Set(k, v) }
      parsedURL.RawQuery = q.Encode()
    }

    // 4. Create and execute the HTTP request
    proxyReq, _ := http.NewRequest(req.Method, parsedURL.String(), bodyReader)
    resp, err := http.DefaultClient.Do(proxyReq)

    // 5. Read response and return to the browser
    respBody, _ := io.ReadAll(resp.Body)
    headers := make(map[string]string)
    for k, vv := range resp.Header { headers[k] = vv[0] }

    json.NewEncoder(w).Encode(ProxyResponse{
      Status:  resp.StatusCode,
      Headers: headers,
      Body:    string(respBody),
      OK:      resp.StatusCode >= 200 && resp.StatusCode < 300,
    })
}
```

<details>
<summary><b>Python equivalent — same proxy in Flask</b></summary>

```python
from flask import Flask, request, jsonify
import requests as http_requests

app = Flask(__name__)

@app.route("/api/request", methods=["POST"])
def handle_proxy():
    # 1. Decode the request body
    data = request.get_json()
    url = data.get("url")
    method = data.get("method", "GET")
    params = data.get("params", {})
    body = data.get("body")

    if not url:
        return jsonify({"ok": False, "body": "missing url"}), 400

    # 2-3. Build the target URL with query parameters
    # (requests library handles this automatically)
    # 4. Make the actual HTTP request
    try:
        resp = http_requests.request(
            method=method,
            url=url,
            params=params,
            data=body if method not in ("GET", "HEAD") else None,
            headers={"Content-Type": "application/json"} if body else None,
        )
        # 5. Return the response
        return jsonify({
            "status": resp.status_code,
            "headers": dict(resp.headers),
            "body": resp.text,
            "ok": 200 <= resp.status_code < 300,
        })
    except Exception as e:
        return jsonify({"ok": False, "body": str(e)}), 502
```

The Go and Python versions are structurally identical — same 5 steps, same JSON shape. The Go version is used in production because it compiles to a single static binary with no runtime dependencies (no Python installation, no pip packages). The Python version would work fine for development or prototyping.
</details>

### 14.3 Vite Dev Server Plugin (Alternative to Go)

During development, you don't need to run the Go server. A Vite plugin adds the same endpoint to the dev server:

```ts
function requestProxy(): PluginOption {
  return {
    name: 'request-proxy',
    configureServer(server) {
      server.middlewares.use('/api/request', async (req, res) => {
        // Same logic as the Go server, but in Node.js
        const parsed = JSON.parse(body);
        const response = await fetch(parsed.url, { method: parsed.method, body: parsed.body });
        const respBody = await response.text();
        res.end(JSON.stringify({ status: response.status, body: respBody, ok: ... }));
      });
    },
  };
}

export default defineConfig({
  plugins: [requestProxy(), react()],
});
```

The Vite plugin runs inside Node.js via `configureServer`, so it has access to `fetch` (available in Node 18+). In production, the Go server handles this instead.

---

## 15. Architecture Overview

### 15.1 File Structure

```
src/
├── main.tsx              # Entry point — renders App into the DOM
├── App.tsx               # Root layout — DnDProvider > Sidebar + Canvas
├── components/
│   ├── BlueprintCanvas.tsx   # Canvas + ReactFlow + keyboard shortcuts + clipboard
│   ├── nodeFactory.ts      # Node templates + sidebar categories + createNodeFromType()
│   ├── NodeIcon.tsx         # SVG icons per node category
│   └── OutputConsole.tsx    # Floating output log panel
├── nodes/
│   ├── BaseNode.tsx          # Shared renderer for most node types
│   ├── StartNode.tsx          # Entry point node (no inputs)
│   ├── FunctionNode.tsx       # Thin wrapper → BaseNode
│   ├── MathNode.tsx           # Thin wrapper → BaseNode
│   ├── BranchNode.tsx         # Thin wrapper → BaseNode
│   ├── LoopNode.tsx           # Thin wrapper → BaseNode
│   ├── PureNode.tsx           # Thin wrapper → BaseNode
│   ├── EventNode.tsx          # Thin wrapper → BaseNode
│   ├── ConstantNode.tsx       # Custom: typed value editors
│   ├── CommentNode.tsx        # Custom: auto-resizing textarea
│   ├── ArrayNode.tsx          # Custom: dynamic item list
│   ├── ConversionNode.tsx    # Custom: minimal layout
│   ├── RequestNode.tsx        # Custom: HTTP request UI
│   └── nodeTypes.ts         # Type→component registry
├── pins/
│   ├── DataPin.tsx           # Colored circle for data pins
│   ├── ExecutionPin.tsx      # White triangle for execution pins
│   └── PinLabel.tsx          # Text label next to a pin
├── edges/
│   ├── BlueprintEdge.tsx     # Custom bezier wire with glow
│   └── edgeTypes.ts         # Edge type registry
├── store/
│   ├── flowStore.ts         # Nodes, edges, undo/redo, pasteNodes
│   ├── executionStore.ts    # Active node/edge, isExecuting
│   └── outputStore.ts       # Output console messages
├── hooks/
│   └── useDnD.tsx           # Drag-and-drop context
├── sidebar/
│   ├── Sidebar.tsx           # Collapsible node palette
│   ├── SidebarCategory.tsx    # Collapsible category section
│   └── SidebarItem.tsx        # Draggable node button
├── toolbar/
│   ├── Toolbar.tsx           # Top control bar (Run, Undo, Save, Zoom)
│   └── ToolbarButton.tsx     # Styled button with tooltip
├── types/
│   ├── nodes.ts             # PinDataType, PinConfig, BlueprintNodeData, PIN_COLORS, CATEGORY_COLORS
│   ├── edges.ts             # BlueprintEdgeData
│   └── index.ts             # Re-exports
├── utils/
│   └── conversionUtils.ts    # isConvertible(), convertValue(), getConversionLabel()
├── engine/
│   └── executor.ts          # Graph walker: resolveInputValue, resolveOutputValue, executeNode
├── vite.config.ts          # Vite config + requestProxy() plugin
server/
└── main.go                # Go HTTP proxy + static file server
```

### 15.2 Data Flow Diagram

```
User Action                     Store                              UI Update
─────────────────────────────     ─────────────────────────────     ────────────────

Drag node from sidebar         DnDContext.setDraggedType        SidebarItem
Drop node on canvas          flowStore.addNode()                 Canvas renders new node
Type mismatch connection     flowStore.onConnect()                Insert ConversionNode
Move node                    flowStore.onNodesChange()             Canvas updates position
Delete node/edge              flowStore.onNodesChange()             Canvas removes element
Undo (Ctrl+Z)                flowStore.undo()                    Canvas restores state
Copy (Ctrl+C)                Module clipboard variable             No visual change
Paste (Ctrl+V)              flowStore.pasteNodes()             Canvas renders copied nodes
Run button                   executionStore.startExecution()       Toolbar disables
Execute Node                 executionStore.setActiveNode()       Node gets glow animation
Execute Edge                 executionStore.setActiveEdge()       Edge gets flow animation
Print String emits              outputStore.addMessage()           OutputConsole appends
HTTP Request returns            ctx.requestResults.set()           RequestNode outputs resolved
```

### 15.3 Key Design Decisions

| Decision | Rationale |
|---|---|
| Module-level clipboard (not Zustand) | Clipboard doesn't affect rendering. Simpler code. |
| Ref for selection tracking | Only read on Ctrl+C — no re-renders needed. |
| `structuredClone` for copying | Handles nested objects/arrays automatically. No manual deep copy. |
| Per-branch ancestors set | Allows same node on different branches (diamond pattern). |
| `saveSnapshot` on every destructive change | Single consistent undo pattern. |
| `pasteNodes` batch action | One undo for entire paste, not N undos. |
| Vite plugin for dev API proxy | No need for separate Go process during development. |
| Go server for production | Single static binary, no runtime dependencies. |
