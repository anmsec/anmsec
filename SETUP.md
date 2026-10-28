# PMSEA Pickleball Cup (Team Tournament) - setup and flow

Slug: `pmsea2026` (collections are `pmsea2026-registrations`, `pmsea2026-settings`, `pmsea2026-status`, `pmsea2026-users`, `pmsea2026-audit`).
One category (Team Tournament), 20 team slots, 6 players per team (3 male + 3 female). No payment, DUPR, vouching or shirts.

## Registration form
Team name, Team captain (contact person), Address (one free-text field), Contact number, Email,
Male players 1-3, Female players 1-3. All fields are required. The 6 player names must all be different (checked on the form).

## Flow
1. Team registers (index.html). A 6-character code is created right away, shown on screen and emailed. Status = Submitted, decision pending.
2. Committee (adminpro.html): View details -> set Decision (For Verification / Accepted / Rejected).
3. Accepted -> press **Send invite**. The email has the code and `{Site link}/confirm.html?code=CODE`. Status = Invited. A timer starts (default 48 hours, set in superadmin > Event).
4. Captain opens confirm.html -> Accept or Decline (final, with a confirmation step).
   - Accept = **Confirmed**. Decline = **Rejected** (reason: Player declined).
   - No answer within the time = **Rejected** (reason: Player declined (no response within 48 hours)).
5. Committee rejection = Decision "Rejected" with a reason, then Send rejection email.
6. Manual changes (team cancels by phone etc.): use the Status dropdown. Rejected there asks for a reason. A declined/expired team can be re-invited with the invite button.
Slots (20) are counted per category: Confirmed counts against the slots, Invited teams are shown as holding a slot.
With a single category the final-category picker is hidden and the invite uses "Team Tournament" automatically. Adding a second category in superadmin brings the category dropdown back.

## Setup order
1. `tournament.config.js`: slug is already `pmsea2026`, Firebase project and superadmin email unchanged. Paste your Apps Script URL in `webhookUrl` later.
2. Firestore -> Rules: paste `firestore.rules` and Publish.
3. Upload all files to the site (GitHub Pages). Add the domain in Firebase Authentication -> Authorized domains. Optional: add `logo.png` (and `poster.jpg`) next to the pages.
4. Open `superadmin.html`, sign in, fill every tab (title, tagline, date, venue, registration dates, prizes, contact, rules/FAQ). **Event > Site link** is required for the invite link. Check the Emails and Confirm Page texts. Save settings once (Code.gs reads these settings).
5. Apps Script: paste `Code.gs` (API_KEY and SLUG are already filled), deploy as Web app (Execute as Me, access Anyone), put the URL in `webhookUrl`.
6. Test: register a dummy team, accept it in adminpro, send the invite to yourself, open the link.

## Notes
- Email placeholders: {title} {team} {captain} {code} {category} {finalCategory} {deadline} {hours} {confirmUrl} {portalUrl} {reason}. {players} still works and means the captain.
- The status page (status.html) shows each state: pending, verification, accepted, invited, confirmed, declined, expired, rejected. Edit them in superadmin > Status Page.
- Team answers and expiry are saved into the registration when an admin has adminpro open. The public pages are always correct even before that.
- Admin tabs: Dashboard, Registrations, Email Tracker, Settings, Users, Audit Log. The Shirt Count tab and shirt/finance features were removed.
