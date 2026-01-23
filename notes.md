also refine the spacing between the text and the 3 dots menue.

another thing what is better to replace the 3 dots with x to delete the tab and the renaming will still there bt double clicking and maybe add also the context menu..or leave the 3 dots as it

the top bar need mor enhancement and refinment give me plan for what can improve and fix etc

focus more on the tabs behaviour ability to reorder them , each board max and min width , the long name problems  and  3 dots icons with text in the board name 


------------------


import functionality 
Global Search	Searches hardcoded types, not yet scoped to project
PDF Viewer	May have hardcoded file references


make double clicking the project name allow user to rename it as also add min and max for better ui ux either for the input field and for the max lenght to show the full project name

fix top bar

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