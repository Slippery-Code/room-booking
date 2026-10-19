---
status: final
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-agentic-sdlc-workshop-2026-10-19/prd.md
  - _bmad-output/planning-artifacts/prds/prd-agentic-sdlc-workshop-2026-10-19/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-agentic-sdlc-workshop-2026-10-19/ARCHITECTURE-SPINE.md
  - AGENTS.md
---

# agentic-sdlc-workshop (Meeting-Room Booking) - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Meeting-Room Booking, decomposing the requirements from the PRD and Architecture requirements into implementable stories. No UX design contract exists; UI direction comes from the PRD and AD-7.

Non-interactive run: the product owner confirmation of the extracted requirements was accepted as proposed.

## Requirements Inventory

### Functional Requirements

FR1: Day view - a Member picks any day in the Booking Window (today + 6, Europe/Athens) and sees each Room's free/booked Slots; booked Slots show the booker's Name; days outside the window cannot be selected; past Slots today are unavailable.
FR2: Week overview - Busyness for all 3 Rooms x 7 days at a glance; selecting a day opens its day view; no Bookings = empty, all 24 Slots booked = full.
FR3: Room facts - each Room shown with capacity (Small 4, Medium 8, Large 14), Large with projector.
FR4: Create a Booking - Room, day in window, Slot boundaries, 30 min to 2 h, within 08:00-20:00, no past Slots, non-blank Name.
FR5: No double bookings - overlapping Bookings for a Room are refused with a message identifying the conflict; back-to-back allowed; result independent of attempt order.
FR6: Daily Allowance - max 2 h per Member per day across all Rooms, matched by Name; refusal states remaining allowance; cancelling restores time.
FR7: Name entry and memory - Name typed once, remembered on the device, prefilled later, changeable.
FR8: Name matching - case-insensitive, surrounding spaces ignored, everywhere a Name is compared.
FR9: View own Bookings - upcoming Bookings matched by Name.
FR10: Cancel own Booking - only with matching Name; Slots free immediately; no editing; trust model per PRD section 5.
FR11: Mobile first, desktop capable - all flows work on phone and desktop; booking flow one-handed on phone; comfortable touch targets.
FR12: Local storage, stated limitation - Bookings and Name in browser storage; per device; app states this plainly; data survives reload and restart.

### NonFunctional Requirements

NFR1: Booking rules (FR4-FR6, FR8) covered by automated tests including edge cases (slot boundaries, back-to-back, exactly 2 h, Name spacing and case).
NFR2: After page load, no network access is needed to browse or book.
NFR3: SM-1 zero double bookings in any device's data; SM-C1 speed must not weaken allowance or overlap checks.
NFR4: SM-2 a Member can book on a phone in under 30 seconds with Name remembered.

### Additional Requirements

- No starter template specified; the repo is an existing Vite + React 19 + TypeScript scaffold (check for `src/` before assuming).
- Functional core / imperative shell: `ui` -> `storage` -> `domain`; `domain` is pure TS and imports nothing outside itself (AD intro).
- AD-1: persist only `Booking[]` and the Name; everything else derived; Rooms are constants in `src/domain/rooms.ts`; Booking = `{ id, roomId, date, startSlot, slotCount, name }`; ids generated in the storage shell; no `endSlot`.
- AD-2: dates are Athens `'YYYY-MM-DD'` strings, times are slot ints 0..23, slotCount 1..4, half-open overlap; `src/domain/time.ts` is the only place converting instants (Intl, Europe/Athens) and exports `athensDate`, `athensSlotIndex`, `windowDates`, `slotLabel`, `formatDate`; in-progress slot counts as past.
- AD-3: domain takes `now: Date`; never reads the clock; tests include Athens midnight and DST.
- AD-4: only `createBooking(bookings, request, now)` and `cancelBooking(bookings, id, requesterName, now)` produce new lists, returning `Result`; check order name, length/grid, window, past, overlap, allowance; finished Bookings count toward allowance and cannot be cancelled; DomainError union on `code`; no user-facing strings in domain.
- AD-5: `nameKey(name) = name.normalize('NFC').trim().toLowerCase()` is the only Name comparison.
- AD-6: only `src/storage/` touches localStorage; `useBookings` hook exposes `bookings`, `currentName`, `book`, `cancel`, `setName`; keys `room-booking:v1`, `room-booking:name`; read-modify-write commits; corrupt data treated as empty; storage errors returned as Result; sync on `storage` events.
- AD-7: view state in React only, no router, no state library, plain CSS in `src/styles.css`, mobile-first; visible per-device notice.
- AD-8: day-grid query returns 24 cells per Room with independent `booking` and `past`; Busyness is integer `bookedSlots` 0..24; own Bookings sorted by date then startSlot.
- AD-9: `src/architecture.test.ts` enforces purity and single-owner rules via `npm run verify`.
- Constraints (AGENTS.md): no new runtime dependencies, strict TS, no `any`/`@ts-ignore`, do not change workflows/vite.config.ts/tsconfig.json, tests next to code, run `npm run verify` before done.

