# AUTISTIC JOURNEY — Engineering Tasks & Roadmap Breakdown

**Document Version:** 1.0  
**Derived From:** [AUTISTIC JOURNEY PRD (v1.0)](file:///C:/Users/boopa/.gemini/antigravity-ide/brain/8575cf67-0285-444f-a562-d1991d00be5f/autistic_journey_prd.md)  
**Tracking Status:** In Progress (Phase 0 & Phase 1 Scaffold Complete)

---

## Quick Reference & Progress Summary

| Phase | Description | Status | Core Deliverables |
|---|---|---|---|
| **Phase 0** | Architecture, Scaffolding & Tooling | [x] Completed | Next.js 14+ App Router, TypeScript, Tailwind CSS, Prisma ORM, Storage Abstraction |
| **Phase 1** | Authentication & Invite Gate | [x] Completed | JWT HTTP-only sessions, bcrypt passwords, invite code consumption, middleware protection |
| **Phase 2** | User Approval & Account Lifecycle | [ ] Pending | Access requests, admin review/approval, suspension, gender & profile locks |
| **Phase 3** | Groups & Social Sub-Vaults | [ ] Pending | Batch groups, custom circles, membership lifecycle, invite/join flows |
| **Phase 4** | Media Ingestion & Storage Adapter | [/] In Progress | Direct presigned uploads (S3/R2), EXIF stripping, metadata indexing |
| **Phase 5** | Gallery & Secure Media Viewing | [ ] Pending | Virtualized infinite grid, photo lightbox, video streaming, anti-download headers |
| **Phase 6** | Permissions, Visibility & Gender Gate | [ ] Pending | Server-side visibility evaluator, gender separation, circle-restricted visibility |
| **Phase 7** | Admin Dashboard & Deletion Workflows | [ ] Pending | System metrics, user management, audit trails, two-man rule deletion requests |
| **Phase 8** | Security Hardening & Watermarking | [ ] Pending | OWASP Top 10 hardening, dynamic overlay watermarking, anti-scraping, rate limits |
| **Phase 9** | Performance Optimization & Polish | [ ] Pending | Progressive image loading, HLS video transcoding, responsive mobile UX |

---

## Phase 0: Architecture, Setup & Storage Abstraction

- [x] **TASK-001**: Initialize Next.js App Router workspace with TypeScript, ESLint, and Tailwind CSS.
- [x] **TASK-002**: Define environment variable specifications (`.env.example` and `.env`).
- [x] **TASK-003**: Create base UI tokens and dark gallery theme in `globals.css`.
- [x] **TASK-004**: Define complete PostgreSQL database schema in `prisma/schema.prisma` (Users, Roles, InviteCodes, MediaAssets, MediaVariants, Albums, Tags, PersonTags, AccessLogs, AuditTrails).
- [x] **TASK-005**: Create initial seed script in `prisma/seed.ts` with master admin, initial invite code (`AJ-BATCH-2026-INIT`), and default taxonomy tags.
- [x] **TASK-006**: Create Storage Provider interface & S3/Cloudflare R2/MinIO client adapter in `src/lib/storage.ts`.
- [x] **TASK-007**: Run `prisma generate` to compile Prisma Client typings.

---

## Phase 1: Authentication & Invite Gate

- [x] **TASK-101**: Implement JWT session management utilities with HTTP-only cookies in `src/lib/auth.ts`.
- [x] **TASK-102**: Build transactional invite-code redemption and user registration API in `src/app/api/auth/register/route.ts`.
- [x] **TASK-103**: Build credential authentication endpoint with bcrypt password verification in `src/app/api/auth/login/route.ts`.
- [x] **TASK-104**: Build session verification and logout endpoints in `src/app/api/auth/me/route.ts`.
- [x] **TASK-105**: Implement session guard middleware in `src/middleware.ts` to redirect unauthenticated visitors to `/login`.
- [x] **TASK-106**: Build dark-mode login UI in `src/app/(auth)/login/page.tsx`.
- [x] **TASK-107**: Build invite redemption and onboarding page in `src/app/(auth)/register/page.tsx`.
- [ ] **TASK-108**: Implement IP-based brute-force rate-limiting for login attempts (exponential backoff after 5 failures).
- [ ] **TASK-109**: Implement session invalidation token blacklist in database/cache for instant logout revocation.

---

## Phase 2: User Approval & Account Lifecycle

- [x] **TASK-201**: Add `AccessRequest` model to database schema for users requesting entry without an invite code.
- [x] **TASK-202**: Build public access request submission form (`/request-access`) capturing college batch, year, ID verification, and notes.
- [x] **TASK-203**: Build admin review API (`/api/admin/access-requests`) for approving/rejecting onboarding requests.
- [x] **TASK-204**: Implement user status state machine (`ACTIVE`, `PENDING_SETUP`, `SUSPENDED`, `DEACTIVATED`).
- [x] **TASK-205**: Enforce server-side gender property immutability (set once during verification, editable only by Super Admin).
- [x] **TASK-206**: Build user profile management page allowing name and avatar updates while protecting immutable security attributes.

---

## Phase 3: Groups & Social Circles

- [x] **TASK-301**: Implement database models for `Group`, `GroupMember`, `GroupRole` (`OWNER`, `MODERATOR`, `MEMBER`), and `GroupType`.
- [x] **TASK-302**: Build Group CRUD API endpoints (`/api/groups`, `/api/groups/[id]`).
- [x] **TASK-303**: Build group membership management APIs (inviting members, joining, leaving, removing members) in `/api/groups/[id]/members`.
- [x] **TASK-304**: Build Group Explorer and Circle management UI in `/groups`.
- [x] **TASK-305**: Enforce IDOR protection: verify caller has proper group role before modifying group metadata or member list.
- [x] **TASK-306**: Implement system batch groups and types (`FRIENDS`, `HOSTEL`, `CLASS`, `PROJECT_TEAM`, `TRIP`, `DEPARTMENT`, `CUSTOM`).

---

## Phase 4: Media Upload & Processing Pipeline

- [x] **TASK-401**: Build direct-to-storage presigned upload URL generator in `src/app/api/media/upload/presign/route.ts`.
- [x] **TASK-402**: Implement MIME type whitelist and file size limits (50MB photos, 2GB videos).
- [x] **TASK-403**: Build upload completion endpoint in `src/app/api/media/upload/complete/route.ts` with `HeadObject` storage verification.
- [x] **TASK-404**: Build drag-and-drop batch uploader UI in `src/components/uploader/BatchUploader.tsx`.
- [x] **TASK-405**: Implement client-side SHA-256 calculation to detect and block duplicates before upload begins.
- [x] **TASK-406**: Implement background media processing worker:
  - Extract and sanitize EXIF/metadata (capture date, camera make/model, dimensions).
  - Strip GPS location coordinates for privacy preservation.
  - Generate WebP thumbnails (`THUMBNAIL_SM`: 320px, `THUMBNAIL_MD`: 640px, `THUMBNAIL_LG`: 1280px, `OPTIMIZED_WEBP`: 2048px).
- [x] **TASK-407**: Implement media ingestion derivatives pipeline in `src/lib/mediaWorker.ts` and integrate with `/api/media/upload/complete`.

---

## Phase 5: Gallery & Secure Media Viewing

- [x] **TASK-501**: Build archive home dashboard shell in `src/app/archive/page.tsx`.
- [x] **TASK-502**: Build virtualized masonry photo grid component supporting cursor pagination and filtering in `src/components/gallery/InfiniteGallery.tsx`.
- [x] **TASK-503**: Build full-screen media lightbox viewer with keyboard navigation (left/right arrow, escape) in `src/components/gallery/MediaLightbox.tsx`.
- [x] **TASK-504**: Implement custom secure HTML5 video player with timeline indicator, mute, playback controls, and download disabling.
- [x] **TASK-505**: Build secure media proxy endpoint (`/api/media/[id]/stream`) enforcing token authentication, access logging, and anti-caching headers (`no-cache`, `no-store`, `must-revalidate`).
- [x] **TASK-506**: Implement right-click / context menu suppression and drag-to-desktop prevention on media viewers.

---

## Phase 6: Granular Permissions, Visibility & Gender Gate

- [x] **TASK-601**: Implement server-side `PermissionEvaluator` service in `src/lib/permissions.ts` with visibility modes:
  - `PUBLIC_BATCH` — Visible to all verified members.
  - `GROUP_ONLY` — Visible only to members of specified groups.
  - `GENDER_RESTRICTED` — Visible only to verified male or female members (e.g. girls' hostel events).
  - `GROUP_AND_GENDER` — Intersection requiring both circle membership and gender match.
  - `SPECIFIC_USERS` — Private whitelist of explicit user IDs.
  - `PRIVATE_CREATOR` — Visible only to uploader and Archivist/Super Admin.
- [x] **TASK-602**: Integrate permission evaluator directly into database query builders (`buildAuthorizedMediaWhereClause`) in `/api/media` so unauthorized media is never retrieved or leaked.
- [x] **TASK-603**: Build visibility selector component inside the upload flow in `src/components/uploader/BatchUploader.tsx` allowing uploaders to configure scope, gender constraints, and assigned circles.
- [x] **TASK-604**: Prevent IDOR vulnerabilities across all media download, streaming, and detail endpoints (`/api/media/[id]/stream`) with 404 indistinguishability.
- [x] **TASK-605**: Create automated authorization test specification (`tests/authorization.test.ts`) validating gender bypass and group bypass invariants.

---

## Phase 7: Admin Dashboard & Deletion Workflows

- [x] **TASK-701**: Build Admin Console navigation and summary overview (`/admin`) displaying active users, storage usage, and recent uploads in `src/app/admin/page.tsx` and `/api/admin/metrics`.
- [x] **TASK-702**: Build User Management table with role adjustment, suspension, and account overview in `/api/admin/users`.
- [x] **TASK-703**: Build Golden Invite Key Generator UI with customizable role assignment, expiration, and usage caps in `/api/admin/invite-codes`.
- [x] **TASK-704**: Implement Two-Man Rule Deletion Workflow:
  - Deletion requests move to `PENDING_DELETION` with 14-day grace period.
  - Requires approval from a second independent Administrator before storage purge.
  - Soft-delete immediately hides media from all gallery views.
  - Implemented in `/api/admin/deletion-requests`.
- [x] **TASK-705**: Build Comprehensive Audit Trail Viewer with filtering by actor, action type, resource, and timestamp in `/api/admin/audit-logs`.
- [x] **TASK-706**: Build Storage Monitor showing breakdown of raw originals vs. generated WebP variants in `/api/admin/metrics`.

---

## Phase 8: Security Hardening & Forensics

- [x] **TASK-801**: Implement dynamic forensic watermarking in `src/components/gallery/MediaLightbox.tsx`:
  - Semi-transparent overlay with viewing user confidentiality notice, ISO timestamp, and archive verification markers.
- [x] **TASK-802**: Configure strict Content Security Policy (CSP), HSTS, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), and Referrer-Policy headers in `next.config.ts`.
- [x] **TASK-803**: Implement API rate limiting with sliding window tracking on sensitive routes (`/api/auth/*` max 15/min, `/api/*` max 120/min) in `src/lib/rateLimit.ts` and `src/middleware.ts`.
- [x] **TASK-804**: Build Anomaly Detection: flag requests exceeding 2.5x the rate limit threshold in `src/lib/rateLimit.ts`.
- [x] **TASK-805**: Enforce CSRF protection, SameSite cookie policies, and Origin validation across all mutating routes.
- [x] **TASK-806**: Security acceptance testing against OWASP Top 10 (SQLi parameterized ORM, strict input sanitization, zero-leak IDOR protection).

---

## Phase 9: Performance, Polish & Final UX

- [x] **TASK-901**: Implement blur-hash placeholder generation and multi-resolution WebP derivatives for instant perceived photo loading.
- [x] **TASK-902**: Optimize gallery queries with pagination cursor indexing (`capturedAt`, `id`) in `/api/media` and `InfiniteGallery.tsx`.
- [x] **TASK-903**: Build Timeline Navigator letting users jump directly to specific college semesters, years, or major college fests in `InfiniteGallery.tsx`.
- [x] **TASK-904**: Implement Person Tagging UI with interactive bounding box placement over faces and coordinate mapping in `MediaLightbox.tsx` and `/api/media/tags/person`.
- [x] **TASK-905**: Build multifaceted search engine supporting filters by tag, event, year, location, and tagged person in `/api/search` and `InfiniteGallery.tsx`.
- [x] **TASK-906**: Comprehensive responsive mobile polish for iOS Safari and Android Chrome, including touch swipe gestures and error boundaries (`error.tsx`, `not-found.tsx`).

---

## Verification & Acceptance Checklist

| ID | Verification Item | Target Standard | Status |
|---|---|---|---|
| **V-01** | Zero Public Access | Unauthenticated requests redirected to login | [x] Passed |
| **V-02** | Clean TypeScript Build | Next.js compilation completes with 0 errors | [x] Passed |
| **V-03** | Direct Storage Transfer | Files stream directly from browser to S3/R2 | [x] Passed |
| **V-04** | Gender Separation | Male accounts cannot view female-restricted media | [x] Passed |
| **V-05** | Deletion Safeguard | Media deletions cannot be executed unilaterally (Two-Man Rule) | [x] Passed |
| **V-06** | Audit Trail Logging | Every view, upload, and permission edit logged | [x] Passed |
