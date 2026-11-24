# Project Rules - TouchMyMac

1. **Strict 200-Line Limit**: Every source file (.py, .js, .css, etc.) must remain under 200 lines. Proactively split files approaching 180 lines.
2. **Vanilla & Zero Third-Party Bloat**:
   - Web frontend must use pure Vanilla JavaScript (ES modules) and Vanilla CSS with CSS variables.
   - Strictly NO Tailwind CSS, NO React.
   - Python backend must use built-in standard libraries and avoid external pip dependencies where possible.
3. **Mobile-First & Touch Ergonomics**:
   - Safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) on all screens.
   - Touch targets must be at least 48px.
4. **Git Discipline**:
   - Work on feature branches (`feature/<name>`).
   - Merge to `main` via PR loop.