### UX Design Requirements

None - no UX design contract exists for this prototype.

### FR Coverage Map

FR1: Epic 1 - Day view per Room with free/booked/past Slots
FR2: Epic 1 - Week overview of Busyness
FR3: Epic 1 - Room capacity and projector facts
FR4: Epic 2 - Create Booking with length, grid, window, past, Name checks
FR5: Epic 2 - Overlap refusal, back-to-back allowed
FR6: Epic 2 - Daily Allowance (restore on cancel verified in Epic 3)
FR7: Epic 2 - Remembered Name
FR8: Epic 2 - nameKey matching (reused in Epic 3)
FR9: Epic 3 - My upcoming Bookings
FR10: Epic 3 - Cancel own Booking
FR11: Epic 4 - Mobile-first and desktop layout, touch targets (base styling begins in Epics 1-2)
FR12: Epic 2 - Persistence and per-device notice (cross-tab sync hardened in Epic 4)
NFR1: Epics 2, 3 - domain tests; Epic 4 - architecture test
NFR2: Epic 4 - verified no network code
SM-1/SM-C1: Epic 2 - rules enforced only in createBooking, order-independence tested

## Epic List

### Epic 1: See What's Free
A Member opens the page and sees, for any day in the Booking Window, which Rooms and Slots are free, plus a week overview of how busy each Room is.
**FRs covered:** FR1, FR2, FR3

### Epic 2: Book a Room
A Member picks a free time, types their Name once, and books a Room; double bookings, over-long Bookings and allowance overruns are refused with clear messages, and Bookings survive reload.
**FRs covered:** FR4, FR5, FR6, FR7, FR8, FR12

### Epic 3: Manage My Bookings
A Member sees their upcoming Bookings and cancels one so the Slots become free again and the allowance is restored.
**FRs covered:** FR9, FR10

### Epic 4: Phone-Ready and Trustworthy
The whole flow is comfortable on a phone and a desktop, and the architecture rules and offline behaviour are enforced by automated checks.
**FRs covered:** FR11 (plus NFR1, NFR2 guards)

## Epic 1: See What's Free

A Member opens the page and sees, for any day in the Booking Window, which Rooms and Slots are free, plus a week overview of how busy each Room is.

### Story 1.1: Athens time model and fixed Rooms

As a Member,
I want the app to know today's date and the current Slot in the space's own time zone,
So that the days and Slots I see are right wherever my phone thinks it is.

**Acceptance Criteria:**

**Given** `src/domain/rooms.ts` exists
**When** a developer reads the Room constants
**Then** Small (4), Medium (8) and Large (14, projector) are defined with ids `small | medium | large`, and nothing about Rooms is persisted

**Given** an instant `now`
**When** `athensDate(now)` and `athensSlotIndex(now)` are called
**Then** they return the Europe/Athens date `'YYYY-MM-DD'` and slot index 0..23 (08:00 = 0, 19:30 = 23), regardless of the process time zone

**Given** instants just before and after Athens midnight, and on the March and October DST change days
**When** `athensDate`, `athensSlotIndex` and `windowDates` are called
**Then** the dates and slots are correct and `windowDates(now)` returns exactly 7 consecutive dates starting today (day arithmetic on y/m/d parts, not +24 h)

