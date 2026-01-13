# CLAUDE_GUIDE.md - AI Development Rules for Sunbelt-PM-System-V1

## 1. Project Overview & Core Principles

- Stack: React 18 + Vite + TypeScript + Tailwind CSS + Supabase (Auth, RLS, Realtime).
- Key folders:
  - src/components/workflow/: All phase/subtask visualization logic lives here.
  - src/components/: Domain-specific UI (e.g., project cards, RFI lists).
  - src/utils/supabaseClient.ts: Supabase init (use this, never expose keys).
- Core philosophy: Keep components small (<150-200 lines), single-responsibility. Use compound patterns where needed. Prefer hooks for logic. Tailwind for styling. Framer Motion for subtle animations only.
- Visual style: Minimalist like Linear.app – clean pills/blocks, status dots, curved connectors. No heavy gamification; subtle pulses/glows for progress.

## 2. Workflow & Visualization Architecture (Critical Reference)

- Phases are NOT nodes/stations – they are canvas areas/zones (e.g., vertical columns or horizontal bands).
  - 6 fixed phases: Pre-Production → Design → Manufacturing → Quality Control → Site Work/Installation → Closeout.
  - Each phase zone contains only its subtasks as draggable stations/nodes.
  - Progression: All stations in a phase must be Complete (green/glow) to unlock next phase (visual cue: header glow/brighten).
- Stations (subtasks/nodes):
  - Draggable within their phase zone only.
  - Rounded pill shape, label + key info (e.g., due date, RFIs).
  - Internal: Horizontal row of status dots/checkpoints (gray → orange pulse → green glow → red blocked pulse).
  - Status colors/animations:
    - Not Started: Gray, static.
    - In Progress: Blue/orange accent, slow border pulse.
    - Blocked: Red, sharper pulse + ! icon.
    - Complete: Green, steady soft glow.
- Lines/connectors:
  - Curved, attach to node ends (left/right).
  - In Progress: Slow directional pulse.
  - Complete: Solid green glow.
  - Blocked: Static red.
- Library: Use @xyflow/react (React Flow) for canvas, nodes, edges.
  - Custom StationNode.tsx for stations (with status logic/animations).
  - Custom edges for pulsing/glow.
- Data: Fetch from Supabase (projects → phases → subtasks → steps/status/dependencies). Use Realtime for live updates.

## 3. Component Placement Rules

When adding or modifying:

- New visualization variant → src/components/workflow/visualizers/ (e.g., SubwayFlow.tsx for subway-inspired, DependencyGraph.tsx for basic).
- Core reusable node/edge → src/components/workflow/components/ (e.g., StationNode.tsx, PulsingEdge.tsx).
- Phase zone logic → src/components/workflow/PhaseZone.tsx or WorkflowCanvas.tsx.
- If it's a general UI element (progress circle, status dot) → src/components/ui/ or shared/.
- Hooks for data/logic → src/hooks/workflow/ (e.g., useWorkflowGraph.ts).
- Never put visualization code outside /workflow/.

## 4. Prompting & Output Rules for Claude

Always follow this structure in prompts to me:
`<role>`You are a senior React/Supabase developer expert in this project.`</role>`
`<context>`Reference the rules in CLAUDE_GUIDE.md sections 1-3. Current file: [file path]. Existing code: [paste relevant snippet].`</context>`
`<task>`[Clear task, e.g., "Extend the WorkflowCanvas to support phase zones as described in section 2."]`</task>`
`<constraints>`

- Use TypeScript.
- Tailwind classes only.
- Framer Motion for animations (subtle only).
- Follow status colors/animations exactly from section 2.
- Keep components <150 lines if possible; extract hooks.
- No new dependencies without justification.
  `</constraints>`
  `<examples>`
- Good: Use existing StationNode pattern.
- Bad: Generic AI slop (Inter font defaults, purple gradients) – avoid.
  `</examples>`
  <output_format>

1. Think step-by-step in `<thinking>` tags.
2. Output full code in ```tsx
3. Explain changes in `<explanation>` tags.
4. If multiple files, list them clearly.
   </output_format>

## 5. Common Patterns & Anti-Patterns

- Good: Custom React Flow nodes/edges with Framer Motion variants for pulse/glow.
- Bad: Over-animated (no trains, no excessive motion); inline styles; prop drilling (use context/hooks).
- Animation keyframes: Use CSS @keyframes for pulse (slow opacity/scale), Framer for glow (box-shadow).

## 6. Review Checklist

Before accepting code from Claude:

- Matches architecture (phases as zones, stations draggable in-zone)?
- Status animations correct (pulse in-progress, glow complete)?
- Lines attach to ends and curve dynamically?
- Uses existing libs/patterns?

Update this file as architecture evolves.
