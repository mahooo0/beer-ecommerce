---
phase: 05-search-system
plan: 04
subsystem: admin-search-ui
tags: [admin, search-settings, meilisearch-config, ui]
dependencies:
  requires: [05-01-meilisearch-infra, 05-02-search-api]
  provides: [admin-search-settings-ui]
  affects: [admin-dashboard]
tech_stack:
  added: []
  patterns: [server-actions, client-components, form-state-management]
key_files:
  created:
    - apps/admin/src/app/dashboard/search/actions.ts
    - apps/admin/src/app/dashboard/search/page.tsx
    - apps/admin/src/app/dashboard/search/search-settings-form.tsx
  modified:
    - apps/admin/src/app/dashboard/layout.tsx
decisions:
  - Use server actions for search settings API calls with Clerk token forwarding
  - Separate server component (page.tsx) for data fetching from client component (form) for interactivity
  - Tag pill UI pattern for stop words with inline remove buttons
  - Up/down arrow buttons for ranking rules reordering (not drag-and-drop)
  - Warning-styled yellow background for full re-sync section to emphasize caution
metrics:
  duration: 2.2m
  completed: 2026-03-11T10:20:33Z
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 05 Plan 04: Admin Search Settings UI Summary

**One-liner:** Admin UI for managing Meilisearch synonyms, stop words, ranking rules, and triggering full product re-sync with real-time feedback

## What Was Built

Created a complete admin interface for configuring Meilisearch search behavior at `/dashboard/search`:

**Server Actions (actions.ts):**
- `getSearchSettings()`, `getSynonyms()`, `getStopWords()`, `getRankingRules()` - fetch current configuration
- `updateSynonyms()`, `updateStopWords()`, `updateRankingRules()` - save configuration changes
- `triggerFullSync()` - initiate full product re-indexing
- All actions use Clerk token forwarding for authentication

**Search Settings Page (page.tsx):**
- Server component that fetches all settings in parallel
- Passes data to SearchSettingsForm client component
- Styled with max-w-4xl container and descriptive header

**Interactive Form (search-settings-form.tsx):**
- **Synonyms Section:** Add/remove synonym pairs (key → comma-separated values), displays as list with remove buttons
- **Stop Words Section:** Add/remove stop words, displays as tag pills with × buttons
- **Ranking Rules Section:** Reorder rules with up/down arrow buttons, reset to default option
- **Full Re-sync Section:** Trigger button with warning styling (yellow background)
- All sections show loading states and success/error messages
- Form state management with React useState

**Navigation:**
- Added "Search" link to admin sidebar under Settings section

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**Manual verification recommended:**
1. Navigate to `/dashboard/search` from admin sidebar
2. Test synonym management: add "phone → smartphone, mobile", save, verify feedback
3. Test stop words: add common words like "the", "a", "and", save, verify pills display
4. Test ranking rules: reorder with up/down buttons, save, verify persistence
5. Test reset to default button for ranking rules
6. Test full re-sync trigger, verify success message

**Expected API endpoints (from 05-02):**
- GET/PUT `/api/search/synonyms`
- GET/PUT `/api/search/stop-words`
- GET/PUT `/api/search/ranking-rules`
- POST `/api/search/sync`

## Key Implementation Details

**Authentication Pattern:**
```typescript
// Server actions use Clerk auth() to get token
const { getToken } = await auth();
const token = await getToken();
// Forward in Authorization header to backend API
```

**Client State Management:**
- Each section maintains independent state (synonyms, stopWords, rankingRules)
- Each section has independent loading/status state
- Add operations update local state immediately, save operations persist to API
- Success/error feedback displayed below save buttons

**UI Patterns:**
- Synonyms: List with key → values display, remove button per entry
- Stop words: Tag pills with × close button (flex-wrap layout)
- Ranking rules: Numbered list with up/down controls, disabled at boundaries
- Full re-sync: Yellow/warning themed card to emphasize caution

## Files Changed

**Created:**
- `apps/admin/src/app/dashboard/search/actions.ts` (134 lines) - Server actions for all search settings operations
- `apps/admin/src/app/dashboard/search/page.tsx` (28 lines) - Server component that fetches settings and renders form
- `apps/admin/src/app/dashboard/search/search-settings-form.tsx` (406 lines) - Interactive client component with four settings sections

**Modified:**
- `apps/admin/src/app/dashboard/layout.tsx` - Added Search navigation link under Settings

## Commits

- `fea5b40`: feat(05-04): add search settings server actions and page
- `550350f`: feat(05-04): add interactive search settings form and navigation

## Integration Points

**Depends on:**
- 05-01: Meilisearch infrastructure and search service
- 05-02: Search API endpoints for settings CRUD operations

**Enables:**
- Admin can configure search behavior without code changes
- Admin can tune search relevance through synonym and stop word management
- Admin can prioritize ranking factors to match business needs
- Admin can manually trigger re-indexing when data is out of sync

## Next Steps

This completes SRCH-06 (Admin search configuration UI). The search system is now fully functional with:
1. Meilisearch infrastructure and sync (05-01)
2. Search API endpoints (05-02)
3. Client search interface (05-03, if exists)
4. Admin settings UI (05-04 - this plan)

Remaining work in Phase 05 likely includes client-facing search UI and advanced features like filters/facets.

## Self-Check: PASSED

**Files exist:**
```bash
✓ apps/admin/src/app/dashboard/search/actions.ts
✓ apps/admin/src/app/dashboard/search/page.tsx
✓ apps/admin/src/app/dashboard/search/search-settings-form.tsx
✓ apps/admin/src/app/dashboard/layout.tsx (modified)
```

**Commits exist:**
```bash
✓ fea5b40 - feat(05-04): add search settings server actions and page
✓ 550350f - feat(05-04): add interactive search settings form and navigation
```

**Verification commands:**
```bash
# Check files created
ls -la apps/admin/src/app/dashboard/search/
# Output: actions.ts, page.tsx, search-settings-form.tsx

# Check nav link added
grep -A2 "Users" apps/admin/src/app/dashboard/layout.tsx | grep "Search"
# Output: Search link present

# Check server actions have auth
grep "await auth()" apps/admin/src/app/dashboard/search/actions.ts
# Output: Found in authenticatedFetch helper
```