**Given** a time before 08:00 or at/after 20:00 Athens time
**When** `athensSlotIndex(now)` is called
**Then** the result lets callers tell "before opening" (all Slots future) from "after closing" (all Slots past); the chosen representation is documented in a test

**Given** `slotLabel(slot)` and `formatDate(date)`
**When** called with slot 0, slot 23 and a date
**Then** they return `08:00`, `19:30` and a readable date string; no other module formats times or dates
**And** unit tests sit next to the code and `npm run verify` passes

### Story 1.2: Day view with Room facts

As a Member,
I want to pick a day and see each Room's free and booked Slots,
So that I know what I can book.

**Acceptance Criteria:**

**Given** a list of Bookings, a date and `now`
**When** the day-grid query runs
**Then** it returns for each of the 3 Rooms 24 cells, each with independent `booking: Booking | null` and `past: boolean` (a cell can be both), and a past Slot is one whose start is before `now`

**Given** the app is open
**When** the Member looks at the day view
**Then** each Room shows its capacity, the Large Room shows the projector, and each Slot is labelled with its `HH:mm` time and shown as free, booked (with the booker's Name) or unavailable (past)

**Given** today is the selected day
**When** the Member opens the day picker
**Then** only today and the next 6 days (Europe/Athens) can be selected and today is selected by default

**Given** today is selected and `now` is 10:10 Athens time
**When** the grid renders
**Then** Slots starting before 10:10, including the in-progress 10:00 Slot, show as unavailable

**Given** no Bookings exist yet
**When** the page loads
**Then** all future Slots show as free and `npm run verify` passes, with query unit tests and a UI test for day selection

### Story 1.3: Week overview

As a Member,
I want to see how busy each Room is on each of the next 7 days,
So that I can find a quiet day without opening every day.

**Acceptance Criteria:**

**Given** Bookings and a date
**When** the busyness query runs
**Then** it returns an integer `bookedSlots` 0..24 per Room per date, where no Bookings gives 0 and all 24 Slots booked gives 24

**Given** the week overview is shown
**When** the Member looks at it
**Then** all 7 days and 3 Rooms are visible at once, a day with 0 booked Slots reads as empty, and a day with 24 reads as full

**Given** the week overview
**When** the Member selects a day
**Then** the day view opens for that day

**Given** fixture Bookings (including a back-to-back pair and a fully booked Room-day)
**When** unit and UI tests run
**Then** counts and the empty/full labels are asserted and `npm run verify` passes

## Epic 2: Book a Room

A Member picks a free time, types their Name once, and books a Room; double bookings, over-long Bookings and allowance overruns are refused with clear messages, and Bookings survive reload.

### Story 2.1: Booking validity rules and Name matching

As a Member,
I want bookings with an invalid time, day or Name to be refused with a clear reason,
So that the calendar only contains sensible Bookings.

**Acceptance Criteria:**

**Given** `nameKey` in `src/domain/name.ts`
**When** called with `"  Eleni K. "` and `"eleni k."`
**Then** both return the same key, and an empty or whitespace-only Name yields an empty key

**Given** `createBooking(bookings, request, now)` returning a `Result`
**When** the request has a blank Name
**Then** it returns `{ ok: false, error: { code: 'name_required' } }`

**Given** a request with `slotCount` 0, 5 or more, or a range that starts before slot 0 or ends after slot 24
**When** `createBooking` runs
**Then** it returns `bad_length` or `outside_grid` respectively; `slotCount` 1 and 4 and a Booking ending exactly at 20:00 succeed

**Given** a date outside today..today+6 in Europe/Athens
**When** `createBooking` runs
**Then** it returns `outside_window`; the first and last window days succeed

**Given** a request whose start Slot is before `now` (including the in-progress Slot)
**When** `createBooking` runs
**Then** it returns `in_past`

**Given** a valid request
**When** `createBooking` runs
**Then** it returns `{ ok: true, value: { bookings, created } }` with a new array (input not mutated) and the trimmed Name stored as typed
**And** checks run in the order name, length/grid, window, past, and tests cover Athens midnight and DST; `npm run verify` passes

### Story 2.2: No double bookings and Daily Allowance

As a Member,
I want the app to refuse overlapping Bookings and more than 2 hours a day,
So that nobody double-books or hogs the Rooms.

**Acceptance Criteria:**

**Given** an existing Booking 10:00-11:00 in Medium
**When** another Booking overlaps it in the same Room (for example 10:30-11:30)
**Then** `createBooking` returns `overlap` with `conflicts` listing the clashing Bookings sorted by `startSlot`

**Given** an existing Booking ending at 10:00
**When** a Booking starting at 10:00 in the same Room is requested
**Then** it succeeds (back-to-back is allowed), and the same overlap on a different Room or a different day also succeeds

**Given** two Bookings A and B that overlap
**When** they are attempted in either order
**Then** exactly one succeeds and the other is refused, whichever order is used

**Given** a Member with 1.5 hours booked that day across Rooms
**When** they request 1 hour
**Then** it returns `allowance_exceeded` carrying 30 remaining minutes

**Given** a Member with exactly 2 hours total after the request
**When** `createBooking` runs
**Then** it succeeds; 2 hours plus one Slot is refused
**And** allowance matches Names through `nameKey` (so `"  ELENI k. "` counts as `"Eleni K."`), counts per day only, counts finished Bookings, and `overlap` is reported before `allowance_exceeded`
**And** unit tests cover these edge cases and `npm run verify` passes

### Story 2.3: Persist Bookings and the remembered Name

As a Member,
I want my Bookings and Name to still be there after I reload or reopen the browser,
So that I do not have to start over.

**Acceptance Criteria:**

**Given** `src/storage/` and the `useBookings` hook
**When** a Member books through `book(requestWithoutId)`
**Then** the shell generates the id (`crypto.randomUUID()` with a `getRandomValues` fallback), re-reads storage, applies `createBooking` to the fresh list, writes `{ version: 1, bookings }` under `room-booking:v1`, updates React state, and returns the domain `Result`

**Given** `setName("Eleni K.")`
**When** the page is reloaded
**Then** `currentName` is prefilled from `room-booking:name`, and changing the Name never rewrites existing Bookings

**Given** missing, corrupt, wrong-version or wrongly shaped stored data
**When** the hook loads
**Then** it yields an empty list without throwing, and a later commit overwrites it

**Given** `localStorage` throws on write (full or unavailable)
**When** `book` is called
**Then** it returns an error Result the UI can show, and state is unchanged

**Given** another tab changes or clears the storage (`storage` event, including `key === null`)
**When** the event fires
**Then** React state refreshes from storage
**And** storage tests use jsdom `localStorage`, nothing outside `src/storage/` touches `localStorage`, and `npm run verify` passes

### Story 2.4: Booking form with clear refusals

As a Member,
I want to tap a free Slot, extend it, enter my Name and confirm,
So that I get a Room in a few seconds.

**Acceptance Criteria:**

**Given** the day view
**When** the Member taps a free Slot
**Then** a booking form opens for that Room, day and start, with end time adjustable in 30-minute steps from 30 minutes to 2 hours and the Name field prefilled from `currentName`

**Given** a valid form
**When** the Member confirms
**Then** a confirmation shows Room, day and `HH:mm-HH:mm`, the Slots show as booked with the Name, and the Name is remembered on this device

**Given** a request refused by the domain
**When** the form shows the error
**Then** each `DomainError` code maps to a plain message in the UI (no strings in the domain): `overlap` names the conflicting Booking's time and booker, `allowance_exceeded` says how many minutes remain today, and blank Name, bad length, past and out-of-window cases each have a message
**And** the form stays open so the Member can change the time

**Given** UJ-1's edge case (the 14:30 Slot is booked and the Member extends 14:00 to 15:00)
**When** they confirm
**Then** the extension is refused with a message naming the conflict

**Given** the page
**When** it is viewed
**Then** visible text states that Bookings are stored only on this device (FR-12)
**And** Testing Library tests cover a successful booking, an overlap refusal and an allowance refusal, and `npm run verify` passes

## Epic 3: Manage My Bookings

A Member sees their upcoming Bookings and cancels one so the Slots become free again and the allowance is restored.

### Story 3.1: Own Bookings list

As a Member,
I want to see my upcoming Bookings,
So that I know what I have reserved.

**Acceptance Criteria:**

**Given** Bookings under several Names and a `currentName`
**When** the own-Bookings query runs
**Then** it returns only upcoming Bookings whose `nameKey` matches, sorted by date then `startSlot`, and Bookings that ended at or before `now` are excluded (a Booking ending exactly at `now` is excluded)

**Given** the Member's Name is `"  eleni k. "`
**When** the My Bookings view opens
**Then** Bookings made as `"Eleni K."` appear, each showing Room, day and `HH:mm-HH:mm`

**Given** the Member has no upcoming Bookings or has no Name set
**When** the view opens
**Then** an empty-state message is shown
**And** unit and UI tests cover these cases and `npm run verify` passes

### Story 3.2: Cancel a Booking

As a Member,
I want to cancel one of my Bookings,
So that someone else can use the Room.

**Acceptance Criteria:**

**Given** `cancelBooking(bookings, id, requesterName, now)`
**When** the requester's `nameKey` matches the Booking's
**Then** it returns `{ ok: true, value: { bookings } }` without that Booking

**Given** a different Name, an unknown id, or a finished Booking
**When** `cancelBooking` runs
**Then** it returns `not_owner`, `not_found` or `in_past` respectively and the list is unchanged

**Given** the Member cancels from My Bookings through the hook's `cancel(id)`
**When** it succeeds
**Then** the change is saved, the Slots show as free in the day view immediately, and the week overview Busyness drops

**Given** a Member at the 2-hour allowance who cancels a 1-hour Booking
**When** they book 1 hour on that day
**Then** the booking succeeds (allowance restored, UJ-3/FR-6)
**And** there is no edit action (cancel and rebook only), cancel/not_owner/allowance-restore tests exist, and `npm run verify` passes

## Epic 4: Phone-Ready and Trustworthy

The whole flow is comfortable on a phone and a desktop, and the architecture rules and offline behaviour are enforced by automated checks.

### Story 4.1: Mobile-first layout and desktop enhancement

As a Member on my phone,
I want the whole booking flow to fit my screen and be easy to tap,
So that I can book one-handed in under 30 seconds.

**Acceptance Criteria:**

**Given** a 360 px wide viewport
**When** the Member uses week overview, day view, booking form and My Bookings
**Then** there is no horizontal page scroll, all text is readable, and every interactive control has a touch target of at least 44x44 CSS px

**Given** a Name already remembered and a free Slot
**When** the Member walks UJ-1 on a phone-sized screen
**Then** the flow completes in at most 3 taps plus confirm, with controls reachable in the lower half of the screen where practical

**Given** a viewport of 768 px or wider
**When** the app renders
**Then** a media-query enhancement uses the extra space (for example Rooms side by side) while the phone layout remains the base CSS in `src/styles.css`

**Given** the markup
**When** reviewed
**Then** controls are semantic (`button`, `label`, `select` or `input`) with visible focus
**And** the change uses plain CSS only, adds no dependencies, and `npm run verify` passes; real-device checks are noted in the PR

### Story 4.2: Architecture and offline guard tests

As the Community Manager,
I want the rules that keep bookings trustworthy to be checked automatically,
So that future changes cannot quietly reintroduce double bookings or device-time bugs.

**Acceptance Criteria:**

**Given** `src/architecture.test.ts` (no new dependency)
**When** `npm test` runs
**Then** it fails if `src/domain/` imports `react` or anything outside itself, or uses `Date.now`, `new Date()` with no argument or `localStorage`

**Given** the same test
**When** any file outside `src/storage/` uses `localStorage`
**Then** it fails

**Given** the same test
**When** any file outside `src/domain/time.ts` uses `getHours`, `getDate`, `getDay` or `toLocale*`
**Then** it fails

**Given** a deliberately violating sample string fed to the scanner
**When** the scanner's own test runs
**Then** each rule is shown to detect its violation (so the guard cannot pass vacuously)

**Given** the source tree
**When** scanned for `fetch`, `XMLHttpRequest` and `WebSocket`
**Then** none are found, supporting browsing and booking with no network after load (NFR2)
**And** `npm run verify` passes on the final codebase

