import functionality 
Global Search	Searches hardcoded types, not yet scoped to project
PDF Viewer	May have hardcoded file references



=
---
do search and advance search need to be edited also ??

Thought for 1s

Good question - let me check what the current search does:

Analyzed

GlobalSearch.tsx
Based on the GlobalSearch outline, it searches across:

Cards (global)
Files (global)
Highlights (global)
Projects
Boards
For Project-Scoped Model:
Current Search	Needed Change?
Search cards globally	⚠️ Cards now live on canvas per-board, not in global store
Search files globally	⚠️ Files are per-project
Search highlights globally	❌ Not implemented anyway
Search projects	✅ Keep - makes sense
Search boards	✅ Keep - makes sense
My recommendation:
For v1.0 - Simplify search to just Projects & Boards:

Remove card/file/highlight search (they're canvas elements now)
Keep project & board navigation
OR: Remove search entirely and just use the sidebar
Alternatively:

Keep the search box in sidebar as a "filter projects" feature only
What would you prefer?

Keep search but limit to Projects/Boards only
Remove search entirely (sidebar is enough for navigation)
Keep as-is (won't work well but can fix later)
---