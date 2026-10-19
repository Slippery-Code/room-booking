---
title: Meeting-Room Booking
status: final
created: 2026-10-19
updated: 2026-10-19
---

# PRD: Meeting-Room Booking
*Working title — confirm.*

## 0. Document Purpose

For the community manager and the people who will design and build this prototype. Vocabulary is anchored in the Glossary; features group the functional requirements (FR-N). Technical context lives in `addendum.md`. Source: `docs/idea.md` plus product-owner decisions recorded in `.memlog.md`.

## 1. Vision

Members of the coworking space book its three meeting rooms on a shared spreadsheet. The result is double bookings and arguments. This product is a simple web page where a member sees which rooms are free and books a slot from their phone in seconds, with rules that make double bookings and room hogging impossible.

**This version is a prototype to validate the booking flow with members.** Data is stored in the browser, so it is per device (see FR-12, §5). Bookings made on one phone are not visible on another. Shared storage across devices is the next phase. Until then the prototype proves the experience, not the shared calendar.

## 2. Target User

About 50 **Members** of the coworking space, and the **Community Manager**.

### 2.1 Jobs To Be Done
- Member: "I need a room for my call at 14:00. Show me what's free and let me grab it without asking anyone."
- Member: "I booked a room but my plans changed. Let me release it so someone else can use it."
- Community Manager: "Stop the double bookings and the arguments."

### 2.2 Non-Users (v1)
Guests and visitors without a member name; room-screen displays; administrators (no admin role).

### 2.3 Key User Journeys

- **UJ-1. Eleni books a room between meetings.**
  - **Persona + context:** Eleni, a freelance designer, is on her phone in the café downstairs.
  - **Entry state:** First visit on this phone; mobile browser; no name stored.
  - **Path:** Opens the page, sees today's rooms. Taps a free 14:00 slot on the Medium room, extends it to 15:00, types "Eleni K.", confirms.
  - **Climax:** A confirmation shows Medium, today, 14:00–15:00; the slot now shows as booked. Under 30 seconds.
  - **Resolution:** Her name is remembered on this phone; next time it is prefilled.
  - **Edge case:** the 14:30 Slot is already booked, so her extension is refused with a message naming the conflict; she picks another time.

- **UJ-2. Nikos checks the week.**
  - **Persona + context:** Nikos plans a workshop on Thursday and wants the Large room with the projector.
  - **Path:** Opens the week overview, sees how busy each room is per day, picks Thursday for the Large room, then sees the day's free slots.
  - **Climax:** He finds a free morning block.

- **UJ-3. Eleni cancels.** Her meeting is moved; she opens her bookings, cancels the 14:00 booking, and the slot becomes free again.

- **UJ-4. Eleni hits the daily limit.** She already has 1.5 hours today and tries to book 1 hour. The app refuses and says she has 30 minutes left today.

## 3. Glossary

- **Member** — A person using the coworking space who books rooms. Identified only by **Name**.
- **Community Manager** — Runs the space; uses the app as a Member. No special rights in this version.
- **Name** — Text a Member types. Matching is case-insensitive and ignores surrounding spaces ("  eleni k. " equals "Eleni K."). Remembered per device.
- **Room** — One of three fixed meeting rooms: **Small** (4 people), **Medium** (8), **Large** (14, projector).
- **Slot** — A 30-minute interval on the grid, from 08:00 to 20:00 in space local time (Europe/Athens). 24 slots per day.
- **Booking** — A Member's reservation of one Room for one or more consecutive Slots on one day. Starts and ends on Slot boundaries; 30 minutes to 2 hours.
- **Booking Window** — Today plus the next 6 days (7 days).
- **Daily Allowance** — At most 2 hours of Bookings per Member per day, across all Rooms.
- **Busyness** — Share of a Room's 24 Slots that are booked on a day.

## 4. Features

