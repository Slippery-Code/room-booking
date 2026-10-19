# Adversarial Review: Architecture Spine (Meeting-Room Booking)

Reviewer stance: find two units, built one level down by different agents, that each obey every AD literally and still do not fit together. Each finding is a hole; the fix is a new or tightened AD.

Verdict: NOT READY for parallel story builds. The spine pins rules and layering well, but names functions without signatures or shared types. Six holes are likely to cause real integration breakage in an afternoon build. All are cheap to close with about 6 lines each. Finding 8 and below are minor.

## Findings

### 1. Interface contracts are named, never shaped (HIGH)
AD-4 names `createBooking(bookings, request, now)` and `Result<Booking[], DomainError>`. AD-6 says a commit "applies the domain function to that fresh list". Neither fixes:
- the `Result` shape (`{ok,value,error}` vs `{success,data}`),
- the `request` type,
- how the commit takes a domain call,
- the storage error type.

Unit A (domain agent) writes `Result = {ok:true,value}|{ok:false,error}`. Unit B (storage/UI agent) writes `{success,data}`. Both comply with AD-4/AD-6. They do not compile together.

Same family: the id. AD-1 says the id comes from `crypto.randomUUID()` in the storage shell, and the domain imports nothing. So `createBooking` cannot mint it. A may put `id` in `request`. B may call `createBooking` without one and assign ids afterwards, which breaks the Result contract. Also, `createBooking` returns the whole list, not the new Booking. UJ-1's confirmation ("Medium, today, 14:00-15:00") has to find it. B will search by name+time, and that is wrong when a Name repeats.

Fix, new AD ("Contracts"):
- `type Result<T,E> = {ok:true; value:T} | {ok:false; error:E}`.
- `BookingRequest = Omit<Booking,'id'> & {id:string}`. The shell generates the id before calling the domain.
- `createBooking` returns `Result<{bookings:Booking[]; created:Booking}, DomainError>`.
- The storage hook exposes exactly `bookings`, `name`, `book(request)`, `cancel(id, name)`, `setName(n)`. Each returns `Result<..., DomainError | StorageError>` and calls the domain internally. No generic `commit(fn)` is exposed.
- `StorageError` is `{code:'storage_unavailable'|'storage_full'}`.

### 2. Cancel has no clock, "upcoming" is undefined, allowance can be farmed (HIGH)
`cancelBooking(bookings, id, requesterName)` takes no `now`. FR-9 lists "upcoming" Bookings; AD-1 puts "my bookings" in `src/domain` with no definition.

- Unit A: own-bookings query keeps `startSlot >= now` (in-progress excluded).
- Unit B: `cancelBooking` happily cancels any owned Booking.
- Unit C: UI shows a Cancel button on the grid for any cell with the user's name. This includes past cells.

Result: a Member can cancel a booking from 09:00 at 15:00 and get back allowance for a meeting that already happened. FR-6 says cancelling restores allowance, but the PRD never says whether past usage counts. Today it counts, because the AD-1 derivation sums all bookings of the day.

Fix:
- Own bookings = bookings where the end instant is after `now`. This is "not finished", and it includes in-progress.
- `cancelBooking` takes `now` and returns `in_past` for a booking whose end is not after `now`. In-progress bookings may be cancelled.
- Past bookings count toward allowance and cannot be cancelled.
- Add a human question to confirm this.

### 3. Who is "the current Member"? Two owners of identity (HIGH)
FR-7 remembers a Name. The booking form has a Name field. AD-7 puts the "booking draft" in React state. AD-6 persists `room-booking:name`. Unspecified:
- when the remembered Name is written (on keystroke, on successful booking, on explicit save),
- whether My Bookings and Cancel use the remembered Name or the form field.

Unit A (form) saves the Name only on successful booking. Unit B (My Bookings) reads the remembered Name. A first-time user who books as "Eleni K.", then edits the field to "Nikos" without booking, sees Eleni's bookings with a Cancel button for Nikos. Or the reverse.

Also `nameKey` is thinner than the Glossary implies, for a Greek audience:
- `trim().toLowerCase()` does no Unicode normalization. A Greek name typed with precomposed vs decomposed accents (NFC/NFD, common across iOS/Android keyboards) gives different keys. The same Member is treated as two Members, so allowance is bypassed.
- Inner whitespace ("Eleni  K.") is not collapsed.
- Accent folding (Ελένη vs Ελενη) is arguably out of PRD scope, but whoever decides that must say so.

