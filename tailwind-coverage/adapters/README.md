# Framework adapters

Each framework runs in its own exact-version-pinned package and process. An adapter
must emit `Observation` records; returning from a parser is only `accepted`, while
`lowered` requires an exact valid platform output and `rendered` requires a fixture.

Planned pins for the first reproducible baseline:

- Tamagui: git SHA from `codex/tailwind-coverage-audit`
- NativeWind: `5.0.0-preview.4`
- Uniwind: `1.11.0`
- Tailwind CSS: `4.3.0`
- React Native: `0.86.2`