### 4.1 Browse availability
**Description:** A Member picks a day in the Booking Window and sees, per Room, which Slots are free and which are booked (with the booker's Name). A week overview shows Busyness per Room per day. Realizes UJ-1, UJ-2.

#### FR-1: Day view
A Member can choose any day in the Booking Window and see each Room's free and booked Slots.
- Days outside the Booking Window cannot be selected.
- Booked Slots show the Name of the booker.
- Today is determined in Europe/Athens, regardless of the device time zone.
- Past Slots today are shown as unavailable.

#### FR-2: Week overview
A Member can see, for each Room and each day in the Booking Window, how busy it is.
- Busyness is shown for all 7 days and 3 Rooms at a glance.
- Selecting a day opens the day view for it.
- A day with no Bookings shows as empty; a fully booked day shows as full.

#### FR-3: Room facts
Each Room is shown with its capacity, and the Large room with its projector.

### 4.2 Make a booking
**Description:** A Member selects a Room, day, start and end, enters their Name, and confirms. The rules below are enforced at confirmation. Realizes UJ-1, UJ-4.

#### FR-4: Create a Booking
A Member can book a Room for a day in the Booking Window, starting and ending on Slot boundaries.
- Minimum length 30 minutes; maximum 2 hours.
- A Booking cannot start before 08:00 or end after 20:00.
- A Booking cannot include Slots already in the past.
- A Name is required; an empty or whitespace-only Name is refused.

#### FR-5: No double bookings
Two Bookings for the same Room must never overlap.
- A Booking that overlaps any existing Booking for that Room is refused with a message identifying the conflict.
- Back-to-back Bookings (one ends at 10:00, the next starts at 10:00) are allowed.
- The result is the same regardless of the order in which Bookings are attempted.

#### FR-6: Daily Allowance
A Member's total booked time per day, across all Rooms, cannot exceed 2 hours.
- Counted per day of the Booking, matched by Name (case-insensitive, surrounding spaces ignored).
- A refused Booking states how much allowance remains.
- Cancelling a Booking restores its time to the allowance.

### 4.3 Identity and cancelling
**Description:** There are no logins. Realizes UJ-1, UJ-3.

#### FR-7: Name entry and memory
A Member types their Name once; the app remembers it on that device and prefills it later. The Member can change it.

#### FR-8: Name matching
Names are compared case-insensitively with surrounding spaces ignored, everywhere a Name is compared (allowance, cancelling).

#### FR-9: View own Bookings
A Member can see their upcoming Bookings (matched by Name).

#### FR-10: Cancel own Booking
A Member can cancel a Booking whose Name matches theirs. The Slots become free immediately.
- A Booking cannot be edited; the Member cancels and rebooks.
- A Member cannot cancel Bookings under a different Name.
- Any Member who types the same Name can cancel it; the trust model is stated in §5.

### 4.4 Platform and storage

#### FR-11: Mobile first, desktop capable
All flows work on a phone-sized browser screen and on a desktop browser.
- Booking flow is completable one-handed on a phone; touch targets are comfortably tappable.

#### FR-12: Local storage, stated limitation
Bookings and the remembered Name are stored in the browser on the device.
- Data is per device; there is no sharing between devices in this version.
- The app tells the Member plainly that Bookings are visible only on this device.
- Data survives page reload and browser restart.

### 4.5 Cross-cutting NFRs
- Booking rules (FR-4 to FR-6, FR-8) are covered by automated tests, including edge cases (slot boundaries, back-to-back Bookings, exactly 2 hours, Name spacing and case).
- After the page has loaded, no network access is needed to browse or book.

## 5. Non-Goals (Explicit)
- No logins, no admin role, no admin panel.
- Not a shared calendar yet: no cross-device sync in this version. The "zero double bookings" guarantee holds within one device's data; two devices can still book the same Room at the same time until shared storage arrives.
- Names are not secured: anyone typing a Member's Name can cancel that Member's Bookings. Accepted for the prototype.
- No room management (the three Rooms are fixed).
- No editing of Bookings (cancel and rebook).

## 6. MVP Scope

### 6.1 In Scope
Day view, week overview, create and cancel Bookings, rules (no overlap, 2-hour limits), remembered Name, mobile-first UI, local storage.

### 6.2 Out of Scope for MVP
Logins; recurring Bookings; screens next to Rooms; notifications; payments; admin panel; editing a Booking; shared storage (next phase).

## 7. Success Metrics

- **SM-1**: Zero double bookings — no two overlapping Bookings for a Room in the data of any device. Validates FR-5.
- **SM-2**: A Member can make a Booking on a phone in under 30 seconds, from opening the page to confirmation, with Name already remembered; first-time use may take longer. Validates FR-1, FR-4, FR-7, FR-11.
- **SM-C1** (counter-metric): Do not trade the rules for speed — the 30-second target must not be met by weakening the allowance or overlap checks. Counterbalances SM-2.

## 8. Open Questions
1. Should the prototype warn Members that two devices can conflict, beyond the notice in FR-12? Owner: Community Manager. Revisit before the shared-storage phase.
2. How is SM-2 measured with the pilot Members (stopwatch in a session, or self-reported)? Owner: Community Manager.

## 9. Assumptions Index
- [ASSUMPTION] §4.1 FR-1: Past Slots today cannot be booked.
- [ASSUMPTION] §5: The no-double-booking guarantee holds within a single device's data; cross-device conflicts are possible until shared storage.
- [ASSUMPTION] §4.3 FR-10: Name-only cancelling lets anyone typing the same Name cancel; accepted for the prototype.
