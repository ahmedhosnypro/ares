Frontend project's rules: Read frontend/AGENTS.md
Docs generation pipeline rules: Read scripts/docs/AGENTS.md

## AI Agent Communication Rules

- **NEVER create summary markdown files** for work completed (e.g., `SUMMARY.md`, `CHANGES.md`, `REPORT.md`, `FIXED.md`)
- **DO respond in chat** with a clear summary of what was done
- Summary files clutter the repository and are not needed
- Exception: Documentation files that are part of the project structure (e.g., `README.md`, `CONTRIBUTING.md`, `API.md`)

## Theme and Styling Rules (Frontend)

- **NO hardcoded colors allowed** - All colors MUST come from the theme palette defined in `frontend/providers/theme.ts`
- **NEVER use hex colors, rgb/rgba values, or color names** (e.g., `#fff`, `#000000`, `rgb(255,0,0)`, `"white"`, `"red"`)
- **Always use theme colors**: `theme.palette.primary.main`, `theme.palette.status.active.main`, `theme.palette.sidebar.background`
- If a color is needed that doesn't exist in the theme, add it to `frontend/providers/theme.ts` first
- This ensures proper theme switching (light/dark mode) and consistent design across the application
