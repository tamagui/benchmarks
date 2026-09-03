# Cross-platform Tailwind coverage

This project compares Tamagui Tailwind, NativeWind, and Uniwind against one pinned
Tailwind catalog and one platform contract. It replaces the non-reproducible raw
parser-acceptance figures previously published by Tamagui.

## What counts

The primary score is **fully rendered semantic capabilities**. A capability receives
one vote regardless of how many colors, spacing tokens, or directional spellings
Tailwind generates for it.

For example, 6,320 default-theme mask candidates do not outweigh ordinary layout.
They are evidence for the single mask capability group and are excluded from the
cross-platform denominator while React Native has no mask primitive.

Evidence progresses through these levels:

1. `rejected` — the framework does not recognize the candidate.
2. `accepted` — a parser/compiler accepts it, but no valid platform output is proven.
3. `lowered` — the framework emits a valid style or host prop with an exact assertion.
4. `rendered` — an automated browser or simulator fixture proves the behavior.

Only `rendered` earns primary-score credit. `accepted` is retained as a diagnostic and
never presented as coverage.

## Platform contract

Each capability is classified independently for web, iOS, and Android:

- `applicable`: the platform has a production-capable primitive with the intended
  semantics.
- `limited`: a primitive exists with a documented version, architecture, or OS limit.
- `inapplicable`: the platform has no equivalent. This remains visible in the report
  but is excluded from that platform's denominator.

“Cross-platform” means rendered on every applicable platform, with limitations shown
instead of silently treated as full support. Component-specific utilities such as SVG
fill or TextInput placeholder color must be tested on the correct host component.

## Reproducibility rules

- Tailwind, React Native, and all compared libraries are exact-version pinned.
- Candidate inventory comes from Tailwind's installed design system, not a hand list.
- Every report includes dependency versions, git SHAs, OS/simulator details, and the
  raw machine-readable observations used to calculate it.
- Adapters run in separate processes so one framework cannot affect another's module
  aliases or globals.
- Generated reports are checked in and `check` fails on drift.
- A clean clone must reproduce parser/lowering reports. Render reports require the
  documented browser and simulator images.

## Current pinned catalog

Run:

```sh
bun install --frozen-lockfile
bun run catalog
bun run check
```

The generated catalog contains Tailwind CSS 4.3.0's 23,286 default-theme candidates
and their raw utility roots. The next layer maps those roots to semantic capabilities
and executes the isolated framework adapters.
