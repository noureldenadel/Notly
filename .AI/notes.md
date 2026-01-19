<!-- use lovable modal for pdfs -->
<!-- hange app name and favicon to yellow box for now -->
<!-- when adding images make it appear in the center of my current view of the canvas not at 0,0 -->
<!-- Clicking the pdf dosent open it -->
<!-- how to reshow the right pannel -->
<!-- Search in TopBar	⌘K shortcut shown but may not be wired globally -->
<!-- Shortcuts cheatsheet	Shortcuts listed may not all work -->
<!-- make the tabs of the boards work -->






import functionality 
Global Search	Searches hardcoded types, not yet scoped to project
PDF Viewer	May have hardcoded file references





data to persist thumbnail and refractor the app







right now i zoom out to 80% when i open the app on browser and i think this is better for users
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