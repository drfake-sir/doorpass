# DoorPass — gym entry, renewals & recovery

A polished, front-end-only product prototype for Indian gyms. DoorPass turns the
front desk into a recovery channel: scan a member's rotating QR, block or allow
entry, and renew on the spot before the member walks out.

No build step. Open `index.html` in a browser, or serve the folder with any
static server.

```powershell
cd doorpass
python -m http.server 4173
# open http://127.0.0.1:4173/
```

## What is in the demo

| Area | What you can try |
| --- | --- |
| **Door** | Search or tap a member, run the expired / grace / active scenarios, scan a real QR with the camera, renew with cash or UPI, sell a day pass that actually grants entry, and release an expired member with the owner PIN. |
| **Dashboard** | Recovered-revenue hero, KPI tiles, 7/14-day collections chart, a 7-day **peak-hour heatmap**, WhatsApp digest, reminder queue, automation settings, freeze-request banner, and a filterable member table. |
| **Member app** | Phone preview with a real, rotating QR token, 30-second countdown, renewal sheet, day pass, freeze request, payment history and GST-style receipts. |
| **Audit log** | Searchable event trail, member/override/reminder/win-back/referral/automation/settings filters, CSV export, and security posture. |
| **Retention** | Live churn radar with 0–99 risk scores, personalised win-back campaigns, and an interactive 30-day revenue forecast. |
| **Referrals** | Per-member tracked links, forward-ready WhatsApp messages, a leaderboard, configurable reward rules and automatic free-day rewards. |
| **Automations** | Six live rules (reminder ladder, payment chase, silent-churn nudge, 30-day win-back, referral auto-reward, owner digest) with real effects, run history, CSV reports and an activity log. |
| **ROI & pricing** | Interactive lapse-rate calculator, founding pricing, and a pilot pitch modal. |

**Kiosk mode** turns the desk tablet into a fullscreen self-scan station: a giant
“tap your pass” screen, live camera or manual token verification, a full-screen
green/red verdict, today’s check-in counters and auto-return after six seconds.
Launch it from the Door or Dashboard header (or the command palette) and press
**Esc** to leave.

### Entry and token security

- The camera scanner uses `BarcodeDetector` when available, with a manual token
  field as a fallback.
- Tokens are signed (`DP1|memberId|window|signature`), expire after the current or
  previous 30-second window, and are rejected if the signature or member is wrong.
- A token can be used once per session; replays are rejected before the door
  decision.
- The Door view includes a **relay simulator**: an allowed decision animates and
  sounds the gate, a blocked decision pulses red, and the strip auto-locks after
  three seconds. The speaker button mutes it; Test sends a manual pulse.
- Dark/light, desktop/mobile and the offline fail-open flow all work client-side.

### Retention radar and win-back

- Every member gets a **0–99 churn score** from visit gap, balance, expiry,
  tenure and notes. The radar sorts the members most likely to disappear.
- **Win-back campaigns** let the owner pick targets, choose an offer (7 free days,
  10% off, a free PT session or a 14-day pause), edit a `{name}` template, preview
  the WhatsApp bubble and send. Each recipient is marked “contacted” and every
  send lands in the audit log.
- The **30-day revenue forecast** is interactive: drag the recovery assumption to
  model how much silent churn and lapsed renewals can be defended.

### Referral engine

- Every member gets a deterministic tracked code (`IT01RM`) and link. The referral
  screen shows invites, joins, conversion, free days rewarded and a leaderboard.
- **Invite** sends the forward-ready message and increments that member’s invite
  count. **Friend joined** simulates a successful conversion: the referrer earns
  the configured free days, their end date moves forward, and the reward is logged.
- Reward rules are live: choose 7/14/21/30 free days for the referrer and the friend
  offer (10% off, 7 free days or a free PT session).
- Every invite and reward is a `referral` event, filterable in the audit log.

### Peak-hour heatmap

- The dashboard models check-ins across the last seven days in two-hour slots and
  highlights the busiest window, with a staffing hint.