Fix:
- One `currentName` in the storage hook is the only identity source. It is written on every successful `book()` and on an explicit "change name" action.
- Form drafts do not change it.
- `nameKey = name.normalize('NFC').trim().replace(/\s+/g,' ').toLowerCase()`.
- Display Name is the trimmed, whitespace-collapsed text as typed.
- The domain trims and normalizes in `createBooking`. The UI does not.

### 4. Time interval representation: draft end vs `slotCount` (HIGH)
UJ-1 says "extends it to 15:00". The natural UI state is `{startSlot, endSlot}`. The domain wants `{startSlot, slotCount}`. Nothing says if an end is exclusive (a boundary, 0..24) or inclusive (a last slot, 0..23).
- UI agent: `endSlot` = last selected slot, `slotCount = endSlot - startSlot`, an off-by-one that books 30 min short.
- Other agent: `endSlot` = boundary.
- Both obey AD-2 as written.

Also AD-2 bans device-zone formatting but never requires `time.ts` to export the formatters. The UI needs `slot -> 'HH:mm'` (AD conventions say rendering is derived) and `'YYYY-MM-DD' -> weekday/day label`. Agents will invent their own. `new Date('2026-10-22').toLocaleDateString()` shifts a day on negative-offset devices.

Fix:
- The UI draft is `{roomId,date,startSlot,slotCount}`, the same as the Booking. There is no `endSlot` anywhere in code.
- `time.ts` exports the whole public API: `todayAthens(now)`, `windowDays(now): string[7]`, `slotLabel(slot)`, `slotEndLabel(slot,count)`, `dayLabel(date)`, `isSlotPast(date,slot,now)`. Nothing else may format dates or times.

### 5. Grid cell state and Busyness are unspecified; past vs booked has no precedence (MEDIUM-HIGH)
FR-1 requires both "booked slots show the Name" and "past slots shown unavailable". A past slot that is also booked satisfies both.
- Grid unit returns `status: 'free'|'booked'|'past'` with past winning. Booked-and-past cells then show no Name.
- UI unit expects `booked` to carry `booking`, and the booked flag to be independent of `past`.
- FR-5 also says the conflict message identifies the conflict. If the cell is hidden as "past", the other agent will not reach the owner's Name.

Busyness has the same problem:
- It is "share of 24 Slots booked", but the return type is a fraction, a percent or a level.
- It is unclear whether past slots today count, and whether "empty"/"full" are `=== 0` / `=== 1` or thresholds.
- A day with past slots never looks full if past slots are excluded from both sides.
- Float comparisons are risky.

Fix:
- `DayCell = {slot:number; booking?:Booking; past:boolean}`. Booking and past are independent; the UI picks the visual (booked wins).
- `busyness(bookings,roomId,date) = {booked:number; total:24}` as integers. Past slots count as booked if booked. Empty is `booked===0`. Full is `booked===24`. The UI formats it.

### 6. Validation order has holes and the `overlap` payload is nondeterministic (MEDIUM)
AD-4's order is "name, length/grid, window, past, overlap, allowance". Gaps:
- `length/grid` is one slot in the order but two codes. For `slotCount=5` at `startSlot=22`, both `bad_length` and `outside_grid` apply. For `slotCount=3` at `startSlot=22` only `outside_grid` applies.
- Yesterday's date is both `outside_window` and `in_past`. The order picks `outside_window`, but a test author reads `in_past`.
- An unknown `roomId`, an invalid or non-existent date (`'2026-02-30'`, `'tomorrow'`), or a non-integer slot has no code.
- When a request overlaps two existing Bookings, `overlap` carries "the conflicting Booking". Which one? FR-5 demands order independence, so list order cannot decide.
- Allowance `remaining` is in minutes in the error but "durations in slots in code".

Fix:
- Add `invalid_request` (bad room, malformed date, non-integer slot) as step 0.
- Check `bad_length` first (`slotCount` integer 1..4), then `outside_grid` (`startSlot>=0` and `startSlot+slotCount<=24`).
- State that yesterday gives `in_past` by checking past before window for dates earlier than today, and `outside_window` only for dates after today+6. Alternatively, keep the order and state the result explicitly in tests.
- `overlap` carries `conflicts: Booking[]` sorted by `startSlot`.
- `allowance_exceeded` carries `remainingSlots`; the UI converts to minutes.

### 7. Stored-data trust and the second writer of invariants (MEDIUM)
AD-6 shape-validates loaded data. "Shape" is undefined. If the validator checks only field types, a corrupt or hand-edited list with overlapping Bookings or a 6-slot Booking loads. Then:
- the grid has two bookings per cell (A takes the first, B the last),
- allowance sums over the bad data,
- the domain never rechecks existing rows.

Also, wrong-version data is "not overwritten until the next successful commit". The next commit does overwrite it, silently losing it. Acceptable for a prototype, but say so.

Fix: the loader validates each Booking with the same predicates as `createBooking` (field types, `slotCount` 1..4, grid bounds, valid date string, known room, non-empty `nameKey`). It drops invalid rows and keeps the rest. It does not enforce overlap on load; it keeps the first row in `startSlot` order and drops the later one. State "wrong-version data is replaced on the next commit; no migration".

### 8. Minor ambiguities (LOW, one line each)
- Stale `now`: AD-3 says the UI re-reads the clock on actions only. A grid left open past 14:00 still shows 14:00 as free until a click. That is acceptable, but a selected day that falls out of the window at midnight needs a clamp rule (UI picks today).
- Ownership error: `cancelBooking` order should be `not_found` before `not_owner`, so a stale click in a second tab gives `not_found`. Name it.
- Retention: past Bookings are never pruned; the window and 50 users make this irrelevant for a prototype. Say so, or the storage agent will add a purge (a second mutation path that breaks AD-4's "only two functions").
- The remembered Name edge: "Name changes do not rewrite existing Bookings" is in Deferred. It is a behaviour decision, so promote it into the identity AD.
- `storage` event sync: another tab's change replaces React state mid-draft. Say the draft is kept and only revalidated on confirm.
- Testing: AD tests list "DST dates" but there is no fixed target date. Name 2026-03-29 and 2026-10-25 (Athens), and note that slot 08:00 to 20:00 never crosses a transition, so the check is "the `todayAthens` boundary around the shift", not slot arithmetic.

## Pair summary (the pairs that matter)

| Pair | Unit A obeys | Unit B obeys | Clash |
| --- | --- | --- | --- |
| Domain Result vs storage hook | AD-4 | AD-6 | Result field names, request shape, id owner (1) |
| Own-bookings query vs cancelBooking | AD-1, AD-4 | AD-4 | "upcoming" vs cancellable; allowance farming (2) |
| Booking form vs My Bookings | AD-5, AD-7 | AD-5, AD-6 | Two sources for current Name; NFC gap (3) |
| UI draft vs createBooking | AD-2, AD-7 | AD-2, AD-4 | `endSlot` exclusive vs inclusive; date/slot formatters (4) |
| Day-grid query vs UI cell renderer | AD-1 | AD-7 | past vs booked precedence; busyness type (5) |
| createBooking vs its tests/UI messages | AD-4 | AD-4 | error order, multi-overlap payload (6) |
| Loader vs grid/allowance queries | AD-6 | AD-1 | Corrupt rows with overlap (7) |

## Proposed new/tightened ADs (summary)
1. NEW AD-8 Contracts: Result shape, BookingRequest with shell-supplied id, `createBooking` returns `{bookings, created}`, hook surface (`book`, `cancel`, `setName`).
2. TIGHTEN AD-2: no `endSlot` in code; `time.ts` public API list; past/upcoming defined by end instant.
3. TIGHTEN AD-4: `cancelBooking` takes `now`; `in_past` for finished bookings; `invalid_request`; check order made explicit; `conflicts[]` sorted; `remainingSlots`.
4. TIGHTEN AD-5: NFC + whitespace-collapse in `nameKey`; one `currentName` source; domain trims.
5. NEW AD-9 Read models: `DayCell {slot, booking?, past}`; `busyness {booked,total}`; "my bookings" definition; sorted by date then slot.
6. TIGHTEN AD-6: define the loader's per-row validation and drop-invalid policy; storage mutates only via the hook's `book`/`cancel`; no pruning.