- Click any cell to inspect that day and slot; **Show peak** returns to the summary.

### Kiosk mode

- Fullscreen, distraction-free self-scan with a large rotating-QR prompt.
- Verifies a real signed token (camera or pasted fallback), logs the entry/block,
  shows a full-screen verdict, and returns to idle after six seconds.
- **Simulate a scan** generates a valid token for an active member, useful for
  demos and automated tests. **Esc** or **Exit kiosk** leaves the mode.

### Automation rules

- Six rules, each with a real switch and an audit trail. Rules can be paused and
  resumed at any time; **Run now** performs the job once, immediately.
  - **Expiry reminder ladder** runs the 7/3/1-day WhatsApp queue.
  - **Payment chase** messages every unpaid member and records the outstanding total.
  - **Silent-churn nudge** drafts personalised campaigns for radar members.
  - **30-day win-back** drafts a campaign from expired and grace memberships.
  - **Referral auto-reward** gates whether a friend's join instantly extends the referrer.
  - **9 pm owner digest** copies the daily digest and logs it.
- Coverage percentage, runs logged, members auto-touched and tasks waiting all update live.
- Every run is an `automation` event, filterable in the audit log.
- CSV reports export members, the audit log, referrals and a JSON backup.

### Action center

- The topbar bell shows a live badge for tasks that still need the desk: unpaid
  balances, freeze approvals, expiring memberships, silent churners, cold referral
  invites and queued offline check-ins.
- Tasks are generated from live state, tickable one by one, and reset each day
  (10 days of history retained). Each task has a jump button to the right screen.
- **Shift handover** saves a note for the next shift; it survives reloads and can
  be copied as a WhatsApp-ready message. Open the center from the bell, the
  Automations page or the command palette.

### Membership workflows

- **Day pass** records the payment, sets `passDate`, logs an entry, increments
  visits and shows an “Entry allowed” verdict. The pass survives a reload.
- **Freeze** is a real request/approval loop: the member requests a freeze or
  unfreeze in the Member app, the owner reviews it from the member drawer or the
  dashboard banner, picks 7/14/30 days, and the end date moves forward by the
  same number of days. Expired memberships must be renewed first.
- **Member editing** updates name, phone, plan, end date, payment status and notes.
  Duplicate phone numbers are blocked in both New Member and Edit.
- **Recent visits** are derived from real entry events, and the door feed dedupes
  repeated taps so browsing members does not inflate attendance.

### Data tools

- **Backup** downloads every member, payment and event as JSON from the sidebar.
- **Restore** accepts that JSON file and replaces the browser state after
  validation.
- Tabs stay in sync through the `storage` event, so the Member app QR in one tab
  and the front desk in another update together.

### Demo details

- Owner override PIN: **2468**
- QR token rotates every **30 seconds**
- Press **Ctrl/Cmd + K** for the command palette
- Press **/** to search from anywhere
- All demo state persists in `localStorage` under `doorpass.v3`
- **Reset demo data** in the sidebar restores the seeded gym

## Files

- `index.html` — app shell and static chrome
- `doorpass.css` — design system, layout and responsive rules
- `doorpass.js` — state, views, interactions and demo data
- `qrcode.min.js` — vendored MIT `qrcode-generator` 2.0.4
- `DoorPass-standalone.html` — optional single-file build for sharing

## Simulated on purpose

Payments, WhatsApp messages, the door relay and time-based automation are
simulated in the browser. There is no backend, no real payment capture and no
real unlock command. The override PIN and rotating QR are product demonstrations,
not production security controls. The scanner and token checks are real logic,
but the signing key lives in the client for the demo.

## Rebuild the single-file version

The standalone file is generated from the four source files:

```powershell
cd doorpass
node build-standalone.js
```

Edit `index.html`, `doorpass.css`, `doorpass.js` or `qrcode.min.js`, then rerun
the command so the shareable file stays in sync.
