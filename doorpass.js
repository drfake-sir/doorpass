/* ============================================================
   DoorPass — application
   Demo data lives in localStorage. Payments / WhatsApp / relay
   are simulated; the QR is a real, scannable QR.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- tiny helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const pad = n => String(n).padStart(2, '0');
  const DAY = 864e5;

  const startOfToday = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };
  const TODAY = startOfToday();
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = iso => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const daysUntil = iso => Math.round((fromISO(iso) - TODAY) / DAY);
  const inr = n => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  const fmtDate = iso => {
    const d = fromISO(iso);
    const opts = { day: 'numeric', month: 'short' };
    if (d.getFullYear() !== TODAY.getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('en-IN', opts);
  };
  const fmtTime = ts => new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const fmtDay = ts => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const initials = name => name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').toLowerCase().replace(/[\s-]/g, '');
  const uid = () => Math.random().toString(36).slice(2, 9);
  const todayISO = () => toISO(TODAY);

  /* ---------- icons ---------- */
  const ICON_PATHS = {
    door: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M2 21h16"/><path d="M9 12h.01"/><path d="M16 8h4v13h-4"/><path d="M20 12h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18.5h4"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.4 8.1 8 9 4.6-.9 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5.5 5.5 0 0 1 7 0"/><path d="M12 19.5h.01"/>',
    wifiOff: '<path d="M2 2l20 20"/><path d="M8.5 16a5.5 5.5 0 0 1 7 0"/><path d="M5 12.5a10 10 0 0 1 4-2.4"/><path d="M15 10.1a10 10 0 0 1 4 2.4"/><path d="M12 19.5h.01"/>',
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    message: '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-4-1L3 21l1.9-5.2a8.4 8.4 0 0 1-1-4A8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/>',
    receipt: '<path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3H5Z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    snow: '<path d="M12 2v20M4 7l16 10M20 7 4 17"/><path d="m9 4 3 3 3-3M9 20l3-3 3 3M4 10l4 1M20 10l-4 1"/>',
    refresh: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.5 19a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H2a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H8a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V8a1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
    zap: '<path d="M13 2 3 14h8l-1 8 11-14h-8l1-6Z"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2 2M19 4l2 2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    sparkle: '<path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>',
    pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M8 17v4h8v-4"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
    branch: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M6 8.5v7M8.5 6h4a3 3 0 0 1 3 3v.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    filterList: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    save: '<path d="M5 3h11l3 3v15H5V3Z"/><path d="M8 3v6h8V3"/><path d="M8 21v-7h8v7"/>',
    camera: '<path d="M4 7h3l1.6-2.4A2 2 0 0 1 10.3 4h3.4a2 2 0 0 1 1.7.6L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
    whatsapp: '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-4-1L3 21l1.9-5.2a8.4 8.4 0 0 1-1-4A8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/><path d="M9 8.5c.4 2.3 2.2 4.1 4.5 4.5"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9"/><path d="M12 8v13"/><path d="M12 8C10.5 5 7 4.6 6.6 6.6S9.5 9 12 8Zm0 0c1.5-3 5-3.4 5.4-1.4S14.5 9 12 8Z"/>',
    userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    expand: '<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14h1M14 20h1M18 20h3"/>'
  };
  const icon = (name, cls = '') =>
    `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.info}</svg>`;

  /* ---------- plans / constants ---------- */
  const PLANS = {
    1: { label: '1 month', months: 1, price: 1200 },
    3: { label: '3 months', months: 3, price: 3200 },
    6: { label: '6 months', months: 6, price: 5800 },
    12: { label: '12 months', months: 12, price: 10500 }
  };
  const DAY_PASS = 150;
  const OWNER_PIN = '2468';
  const WA_COST = 0.86;
  const STORE_KEY = 'doorpass.v3';
  const THEME_KEY = 'doorpass.theme';

  const STATUS = {
    active: { label: 'Active', tone: 'ok', pill: 'ok', icon: 'check' },
    expiring: { label: 'Expiring', tone: 'warn', pill: 'warn', icon: 'alert' },
    grace: { label: 'Grace period', tone: 'warn', pill: 'warn', icon: 'clock' },
    expired: { label: 'Expired', tone: 'bad', pill: 'bad', icon: 'x' },
    frozen: { label: 'Frozen', tone: 'muted', pill: 'info', icon: 'snow' }
  };

  const VIEWS = [
    { id: 'door', label: 'Door', short: 'Door', icon: 'door', group: 'Operate', title: 'Door', crumb: 'Door' },
    { id: 'dashboard', label: 'Dashboard', short: 'Desk', icon: 'grid', group: 'Operate', title: 'Recovery dashboard', crumb: 'Dashboard' },
    { id: 'member', label: 'Member app', short: 'Pass', icon: 'phone', group: 'Operate', title: 'Member app', crumb: 'Member app' },
    { id: 'audit', label: 'Audit log', short: 'Audit', icon: 'shield', group: 'Operate', title: 'Audit log & security', crumb: 'Audit log' },
    { id: 'retention', label: 'Retention', short: 'Churn', icon: 'target', group: 'Grow', title: 'Retention radar', crumb: 'Retention' },
    { id: 'referrals', label: 'Referrals', short: 'Refer', icon: 'gift', group: 'Grow', title: 'Referral engine', crumb: 'Referrals' },
    { id: 'automations', label: 'Automations', short: 'Auto', icon: 'zap', group: 'Grow', title: 'Automation rules', crumb: 'Automations' },
    { id: 'roi', label: 'ROI & pricing', short: 'Price', icon: 'calc', group: 'Grow', title: 'The business case', crumb: 'ROI & pricing', mobile: false }
  ];

  /* ---------- demo data ---------- */
  function historyFor(m, i) {
    const p = PLANS[m.plan];
    const start = addDays(fromISO(m.end), -p.months * 30);
    const arr = [];
    const paidNow = m.pay === 'paid' ? p.price : m.pay === 'partial' ? p.price - (m.balance || 0) : 0;
    if (paidNow > 0) {
      arr.push({
        id: 'DP-' + (2410 + i * 3), date: toISO(start), amount: paidNow,
        method: i % 2 ? 'Cash' : 'UPI', plan: p.months, status: 'paid'
      });
    }
    arr.push({
      id: 'DP-' + (2280 + i * 3), date: toISO(addDays(start, -p.months * 30)), amount: p.price,
      method: i % 3 ? 'UPI' : 'Cash', plan: p.months, status: 'paid'
    });
    if (i % 2 === 0) {
      arr.push({
        id: 'DP-' + (2160 + i * 3), date: toISO(addDays(start, -p.months * 60)), amount: p.price,
        method: 'UPI', plan: p.months, status: 'paid'
      });
    }
    return arr;
  }

  function seed() {
    const rows = [
      ['Rahul Menon', '9841022314', 1, -6, 'unpaid', 1200, 12, 38, 18, 'Prefers evening slot. Says salary is delayed.'],
      ['Priya Lakshmi', '9884011720', 1, 2, 'paid', 0, 1, 64, 330, 'Zumba regular.'],
      ['Arjun Kumar', '9003045511', 3, 45, 'paid', 0, 0, 120, 205, ''],
      ['Fatima Begum', '9940177822', 1, -1, 'paid', 0, 4, 22, 285, 'Renewed at the door last month.'],
      ['Karthik Raja', '9790833140', 6, 5, 'partial', 1600, 2, 88, 145, 'Paying the balance in two parts.'],
      ['Divya Shree', '9840290871', 12, 120, 'paid', 0, 3, 210, 350, 'Annual member.'],
      ['Imran Sheikh', '9841766230', 1, -20, 'unpaid', 1200, 25, 9, 35, 'Stopped coming after Ramzan.'],
      ['Sneha Nair', '9444012983', 1, 18, 'paid', 0, 11, 31, 90, 'Last visit 11 days ago.'],
      ['Vignesh S', '9894520017', 1, 0, 'paid', 0, 1, 44, 160, 'Ends today.'],
      ['Meena Devi', '9962044801', 3, 9, 'paid', 0, 14, 52, 25, 'Attendance dropped this month.'],
      ['Aisha Rahman', '9841099331', 3, 3, 'paid', 0, 0, 76, 315, ''],
      ['Suresh Babu', '9789054412', 1, -45, 'unpaid', 1200, 40, 5, 15, 'Win-back candidate.'],
      ['Nandini R', '9940032287', 12, 200, 'paid', 0, 2, 190, 265, ''],
      ['Vikram Anand', '9840456671', 3, 6, 'partial', 900, 1, 67, 55, 'Balance promised on the 10th.'],
      ['John Peter', '9841220098', 6, 75, 'paid', 0, 20, 48, 195, 'Travels; low attendance.'],
      ['Lakshmi Narayanan', '9962117740', 1, -2, 'unpaid', 1200, 3, 19, 342, 'Second grace day.'],
      ['Rohan Das', '9003215540', 1, 12, 'paid', 0, 15, 27, 230, 'At risk.'],
      ['Kavya Iyer', '9884007712', 12, 240, 'paid', 0, 0, 240, 300, 'Annual member. Referred two friends.']
    ];
    const members = rows.map((r, i) => ({
      id: i + 1,
      name: r[0],
      phone: r[1],
      plan: r[2],
      end: toISO(addDays(TODAY, r[3])),
      pay: r[4],
      balance: r[5],
      lastSeen: r[6],
      visits: r[7],
      hue: r[8],
      notes: r[9],
      frozen: false,
      joined: toISO(addDays(TODAY, -180 - i * 11)),
      refInvites: 0,
      refJoins: 0,
      refRewardDays: 0,
      reminders: { 7: i % 3 === 0, 3: i % 4 === 0, 1: false },
      history: historyFor({ plan: r[2], end: toISO(addDays(TODAY, r[3])), pay: r[4], balance: r[5] }, i)
    }));

    const refSeed = { 18: [4, 2, 14], 2: [3, 1, 7], 3: [2, 1, 7], 6: [1, 0, 0], 9: [2, 0, 0], 12: [1, 0, 0] };
    Object.entries(refSeed).forEach(([id, a]) => {
      const m = members.find(x => x.id === Number(id));
      if (m) { m.refInvites = a[0]; m.refJoins = a[1]; m.refRewardDays = a[2]; }
    });

    const ts = (daysAgo, h, min) => {
      const d = addDays(TODAY, -daysAgo);
      d.setHours(h, min, 0, 0);
      return d.toISOString();
    };

    const events = [
      { id: uid(), ts: ts(0, 9, 42), type: 'block', title: 'Rahul Menon blocked at the door', detail: 'Membership expired 6 days ago · unpaid balance ₹1,200', actor: 'Front desk', memberId: 1 },
      { id: uid(), ts: ts(0, 9, 38), type: 'entry', title: 'Priya Lakshmi checked in', detail: 'Expires in 2 days · reminder pending', actor: 'Front desk', memberId: 2 },
      { id: uid(), ts: ts(0, 9, 12), type: 'entry', title: 'Arjun Kumar checked in', detail: '3-month plan · 45 days left', actor: 'Front desk', memberId: 3 },
      { id: uid(), ts: ts(0, 8, 55), type: 'payment', title: 'Fatima Begum renewed at the door', detail: '1 month · UPI · recovered at door', amount: 1200, actor: 'Front desk', memberId: 4 },
      { id: uid(), ts: ts(0, 8, 20), type: 'entry', title: 'Divya Shree checked in', detail: 'Annual plan', actor: 'Front desk', memberId: 6 },
      { id: uid(), ts: ts(1, 19, 40), type: 'override', title: 'Imran Sheikh let in on override', detail: 'Reason: Owner approval · PIN verified', actor: 'Owner', memberId: 7 },
      { id: uid(), ts: ts(1, 18, 5), type: 'reminder', title: '7-day reminders sent', detail: '4 members · WhatsApp · ₹3.44 message cost', actor: 'System' },
      { id: uid(), ts: ts(1, 11, 30), type: 'payment', title: 'Karthik Raja part-paid ₹1,600', detail: 'Balance ₹1,600 due · 6-month plan', amount: 1600, actor: 'Owner', memberId: 5 },
      { id: uid(), ts: ts(2, 16, 10), type: 'settings', title: 'Smart renewal offer enabled', detail: '+5 free days on 3, 6 and 12 month renewals', actor: 'Owner' },
      { id: uid(), ts: ts(2, 10, 5), type: 'block', title: 'Suresh Babu blocked at the door', detail: 'Expired 45 days ago · win-back list', actor: 'Front desk', memberId: 12 },
      { id: uid(), ts: ts(3, 17, 20), type: 'entry', title: 'Vikram Anand checked in', detail: 'Grace period · balance ₹900', actor: 'Front desk', memberId: 14 },
      { id: uid(), ts: ts(3, 9, 30), type: 'reminder', title: 'Win-back campaign sent', detail: '3 members at 30+ days · Tamil template', actor: 'System' },
      { id: uid(), ts: ts(1, 12, 15), type: 'referral', title: 'Kavya Iyer earned 7 free days', detail: 'Aarav joined with code IT18KI · reward applied', actor: 'System' },
      { id: uid(), ts: ts(2, 18, 40), type: 'referral', title: 'Referral invite sent · Kavya Iyer', detail: 'Link shared on WhatsApp · IT18KI', actor: 'Front desk' }
    ];

    return {
      version: 3,
      gym: { name: 'Iron Temple Fitness', branch: 'Anna Nagar · Chennai', gstin: '33ABCDE1234F1Z5' },
      settings: {
        graceDays: 3,
        offer: true,
        offerDays: 5,
        autoReminders: true,
        failOpen: true,
        language: 'en',
        refReward: 7,
        refFriend: '10% off',
        rules: {
          reminders: true,
          paymentChase: true,
          churnNudge: true,
          winback30: true,
          referralAuto: true,
          digest: true
        }
      },
      stats: {
        recovered: 18400,
        recoveredPrev: 14200,
        chart: [6200, 7400, 5100, 8900, 9600, 7800, 11200, 8400, 10100, 7300, 11800, 9200, 12600, 4400]
      },
      members,
      events,
      tasks: {},
      shiftNote: '',
      automationLast: {}
    };
  }

  function hydrateState(next) {
    next.members.forEach(m => {
      if (!Array.isArray(m.history)) m.history = [];
      if (!m.reminders) m.reminders = { 7: false, 3: false, 1: false };
      if (m.passDate === undefined) m.passDate = null;
      if (m.freezeRequest === undefined) m.freezeRequest = null;
      if (m.frozenUntil === undefined) m.frozenUntil = null;
      if (m.freezeDays === undefined) m.freezeDays = 0;
      if (m.campaignAt === undefined) m.campaignAt = null;
      if (m.refInvites === undefined) m.refInvites = 0;
      if (m.refJoins === undefined) m.refJoins = 0;
      if (m.refRewardDays === undefined) m.refRewardDays = 0;
    });
    next.settings = Object.assign({ refReward: 7, refFriend: '10% off' }, next.settings || {});
    next.settings.rules = Object.assign({
      reminders: true, paymentChase: true, churnNudge: true,
      winback30: true, referralAuto: true, digest: true
    }, next.settings.rules || {});
    if (!next.tasks || typeof next.tasks !== 'object') next.tasks = {};
    if (typeof next.shiftNote !== 'string') next.shiftNote = '';
    if (!next.automationLast || typeof next.automationLast !== 'object') next.automationLast = {};
    return next;
  }

  let S = load();
  try { if (!localStorage.getItem(STORE_KEY)) save(); } catch (e) {}
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return seed();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 3 || !Array.isArray(parsed.members)) return seed();
      return hydrateState(parsed);
    } catch (e) {
      return seed();
    }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* storage may be blocked */ }
  }
  function resetDemo() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    S = seed();
    UI.selected = null;
    UI.filter = 'all';
    UI.search = '';
    closeModal();
    toast('Demo data reset to a clean state.', 'ok');
    render();
  }

  function exportBackup() {
    const payload = JSON.stringify({
      app: 'DoorPass',
      exportedAt: new Date().toISOString(),
      state: S
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `doorpass-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    pushEvent('settings', 'Backup exported', `${S.members.length} members · ${S.events.length} events · owner download`, { actor: 'Owner' });
    save();
    render();
    toast(`Backup saved · ${S.members.length} members.`, 'ok');
  }

  function importBackupFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const next = parsed && parsed.state ? parsed.state : parsed;
        if (!next || next.version !== 3 || !Array.isArray(next.members)) throw new Error('shape');
        hydrateState(next);
        S = next;
        save();
        UI.selected = null;
        UI.filter = 'all';
        closeModal();
        render();
        toast(`Restored ${S.members.length} members from backup.`, 'ok');
      } catch (e) {
        toast('That file is not a valid DoorPass backup.', 'bad');
      }
    };
    reader.onerror = () => toast('Could not read that file.', 'bad');
    reader.readAsText(file);
  }

  /* ---------- selectors ---------- */
  const memberById = id => S.members.find(m => m.id === Number(id));
  const planOf = m => PLANS[m.plan] || PLANS[1];

  function statusOf(m) {
    if (m.frozen) return 'frozen';
    const d = daysUntil(m.end);
    if (d < 0) return -d <= S.settings.graceDays ? 'grace' : 'expired';
    if (d <= 7) return 'expiring';
    return 'active';
  }
  const hasActivePass = m => !!m && m.passDate === todayISO();
  const freezeRequests = () => S.members.filter(m => !!m.freezeRequest);
  function statusPill(m) {
    const k = statusOf(m);
    const s = STATUS[k];
    return `<span class="pill pill--${s.pill}">${s.label}${k === 'grace' ? ` · ${-daysUntil(m.end)}d` : ''}</span>`;
  }
  function payPill(m) {
    const cls = m.pay === 'paid' ? 'ok' : 'bad';
    return `<span class="pill pill--${cls}">${m.pay === 'partial' ? 'Part paid' : m.pay === 'unpaid' ? 'Unpaid' : 'Paid'}</span>`;
  }
  function reminderKey(m) {
    const d = daysUntil(m.end);
    if (d >= 5 && d <= 7) return 7;
    if (d >= 2 && d <= 4) return 3;
    if (d >= 0 && d <= 1) return 1;
    return 0;
  }
  function pendingReminders() {
    return S.members.filter(m => {
      const k = reminderKey(m);
      return !m.frozen && k && !m.reminders[k];
    });
  }
  function atRisk(m) {
    const st = statusOf(m);
    return (st === 'active' || st === 'expiring') && m.lastSeen >= 10;
  }
  function filteredMembers() {
    let list = S.members.slice();
    const f = UI.filter;
    if (f === 'expiring') list = list.filter(m => statusOf(m) === 'expiring');
    else if (f === 'expired') list = list.filter(m => ['expired', 'grace'].includes(statusOf(m)));
    else if (f === 'unpaid') list = list.filter(m => m.pay !== 'paid');
    else if (f === 'risk') list = list.filter(atRisk);
    else if (f === 'frozen') list = list.filter(m => statusOf(m) === 'frozen');
    else if (f === 'requests') list = list.filter(m => !!m.freezeRequest);

    const q = norm(UI.search);
    if (q) list = list.filter(m => norm(m.name).includes(q) || norm(m.phone).includes(q) || String(m.id) === q);

    if (UI.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (UI.sort === 'status') {
      const rank = { expired: 0, grace: 1, expiring: 2, frozen: 3, active: 4 };
      list.sort((a, b) => rank[statusOf(a)] - rank[statusOf(b)]);
    } else list.sort((a, b) => daysUntil(a.end) - daysUntil(b.end));
    return list;
  }
  function counts() {
    const c = { active: 0, expiring: 0, expired: 0, grace: 0, frozen: 0, risk: 0, unpaid: 0, requests: 0 };
    S.members.forEach(m => {
      const s = statusOf(m);
      c[s] = (c[s] || 0) + 1;
      if (atRisk(m)) c.risk++;
      if (m.pay !== 'paid') c.unpaid++;
      if (m.freezeRequest) c.requests++;
    });
    c.expiredCombined = c.expired + c.grace;
    return c;
  }
  function riskValue() {
    return S.members.filter(m => ['expiring', 'grace', 'expired'].includes(statusOf(m)))
      .reduce((sum, m) => sum + planOf(m).price, 0);
  }
  function monthlyValue(m) {
    const p = planOf(m);
    return p.price / p.months;
  }
  function churnScore(m) {
    if (statusOf(m) === 'frozen') return 0;
    const d = daysUntil(m.end);
    let score = 0;
    if (m.lastSeen >= 3) score += Math.min(48, (m.lastSeen - 2) * 5);
    if (m.visits < 25) score += 12;
    else if (m.visits < 50) score += 6;
    if (m.pay !== 'paid') score += 16 + Math.min(10, Math.round((m.balance || 0) / 500));
    if (d < 0) score += 18;
    else if (d <= 7) score += 10;
    if (m.freezeRequest) score += 6;
    if (/stopped|dropped|low attendance|at risk|delayed|travel|salary/i.test(m.notes || '')) score += 10;
    return clamp(Math.round(score), 0, 99);
  }
  function riskRadar() {
    return S.members
      .map(m => ({ m, score: churnScore(m) }))
      .filter(x => x.score >= 30)
      .sort((a, b) => b.score - a.score);
  }
  function churnReasons(m) {
    const out = [];
    const d = daysUntil(m.end);
    if (m.lastSeen >= 10) out.push(`No visit in ${m.lastSeen} days`);
    else if (m.lastSeen >= 3) out.push(`Last visit ${m.lastSeen} days ago`);
    if (m.pay !== 'paid') out.push(`${inr(m.balance || planOf(m).price)} unpaid`);
    if (d < 0) out.push(`Expired ${-d}d ago`);
    else if (d <= 7) out.push(d === 0 ? 'Ends today' : `Ends in ${d}d`);
    if (m.visits < 25) out.push(`Only ${m.visits} visits`);
    if (m.freezeRequest) out.push('Freeze request pending');
    return out.length ? out.slice(0, 3) : ['Low engagement signals'];
  }
  function retentionFigures(rate) {
    const pct = clamp(Number(rate == null ? UI.winbackRate : rate), 0, 80) / 100;
    const active = S.members.filter(m => !m.frozen && ['active', 'expiring'].includes(statusOf(m)));
    const due = S.members.filter(m => !m.frozen && ['expired', 'grace'].includes(statusOf(m)));
    const radar = riskRadar();
    const atRisk = radar.filter(x => ['active', 'expiring'].includes(statusOf(x.m)));
    const base = active.reduce((s, m) => s + monthlyValue(m), 0);
    const atRiskPool = atRisk.reduce((s, x) => s + monthlyValue(x.m), 0);
    const duePool = due.reduce((s, m) => s + monthlyValue(m), 0);
    const protectedValue = atRiskPool * pct;
    const renewals = duePool * pct * 0.6;
    const projected = base - atRiskPool + protectedValue + renewals;
    return {
      base: Math.round(base),
      atRiskPool: Math.round(atRiskPool),
      duePool: Math.round(duePool),
      protectedValue: Math.round(protectedValue),
      renewals: Math.round(renewals),
      projected: Math.round(projected),
      rate: Math.round(pct * 100),
      activeCount: active.length,
      dueCount: due.length
    };
  }
  const CAMPAIGN_OFFERS = {
    free7: { label: '7 free days', line: 'Come back this week and we will add 7 free days to your membership.' },
    off10: { label: '10% off renewal', line: 'Renew this week and take 10% off your next month.' },
    pt: { label: 'Free PT session', line: 'Book one free session with a coach this week, on us.' },
    pause: { label: '14-day pause', line: 'If now is not the right time, we can pause your membership for 14 days.' }
  };
  function campaignTemplate(offerKey) {
    const o = CAMPAIGN_OFFERS[offerKey] || CAMPAIGN_OFFERS.free7;
    return `Hi {name}, we miss you at Iron Temple. ${o.line} Reply YES and we’ll set it up. — Coach Ravi`;
  }
  function campaignMessage(m, offerKey) {
    if (!m) return '';
    return campaignTemplate(offerKey).replace('{name}', m.name.split(' ')[0]);
  }
  function eventToday(e) {
    return new Date(e.ts).toDateString() === TODAY.toDateString();
  }
  function todayCounts() {
    const t = S.events.filter(eventToday);
    return {
      entries: t.filter(e => e.type === 'entry').length,
      blocks: t.filter(e => e.type === 'block').length,
      overrides: t.filter(e => e.type === 'override').length
    };
  }

  /* ---------- mutation helpers ---------- */
  function pushEvent(type, title, detail, opts = {}) {
    S.events.unshift({
      id: uid(),
      ts: new Date().toISOString(),
      type, title, detail,
      amount: opts.amount,
      actor: opts.actor || 'Front desk',
      memberId: opts.memberId,
      reason: opts.reason
    });
    S.events = S.events.slice(0, 250);
    save();
  }
  function addCollected(amount) {
    S.stats.chart[S.stats.chart.length - 1] += amount;
    S.stats.recovered += amount;
    save();
  }
  function receiptNo() {
    let n = 2500;
    S.members.forEach(m => (m.history || []).forEach(h => {
      const num = Number(String(h.id).replace(/\D/g, ''));
      if (num > n) n = num;
    }));
    return 'DP-' + (n + 1);
  }
  function reminderText(m) {
    const first = m.name.split(' ')[0];
    const d = daysUntil(m.end);
    const lang = S.settings.language;
    if (lang === 'ta') {
      const when = d < 0 ? `${-d} நாட்களுக்கு முன்பே முடிந்தது` : d === 0 ? 'இன்று முடிகிறது' : `${d} நாட்களில் முடிகிறது`;
      return `வணக்கம் ${first}, உங்கள் ஜிம் உறுப்பினர் காலம் ${when}. 2 கிளிக்கில் புதுப்பிக்க: https://doorpass.app/r/${m.id}`;
    }
    if (lang === 'hi') {
      const when = d < 0 ? `${-d} दिन पहले समाप्त हो गई` : d === 0 ? 'आज समाप्त हो रही है' : `${d} दिनों में समाप्त हो रही है`;
      return `नमस्ते ${first}, आपकी जिम सदस्यता ${when}. 2 टैप में रिन्यू करें: https://doorpass.app/r/${m.id}`;
    }
    const when = d < 0 ? `expired ${-d} days ago` : d === 0 ? 'ends today' : `ends in ${d} days`;
    return `Hi ${first}, your gym membership ${when}. Renew in 2 taps: https://doorpass.app/r/${m.id}`;
  }

  /* ---------- UI state ---------- */
  const UI = {
    view: 'door',
    query: '',
    doorFilter: 'all',
    selected: null,
    released: null,
    offline: false,
    queued: 0,
    doorRenew: { plan: 1, method: 'upi', busy: false, open: false },
    filter: 'all',
    search: '',
    sort: 'end',
    chartRange: 7,
    modal: null,
    memberId: 2,
    memberRenew: { plan: 1, method: 'upi', busy: false, open: false },
    auditFilter: 'all',
    queueBusy: false,
    winbackRate: 35,
    relay: null,
    sound: true,
    heatCell: null,
    kiosk: { on: false, result: null },
    roi: { members: 200, fee: 1500, lapses: 8, recovery: 40 },
    palette: { open: false, q: '', index: 0 },
    focus: null,
    sidebarOpen: false,
    noteDismissed: false,
    lastDoorLog: {},
    usedTokens: {},
    scanner: null,
    animate: true
  };
  const savedTheme = (() => {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  })();
  if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

  /* ---------- toast ---------- */
  function toast(msg, type = 'ok') {
    const root = $('#toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast toast--' + type;
    const ic = type === 'bad' ? 'x' : type === 'warn' ? 'alert' : 'checkCircle';
    el.innerHTML = icon(ic) + '<span>' + esc(msg) + '</span>';
    root.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 240);
    }, 3400);
  }
  function copyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast(okMsg, 'ok'), () => toast('Clipboard was blocked by the browser.', 'warn'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast(okMsg, 'ok'); }
      catch (e) { toast('Copy is not available in this browser.', 'warn'); }
      ta.remove();
    }
  }
  function csvDownload(name, rows) {
    const csv = rows.map(r => r.map(v => {
      const s = String(v == null ? '' : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('CSV downloaded.', 'ok');
  }

  /* ---------- QR token ---------- */
  function signature(input) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(36).padStart(7, '0').slice(0, 7);
  }
  function tokenFor(m, win) {
    const body = `DP1|${m.id}|${win}`;
    return body + '|' + signature(body + '|iron-temple-demo-key');
  }
  function tokenRef(m, win) {
    return tokenFor(m, win).split('|')[3];
  }
  let lastQRWindow = -1;
  function qrMarkup(m) {
    const win = Math.floor(Date.now() / 30000);
    lastQRWindow = win;
    const text = tokenFor(m, win);
    try {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch (e) {
      return '<div class="mut" style="padding:20px">QR unavailable</div>';
    }
  }
  function updateQR(force) {
    if (UI.view !== 'member') return;
    const m = memberById(UI.memberId);
    if (!m) return;
    const box = $('#qrLive');
    const bar = $('#qrBar');
    const sec = $('#qrSec');
    const tok = $('#qrTok');
    if (!box) return;
    const now = Date.now();
    const win = Math.floor(now / 30000);
    const remain = 30 - Math.floor((now % 30000) / 1000);
    if (bar) bar.style.width = (100 - (now % 30000) / 300) + '%';
    if (sec) sec.textContent = remain;
    if (tok) tok.textContent = '#' + tokenRef(m, win);
    if (force || win !== lastQRWindow) {
      box.innerHTML = qrMarkup(m);
      if (UI.animate) {
        box.animate([{ opacity: .35, transform: 'scale(.985)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
      }
    }
  }

  /* ---------- camera / token scanner ---------- */
  let scanTimer = null, scanStream = null, scanDetector = null, scanLastRaw = '';

  function stopScanner() {
    if (scanTimer) clearInterval(scanTimer);
    scanTimer = null;
    if (scanStream) scanStream.getTracks().forEach(t => t.stop());
    scanStream = null;
    scanDetector = null;
    scanLastRaw = '';
    const v = document.getElementById('scanVideo');
    if (v) v.srcObject = null;
    UI.scanner = null;
  }

  function parseScan(raw) {
    const parts = String(raw || '').trim().split('|');
    if (parts.length !== 4 || parts[0] !== 'DP1') return { ok: false, error: 'That is not a DoorPass member QR.' };
    const id = Number(parts[1]);
    const win = Number(parts[2]);
    const sig = parts[3];
    const m = memberById(id);
    if (!m) return { ok: false, error: 'This QR belongs to a member who is not in the cache.' };
    if (!Number.isFinite(win) || Math.abs(win - Math.floor(Date.now() / 30000)) > 1) {
      return { ok: false, error: 'This QR has expired. Ask the member to refresh it.' };
    }
    if (tokenFor(m, win) !== String(raw).trim()) {
      return { ok: false, error: 'Signature mismatch. This is not a valid DoorPass QR.' };
    }
    if (UI.usedTokens[raw]) {
      return { ok: false, error: 'This QR has already been used. Ask the member to refresh it.' };
    }
    return { ok: true, member: m };
  }

  function acceptScan(raw) {
    const res = parseScan(raw);
    const status = document.getElementById('scanStatus');
    if (!res.ok) {
      if (status) {
        status.textContent = res.error;
        status.classList.add('is-bad');
      }
      return false;
    }
    stopScanner();
    UI.usedTokens[String(raw).trim()] = Date.now();
    closeModal();
    if (UI.kiosk.on) {
      selectMember(res.member.id);
      kioskDecision(res.member);
      return true;
    }
    go('door');
    setTimeout(() => {
      selectMember(res.member.id);
      toast(`QR verified · ${res.member.name.split(' ')[0]}`, 'ok');
    }, 40);
    return true;
  }

  function startScanner() {
    const video = document.getElementById('scanVideo');
    const status = document.getElementById('scanStatus');
    if (!video || !status) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      status.textContent = 'This browser has no camera API. Paste the member token below.';
      status.classList.add('is-bad');
      return;
    }
    status.textContent = 'Requesting camera…';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(async stream => {
        if (!UI.modal || UI.modal.type !== 'scanner') {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        scanStream = stream;
        video.srcObject = stream;
        try { await video.play(); } catch (e) {}
        if (!('BarcodeDetector' in window)) {
          status.textContent = 'Live detection is not supported in this browser. Paste the token below.';
          return;
        }
        try {
          scanDetector = new BarcodeDetector({ formats: ['qr_code'] });
          status.textContent = 'Point the camera at the member’s rotating QR.';
          scanTimer = setInterval(async () => {
            if (!scanDetector || !video.videoWidth) return;
            try {
              const codes = await scanDetector.detect(video);
              if (codes.length) {
                const raw = codes[0].rawValue;
                if (raw !== scanLastRaw) {
                  scanLastRaw = raw;
                  acceptScan(raw);
                }
              }
            } catch (e) {}
          }, 320);
        } catch (e) {
          status.textContent = 'Live detection is unavailable. Paste the token below.';
        }
      })
      .catch(() => {
        status.textContent = 'Camera permission was blocked. Paste the member token below.';
        status.classList.add('is-bad');
      });
  }


  /* ---------- shell ---------- */
  function renderShell() {
    const view = VIEWS.find(v => v.id === UI.view) || VIEWS[0];
    $('#crumb').textContent = view.crumb;
    $('#pageTitle').textContent = view.title;
    document.title = view.title + ' · DoorPass';

    let nav = '';
    ['Operate', 'Grow'].forEach(group => {
      nav += `<div class="nav-label">${group}</div><div class="nav">`;
      VIEWS.filter(v => v.group === group).forEach(v => {
        const active = UI.view === v.id;
        nav += `<a class="nav__item${active ? ' is-active' : ''}" href="#${v.id}" data-nav="${v.id}"${active ? ' aria-current="page"' : ''}>
          ${icon(v.icon)}<span>${v.label}</span>
          ${v.id === 'door' ? '<span class="nav__dot" aria-hidden="true"></span>' : v.id === 'audit' ? '<kbd>log</kbd>' : ''}
        </a>`;
      });
      nav += '</div>';
    });
    $('#nav').innerHTML = nav;

    $('#mobilenav').innerHTML = VIEWS.filter(v => v.mobile !== false).map(v =>
      `<a href="#${v.id}" data-nav="${v.id}" class="${UI.view === v.id ? 'is-active' : ''}"${UI.view === v.id ? ' aria-current="page"' : ''}>${icon(v.icon)}<span>${v.short || v.label}</span></a>`
    ).join('');

    $('#themeBtn').innerHTML = icon(document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon');
    const waiting = pendingTaskCount();
    const bell = $('#actionBtn');
    if (bell) {
      bell.innerHTML = icon('bell') + (waiting ? `<span class="notify-badge">${waiting > 9 ? '9+' : waiting}</span>` : '');
      bell.setAttribute('aria-label', waiting ? `Action center, ${waiting} task${waiting === 1 ? '' : 's'} waiting` : 'Action center');
    }
    $('#side-cache').textContent = S.members.length;
    $('#side-net').textContent = UI.offline ? 'Desk tablet offline' : 'Desk tablet online';
    $('#side-dot').className = 'dot' + (UI.offline ? ' dot--warn' : '');
    $('#netChip').className = 'chip-status hide-xs';
    $('#netDot').className = 'dot' + (UI.offline ? ' dot--warn' : '');
    $('#netLabel').textContent = UI.offline ? 'Offline · cash only' : 'Online';
    $('#demoNote').classList.toggle('hidden', UI.noteDismissed);
    $('#netChip').style.cursor = 'pointer';
  }

  function render() {
    renderShell();
    const main = $('#main');
    if (!main) return;
    if (UI.view === 'door') main.innerHTML = renderDoor();
    else if (UI.view === 'dashboard') main.innerHTML = renderDashboard();
    else if (UI.view === 'member') main.innerHTML = renderMember();
    else if (UI.view === 'audit') main.innerHTML = renderAudit();
    else if (UI.view === 'retention') main.innerHTML = renderRetention();
    else if (UI.view === 'referrals') main.innerHTML = renderReferrals();
    else if (UI.view === 'automations') main.innerHTML = renderAutomations();
    else main.innerHTML = renderROI();

    afterRender();
    renderKiosk();
  }

  function afterRender() {
    updateQR(true);
    armRelay();
    bindChart();
    bindROI();
    if (UI.focus) {
      const el = document.getElementById(UI.focus);
      if (el) {
        el.focus();
        if (el.setSelectionRange) {
          const v = el.value || '';
          try { el.setSelectionRange(v.length, v.length); } catch (e) {}
        }
      }
      UI.focus = null;
    }
  }

  function go(view) {
    if (!VIEWS.some(v => v.id === view)) return;
    UI.view = view;
    UI.focus = null;
    UI.sidebarOpen = false;
    $('#sidebar').classList.remove('is-open');
    if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
    closeModal();
    render();
    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  }

  /* ============================================================
     Renewal panel (shared by door, member app and modal)
     ============================================================ */
  function renewPanel(m, st, opts = {}) {
    const acts = opts.acts || {};
    const allowPass = !!opts.allowPass;
    const offline = !!opts.offline;
    if (offline && st.method === 'upi') st.method = 'cash';
    if (!PLANS[st.plan]) st.plan = m.plan;
    if (st.method === 'pass' && !allowPass) st.method = 'cash';

    const plan = PLANS[st.plan] || PLANS[1];
    const offerOn = S.settings.offer && plan.months >= 3;
    const d = daysUntil(m.end);
    const fromOld = d >= -S.settings.graceDays;

    const planButtons = Object.entries(PLANS).map(([k, p]) => {
      const n = Number(k);
      const isOffer = S.settings.offer && p.months >= 3;
      return `<button type="button" class="plan${st.plan === n ? ' is-on' : ''}" data-act="${acts.plan}" data-v="${n}" aria-pressed="${st.plan === n}">
        ${isOffer ? `<span class="plan__offer">+${S.settings.offerDays}d</span>` : ''}
        <span class="plan__label">${p.label}</span>
        <span class="plan__price">${inr(p.price)}</span>
        <span class="plan__per">${inr(Math.round(p.price / p.months))} / month</span>
      </button>`;
    }).join('');

    const methods = [
      ['upi', 'UPI', 'card'],
      ['cash', 'Cash', 'cash']
    ];
    if (allowPass) methods.push(['pass', 'Day pass', 'clock']);

    let cta;
    if (st.busy) cta = 'Waiting for UPI confirmation…';
    else if (st.method === 'pass') cta = `Collect ${inr(DAY_PASS)} · day pass`;
    else if (st.method === 'cash') cta = `Cash collected · ${inr(plan.price)}`;
    else cta = `Send UPI request · ${inr(plan.price)}`;

    const note = st.method === 'pass'
      ? 'One entry today. The membership dates stay unchanged.'
      : fromOld
        ? `Stacks from the current end date (${fmtDate(m.end)}) because they are inside grace.`
        : `Starts today. The old end date is more than ${S.settings.graceDays} days ago.`;

    return `<div class="renew">
      <div class="renew__head">
        <h3>Renew ${esc(m.name.split(' ')[0])}’s membership</h3>
        ${offerOn ? `<span class="pill pill--brand">+${S.settings.offerDays} free days</span>` : ''}
      </div>
      <div class="plans" role="group" aria-label="Membership plan">${planButtons}</div>
      <div class="seg" role="group" aria-label="Payment method">
        ${methods.map(([k, label, ic]) => `<button type="button" data-act="${acts.method}" data-v="${k}" class="${st.method === k ? 'is-on' : ''}" ${k === 'upi' && offline ? 'disabled title="UPI unavailable offline"' : ''}>${icon(ic)}${label}</button>`).join('')}
      </div>
      <div class="renew__cta">
        <button type="button" class="btn btn--primary btn--lg" data-act="${acts.pay}" ${st.busy ? 'disabled' : ''}>
          ${st.busy ? icon('refresh') : icon(st.method === 'cash' ? 'cash' : 'arrowRight')}${cta}
        </button>
      </div>
      <div class="renew__note">${icon('info')}<span>${note}${offline ? ' Offline: cash only, syncs later.' : ''}</span></div>
    </div>`;
  }

  /* ============================================================
     DOOR
     ============================================================ */
  function doorList() {
    let list = S.members.slice();
    const q = norm(UI.query);
    if (q) list = list.filter(m => norm(m.name).includes(q) || norm(m.phone).includes(q) || String(m.id) === q);
    if (UI.doorFilter === 'expired') list = list.filter(m => ['expired', 'grace'].includes(statusOf(m)));
    if (UI.doorFilter === 'expiring') list = list.filter(m => statusOf(m) === 'expiring');
    if (UI.doorFilter === 'blocked') list = list.filter(m => statusOf(m) === 'expired' || m.pay !== 'paid');
    return list.sort((a, b) => daysUntil(a.end) - daysUntil(b.end));
  }

  function renderDoor() {
    const c = counts();
    const t = todayCounts();
    const m = memberById(UI.selected);
    const list = doorList();
    const recent = S.events.filter(e => ['entry', 'block', 'override', 'payment'].includes(e.type)).slice(0, 5);
    const selectedStatus = m ? statusOf(m) : null;
    const passActive = m && hasActivePass(m);
    const showRenew = m && selectedStatus !== 'frozen' && (UI.doorRenew.open || (['expired', 'grace'].includes(selectedStatus) && !passActive));

    const scenario = name => S.members.find(x => x.name.startsWith(name));

    return `
    <div class="page-head">
      <div>
        <h1>Door</h1>
        <p>Scan, search or tap a member. One decision, one screen, one tap to renew.</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--sm btn--primary" data-act="scan" type="button">${icon('camera')}Scan QR</button>
        <button class="btn btn--sm" data-act="kiosk" type="button">${icon('qr')}Kiosk mode</button>
        <button class="btn btn--sm" data-act="toggle-offline" type="button">
          ${icon(UI.offline ? 'wifiOff' : 'wifi')}${UI.offline ? 'Offline · cash only' : 'Simulate offline'}
        </button>
        <button class="btn btn--sm btn--ghost" data-act="palette" type="button">${icon('search')}Find anything</button>
      </div>
    </div>

    ${UI.offline ? `<div class="banner">
      ${icon('wifiOff')}<span><strong>Offline mode.</strong> Using ${S.members.length} cached members. ${UI.queued} check-in${UI.queued === 1 ? '' : 's'} queued to sync. Payments are cash only.</span>
      <button class="btn btn--xs" data-act="sync-offline" type="button" ${UI.queued ? '' : 'disabled'}>${icon('refresh')}Sync now</button>
    </div>` : ''}

    <div class="door-grid">
      <section class="card find-card" aria-label="Find member">
        <div class="card__head">
          <h2>Find member</h2>
          <span class="mut">${list.length} of ${S.members.length}</span>
        </div>
        <div class="search">
          ${icon('search')}
          <input class="input" id="doorSearch" type="search" placeholder="Name, last 4 digits or member no." value="${esc(UI.query)}" autocomplete="off" aria-label="Search member">
          <kbd>/</kbd>
        </div>
        <div class="chips" style="margin-top:9px">
          ${[['all', 'All'], ['expired', 'Expired'], ['expiring', 'Expiring'], ['blocked', 'Payment issue']].map(([k, label]) =>
            `<button class="chip${UI.doorFilter === k ? ' is-on' : ''}" data-act="door-filter" data-v="${k}" type="button">${label}</button>`).join('')}
        </div>
        <div class="member-list" role="list">
          ${list.map(x => `<button type="button" class="mrow${x.id === UI.selected ? ' is-sel' : ''}" data-act="select" data-id="${x.id}" role="listitem">
            <span class="avatar" style="--h:${x.hue}">${initials(x.name)}</span>
            <span class="mrow__body">
              <span class="mrow__name">${esc(x.name)}</span>
              <span class="mrow__meta">#${x.id} · ${x.phone} · ${planOf(x).label}</span>
            </span>
            ${statusPill(x)}
          </button>`).join('') || `<div class="list-empty">No match. Try the phone number or member ID.</div>`}
        </div>
        <p class="mut" style="margin-top:10px;display:flex;gap:6px;align-items:flex-start">${icon('lock')}<span>A photo is on file for every member. Verify the face on the desk tablet, not just the QR.</span></p>
      </section>

      <div style="min-width:0;display:flex;flex-direction:column;gap:16px">
        <section class="scan-panel" aria-label="Scan result">
          <div class="scan-stage">
            ${m ? doorResult(m, t) : doorIdle(scenario)}
            ${showRenew && selectedStatus !== 'frozen' ? `<div class="card card--pad" style="margin-top:16px">${renewPanel(m, UI.doorRenew, {
              acts: { plan: 'door-plan', method: 'door-method', pay: 'door-pay' },
              allowPass: true,
              offline: UI.offline
            })}</div>` : ''}
          </div>
          <div class="feed">
            <div class="feed__title">
              ${icon('activity')}
              <h2>Recent activity</h2>
              <span class="mut">Live from this desk</span>
            </div>
            <div aria-live="polite">
              ${recent.map(e => `<div class="feed-row">
                <span class="pill pill--${e.type === 'entry' ? 'ok' : e.type === 'block' ? 'bad' : e.type === 'override' ? 'warn' : 'brand'}">${e.type === 'entry' ? 'In' : e.type === 'block' ? 'Blocked' : e.type === 'override' ? 'Override' : 'Paid'}</span>
                <span class="feed-row__body">
                  <span class="feed-row__name">${esc(e.title)}</span>
                  <span class="feed-row__meta">${esc(e.detail)}</span>
                </span>
                <time>${eventToday(e) ? fmtTime(e.ts) : fmtDay(e.ts)}</time>
              </div>`).join('') || `<p class="mut">No activity yet today.</p>`}
            </div>
          </div>
        </section>
      </div>
    </div>`;
  }

  function doorIdle(scenario) {
    const a = scenario('Rahul');
    const b = scenario('Lakshmi');
    const c = scenario('Arjun');
    return `<div class="scan-idle">
      <div class="scan-frame" aria-hidden="true">
        <span class="corner"></span><span class="corner"></span><span class="corner"></span><span class="corner"></span>
        <span class="scan-line"></span>
        ${icon('door')}
      </div>
      <h2>Ready to scan</h2>
      <p>Point the member’s rotating QR at the camera, or pick them from the list. The decision appears in under a second — even offline.</p>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px">
        <button class="btn btn--primary" data-act="scan" type="button">${icon('camera')}Scan with camera</button>
        <button class="btn btn--ghost" data-act="add-member" type="button">${icon('plus')}Add member</button>
      </div>
      <div class="demo-scenarios">
        <div class="card__eyebrow">Try a live demo scenario</div>
        <div class="scenario-grid">
          ${a ? `<button class="scenario" type="button" data-act="select" data-id="${a.id}"><i style="background:var(--bad)"></i>Expired<span>Rahul · -6 days</span></button>` : ''}
          ${b ? `<button class="scenario" type="button" data-act="select" data-id="${b.id}"><i style="background:var(--warn)"></i>Grace day<span>Lakshmi · -2 days</span></button>` : ''}
          ${c ? `<button class="scenario" type="button" data-act="select" data-id="${c.id}"><i style="background:var(--ok)"></i>Active<span>Arjun · 45 days</span></button>` : ''}
        </div>
      </div>
      <div class="stage-foot">
        <span><span class="dot"></span> <strong>${S.members.length}</strong> cached</span>
        <span><strong>${todayCounts().entries}</strong> in today</span>
        <span><strong>${todayCounts().blocks}</strong> blocked</span>
        <span>Owner PIN <strong class="mono">2468</strong></span>
      </div>
    </div>`;
  }

  function relayMarkup() {
    const r = UI.relay || { kind: 'idle' };
    const open = r.kind === 'open';
    const blocked = r.kind === 'blocked';
    return `<div class="relay${open ? ' is-open' : ''}${blocked ? ' is-blocked' : ''}" id="relayStrip" data-kind="${r.kind}" aria-live="polite">
      <span class="relay__gate" aria-hidden="true"><i></i><i></i></span>
      <span class="relay__body">
        <span class="relay__k">${icon('zap')}Door relay · Gate 1</span>
        <span class="relay__t" id="relayState">${open ? 'Unlocked · open for 3 seconds' : blocked ? 'Locked · entry denied' : 'Ready · waiting for a scan'}</span>
        <span class="relay__s" id="relaySub">${open ? `Relay pulse at ${fmtTime(r.ts)} · auto-locks` : blocked ? 'No relay pulse sent · decision logged' : 'Hardware simulator — no real door is connected'}</span>
      </span>
      <span class="relay__led" aria-hidden="true"></span>
      <span class="relay__btns">
        <button class="icon-btn" data-act="toggle-sound" type="button" aria-label="${UI.sound ? 'Mute relay sounds' : 'Enable relay sounds'}" title="${UI.sound ? 'Mute relay sounds' : 'Enable relay sounds'}">${icon(UI.sound ? 'bell' : 'x')}</button>
        <button class="btn btn--xs btn--ghost" data-act="test-relay" type="button">${icon('zap')}Test</button>
      </span>
    </div>`;
  }

  let relayAudio = null;
  function playRelayTone(kind) {
    if (!UI.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      relayAudio = relayAudio || new Ctx();
      if (relayAudio.state === 'suspended') relayAudio.resume();
      const now = relayAudio.currentTime;
      const notes = kind === 'open' ? [620, 880] : [170];
      notes.forEach((freq, i) => {
        const osc = relayAudio.createOscillator();
        const gain = relayAudio.createGain();
        osc.type = kind === 'open' ? 'sine' : 'square';
        osc.frequency.value = freq;
        const at = now + i * 0.11;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(kind === 'open' ? 0.09 : 0.05, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.19);
        osc.connect(gain).connect(relayAudio.destination);
        osc.start(at);
        osc.stop(at + 0.21);
      });
    } catch (e) { /* audio is a nice-to-have */ }
  }

  function armRelay() {
    const strip = $('#relayStrip');
    if (!strip) return;
    const kind = strip.dataset.kind;
    const state = strip.querySelector('#relayState');
    const sub = strip.querySelector('#relaySub');
    if (kind === 'open') {
      if (UI.relay && Date.now() - UI.relay.ts < 900) playRelayTone('open');
      setTimeout(() => {
        strip.classList.remove('is-open');
        if (state) state.textContent = 'Locked · ready for the next scan';
        if (sub) sub.textContent = 'Auto-locked after 3 seconds';
        UI.relay = null;
      }, 3000);
    } else if (kind === 'blocked') {
      if (UI.relay && Date.now() - UI.relay.ts < 900) playRelayTone('blocked');
      setTimeout(() => {
        strip.classList.remove('is-blocked');
        if (state) state.textContent = 'Locked · waiting for the next scan';
        UI.relay = null;
      }, 1400);
    }
  }

  /* ---------- kiosk mode ---------- */
  let kioskTimer = null;
  function kioskAllowed(m) {
    return hasActivePass(m) || ['active', 'expiring', 'grace'].includes(statusOf(m));
  }
  function updateKioskClock() {
    const el = document.getElementById('kioskClock');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  function enterKiosk() {
    UI.kiosk = { on: true, result: null };
    document.body.classList.add('kiosk-on');
    render();
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) { const p = el.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
    } catch (e) {}
    toast('Kiosk mode on. Press Esc to exit.', 'ok');
  }
  function exitKiosk() {
    UI.kiosk = { on: false, result: null };
    document.body.classList.remove('kiosk-on');
    clearTimeout(kioskTimer);
    try { if (document.fullscreenElement && document.exitFullscreen) { const p = document.exitFullscreen(); if (p && p.catch) p.catch(() => {}); } } catch (e) {}
    render();
    toast('Kiosk mode off.', 'ok');
  }
  function kioskDecision(m) {
    const kind = kioskAllowed(m) ? 'open' : 'blocked';
    UI.kiosk.result = { id: m.id, kind, at: Date.now() };
    renderKiosk();
    playRelayTone(kind);
    clearTimeout(kioskTimer);
    kioskTimer = setTimeout(() => {
      if (UI.kiosk.on) { UI.kiosk.result = null; renderKiosk(); }
    }, 6000);
  }
  function renderKiosk() {
    let root = document.getElementById('kiosk-root');
    if (!root) { root = document.createElement('div'); root.id = 'kiosk-root'; document.body.appendChild(root); }
    if (!UI.kiosk.on) { root.innerHTML = ''; return; }
    const r = UI.kiosk.result;
    const m = r ? memberById(r.id) : null;
    const t = todayCounts();
    const recent = S.events.filter(e => ['entry', 'block', 'override'].includes(e.type)).slice(0, 3);
    const stage = r && m
      ? `<div class="kiosk__verdict kiosk__verdict--${r.kind}" id="kioskVerdict">
          <span class="kiosk__icon">${icon(r.kind === 'open' ? 'checkCircle' : 'x')}</span>
          <span class="kiosk__name">${esc(m.name)}</span>
          <span class="kiosk__msg">${r.kind === 'open' ? (hasActivePass(m) ? 'Day pass accepted — welcome in.' : 'Membership active — welcome in.') : statusOf(m) === 'frozen' ? 'Membership frozen — please see the desk.' : 'Membership expired — please see the desk to renew.'}</span>
          <span class="kiosk__sub">${r.kind === 'open' ? 'Gate 1 unlocked · auto-locks in 3 seconds' : 'Entry not recorded · the desk can help'}</span>
        </div>`
      : `<div class="kiosk__idle">
          <span class="kiosk__scan" aria-hidden="true">${icon('qr')}</span>
          <span class="kiosk__hint">Tap your DoorPass QR</span>
          <span class="kiosk__sub">Rotating code · no app install needed</span>
          <div class="kiosk__actions">
            <button class="kiosk__btn" data-act="kiosk-scan" type="button">${icon('camera')}Open camera</button>
            <button class="kiosk__btn kiosk__btn--ghost" data-act="kiosk-demo" type="button">${icon('sparkle')}Simulate a scan</button>
          </div>
          <form id="kioskTokenForm" class="kiosk__manual" novalidate>
            <input id="kioskToken" placeholder="Paste a member token (demo fallback)" aria-label="Member token">
            <button class="btn btn--sm" type="submit">Verify</button>
            <div class="err" id="kioskErr" role="alert"></div>
          </form>
        </div>`;
    root.innerHTML = `<div class="kiosk" role="dialog" aria-modal="true" aria-label="DoorPass kiosk">
      <div class="kiosk__top">
        <span class="kiosk__brand"><span class="kiosk__mark">${icon('door')}</span>DoorPass<span class="kiosk__gym">Iron Temple</span></span>
        <span class="kiosk__clock" id="kioskClock"></span>
        <button class="btn btn--sm btn--ghost" data-act="exit-kiosk" type="button">${icon('logout')}Exit kiosk</button>
      </div>
      <div class="kiosk__stage">${stage}</div>
      <div class="kiosk__bottom">
        <div class="kiosk__stats">
          <div><b>${t.entries}</b><span>check-ins today</span></div>
          <div><b>${t.blocks}</b><span>seen at the desk</span></div>
          <div><b>${S.members.length}</b><span>cached members</span></div>
        </div>
        <div class="kiosk__recent">
          <span class="kiosk__recent__k">Latest activity</span>
          ${recent.map(e => `<span class="kiosk__ev"><b>${esc(e.title)}</b><em>${eventToday(e) ? fmtTime(e.ts) : fmtDay(e.ts)}</em></span>`).join('') || '<span class="mut">No activity yet.</span>'}
        </div>
      </div>
    </div>`;
    updateKioskClock();
  }

  function doorResult(m, t) {
    const st = statusOf(m);
    const meta = STATUS[st];
    const d = daysUntil(m.end);
    const released = UI.released === m.id;
    const pass = !released && hasActivePass(m);

    const copy = pass ? ['Day pass', 'Entry allowed', `Day pass paid today. Membership expiry stays ${fmtDate(m.end)}.`] : {
      active: ['Entry allowed', 'Allowed', `Valid till ${fmtDate(m.end)} · ${d} day${d === 1 ? '' : 's'} left.`],
      expiring: ['Entry allowed', 'Allowed', `Ends ${d === 0 ? 'today' : 'in ' + d + ' day' + (d === 1 ? '' : 's')}. Ask them to renew while they are here.`],
      grace: ['Grace period', 'Let in today', `Expired ${-d} day${-d === 1 ? '' : 's'} ago. Grace ends in ${S.settings.graceDays + d} day${S.settings.graceDays + d === 1 ? '' : 's'}.`],
      expired: ['Entry blocked', 'Entry blocked', `Expired ${-d} day${-d === 1 ? '' : 's'} ago (${fmtDate(m.end)}). Renew below to let them in.`],
      frozen: ['Membership on hold', 'Frozen', 'The member asked to pause. The owner must unfreeze before entry.']
    }[st];

    const canRenewEarly = ['active', 'expiring'].includes(st) || pass;
    const tone = released ? 'warn' : pass ? 'ok' : meta.tone;
    const verdictIcon = released ? 'key' : pass ? 'checkCircle' : meta.icon;

    let actions = `<button class="btn btn--ghost" type="button" data-act="clear-scan">${icon('refresh')}Next member</button>`;
    if (canRenewEarly) actions += `<button class="btn" type="button" data-act="door-renew-toggle">${icon('card')}${UI.doorRenew.open ? 'Hide renewal' : pass ? 'Renew membership' : 'Renew early'}</button>`;
    if (st === 'expiring') actions += `<button class="btn" type="button" data-act="remind" data-id="${m.id}">${icon('whatsapp')}Send reminder</button>`;
    if (['expired', 'grace', 'frozen'].includes(st) && !released && !pass) actions += `<button class="btn btn--danger" type="button" data-act="override" data-id="${m.id}">${icon('key')}Release with owner PIN</button>`;

    return `<div class="scan-stage__status tone-${tone}">
      <div class="verdict-top">
        <div class="verdict-icon">${icon(verdictIcon)}</div>
        <div class="verdict-copy">
          <div class="verdict-eyebrow">${released ? 'Released by owner' : copy[0]}</div>
          <div class="verdict-title">${released ? 'Door released' : copy[1]}</div>
          <div class="verdict-sub">${released ? 'This entry was logged as an override. The membership is still expired.' : copy[2]}</div>
          <div class="verdict-person">
            <span class="avatar" style="--h:${m.hue}">${initials(m.name)}</span>
            <span>
              <span class="verdict-person__name">${esc(m.name)}</span>
              <span class="verdict-person__meta"> · #${m.id} · ${planOf(m).label} · photo on file</span>
            </span>
            ${m.pay !== 'paid' ? payPill(m) : ''}
          </div>
        </div>
      </div>
      <div class="verdict-meta">
        <div class="vmeta"><div class="vmeta__k">Ends</div><div class="vmeta__v">${fmtDate(m.end)}</div></div>
        <div class="vmeta"><div class="vmeta__k">${d >= 0 ? 'Days left' : 'Overdue'}</div><div class="vmeta__v">${d >= 0 ? d + ' days' : -d + ' days'}</div></div>
        <div class="vmeta"><div class="vmeta__k">Payment</div><div class="vmeta__v">${m.pay === 'paid' ? 'Settled' : m.pay === 'partial' ? 'Balance ' + inr(m.balance) : 'Unpaid ' + inr(m.balance || planOf(m).price)}</div></div>
        <div class="vmeta"><div class="vmeta__k">Last visit</div><div class="vmeta__v">${m.lastSeen === 0 ? 'Today' : m.lastSeen + ' days ago'}</div></div>
      </div>
      <div class="verdict-actions">${actions}</div>
      ${relayMarkup()}
      ${released ? `<div class="banner" style="margin:16px 0 0;background:var(--ok-soft);color:var(--ok);border-color:color-mix(in srgb,var(--ok) 24%,transparent)">${icon('checkCircle')}<span><strong>Logged.</strong> Reason and PIN are in the audit trail. It will appear in the owner’s 9 pm digest.</span></div>` : ''}
      ${pass ? `<div class="banner" style="margin:16px 0 0;background:var(--ok-soft);color:var(--ok);border-color:color-mix(in srgb,var(--ok) 24%,transparent)">${icon('checkCircle')}<span><strong>Day pass active.</strong> One entry is recorded. Ask them to renew before the next visit.</span></div>` : ''}
      ${m.freezeRequest && !released ? `<div class="banner" style="margin:16px 0 0;background:var(--warn-soft);color:var(--warn);border-color:color-mix(in srgb,var(--warn) 26%,transparent)">
        ${icon('snow')}<span><strong>${m.freezeRequest.action === 'unfreeze' ? 'Unfreeze' : 'Freeze'} request pending.</strong> Review it from the member drawer or dashboard.</span>
      </div>` : ''}
      ${st === 'frozen' ? `<p class="mut" style="margin-top:12px">Use the owner PIN to release once, or unfreeze from the member drawer.</p>` : ''}
    </div>`;
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  function sparkline(data) {
    const w = 220, h = 56;
    const max = Math.max(...data), min = Math.min(...data);
    const span = max - min || 1;
    const pts = data.map((v, i) => [i * (w / (data.length - 1)), h - 4 - ((v - min) / span) * (h - 10)]);
    const line = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    return `<svg class="hero__spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${line}" fill="none" stroke="#C9F36A" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  }

  function chartMarkup() {
    const n = UI.chartRange;
    const data = S.stats.chart.slice(-n);
    const W = 600, H = 190, padL = 14, padR = 14, top = 16, base = 158;
    const max = Math.max(...data, 1) * 1.15;
    const x = i => padL + i * ((W - padL - padR) / (n - 1));
    const y = v => base - (v / max) * (base - top);
    const pts = data.map((v, i) => [x(i), y(v)]);
    const line = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    const area = `M${x(0).toFixed(1)} ${base} ` + pts.map(p => 'L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + ` L${x(n - 1).toFixed(1)} ${base} Z`;
    const grid = [0, .5, 1].map(f => {
      const gy = base - f * (base - top);
      return `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="var(--line)" stroke-dasharray="3 5" opacity=".8"/>`;
    }).join('');
    const dots = pts.map((p, i) => {
      const last = i === pts.length - 1;
      const label = addDays(TODAY, -(n - 1 - i)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      return `<circle class="chart-hit" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="14" fill="transparent" data-label="${label}" data-value="${data[i]}"/>
        <circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${last ? 4.5 : 2.6}" fill="${last ? 'var(--brand)' : 'var(--surface)'}" stroke="var(--brand)" stroke-width="2"/>`;
    }).join('');
    const every = n > 10 ? 2 : 1;
    const labels = pts.map((p, i) => {
      if (i % every !== 0 && i !== pts.length - 1) return '';
      const d = addDays(TODAY, -(n - 1 - i));
      const txt = n > 7 ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : d.toLocaleDateString('en-IN', { weekday: 'short' });
      return `<text x="${p[0].toFixed(1)}" y="181" font-size="9.5" text-anchor="middle" fill="var(--faint)" font-family="var(--font)">${txt}</text>`;
    }).join('');

    return `<div class="chart-wrap" id="chartWrap">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily collections, last ${n} days">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--brand)" stop-opacity=".24"/>
            <stop offset="1" stop-color="var(--brand)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <path d="${area}" fill="url(#chartFill)"/>
        <path d="${line}" fill="none" stroke="var(--brand)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}
        ${labels}
      </svg>
      <div class="chart-tip" id="chartTip"></div>
    </div>`;
  }

  function riskRow(x) {
    const m = x.m;
    const score = x.score;
    const tone = score >= 70 ? 'bad' : score >= 45 ? 'warn' : 'info';
    return `<div class="risk-row">
      <span class="risk-score risk-score--${tone}" style="--p:${score}" aria-label="Churn risk ${score} out of 99"><b>${score}</b><i>risk</i></span>
      <span class="risk-body">
        <span class="risk-name">${esc(m.name)}${m.campaignAt ? '<em class="risk-sent">contacted</em>' : ''}</span>
        <span class="risk-tags">${churnReasons(m).map(r => `<span>${esc(r)}</span>`).join('')}</span>
      </span>
      <span class="risk-val">${inr(monthlyValue(m))}<small>/mo</small></span>
      <span class="risk-acts">
        <button class="btn btn--xs" data-act="winback-one" data-id="${m.id}" type="button">${icon('whatsapp')}Win back</button>
        <button class="icon-btn" data-act="open-member" data-id="${m.id}" type="button" aria-label="Open ${esc(m.name)}">${icon('arrowRight')}</button>
      </span>
    </div>`;
  }

  function updateForecast() {
    const input = $('#forecastRate');
    if (!input) return;
    UI.winbackRate = Number(input.value) || 0;
    const f = retentionFigures(UI.winbackRate);
    const doNothing = f.base - f.atRiskPool;
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    const width = (v, base) => Math.max(3, Math.min(100, Math.round((v / Math.max(1, base)) * 100))) + '%';
    set('rateVal', f.rate + '%');
    set('forecastProj', inr(f.projected));
    set('forecastDelta', `${inr(Math.max(0, f.projected - doNothing))} above the do-nothing book`);
    set('meterBase', inr(f.base - f.atRiskPool));
    set('meterProtected', inr(f.protectedValue));
    set('meterRenewals', inr(f.renewals));
    set('heroProjected', inr(f.projected));
    set('heroRecovered', inr(f.protectedValue + f.renewals));
    const pb = document.getElementById('meterProtectedBar');
    const rb = document.getElementById('meterRenewalsBar');
    if (pb) pb.style.width = width(f.protectedValue, f.base - f.atRiskPool);
    if (rb) rb.style.width = width(f.renewals, f.base - f.atRiskPool);
  }

  function renderRetention() {
    const c = counts();
    const radarAll = riskRadar();
    const radar = radarAll.slice(0, 7);
    const f = retentionFigures();
    const targets = radarAll.slice(0, 8);
    const top = targets[0] && targets[0].m;
    const campaignEvents = S.events.filter(e => e.type === 'campaign');
    const unpaid = S.members.filter(m => m.pay !== 'paid').reduce((s, m) => s + (m.balance || planOf(m).price), 0);
    const avg = radarAll.length ? Math.round(radarAll.reduce((s, x) => s + x.score, 0) / radarAll.length) : 0;
    const lastCampaign = campaignEvents[0];
    const doNothing = f.base - f.atRiskPool;
    const width = (v, base) => Math.max(3, Math.min(100, Math.round((v / Math.max(1, base)) * 100))) + '%';

    return `
    <div class="page-head">
      <div>
        <h1>Retention radar</h1>
        <p>Find the members who are about to disappear — then give them a reason to come back.</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--sm btn--primary" data-act="campaign" type="button" ${targets.length ? '' : 'disabled'}>${icon('send')}Launch win-back</button>
      </div>
    </div>

    <section class="hero hero--retention" aria-label="Projected revenue">
      ${sparkline(S.stats.chart.slice(-10))}
      <div class="hero__main">
        <div class="hero__k">Projected next 30 days</div>
        <div class="hero__v" id="heroProjected">${inr(f.projected)}</div>
        <div class="hero__delta">${icon('target')}${radarAll.length} silent churners · <span id="heroRecovered">${inr(f.protectedValue + f.renewals)}</span> modelled recovery</div>
      </div>
      <div class="hero__atrisk">
        <span>Revenue in play</span>
        <b>${inr(f.atRiskPool + f.duePool)}</b>
      </div>
    </section>

    <div class="kpis">
      <button class="kpi kpi--alert" data-act="list-radar" type="button">
        <span class="kpi__k">${icon('target')}Silent churners</span>
        <span class="kpi__v">${radarAll.length}</span>
        <span class="kpi__sub">avg risk ${avg} / 99</span>
      </button>
      <div class="kpi">
        <span class="kpi__k">${icon('cash')}Unpaid balance</span>
        <span class="kpi__v">${inr(unpaid)}</span>
        <span class="kpi__sub">${c.unpaid} members with a balance</span>
      </div>
      <button class="kpi" data-act="kpi" data-v="expiring" type="button">
        <span class="kpi__k">${icon('clock')}Renewals in play</span>
        <span class="kpi__v">${c.expiring + c.expiredCombined}</span>
        <span class="kpi__sub">${inr(f.duePool)} monthly value</span>
      </button>
      <div class="kpi">
        <span class="kpi__k">${icon('whatsapp')}Win-backs sent</span>
        <span class="kpi__v">${campaignEvents.length}</span>
        <span class="kpi__sub">${lastCampaign ? 'last ' + fmtDay(lastCampaign.ts) : 'none yet'}</span>
      </div>
    </div>

    <div class="ret-grid">
      <section class="card radar-card">
        <div class="card__head">
          <h2>Churn radar</h2>
          <span class="pill pill--outline">live scoring</span>
          <span class="mut" style="margin-left:auto">visit gap · balance · expiry · tenure</span>
        </div>
        ${radar.map(riskRow).join('') || `<div class="empty"><h3>No one is slipping</h3><p>Every active member has visited in the last few days.</p></div>`}
        ${radarAll.length > radar.length ? `<div class="radar-foot">+${radarAll.length - radar.length} more members scored above 30. Open the group to see the full list.</div>` : ''}
      </section>

      <section class="card campaign-card">
        <div class="card__head">
          <h2>Win-back autopilot</h2>
          <span class="pill pill--brand">WhatsApp</span>
        </div>
        <div class="camp-to">${icon('whatsapp')}${top ? `To ${esc(top.name.split(' ')[0])}${targets.length > 1 ? ` + ${targets.length - 1} more` : ''}` : 'No targets right now'}</div>
        <div class="camp-bubble">${esc(top ? campaignMessage(top, 'free7') : 'Nobody needs a nudge today. Enjoy the quiet.')}</div>
        <div class="camp-stats">
          <span><b>${targets.length}</b> personal messages</span>
          <span><b>${inr(targets.length * WA_COST)}</b> est. cost</span>
        </div>
        <button class="btn btn--primary" data-act="campaign" type="button" ${targets.length ? '' : 'disabled'} style="width:100%;justify-content:center">${icon('sparkle')}Personalise &amp; send</button>
        <p class="camp-note">Each message uses the member’s name, plan and last visit. No broadcast blasts.</p>
        <div class="camp-playbook">
          <div class="camp-step"><span>1</span><p><b>Score</b>Visit gap, balance and expiry create a 0–99 risk.</p></div>
          <div class="camp-step"><span>2</span><p><b>Personalise</b>Use <code>{name}</code> and a real offer, not a blast.</p></div>
          <div class="camp-step"><span>3</span><p><b>Send</b>Marks them contacted and logs it to the audit trail.</p></div>
        </div>
      </section>
    </div>

    <section class="card forecast-card" aria-label="Revenue forecast">
      <div class="card__head">
        <div style="min-width:0">
          <h2>30-day revenue forecast</h2>
          <div class="mut">Slide the recovery assumption and watch silent churn turn back into money.</div>
        </div>
        <span class="pill pill--outline" style="margin-left:auto">live model</span>
      </div>
      <div class="forecast">
        <div class="forecast__big">
          <span>Projected</span>
          <b id="forecastProj">${inr(f.projected)}</b>
          <small id="forecastDelta">${inr(Math.max(0, f.projected - doNothing))} above the do-nothing book</small>
        </div>
        <div class="forecast__meters">
          <div class="meter"><span>Secure base</span><b id="meterBase">${inr(f.base - f.atRiskPool)}</b><i style="width:100%"></i></div>
          <div class="meter meter--ok"><span>Silent churn protected</span><b id="meterProtected">${inr(f.protectedValue)}</b><i id="meterProtectedBar" style="width:${width(f.protectedValue, f.base - f.atRiskPool)}"></i></div>
          <div class="meter meter--warn"><span>Lapsed renewals recovered</span><b id="meterRenewals">${inr(f.renewals)}</b><i id="meterRenewalsBar" style="width:${width(f.renewals, f.base - f.atRiskPool)}"></i></div>
        </div>
        <div class="forecast__rate">
          <label for="forecastRate">Recovery assumption <b id="rateVal">${f.rate}%</b></label>
          <input type="range" id="forecastRate" min="0" max="80" step="5" value="${UI.winbackRate}" aria-label="Recovery assumption">
          <div class="forecast__scale"><span>Do nothing</span><span>Best playbook</span></div>
        </div>
      </div>
      <div class="forecast__foot">Assumes ${f.dueCount} lapsed or expiring memberships convert at 60% of the chosen rate. Updates as the desk works the list.</div>
    </section>`;
  }

  /* ============================================================
     REFERRAL ENGINE
     ============================================================ */
  function makeRefCode(m) {
    return 'IT' + pad(m.id) + initials(m.name);
  }
  function refCodeOf(m) {
    return m.refCode || makeRefCode(m);
  }
  function refLink(m) {
    return `https://doorpass.app/join/iron-temple?ref=${refCodeOf(m)}`;
  }
  function refRewardDays() {
    return Number(S.settings.refReward) || 7;
  }
  function refFriendPerk() {
    return S.settings.refFriend || '10% off';
  }
  function refMessage(m) {
    return `Hi ${m.name.split(' ')[0]}, here is your Iron Temple referral link: ${refLink(m)}. Share it with a friend — they get ${refFriendPerk()} on their first month and you get ${refRewardDays()} free days when they join.`;
  }
  function referralStats() {
    const invites = S.members.reduce((s, m) => s + (m.refInvites || 0), 0);
    const joins = S.members.reduce((s, m) => s + (m.refJoins || 0), 0);
    const days = S.members.reduce((s, m) => s + (m.refRewardDays || 0), 0);
    const leaders = S.members
      .filter(m => (m.refJoins || 0) + (m.refInvites || 0) > 0)
      .sort((a, b) => (b.refJoins - a.refJoins) || (b.refInvites - a.refInvites) || a.name.localeCompare(b.name));
    const rate = invites ? Math.round((joins / invites) * 100) : 0;
    const value = joins * PLANS[1].price;
    const events = S.events.filter(e => e.type === 'referral');
    return { invites, joins, days, leaders, rate, value, events };
  }

  function renderReferrals() {
    const f = referralStats();
    const top = f.leaders[0];
    return `
    <div class="page-head">
      <div>
        <h1>Referral engine</h1>
        <p>Turn happy members into a second sales team — with tracked links and automatic rewards.</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--sm btn--primary" data-act="referral" type="button" ${S.members.length ? '' : 'disabled'}>${icon('userPlus')}Send an invite</button>
      </div>
    </div>

    <section class="hero hero--ref" aria-label="Referral revenue">
      ${sparkline(S.stats.chart.slice(-10))}
      <div class="hero__main">
        <div class="hero__k">Revenue from referrals</div>
        <div class="hero__v" id="refValue">${inr(f.value)}</div>
        <div class="hero__delta">${icon('gift')}<span id="refJoinsHero">${f.joins}</span> friends joined · <span id="refDaysHero">${f.days}</span> free days rewarded</div>
      </div>
      <div class="hero__atrisk">
        <span>Cost per join</span>
        <b>₹0</b>
      </div>
    </section>

    <div class="kpis">
      <div class="kpi">
        <span class="kpi__k">${icon('send')}Invites sent</span>
        <span class="kpi__v" id="refInvites">${f.invites}</span>
        <span class="kpi__sub">personal links, not broadcasts</span>
      </div>
      <div class="kpi kpi--good">
        <span class="kpi__k">${icon('users')}Friends joined</span>
        <span class="kpi__v" id="refJoins">${f.joins}</span>
        <span class="kpi__sub">₹${PLANS[1].price.toLocaleString('en-IN')} first-month value each</span>
      </div>
      <div class="kpi">
        <span class="kpi__k">${icon('trend')}Conversion</span>
        <span class="kpi__v" id="refRate">${f.rate}%</span>
        <span class="kpi__sub">invite → paid member</span>
      </div>
      <div class="kpi">
        <span class="kpi__k">${icon('gift')}Rewards paid</span>
        <span class="kpi__v" id="refDays">${f.days}d</span>
        <span class="kpi__sub">${refRewardDays()} days per successful join</span>
      </div>
    </div>

    <div class="ref-grid">
      <section class="card ref-board">
        <div class="card__head">
          <h2>Top referrers</h2>
          <span class="pill pill--outline">leaderboard</span>
          <span class="mut" style="margin-left:auto">${f.leaders.length} members sharing</span>
        </div>
        ${f.leaders.length ? f.leaders.map((m, i) => `<div class="ref-row" data-member="${m.id}">
          <span class="ref-rank${i === 0 ? ' ref-rank--gold' : ''}">${i + 1}</span>
          <span class="avatar" style="--h:${m.hue}">${initials(m.name)}</span>
          <span class="ref-row__body">
            <span class="ref-row__n">${esc(m.name)}</span>
            <span class="ref-row__c">${refCodeOf(m)} · ${m.refInvites || 0} invite${(m.refInvites || 0) === 1 ? '' : 's'} · ${m.refRewardDays || 0}d earned</span>
          </span>
          <span class="ref-row__n${m.refJoins ? '' : ' is-zero'}" title="Friends joined">${m.refJoins || 0}</span>
          <span class="ref-row__acts">
            <button class="icon-btn" type="button" data-act="copy-ref-link" data-id="${m.id}" title="Copy referral link" aria-label="Copy ${esc(m.name)}'s referral link">${icon('link')}</button>
            <button class="btn btn--xs" type="button" data-act="referral" data-id="${m.id}">${icon('send')}Invite</button>
          </span>
        </div>`).join('') : `<div class="empty" style="padding:22px 0"><h3>No referrers yet</h3><p>Send the first invite and this board fills itself.</p></div>`}
        ${top ? `<div class="radar-foot">Top link converts best: <b>${refCodeOf(top)}</b> · ${top.refJoins || 0} join${(top.refJoins || 0) === 1 ? '' : 's'} from ${top.refInvites || 0} invites.</div>` : ''}
      </section>

      <section class="card ref-engine">
        <div class="card__head">
          <h2>Reward rules</h2>
          <span class="pill pill--brand">owner</span>
        </div>
        <div class="setting-row">
          <div class="setting-row__body">
            <div class="setting-row__t">Referrer reward</div>
            <div class="setting-row__s">Free days added when their friend joins.</div>
          </div>
          <select class="select" id="refReward" aria-label="Referrer reward">
            ${[7, 14, 21, 30].map(n => `<option value="${n}" ${refRewardDays() === n ? 'selected' : ''}>+${n} days</option>`).join('')}
          </select>
        </div>
        <div class="setting-row">
          <div class="setting-row__body">
            <div class="setting-row__t">Friend offer</div>
            <div class="setting-row__s">What the new member gets on their first month.</div>
          </div>
          <select class="select" id="refFriend" aria-label="Friend offer">
            ${['10% off', '7 free days', 'Free PT session'].map(o => `<option ${refFriendPerk() === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
        <div class="camp-playbook" style="margin-top:14px">
          <div class="camp-step"><span>1</span><p><b>Share</b>Every member gets a tracked link and a forward-ready message.</p></div>
          <div class="camp-step"><span>2</span><p><b>Join</b>The friend pays their first month through the link.</p></div>
          <div class="camp-step"><span>3</span><p><b>Reward</b>Free days land on the referrer automatically, logged in audit.</p></div>
        </div>
        <button class="btn btn--primary" data-act="referral" type="button" style="width:100%;justify-content:center;margin-top:14px">${icon('sparkle')}Create a referral link</button>
      </section>
    </div>

    <section class="card ref-activity">
      <div class="card__head">
        <h2>Referral activity</h2>
        <span class="pill pill--outline">audited</span>
      </div>
      ${f.events.slice(0, 6).map(e => `<div class="ref-act">
        <span class="ref-act__ic">${icon(e.title.indexOf('earned') >= 0 ? 'gift' : 'send')}</span>
        <span class="ref-act__body"><span class="ref-act__t">${esc(e.title)}</span><span class="ref-act__s">${esc(e.detail)}</span></span>
        <time>${eventToday(e) ? fmtTime(e.ts) : fmtDay(e.ts)}</time>
      </div>`).join('') || `<div class="empty" style="padding:20px 0"><p>Referral invites and rewards will appear here.</p></div>`}
    </section>`;
  }

  /* ============================================================
     AUTOMATION RULES + ACTION CENTER
     ============================================================ */
  const RULES = [
    { key: 'reminders', icon: 'bell', title: 'Expiry reminder ladder', desc: '7, 3 and 1 day before expiry. Falls back to a call list.', run: false },
    { key: 'paymentChase', icon: 'cash', title: 'Payment chase', desc: 'Follows up unpaid balances after 3 days until they clear.', run: true, label: 'Chase now' },
    { key: 'churnNudge', icon: 'target', title: 'Silent-churn nudge', desc: 'Drafts a personal win-back for members who stop visiting.', run: true, label: 'Draft nudges' },
    { key: 'winback30', icon: 'sparkle', title: '30-day win-back', desc: 'Sweeps expired memberships into one campaign.', run: true, label: 'Draft campaign' },
    { key: 'referralAuto', icon: 'gift', title: 'Referral rewards auto-apply', desc: 'Free days land on the referrer the moment a friend joins.', run: false },
    { key: 'digest', icon: 'message', title: '9 pm owner digest', desc: 'Collections, expiries, risk and unpaid balances on WhatsApp.', run: true, label: 'Copy digest' }
  ];
  function ruleOn(key) {
    return !!(S.settings.rules && S.settings.rules[key]);
  }
  function rulesOnCount() {
    return RULES.filter(r => ruleOn(r.key)).length;
  }
  function ruleDef(key) {
    return RULES.find(r => r.key === key) || RULES[0];
  }
  function taskState() {
    const day = todayISO();
    if (!S.tasks[day]) S.tasks[day] = {};
    return S.tasks[day];
  }
  function taskDone(id) {
    return !!taskState()[id];
  }
  function actionTasks() {
    const unpaidList = S.members.filter(m => m.pay !== 'paid' && !m.frozen);
    const unpaidAmt = unpaidList.reduce((s, m) => s + (m.balance || planOf(m).price), 0);
    const radar = riskRadar().filter(x => ['active', 'expiring'].includes(statusOf(x.m)));
    const expiring = S.members.filter(m => statusOf(m) === 'expiring');
    const requests = freezeRequests();
    const coldRef = S.members.filter(m => (m.refInvites || 0) > 0 && (m.refJoins || 0) === 0);
    const tasks = [];
    if (unpaidList.length) tasks.push({
      id: 'pay', tone: 'bad', icon: 'cash',
      title: `Chase ${inr(unpaidAmt)} in unpaid balances`,
      sub: `${unpaidList.length} member${unpaidList.length === 1 ? '' : 's'} still owe money`,
      label: 'Review'
    });
    if (requests.length) tasks.push({
      id: 'freeze', tone: 'warn', icon: 'snow',
      title: `Approve ${requests.length} freeze request${requests.length === 1 ? '' : 's'}`,
      sub: 'Dates move forward once approved',
      label: 'Review'
    });
    if (expiring.length) tasks.push({
      id: 'expiring', tone: 'warn', icon: 'clock',
      title: `Renew ${expiring.length} membership${expiring.length === 1 ? '' : 's'} ending this week`,
      sub: `${inr(expiring.length * 1500)} of renewals in play`,
      label: 'Review'
    });
    if (radar.length) tasks.push({
      id: 'radar', tone: 'info', icon: 'target',
      title: `Win back ${radar.length} silent churner${radar.length === 1 ? '' : 's'}`,
      sub: 'Scored 30+ on the churn radar',
      label: 'Open radar'
    });
    if (coldRef.length) tasks.push({
      id: 'referral', tone: 'brand', icon: 'gift',
      title: `Nudge ${coldRef.length} referral invite${coldRef.length === 1 ? '' : 's'}`,
      sub: 'Invites sent but no friend has joined yet',
      label: 'Open'
    });
    if (UI.queued) tasks.push({
      id: 'sync', tone: 'warn', icon: 'refresh',
      title: `Sync ${UI.queued} queued check-in${UI.queued === 1 ? '' : 's'}`,
      sub: 'Recorded offline · waiting to reconcile',
      label: 'Sync'
    });
    return tasks;
  }
  function pendingTaskCount() {
    return actionTasks().filter(t => !taskDone(t.id)).length;
  }
  function toggleTask(id) {
    const t = taskState();
    t[id] = !t[id];
    const keys = Object.keys(S.tasks).sort();
    while (keys.length > 10) delete S.tasks[keys.shift()];
    save();
    render();
    toast(t[id] ? 'Task done for today.' : 'Task reopened.', 'ok');
  }
  function jumpTask(id) {
    closeModal();
    if (id === 'pay') { go('dashboard'); UI.filter = 'unpaid'; render(); }
    else if (id === 'freeze') { go('dashboard'); UI.filter = 'requests'; render(); }
    else if (id === 'expiring') { go('dashboard'); UI.filter = 'expiring'; render(); }
    else if (id === 'radar') { go('retention'); return; }
    else if (id === 'referral') { go('referrals'); return; }
    else if (id === 'sync') { go('dashboard'); }
    setTimeout(() => {
      const l = document.querySelector('#memberList');
      if (l) l.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }
  function toggleRule(key, on) {
    S.settings.rules[key] = !!on;
    if (key === 'reminders') S.settings.autoReminders = !!on;
    const r = ruleDef(key);
    pushEvent('automation', `${r.title} ${on ? 'enabled' : 'paused'}`, 'Owner automation rule', { actor: 'Owner' });
    save();
    render();
    toast(`${r.title} ${on ? 'on' : 'paused'}.`, 'ok');
  }
  function chasePayments() {
    const unpaid = S.members.filter(m => m.pay !== 'paid' && !m.frozen);
    if (!unpaid.length) { toast('No unpaid balances to chase.', 'ok'); return; }
    const amt = unpaid.reduce((s, m) => s + (m.balance || planOf(m).price), 0);
    unpaid.forEach(m => { m.chaseAt = todayISO(); });
    pushEvent('automation', 'Payment chase sent', `${unpaid.length} members · ${inr(amt)} outstanding · WhatsApp`, { actor: 'Automation' });
    S.automationLast.paymentChase = new Date().toISOString();
    save();
    closeModal();
    render();
    toast(`Chased ${unpaid.length} member${unpaid.length === 1 ? '' : 's'} for ${inr(amt)}.`, 'ok');
  }
  function runRule(key) {
    const r = ruleDef(key);
    if (!ruleOn(key)) { toast(`Turn ${r.title} on first.`, 'warn'); return; }
    if (key === 'reminders') { runQueue(); return; }
    if (key === 'paymentChase') { chasePayments(); return; }
    if (key === 'churnNudge') {
      const ids = riskRadar().filter(x => ['active', 'expiring'].includes(statusOf(x.m))).slice(0, 8).map(x => x.m.id);
      if (!ids.length) { toast('No silent churners right now.', 'ok'); return; }
      S.automationLast.churnNudge = new Date().toISOString();
      pushEvent('automation', 'Silent-churn nudges drafted', `${ids.length} members · personalised WhatsApp drafts`, { actor: 'Automation' });
      save();
      openModal('campaign', { ids });
      render();
      toast(`${ids.length} personalised nudges drafted.`, 'ok');
      return;
    }
    if (key === 'winback30') {
      const ids = S.members.filter(m => ['expired', 'grace'].includes(statusOf(m))).slice(0, 8).map(m => m.id);
      if (!ids.length) { toast('No lapsed members to win back.', 'ok'); return; }
      S.automationLast.winback30 = new Date().toISOString();
      pushEvent('automation', '30-day win-back campaign drafted', `${ids.length} lapsed memberships · WhatsApp sweep`, { actor: 'Automation' });
      save();
      openModal('campaign', { ids });
      render();
      toast(`${ids.length} lapsed members added to a draft.`, 'ok');
      return;
    }
    if (key === 'digest') {
      const c = counts();
      const collected = S.stats.chart[S.stats.chart.length - 1];
      copyText(`*DoorPass daily digest · Iron Temple*\n${inr(collected)} collected today\n${c.expiring} expiring this week\n${c.risk} at risk of quitting\n${c.unpaid} unpaid or part-paid\n\n${pendingReminders().length} reminders waiting.`, 'Digest copied.');
      S.automationLast.digest = new Date().toISOString();
      pushEvent('automation', 'Owner digest prepared', `${c.expiring} expiring · ${c.risk} at risk · ${c.unpaid} unpaid`, { actor: 'Automation' });
      save();
      render();
      return;
    }
    toast('This rule runs on its own — nothing to trigger.', 'ok');
  }
  function lastRunText(key) {
    const ts = S.automationLast[key];
    if (!ts) return 'not run yet';
    return eventToday({ ts }) ? 'ran ' + fmtTime(ts) : 'ran ' + fmtDay(ts);
  }
  function automationMarkup(rule) {
    const on = ruleOn(rule.key);
    return `<div class="rule-row${on ? '' : ' is-off'}">
      <span class="rule-ico">${icon(rule.icon)}</span>
      <span class="rule-body">
        <span class="rule-t">${rule.title}</span>
        <span class="rule-s">${rule.desc}</span>
        <span class="rule-last">${lastRunText(rule.key)}</span>
      </span>
      <span class="rule-acts">
        ${rule.run ? `<button class="btn btn--xs" data-act="rule-run" data-rule="${rule.key}" type="button" ${on ? '' : 'disabled'}>${rule.label || 'Run now'}</button>` : ''}
        <label class="switch"><input type="checkbox" data-rule="${rule.key}" ${on ? 'checked' : ''} aria-label="${rule.title}"><span class="switch__track"></span></label>
      </span>
    </div>`;
  }
  function renderAutomations() {
    const runs = S.events.filter(e => e.type === 'automation');
    const touched = S.members.filter(m => m.chaseAt || m.campaignAt).length;
    const waiting = pendingTaskCount();
    const tasks = actionTasks();
    return `
    <div class="page-head">
      <div>
        <h1>Automation rules</h1>
        <p>The jobs nobody should have to remember — each one switches on and can be run by hand.</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--sm" data-act="action-center" type="button">${icon('bell')}Action center${waiting ? ` · ${waiting}` : ''}</button>
        <button class="btn btn--sm btn--primary" data-act="referral" type="button">${icon('gift')}Referral link</button>
      </div>
    </div>

    <section class="hero hero--auto" aria-label="Automation coverage">
      ${sparkline(S.stats.chart.slice(-10))}
      <div class="hero__main">
        <div class="hero__k">Automation coverage</div>
        <div class="hero__v" id="autoCoverage">${Math.round((rulesOnCount() / RULES.length) * 100)}%</div>
        <div class="hero__delta">${icon('zap')}<span id="autoRulesOn">${rulesOnCount()}</span> of ${RULES.length} rules on · <span id="autoRuns">${runs.length}</span> runs logged</div>
      </div>
      <div class="hero__atrisk">
        <span>Manual work left</span>
        <b id="autoWaiting">${waiting}</b>
      </div>
    </section>

    <div class="kpis">
      <div class="kpi">
        <span class="kpi__k">${icon('zap')}Rules live</span>
        <span class="kpi__v" id="kpiRules">${rulesOnCount()} / ${RULES.length}</span>
        <span class="kpi__sub">every rule is reversible</span>
      </div>
      <div class="kpi">
        <span class="kpi__k">${icon('activity')}Runs logged</span>
        <span class="kpi__v" id="kpiRuns">${runs.length}</span>
        <span class="kpi__sub">this month · audited</span>
      </div>
      <div class="kpi kpi--good">
        <span class="kpi__k">${icon('users')}Members auto-touched</span>
        <span class="kpi__v" id="kpiTouched">${touched}</span>
        <span class="kpi__sub">chased or campaigned</span>
      </div>
      <button class="kpi kpi--alert" data-act="action-center" type="button">
        <span class="kpi__k">${icon('bell')}Tasks waiting</span>
        <span class="kpi__v" id="kpiWaiting">${waiting}</span>
        <span class="kpi__sub">${tasks.length - waiting} done today</span>
      </button>
    </div>

    <div class="auto-grid">
      <section class="card auto-rules">
        <div class="card__head">
          <h2>Rules</h2>
          <span class="pill pill--outline">owner controls</span>
          <span class="mut" style="margin-left:auto">Run now = do it once, immediately</span>
        </div>
        ${RULES.map(automationMarkup).join('')}
      </section>

      <div class="auto-side">
        <section class="card action-peek">
          <div class="card__head">
            <h2>Today’s action center</h2>
            <span class="pill pill--brand">${waiting ? waiting + ' open' : 'clear'}</span>
          </div>
          <div class="progress"><i style="width:${tasks.length ? Math.round(((tasks.length - waiting) / tasks.length) * 100) : 100}%"></i></div>
          <div class="progress__meta"><span>${tasks.length - waiting} of ${tasks.length} done</span><span>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></div>
          ${tasks.length ? tasks.slice(0, 3).map(t => `<div class="peek-task${taskDone(t.id) ? ' is-done' : ''}">${icon(t.icon)}<span>${t.title}</span></div>`).join('') : `<p class="mut" style="padding:8px 0">Nothing on the list. The gym runs itself.</p>`}
          <button class="btn btn--primary" data-act="action-center" type="button" style="width:100%;justify-content:center;margin-top:12px">${icon('checkCircle')}Open action center</button>
        </section>

        <section class="card reports-card">
          <div class="card__head">
            <h2>Reports</h2>
            <span class="pill pill--outline">CSV</span>
          </div>
          <button class="report-row" data-act="export-csv" type="button">${icon('download')}<span><b>Members</b><em>Plans, balances, expiry</em></span></button>
          <button class="report-row" data-act="audit-export" type="button">${icon('shield')}<span><b>Audit log</b><em>Every door and payment event</em></span></button>
          <button class="report-row" data-act="export-referrals" type="button">${icon('gift')}<span><b>Referrals</b><em>Codes, invites, joins, rewards</em></span></button>
          <button class="report-row" data-act="export-backup" type="button">${icon('save')}<span><b>Full backup</b><em>JSON restore point</em></span></button>
        </section>
      </div>
    </div>

    <section class="card auto-log">
      <div class="card__head">
        <h2>Automation activity</h2>
        <span class="pill pill--outline">audited</span>
        <button class="btn btn--xs btn--ghost" data-act="audit-automation" type="button" style="margin-left:auto">${icon('shield')}Open audit log</button>
      </div>
      ${runs.slice(0, 6).map(e => `<div class="ref-act">
        <span class="ref-act__ic">${icon('zap')}</span>
        <span class="ref-act__body"><span class="ref-act__t">${esc(e.title)}</span><span class="ref-act__s">${esc(e.detail)}</span></span>
        <time>${eventToday(e) ? fmtTime(e.ts) : fmtDay(e.ts)}</time>
      </div>`).join('') || `<div class="empty" style="padding:20px 0"><p>No automation runs yet. Use “Run now” on any rule.</p></div>`}
    </section>`;
  }

  function actionCenterMarkup() {
    const tasks = actionTasks();
    const done = tasks.filter(t => taskDone(t.id)).length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 100;
    return `<div class="action-center">
      <div class="progress progress--lg"><i style="width:${pct}%"></i></div>
      <div class="progress__meta"><span>${done} of ${tasks.length} done today</span><span>${tasks.length - done} left</span></div>
      <div class="tasks">
        ${tasks.map(t => `<div class="task${taskDone(t.id) ? ' is-done' : ''}">
          <button class="task__check" type="button" data-act="task-toggle" data-task="${t.id}" aria-label="Mark ${esc(t.title)} done" aria-pressed="${taskDone(t.id)}">${icon('check')}</button>
          <span class="task__body"><b>${esc(t.title)}</b><em>${esc(t.sub)}</em></span>
          <button class="btn btn--xs" type="button" data-act="task-jump" data-task="${t.id}">${t.label}</button>
        </div>`).join('') || `<div class="empty" style="padding:18px 0"><h3>All clear</h3><p>Nothing needs the desk right now.</p></div>`}
      </div>
      <div class="shift">
        <div class="shift__head">
          <span class="camp-preview__k">${icon('message')}Shift handover</span>
          <span class="mut" style="font-size:9.5px">Saved for the next shift</span>
        </div>
        <textarea class="input" id="shiftNote" rows="3" placeholder="Cash counted, gate 2 fob left at the desk, Rahul promised payment Friday…">${esc(S.shiftNote)}</textarea>
        <div class="shift__acts">
          <button class="btn btn--xs" data-act="save-shift" type="button">${icon('save')}Save note</button>
          <button class="btn btn--xs btn--ghost" data-act="copy-shift" type="button">${icon('copy')}Copy handover</button>
        </div>
      </div>
    </div>`;
  }

  /* ============================================================
     PEAK-HOUR HEATMAP (dashboard)
     ============================================================ */
  const HEAT_SLOTS = [6, 8, 10, 12, 14, 16, 18, 20];
  const slotLabel = h => (h < 12 ? h + 'a' : h === 12 ? '12p' : (h - 12) + 'p');
  function hashNum(n) {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }
  function heatData() {
    const baseVisits = S.members.reduce((s, m) => s + (m.visits || 0), 0);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(TODAY, -i);
      const wk = d.getDay() === 0 || d.getDay() === 6;
      const cells = HEAT_SLOTS.map(h => {
        const start = new Date(d);
        start.setHours(h, 0, 0, 0);
        const end = new Date(start.getTime() + 2 * 3600e3);
        const real = S.events.filter(e => e.type === 'entry' && new Date(e.ts) >= start && new Date(e.ts) < end).length;
        const shape = h === 6 ? 0.55 : h === 8 ? 0.8 : h === 10 ? 0.45 : h === 12 ? 0.35 : h === 14 ? 0.3 : h === 16 ? 0.55 : h === 18 ? 1 : 0.85;
        const jitter = 0.72 + hashNum(d.getDate() * 31 + h * 7 + (wk ? 97 : 0)) * 0.6;
        const modelled = Math.round((baseVisits / 90) * shape * jitter * (wk ? 1.18 : 1));
        return { h, n: modelled + real, real };
      });
      days.push({ date: d, key: toISO(d), label: d.toLocaleDateString('en-IN', { weekday: 'short' }), cells });
    }
    const flat = days.flatMap(day => day.cells.map(c => ({ ...c, day })));
    const max = Math.max(1, ...flat.map(c => c.n));
    const peak = flat.reduce((a, b) => (b.n > a.n ? b : a), flat[0]);
    const total = flat.reduce((s, c) => s + c.n, 0);
    return { days, max, peak, total };
  }
  function heatInsight() {
    const data = heatData();
    if (UI.heatCell) {
      const day = data.days.find(d => d.key === UI.heatCell.d);
      const cell = day && day.cells.find(c => c.h === UI.heatCell.h);
      if (day && cell) {
        return {
          text: `${day.date.toLocaleDateString('en-IN', { weekday: 'long' })} · ${slotLabel(cell.h)}–${slotLabel(cell.h + 2)} · ${cell.n} check-ins`,
          sub: 'This slot is modelled from 14 days of demo check-ins.',
          cell
        };
      }
    }
    return {
      text: `Busiest window: ${data.peak.day.label} ${slotLabel(data.peak.h)}–${slotLabel(data.peak.h + 2)} · ${data.peak.n} check-ins`,
      sub: `Staff one extra coach from ${slotLabel(data.peak.h)}. ${data.total} check-ins across the last 7 days.`,
      cell: null
    };
  }
  function heatMarkup() {
    const data = heatData();
    const ins = heatInsight();
    return `<section class="card heat-card" aria-label="Peak-hour heatmap">
      <div class="card__head">
        <h2>Peak-hour heatmap</h2>
        <span class="pill pill--outline">last 7 days</span>
        <span class="mut" style="margin-left:auto">check-ins per 2-hour slot</span>
      </div>
      <div class="heat" role="grid" aria-label="Check-ins by day and time">
        <span class="heat__h"></span>
        ${HEAT_SLOTS.map(h => `<span class="heat__h">${slotLabel(h)}</span>`).join('')}
        ${data.days.map(day => `<span class="heat__d">${day.label}</span>` + day.cells.map(c => {
          const sel = UI.heatCell && UI.heatCell.d === day.key && UI.heatCell.h === c.h;
          return `<button class="heat__c${sel ? ' is-sel' : ''}${c.n === data.max ? ' is-peak' : ''}" type="button" data-act="heat-cell" data-d="${day.key}" data-h="${c.h}" style="--i:${(c.n / data.max).toFixed(2)}" aria-label="${day.label} ${slotLabel(c.h)} ${c.n} check-ins">${c.n}</button>`;
        }).join('')).join('')}
      </div>
      <div class="heat__foot">
        <span id="heatDetail"><b>${esc(ins.text)}</b><em>${esc(ins.sub)}</em></span>
        ${UI.heatCell ? `<button class="btn btn--xs" data-act="heat-clear" type="button">Show peak</button>` : ''}
      </div>
    </section>`;
  }

  function renderDashboard() {
    const c = counts();
    const pending = pendingReminders();
    const requests = freezeRequests();
    const risk = riskValue();
    const collected = S.stats.chart[S.stats.chart.length - 1];
    const growth = S.stats.recoveredPrev ? Math.round(((S.stats.recovered - S.stats.recoveredPrev) / S.stats.recoveredPrev) * 100) : 0;
    const rows = filteredMembers();
    const filters = [
      ['all', 'All', S.members.length],
      ['expiring', 'Expiring', c.expiring],
      ['expired', 'Expired', c.expiredCombined],
      ['unpaid', 'Payment issue', c.unpaid],
      ['risk', 'At risk', c.risk],
      ['requests', 'Freeze requests', c.requests]
    ];
    const digest = `*DoorPass daily digest · Iron Temple*\n${inr(collected)} collected today\n${c.expiring} expiring this week\n${c.risk} at risk of quitting\n${c.unpaid} unpaid or part-paid\n\n${pending.length} reminders waiting. Reply OPEN to see the list.`;

    return `
    <div class="page-head">
      <div>
        <h1>Recovery dashboard</h1>
        <p>Money already collected, money still at risk, and the one action that fixes it.</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--sm" data-act="scan" type="button">${icon('camera')}Scan QR</button>
        <button class="btn btn--sm" data-act="kiosk" type="button">${icon('qr')}Kiosk</button>
        <button class="btn btn--sm" data-act="export-csv" type="button">${icon('download')}Export CSV</button>
        <button class="btn btn--sm btn--primary" data-act="add-member" type="button">${icon('plus')}Add member</button>
      </div>
    </div>

    ${requests.length ? `<div class="banner" style="margin:0 0 16px">
      ${icon('snow')}<span><strong>${requests.length} freeze request${requests.length === 1 ? '' : 's'} waiting.</strong> Approve, decline or open the member to see the details.</span>
      <button class="btn btn--xs" data-act="view-requests" type="button">Review requests</button>
    </div>` : ''}

    <section class="hero" aria-label="Recovered revenue">
      ${sparkline(S.stats.chart.slice(-10))}
      <div class="hero__main">
        <div class="hero__k">Recovered at the door this month</div>
        <div class="hero__v">${inr(S.stats.recovered)}</div>
        <div class="hero__delta">${icon('trend')}${growth >= 0 ? '+' : ''}${growth}% vs last month · ${inr(collected)} today</div>
      </div>
      <div class="hero__atrisk">
        <span>Still at risk this week</span>
        <b>${inr(risk)}</b>
      </div>
    </section>

    <div class="kpis">
      <div class="kpi">
        <span class="kpi__k">${icon('cash')}Collected today</span>
        <span class="kpi__v">${inr(collected)}</span>
        <span class="kpi__sub">${todayCounts().entries} check-ins · ${todayCounts().blocks} blocked</span>
      </div>
      <button class="kpi" data-act="kpi" data-v="expiring" type="button">
        <span class="kpi__k">${icon('clock')}Expiring this week</span>
        <span class="kpi__v">${c.expiring}</span>
        <span class="kpi__sub">${inr(c.expiring * 1500)} at stake</span>
      </button>
      <button class="kpi kpi--alert" data-act="kpi" data-v="expired" type="button">
        <span class="kpi__k">${icon('alert')}Expired / grace</span>
        <span class="kpi__v">${c.expiredCombined}</span>
        <span class="kpi__sub">${c.grace} in grace today</span>
      </button>
      <button class="kpi" data-act="kpi" data-v="risk" type="button">
        <span class="kpi__k">${icon('trend')}At risk of quitting</span>
        <span class="kpi__v">${c.risk}</span>
        <span class="kpi__sub">10+ days without a visit</span>
      </button>
    </div>

    <div class="dash-grid">
      <section class="card chart-card">
        <div class="chart-head">
          <div>
            <h2>Collections</h2>
            <div class="mut">Cash + UPI recorded at the door and in the app</div>
          </div>
          <div class="seg chart-toggle" role="group" aria-label="Chart range">
            <button type="button" data-act="chart-range" data-v="7" class="${UI.chartRange === 7 ? 'is-on' : ''}">7 days</button>
            <button type="button" data-act="chart-range" data-v="14" class="${UI.chartRange === 14 ? 'is-on' : ''}">14 days</button>
          </div>
        </div>
        ${chartMarkup()}
      </section>

      <section class="card digest">
        <div class="card__head">
          <h2>Tonight’s 9 pm digest</h2>
          <span class="pill pill--brand">WhatsApp</span>
        </div>
        <div class="digest-bubble">${esc(digest)}</div>
        <div class="digest-foot">
          <span class="mut">Sent to the owner every night.</span>
          <button class="btn btn--xs btn--ghost" data-act="copy-digest" type="button" style="margin-left:auto">${icon('copy')}Copy</button>
        </div>
      </section>
    </div>

    <div class="dash-grid">
      <section class="card queue">
        <div class="card__head">
          <h2>Reminder queue</h2>
          <span class="pill pill--outline">7 · 3 · 1 day</span>
          <button class="btn btn--sm ${pending.length && S.settings.autoReminders ? 'btn--primary' : ''}" data-act="run-queue" type="button" style="margin-left:auto" ${!pending.length || UI.queueBusy || !S.settings.autoReminders ? 'disabled' : ''}>
            ${icon(UI.queueBusy ? 'refresh' : 'send')}${UI.queueBusy ? 'Sending…' : !S.settings.autoReminders ? 'Auto paused' : pending.length ? 'Run queue (' + pending.length + ')' : 'All caught up'}
          </button>
        </div>
        ${pending.slice(0, 4).map(m => `<div class="queue__row">
          <span class="queue__badge${reminderKey(m) === 1 ? ' queue__badge--now' : ''}">${reminderKey(m)}d</span>
          <span class="queue__body">
            <span class="queue__t">${esc(m.name)}</span>
            <span class="queue__s">Ends ${fmtDate(m.end)} · ${m.phone}</span>
          </span>
          <span class="queue__cost">₹${WA_COST.toFixed(2)}</span>
        </div>`).join('') || `<div class="empty" style="padding:22px 0"><p>No reminders due. The next queue runs itself at 9 am.</p></div>`}
        <div class="stage-foot" style="margin-top:10px;padding-top:10px">
          <span>${pending.length} pending</span>
          <span class="mut">est. ${inr(pending.length * WA_COST)} WhatsApp cost</span>
          <span class="mut" style="margin-left:auto">Opt-outs excluded</span>
        </div>
      </section>

      <section class="card auto-card">
        <div class="card__head">
          <h2>Automation</h2>
          <span class="pill pill--outline">Owner settings</span>
        </div>
        <div class="setting-row">
          <div class="setting-row__body">
            <div class="setting-row__t">Smart renewal offer</div>
            <div class="setting-row__s">Add free days on longer plans, at the door and in the app.</div>
          </div>
          <label class="switch"><input type="checkbox" id="setOffer" ${S.settings.offer ? 'checked' : ''} aria-label="Smart renewal offer"><span class="switch__track"></span></label>
        </div>
        ${S.settings.offer ? `<div class="setting-row">
          <div class="setting-row__body"><div class="setting-row__t">Free days on 3, 6 and 12 months</div></div>
          <select class="select" id="setOfferDays" aria-label="Free days">
            ${[3, 5, 7, 10].map(n => `<option value="${n}" ${S.settings.offerDays === n ? 'selected' : ''}>+${n} days</option>`).join('')}
          </select>
        </div>` : ''}
        <div class="setting-row">
          <div class="setting-row__body">
            <div class="setting-row__t">Auto reminders</div>
            <div class="setting-row__s">7, 3 and 1 day before expiry. Falls back to a call list.</div>
          </div>
          <label class="switch"><input type="checkbox" id="setAuto" ${S.settings.autoReminders ? 'checked' : ''} aria-label="Automatic reminders"><span class="switch__track"></span></label>
        </div>
        <div class="setting-row">
          <div class="setting-row__body">
            <div class="setting-row__t">Grace period</div>
            <div class="setting-row__s">Amber instead of red at the door.</div>
          </div>
          <select class="select" id="setGrace" aria-label="Grace days">
            ${[0, 1, 2, 3, 5, 7].map(n => `<option value="${n}" ${S.settings.graceDays === n ? 'selected' : ''}>${n} day${n === 1 ? '' : 's'}</option>`).join('')}
          </select>
        </div>
        <div class="setting-row">
          <div class="setting-row__body">
            <div class="setting-row__t">Fail open when offline</div>
            <div class="setting-row__s">Never block a paying member because the internet died.</div>
          </div>
          <label class="switch"><input type="checkbox" id="setFailOpen" ${S.settings.failOpen ? 'checked' : ''} aria-label="Fail open when offline"><span class="switch__track"></span></label>
        </div>
        <div class="setting-row">
          <div class="setting-row__body">
            <div class="setting-row__t">Reminder language</div>
            <div class="setting-row__s">Template used for WhatsApp reminders.</div>
          </div>
          <select class="select" id="setLang" aria-label="Reminder language">
            <option value="en" ${S.settings.language === 'en' ? 'selected' : ''}>English</option>
            <option value="ta" ${S.settings.language === 'ta' ? 'selected' : ''}>தமிழ்</option>
            <option value="hi" ${S.settings.language === 'hi' ? 'selected' : ''}>हिन्दी</option>
          </select>
        </div>
      </section>
    </div>

    ${heatMarkup()}

    <section class="card list-card" id="memberList">
      <div class="list-head">
        <h2>Members <span class="mut" style="font-weight:500">(${rows.length})</span></h2>
        <div class="list-tools">
          <div class="search">
            ${icon('search')}
            <input class="input" id="listSearch" type="search" placeholder="Search name or phone" value="${esc(UI.search)}" aria-label="Search members">
          </div>
          <select class="select" id="sortSelect" aria-label="Sort members" style="width:auto;min-height:34px;font-size:12px">
            <option value="end" ${UI.sort === 'end' ? 'selected' : ''}>Ending soon</option>
            <option value="name" ${UI.sort === 'name' ? 'selected' : ''}>Name A–Z</option>
            <option value="status" ${UI.sort === 'status' ? 'selected' : ''}>Status</option>
          </select>
        </div>
      </div>
      <div class="list-filters">
        ${filters.map(([k, label, n]) => `<button class="chip${UI.filter === k ? ' is-on' : ''}" data-act="list-filter" data-v="${k}" type="button">${label}<span class="chip__n">${n}</span></button>`).join('')}
      </div>
      <div class="mtable" role="table" aria-label="Members">
        <div class="mtable__head" role="row">
          <span role="columnheader">Member</span><span role="columnheader">Plan</span><span role="columnheader">Ends</span><span role="columnheader">Status</span><span role="columnheader">Payment</span><span role="columnheader" style="text-align:right">Actions</span>
        </div>
        ${rows.map(m => `<div class="mtable__row" role="row" tabindex="0" data-act="open-member" data-id="${m.id}" aria-label="Open ${esc(m.name)}">
          <div class="mtable__name" role="cell">
            <span class="avatar" style="--h:${m.hue}">${initials(m.name)}</span>
            <span style="min-width:0">
              <span class="mtable__n">${esc(m.name)}</span>
              <span class="mtable__p">#${m.id} · ${m.phone}</span>
            </span>
          </div>
          <div class="mcell mcell--plan" role="cell"><b>${planOf(m).label}</b><div style="font-size:10px">${inr(planOf(m).price)}</div></div>
          <div class="mcell mcell--ends" role="cell">${fmtDate(m.end)}<div style="font-size:10px">${daysUntil(m.end) >= 0 ? daysUntil(m.end) + 'd left' : -daysUntil(m.end) + 'd ago'}</div></div>
          <div class="mcell mcell--status" role="cell">${statusPill(m)}</div>
          <div class="mcell mcell--pay" role="cell">${payPill(m)}${m.balance ? `<div style="font-size:10px">${inr(m.balance)} due</div>` : ''}</div>
          <div class="mtable__actions" role="cell">
            <button class="icon-btn" type="button" data-act="wa-member" data-id="${m.id}" title="WhatsApp reminder" aria-label="WhatsApp ${esc(m.name)}">${icon('whatsapp')}</button>
            <button class="btn" type="button" data-act="renew-member" data-id="${m.id}">Renew</button>
            <button class="icon-btn" type="button" data-act="open-member" data-id="${m.id}" title="Member details" aria-label="Open ${esc(m.name)}">${icon('more')}</button>
          </div>
        </div>`).join('') || `<div class="empty">
          <h3>Nobody in this filter</h3>
          <p>Try another filter or clear the search.</p>
          <button class="btn btn--sm" data-act="clear-list-filter" type="button" style="margin-top:10px">Show all members</button>
        </div>`}
      </div>
    </section>`;
  }

  /* ============================================================
     MEMBER APP
     ============================================================ */
  function renderMember() {
    const m = memberById(UI.memberId) || S.members[0];
    if (!m) return '<div class="empty">No members yet.</div>';
    UI.memberId = m.id;
    const st = statusOf(m);
    const d = daysUntil(m.end);
    const meta = STATUS[st];
    const denom = Math.max(1, planOf(m).months * 30);
    const frac = m.frozen ? 0 : clamp(d / denom, 0, 1);
    const C = 2 * Math.PI * 36;
    const off = C * (1 - frac);
    const canFreeze = !['expired', 'grace'].includes(st);
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return `
    <div class="page-head">
      <div>
        <h1>Member app</h1>
        <p>The member never installs anything. A WhatsApp link opens this page, offline-cached after the first visit.</p>
      </div>
      <div class="page-head__actions">
        <span class="pill pill--outline">${icon('lock')}Signed · rotating · single-use</span>
      </div>
    </div>

    <div class="preview-tools">
      <span class="mut">Preview as</span>
      <select class="select" id="previewSelect" aria-label="Preview member">
        ${S.members.map(x => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${esc(x.name)}${statusOf(x) === 'expired' ? ' (expired)' : ''}</option>`).join('')}
      </select>
      <span class="mut" style="display:flex;align-items:center;gap:5px">${icon('refresh')}Token rotates every 30 seconds</span>
    </div>

    <div class="member-layout">
      <div>
        <div class="phone">
          <div class="phone__screen">
            <div class="phone__notch" aria-hidden="true"></div>
            <div class="phone__status" aria-hidden="true">
              <span>${now}</span>
              <span class="icons"><span>◗</span><i></i><i></i></span>
            </div>
            <div class="phone__body">
              <div class="member-top">
                <span class="avatar avatar--sm" style="--h:150">IT</span>
                <span>
                  <span class="member-top__gym">Iron Temple · Anna Nagar</span>
                  <span class="member-top__sub">Anna Nagar · Chennai</span>
                </span>
                <button class="icon-btn" type="button" data-act="member-notices" aria-label="Notices">${icon('bell')}<span class="dot"></span></button>
              </div>

              <div class="member-hero">
                <div class="member-hero__top">
                  <div>
                    <div class="member-hero__k">Member</div>
                    <div class="member-hero__name">${esc(m.name)}</div>
                    <div class="member-hero__id">#${String(m.id).padStart(4, '0')} · ${planOf(m).label}</div>
                  </div>
                  <div class="member-hero__ring">
                    <svg viewBox="0 0 86 86" aria-hidden="true">
                      <circle class="bg" cx="43" cy="43" r="36" fill="none" stroke-width="5"/>
                      <circle class="fg" cx="43" cy="43" r="36" fill="none" stroke-width="5" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
                    </svg>
                    <div class="txt">
                      <b>${m.frozen ? '❄' : Math.abs(d)}</b>
                      <span>${m.frozen ? 'frozen' : d >= 0 ? 'days left' : 'days over'}</span>
                    </div>
                  </div>
                </div>
                <div class="member-hero__foot">
                  <span class="pill pill--${meta.pill}">${meta.label}</span>
                  <span class="pill">${d >= 0 ? 'Ends' : 'Ended'} ${fmtDate(m.end)}</span>
                  ${m.pay !== 'paid' ? `<span class="pill pill--bad">${m.balance ? inr(m.balance) + ' due' : 'Payment due'}</span>` : ''}
                </div>
              </div>

              <div class="qr-card">
                <div class="qr-box" id="qrLive" aria-label="Rotating entry QR">${qrMarkup(m)}</div>
                <div class="qr-bar"><i id="qrBar" style="width:100%"></i></div>
                <div class="qr-meta"><span>Refreshes in <b id="qrSec">30</b>s</span><span class="mono" id="qrTok">#${tokenRef(m, Math.floor(Date.now() / 30000))}</span></div>
                <p class="qr-hint">Signed, single-use and cached for offline entry.</p>
              </div>

              <div class="member-actions">
                <button type="button" data-act="member-renew">${icon('card')}${['active', 'expiring'].includes(st) ? 'Renew early' : 'Renew now'}</button>
                <button type="button" data-act="member-freeze" ${m.freezeRequest || !canFreeze ? 'disabled' : ''}>${icon('snow')}${m.freezeRequest ? 'Request pending' : !canFreeze ? 'Renew to freeze' : m.frozen ? 'Request unfreeze' : 'Freeze'}</button>
                <button type="button" data-act="scroll-history">${icon('receipt')}Receipts</button>
              </div>

              ${m.freezeRequest ? `<div class="banner" style="margin-top:12px">
                ${icon('snow')}<span><strong>${m.freezeRequest.action === 'unfreeze' ? 'Unfreeze' : 'Freeze'} requested.</strong> The owner needs to approve. ${m.frozen ? 'Access stays blocked until then.' : 'Dates will move forward if approved.'}</span>
                <button class="btn btn--xs btn--ghost" data-act="member-freeze-cancel" type="button">Cancel</button>
              </div>` : ''}
              ${m.frozen ? `<div class="banner" style="margin-top:12px;background:var(--surface-2);color:var(--ink-2);border-color:var(--line)">
                ${icon('info')}<span><strong>Frozen${m.frozenUntil ? ' until ' + fmtDate(m.frozenUntil) : ''}.</strong> Your end date already includes the pause. Ask the owner to unfreeze when you return.</span>
              </div>` : ''}

              ${UI.memberRenew.open ? `<div class="sheet">${renewPanel(m, UI.memberRenew, {
                acts: { plan: 'member-plan', method: 'member-method', pay: 'member-pay' },
                allowPass: false,
                offline: false
              })}</div>` : ''}

              <div class="member-section member-section--pay">
                <div class="member-section__head"><h3>Payments &amp; receipts</h3><span>GST ready</span></div>
                ${m.history.slice(0, 4).map(h => `<div class="hist">
                  <span class="hist__ic">${icon(h.method === 'Cash' ? 'cash' : 'card')}</span>
                  <span class="hist__body">
                    <span class="hist__t">${h.plan ? (h.plan + ' month plan') : 'Day pass'}</span>
                    <span class="hist__s">${fmtDate(h.date)} · ${h.method} · ${h.id}</span>
                  </span>
                  <span class="hist__a">${inr(h.amount)}</span>
                  <button type="button" data-act="receipt" data-id="${m.id}" data-pid="${h.id}">Receipt</button>
                </div>`).join('')}
              </div>

              <div class="member-section">
                <div class="member-section__head"><h3>Notices</h3><span>2 new</span></div>
                <div class="notice">${icon('zap')}<span><span class="notice__t">Zumba · Saturday 7:00 am</span><span class="notice__s">Studio 2 · bring a mat</span></span></div>
                <div class="notice">${icon('sparkle')}<span><span class="notice__t">Renew 3 months, get ${S.settings.offerDays} days free</span><span class="notice__s">Automatically added at renewal</span></span></div>
              </div>
            </div>
          </div>
        </div>
        <p class="phone-caption">Preview only. The real page opens from a WhatsApp link and needs no install.</p>
      </div>

      <div class="side-notes">
        <section class="card note-card">
          <h3>Why a screenshot won’t get anyone in</h3>
          <p>The QR is a signed token, not a static picture.</p>
          <ul>
            <li>${icon('checkCircle')}<span>Rotates every 30 seconds and expires server-side.</span></li>
            <li>${icon('checkCircle')}<span>One-time use: the desk consumes the nonce.</span></li>
            <li>${icon('checkCircle')}<span>The staff screen shows the member’s photo for a face check.</span></li>
            <li>${icon('checkCircle')}<span>Every manual release needs the owner PIN and a reason.</span></li>
          </ul>
        </section>
        <section class="card note-card">
          <h3>What the member gets</h3>
          <ul>
            <li>${icon('checkCircle')}<span>No app install. A WhatsApp link, cached for offline use.</span></li>
            <li>${icon('checkCircle')}<span>UPI or cash at the desk. Day passes for guests.</span></li>
            <li>${icon('checkCircle')}<span>GST receipts on WhatsApp, not a paper book.</span></li>
            <li>${icon('checkCircle')}<span>Freeze requests and a clear renewal date.</span></li>
          </ul>
        </section>
        <section class="card note-card">
          <h3>What the owner sees</h3>
          <ul>
            <li>${icon('checkCircle')}<span>₹${S.stats.recovered.toLocaleString('en-IN')} recovered this month, with proof.</span></li>
            <li>${icon('checkCircle')}<span>${pendingReminders().length} reminders queued and their message cost.</span></li>
            <li>${icon('checkCircle')}<span>Every override, check-in and payment in one audit trail.</span></li>
          </ul>
          <button class="btn btn--sm" data-act="nav" data-view="dashboard" type="button" style="margin-top:12px">${icon('arrowRight')}Open dashboard</button>
        </section>
      </div>
    </div>`;
  }

  /* ============================================================
     AUDIT
     ============================================================ */
  function renderAudit() {
    const types = [
      ['all', 'All'],
      ['entry', 'Check-ins'],
      ['block', 'Blocked'],
      ['payment', 'Payments'],
      ['override', 'Overrides'],
      ['reminder', 'Reminders'],
      ['campaign', 'Win-backs'],
      ['referral', 'Referrals'],
      ['automation', 'Automations'],
      ['member', 'Members'],
      ['settings', 'Settings']
    ];
    const meta = {
      entry: ['Check-in', 'ok'], block: ['Blocked', 'bad'], payment: ['Payment', 'brand'],
      override: ['Override', 'warn'], reminder: ['Reminder', 'info'], settings: ['Settings', 'outline'], member: ['Member', 'brand'],
      campaign: ['Win-back', 'brand'], referral: ['Referral', 'brand'], automation: ['Automation', 'brand']
    };
    const rows = S.events.filter(e => UI.auditFilter === 'all' || e.type === UI.auditFilter);
    const overrides = S.events.filter(e => e.type === 'override').length;
    const blocks = S.events.filter(e => e.type === 'block').length;
    const reminders = S.events.filter(e => e.type === 'reminder').length;
    const payments = S.events.filter(e => e.type === 'payment').length;

    const posture = [
      ['lock', 'Rotating signed token', '30-second window, HMAC-verified server-side, single-use nonce.'],
      ['key', 'Owner PIN for overrides', 'Demo PIN 2468. Every release stores a reason, actor and timestamp.'],
      ['shield', 'Full audit trail', 'Check-ins, blocks, payments, reminders and settings are append-only.'],
      ['server', 'Idempotent payment webhooks', 'Pending → paid, keyed by gateway reference, so a double tap cannot double-extend.'],
      ['branch', 'Per-gym isolation', 'Every table carries gym_id. No query crosses a tenant boundary.'],
      ['wifiOff', 'Offline fail-open', 'Cached member list, cash-only, queued sync, reconcile later.']
    ];

    return `
    <div class="page-head">
      <div>
        <h1>Audit log &amp; security</h1>
        <p>Every exception has a name, a reason and a timestamp. This is the part a copied screen cannot fake.</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--sm" data-act="audit-export" type="button">${icon('download')}Export log</button>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi"><span class="kpi__k">${icon('key')}Overrides</span><span class="kpi__v">${overrides}</span><span class="kpi__sub">all time · PIN verified</span></div>
      <div class="kpi"><span class="kpi__k">${icon('x')}Blocked attempts</span><span class="kpi__v">${blocks}</span><span class="kpi__sub">expired or frozen</span></div>
      <div class="kpi"><span class="kpi__k">${icon('send')}Reminder batches</span><span class="kpi__v">${reminders}</span><span class="kpi__sub">WhatsApp + fallback list</span></div>
      <div class="kpi"><span class="kpi__k">${icon('cash')}Payments logged</span><span class="kpi__v">${payments}</span><span class="kpi__sub">cash, UPI and part-pay</span></div>
    </div>

    <div class="audit-grid">
      <section class="card list-card">
        <div class="list-head"><h2>Event stream</h2><span class="mut">${rows.length} events</span></div>
        <div class="list-filters">
          ${types.map(([k, label]) => `<button class="chip${UI.auditFilter === k ? ' is-on' : ''}" data-act="audit-filter" data-v="${k}" type="button">${label}</button>`).join('')}
        </div>
        <div class="evt evt--head"><span>Time</span><span>Type</span><span>Event</span><span style="text-align:right">Amount / actor</span></div>
        ${rows.map(e => {
          const mt = meta[e.type] || meta.member;
          return `<div class="evt">
            <time>${eventToday(e) ? fmtTime(e.ts) : fmtDay(e.ts)}</time>
            <span class="pill pill--${mt[1]}">${mt[0]}</span>
            <span class="evt__d"><span class="evt__t">${esc(e.title)}</span><span class="evt__s">${esc(e.detail || '')}</span></span>
            <span class="evt__a">${e.amount != null ? inr(e.amount) : esc(e.actor || '')}</span>
          </div>`;
        }).join('') || `<div class="empty"><h3>No events in this filter</h3><p>Pick another type.</p></div>`}
      </section>

      <div class="side-notes">
        <section class="card posture">
          <div class="card__head"><h2>Security posture</h2><span class="pill pill--outline">demo spec</span></div>
          ${posture.map(([ic, t, s]) => `<div class="posture__row">
            <span class="posture__ic">${icon(ic)}</span>
            <span><span class="posture__t">${t}</span><span class="posture__s">${s}</span></span>
          </div>`).join('')}
        </section>
        <section class="card note-card">
          <h3>What is real in this prototype</h3>
          <p>The QR is a real scannable code and the token rotates. Everything else — UPI, WhatsApp, door relay and PIN check — is simulated in the browser.</p>
          <button class="btn btn--sm btn--ghost" data-act="nav" data-view="roi" type="button" style="margin-top:10px">${icon('calc')}See the business case</button>
        </section>
      </div>
    </div>`;
  }

  /* ============================================================
     ROI & PRICING
     ============================================================ */
  function roiFigures() {
    const r = UI.roi;
    const lapsedMembers = Math.round(r.members * (r.lapses / 100));
    const lost = Math.round(lapsedMembers * r.fee);
    const monthly = Math.round(lost * (r.recovery / 100));
    const annual = monthly * 12;
    const plan = 2499;
    const multiple = monthly / plan;
    const breakEven = lost ? Math.min(100, Math.ceil((plan / lost) * 100)) : 100;
    return { lapsedMembers, lost, monthly, annual, plan, multiple, breakEven, netAnnual: annual - plan * 12 };
  }

  function renderROI() {
    const f = roiFigures();
    const r = UI.roi;
    const presets = [
      ['Small gym', { members: 120, fee: 1200, lapses: 5, recovery: 35 }],
      ['Mid gym', { members: 250, fee: 1500, lapses: 8, recovery: 40 }],
      ['2-branch chain', { members: 600, fee: 1800, lapses: 12, recovery: 45 }]
    ];

    return `
    <div class="page-head">
      <div>
        <h1>The business case</h1>
        <p>Move the sliders to the gym you are pitching. The numbers do the selling.</p>
      </div>
      <div class="page-head__actions">
        <span class="pill pill--brand">30-day pilot · no hardware</span>
      </div>
    </div>

    <div class="roi-grid">
      <section class="card calc">
        <div class="card__head"><h2>Their gym, their numbers</h2><span class="pill pill--outline">editable</span></div>
        <div class="slider">
          <div class="slider__top"><span class="slider__k">Active members</span><span class="slider__v" id="roiMembersV">${r.members}</span></div>
          <input type="range" id="roiMembers" min="50" max="1000" step="10" value="${r.members}" aria-label="Active members">
          <div class="slider__scale"><span>50</span><span>1,000</span></div>
        </div>
        <div class="slider">
          <div class="slider__top"><span class="slider__k">Average monthly fee</span><span class="slider__v" id="roiFeeV">${inr(r.fee)}</span></div>
          <input type="range" id="roiFee" min="500" max="5000" step="100" value="${r.fee}" aria-label="Average monthly fee">
          <div class="slider__scale"><span>₹500</span><span>₹5,000</span></div>
        </div>
        <div class="slider">
          <div class="slider__top"><span class="slider__k">Share of members who lapse each month</span><span class="slider__v" id="roiLapsesV">${r.lapses}%</span></div>
          <input type="range" id="roiLapses" min="1" max="25" step="1" value="${r.lapses}" aria-label="Monthly lapse rate">
          <div class="slider__scale"><span>1%</span><span>25%</span></div>
          <div class="slider__hint">That is about <b>${f.lapsedMembers} members</b> slipping out every month at this size.</div>
        </div>
        <div class="slider">
          <div class="slider__top"><span class="slider__k">Share recovered at the door</span><span class="slider__v" id="roiRecoveryV">${r.recovery}%</span></div>
          <input type="range" id="roiRecovery" min="10" max="80" step="5" value="${r.recovery}" aria-label="Recovery rate">
          <div class="slider__scale"><span>10%</span><span>80%</span></div>
        </div>
        <div class="presets">
          ${presets.map(([label, vals]) => `<button class="chip" type="button" data-act="roi-preset" data-preset="${label}">${label}</button>`).join('')}
        </div>
      </section>

      <section class="result" aria-live="polite">
        <div class="result__k">Recovered every month</div>
        <div class="result__v" id="roiMonthly">${inr(f.monthly)}</div>
        <div class="result__row"><span>Leaking each month</span><b id="roiLeak">${inr(f.lost)}</b></div>
        <div class="result__row"><span>Recovered each year</span><b id="roiAnnual">${inr(f.annual)}</b></div>
        <div class="result__row"><span>Growth plan cost</span><b id="roiCost">${inr(f.plan)}/mo</b></div>
        <div class="result__row"><span>Return on spend</span><b id="roiMultiple">${f.multiple.toFixed(1)}×</b></div>
        <div class="result__row"><span>Net gain per year</span><b id="roiNet">${inr(f.netAnnual)}</b></div>
        <div class="result__callout" id="roiCallout">You only need to recover <b>${f.breakEven}%</b> of lapses to cover the fee.</div>
      </section>
    </div>

    <div class="card__head" style="margin:4px 0 12px">
      <h2 style="font-size:18px">Pricing that makes the decision easy</h2>
      <span class="mut" style="margin-left:auto">Founding price for the first 5 gyms · locked for life</span>
    </div>

    <div class="plans-grid">
      <article class="price-card">
        <h3>Door Lock</h3>
        <div class="price-card__was">₹1,299 standard</div>
        <div class="price-card__price">₹999<small>/month</small></div>
        <p class="mut">Up to 150 members</p>
        <ul class="price-card__list">
          <li>${icon('check')}Rotating QR door lock</li>
          <li>${icon('check')}Instant renewal at the door</li>
          <li>${icon('check')}7 / 3 / 1 day reminders</li>
          <li>${icon('check')}Owner dashboard + CSV</li>
        </ul>
        <button class="btn btn--block" type="button" data-act="pilot" data-plan="Door Lock">Start a pilot</button>
      </article>

      <article class="price-card price-card--featured">
        <span class="price-card__tag">Recommended</span>
        <h3>Growth</h3>
        <div class="price-card__was">₹2,499 standard</div>
        <div class="price-card__price">₹1,999<small>/month</small></div>
        <p class="mut">Up to 400 members</p>
        <ul class="price-card__list">
          <li>${icon('check')}Everything in Door Lock</li>
          <li>${icon('check')}Churn detector + daily digest</li>
          <li>${icon('check')}Freeze, notices, part-payments</li>
          <li>${icon('check')}1,000 WhatsApp messages included</li>
        </ul>
        <button class="btn btn--primary btn--block" type="button" data-act="pilot" data-plan="Growth">Start a pilot</button>
      </article>

      <article class="price-card">
        <h3>Pro</h3>
        <div class="price-card__was">₹4,999 standard</div>
        <div class="price-card__price">₹3,499<small>/month</small></div>
        <p class="mut">Unlimited · 2 branches</p>
        <ul class="price-card__list">
          <li>${icon('check')}Everything in Growth</li>
          <li>${icon('check')}Win-back campaigns</li>
          <li>${icon('check')}Footfall &amp; peak-hour analytics</li>
          <li>${icon('check')}Staff roles + priority support</li>
        </ul>
        <button class="btn btn--block" type="button" data-act="pilot" data-plan="Pro">Start a pilot</button>
      </article>
    </div>

    <div class="guarantee" style="margin-top:16px">
      ${icon('shield')}
      <div>
        <h3>Free 30-day pilot, then a recovery guarantee</h3>
        <p>One day to import their member list. No hardware, no contract. If the system does not recover more than its fee in 60 days, refund it. Setup ₹3,999 — waived on annual plans. No commission on payments; gateway fees go straight to the gym.</p>
      </div>
      <button class="btn btn--primary btn--sm" type="button" data-act="pilot" data-plan="Growth" style="margin-left:auto">${icon('whatsapp')}Book a pilot</button>
    </div>`;
  }

  /* ============================================================
     MODALS
     ============================================================ */
  function modalShell({ title, sub, body, foot, wide, autofocus }) {
    return `<div class="overlay">
      <div class="modal${wide ? ' modal--wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal__head">
          <div>
            <h2 id="modalTitle">${title}</h2>
            ${sub ? `<p>${sub}</p>` : ''}
          </div>
          <button class="icon-btn" data-act="close-modal" type="button" aria-label="Close">${icon('x')}</button>
        </div>
        <div class="modal__body">${body}</div>
        ${foot ? `<div class="modal__foot">${foot}</div>` : ''}
      </div>
    </div>`;
  }

  function memberMini(m) {
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);margin-bottom:14px">
      <span class="avatar" style="--h:${m.hue}">${initials(m.name)}</span>
      <span style="min-width:0;flex:1">
        <span style="display:block;font-size:13px;font-weight:600">${esc(m.name)}</span>
        <span class="mut">#${m.id} · ${m.phone} · ${planOf(m).label}</span>
      </span>
      ${statusPill(m)}
    </div>`;
  }

  function openModal(type, data = {}) {
    UI.modal = Object.assign({ type }, data);
    renderModal();
    syncBodyLock();
    setTimeout(() => {
      const root = $('#modal-root');
      const preferred = root.querySelector('[data-autofocus]') || root.querySelector('input, select, textarea, button');
      if (preferred) preferred.focus();
    }, 30);
  }
  function closeModal() {
    stopScanner();
    UI.modal = null;
    const root = $('#modal-root');
    if (root) root.innerHTML = '';
    syncBodyLock();
  }
  function syncBodyLock() {
    document.body.classList.toggle('modal-open', !!UI.modal || UI.palette.open);
  }

  function renderModal() {
    const root = $('#modal-root');
    if (!root) return;
    const md = UI.modal;
    if (!md) { root.innerHTML = ''; return; }
    let html = '';

    if (md.type === 'add') {
      html = modalShell({
        title: 'Add a member',
        sub: 'One screen. The QR goes out on WhatsApp immediately.',
        autofocus: true,
        body: `<form id="addForm" novalidate>
          <div class="form-grid">
            <div class="field span2"><label for="addName">Full name</label><input class="input" id="addName" data-autofocus placeholder="e.g. Ananya Krishnan" autocomplete="name"></div>
            <div class="field"><label for="addPhone">Phone</label><input class="input" id="addPhone" placeholder="10-digit number" inputmode="tel" autocomplete="tel"></div>
            <div class="field"><label for="addStart">Start date</label><input class="input" id="addStart" type="date" value="${todayISO()}"></div>
            <div class="field"><label for="addPlan">Plan</label><select class="select" id="addPlan">${Object.entries(PLANS).map(([k, p]) => `<option value="${k}">${p.label} · ${inr(p.price)}</option>`).join('')}</select></div>
            <div class="field"><label for="addMethod">Payment</label><select class="select" id="addMethod"><option>Cash</option><option>UPI</option><option>Pay later</option></select></div>
            <div class="field span2"><label for="addNotes">Note (optional)</label><input class="input" id="addNotes" placeholder="Trainer, slot, referral…"></div>
            <div class="span2 mut" id="addAmount" style="display:flex;align-items:center;gap:6px">${icon('cash')}Collects <b style="margin:0 3px">${inr(1200)}</b> today · receipt on WhatsApp.</div>
            <div class="span2 err" id="addErr" role="alert"></div>
          </div>
        </form>`,
        foot: `<button class="btn" data-act="close-modal" type="button">Cancel</button><button class="btn btn--primary" type="submit" form="addForm">${icon('plus')}Add member</button>`
      });
    }

    if (md.type === 'renew') {
      const m = memberById(md.id);
      if (!m) { root.innerHTML = ''; return; }
      if (!PLANS[md.plan]) md.plan = m.plan;
      if (!md.method) md.method = 'upi';
      html = modalShell({
        title: 'Renew membership',
        sub: 'Cash or UPI. The receipt goes out on WhatsApp.',
        body: `${memberMini(m)}${renewPanel(m, md, { acts: { plan: 'modal-plan', method: 'modal-method', pay: 'modal-pay' }, allowPass: false, offline: UI.offline })}`,
        foot: `<button class="btn" data-act="close-modal" type="button">Close</button>`
      });
    }

    if (md.type === 'override') {
      const m = memberById(md.id);
      if (!m) { root.innerHTML = ''; return; }
      html = modalShell({
        title: 'Release the door?',
        sub: 'A one-time release. It is logged with your reason and PIN.',
        body: `<form id="overrideForm">
          ${memberMini(m)}
          <div class="field" style="margin-bottom:12px">
            <label for="ovReason">Reason code</label>
            <select class="select" id="ovReason">
              <option>Owner approval</option>
              <option>Payment promised today</option>
              <option>Trial or guest visit</option>
              <option>Emergency</option>
              <option>Staff correction</option>
            </select>
          </div>
          <label style="font-size:11.5px;font-weight:600;color:var(--ink-2);display:block;text-align:center;margin-bottom:2px">Owner PIN</label>
          <div class="pin-input" id="pinWrap">
            ${[0, 1, 2, 3].map(i => `<input type="text" inputmode="numeric" maxlength="1" data-pin="${i}" aria-label="PIN digit ${i + 1}" autocomplete="off">`).join('')}
          </div>
          <div class="err-line" id="pinErr" role="alert"></div>
          <p class="mut" style="text-align:center;font-size:10.5px">Demo PIN: <span class="mono">2468</span>. In production this is the owner’s device-bound PIN.</p>
        </form>`,
        foot: `<button class="btn" data-act="close-modal" type="button">Cancel</button><button class="btn btn--danger" type="submit" form="overrideForm">${icon('key')}Release &amp; log</button>`
      });
    }

    if (md.type === 'receipt') {
      const m = memberById(md.id);
      const p = m && m.history.find(h => h.id === md.pid);
      if (!m || !p) { root.innerHTML = ''; return; }
      html = modalShell({
        title: 'Payment receipt',
        sub: 'GST-ready. Print or send on WhatsApp.',
        body: receiptMarkup(m, p),
        foot: `<button class="btn" data-act="receipt-copy" data-id="${m.id}" data-pid="${p.id}" type="button">${icon('copy')}Copy text</button><button class="btn btn--primary" data-act="receipt-print" type="button">${icon('print')}Print / PDF</button>`
      });
    }

    if (md.type === 'detail') {
      const m = memberById(md.id);
      if (!m) { root.innerHTML = ''; return; }
      const st = statusOf(m);
      html = modalShell({
        title: 'Member detail',
        sub: `#${m.id} · joined ${fmtDate(m.joined)}`,
        wide: true,
        body: `<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px">
          <span class="avatar avatar--lg" style="--h:${m.hue}">${initials(m.name)}</span>
          <div style="min-width:0;flex:1">
            <h3 style="font-size:18px">${esc(m.name)}</h3>
            <div class="mut">${m.phone} · ${planOf(m).label} · ${esc(m.notes || 'No notes')}</div>
          </div>
          <div>${statusPill(m)} ${payPill(m)}</div>
        </div>
        <div class="detail-grid">
          <div class="detail"><div class="detail__k">Ends</div><div class="detail__v">${fmtDate(m.end)} · ${daysUntil(m.end) >= 0 ? daysUntil(m.end) + ' days left' : -daysUntil(m.end) + ' days overdue'}</div></div>
          <div class="detail"><div class="detail__k">Plan value</div><div class="detail__v">${inr(planOf(m).price)}</div></div>
          <div class="detail"><div class="detail__k">Last visit</div><div class="detail__v">${m.lastSeen === 0 ? 'Today' : m.lastSeen + ' days ago'} · ${m.visits} visits</div></div>
          <div class="detail"><div class="detail__k">Balance due</div><div class="detail__v">${m.balance ? inr(m.balance) : 'Nil'}</div></div>
          <div class="detail span2"><div class="detail__k">Notes</div><div class="detail__v" style="font-weight:500">${esc(m.notes || '—')}</div></div>
        </div>
        ${m.freezeRequest ? `<div class="banner" style="margin:14px 0 0">
          ${icon('snow')}<span><strong>${m.freezeRequest.action === 'unfreeze' ? 'Unfreeze request' : 'Freeze request'}.</strong> ${m.freezeRequest.action === 'unfreeze' ? 'The member wants access back.' : `Pause for ${m.freezeRequest.days || 14} days. The end date moves forward.`}</span>
          <button class="btn btn--xs btn--primary" data-act="detail-freeze-approve" data-id="${m.id}" type="button">Review</button>
          <button class="btn btn--xs btn--ghost" data-act="detail-freeze-decline" data-id="${m.id}" type="button">Decline</button>
        </div>` : ''}
        <div class="drawer-actions">
          <button class="btn" data-act="remind" data-id="${m.id}" type="button">${icon('whatsapp')}Send reminder</button>
          <button class="btn" data-act="detail-partial" data-id="${m.id}" type="button">${icon('cash')}Part payment</button>
          <button class="btn" data-act="detail-freeze" data-id="${m.id}" type="button">${icon('snow')}${m.frozen ? 'Unfreeze' : 'Freeze'}</button>
          <button class="btn" data-act="detail-edit" data-id="${m.id}" type="button">${icon('settings')}Edit details</button>
          <button class="btn" data-act="detail-wa" data-id="${m.id}" type="button">${icon('whatsapp')}WhatsApp</button>
        </div>
        <div class="card__eyebrow" style="margin:18px 0 6px">Recent visits</div>
        ${S.events.filter(e => e.type === 'entry' && e.memberId === m.id).slice(0, 4).map(e => `<div class="hist">
          <span class="hist__ic">${icon('activity')}</span>
          <span class="hist__body"><span class="hist__t">${esc(e.title)}</span><span class="hist__s">${fmtDay(e.ts)} · ${fmtTime(e.ts)} · ${esc(e.detail || '')}</span></span>
          <span class="mut" style="font-size:10px">${eventToday(e) ? 'Today' : fmtDay(e.ts)}</span>
        </div>`).join('') || `<p class="mut" style="font-size:11px">No visits recorded yet.</p>`}
        <div class="card__eyebrow" style="margin:18px 0 6px">Payment history</div>
        ${m.history.slice(0, 5).map(h => `<div class="hist">
          <span class="hist__ic">${icon(h.method === 'Cash' ? 'cash' : 'card')}</span>
          <span class="hist__body"><span class="hist__t">${inr(h.amount)} · ${h.plan ? h.plan + ' month' : 'day pass'}</span><span class="hist__s">${fmtDate(h.date)} · ${h.method} · ${h.id}</span></span>
          <button type="button" data-act="receipt" data-id="${m.id}" data-pid="${h.id}">Receipt</button>
        </div>`).join('')}
        ${st === 'expired' || st === 'frozen' ? `<p class="mut" style="margin-top:12px;display:flex;gap:6px">${icon('info')}This member is currently blocked at the door.</p>` : ''}`,
        foot: `<button class="btn" data-act="close-modal" type="button">Close</button><button class="btn btn--primary" data-act="detail-renew" data-id="${m.id}" type="button">Renew membership</button>`
      });
    }

    if (md.type === 'partial') {
      const m = memberById(md.id);
      if (!m) { root.innerHTML = ''; return; }
      html = modalShell({
        title: 'Record a part payment',
        sub: 'Common in Indian gyms. The balance stays visible at the door.',
        body: `<form id="partialForm">
          ${memberMini(m)}
          <div class="form-grid">
            <div class="field"><label for="partAmount">Amount collected</label><input class="input" id="partAmount" type="number" min="1" max="${m.balance || planOf(m).price}" value="${m.balance || Math.round(planOf(m).price / 2)}" data-autofocus></div>
            <div class="field"><label for="partMethod">Method</label><select class="select" id="partMethod"><option>Cash</option><option>UPI</option></select></div>
            <div class="field span2"><label for="partNote">Note</label><input class="input" id="partNote" placeholder="Promised the rest on the 10th"></div>
            <div class="span2 mut">Current balance: <b>${inr(m.balance || planOf(m).price)}</b> · plan ${planOf(m).label}</div>
            <div class="span2 err" id="partErr" role="alert"></div>
          </div>
        </form>`,
        foot: `<button class="btn" data-act="close-modal" type="button">Cancel</button><button class="btn btn--primary" type="submit" form="partialForm">${icon('cash')}Record payment</button>`
      });
    }

    if (md.type === 'freeze') {
      const m = memberById(md.id);
      if (!m) { root.innerHTML = ''; return; }
      html = modalShell({
        title: 'Freeze this membership',
        sub: 'Pause access and move the end date forward by the same number of days.',
        body: `<form id="freezeForm">
          ${memberMini(m)}
          <div class="form-grid">
            <div class="field"><label for="freezeDays">Pause for</label><select class="select" id="freezeDays">
              ${[7, 14, 30].map(n => `<option value="${n}" ${Number(md.days) === n ? 'selected' : ''}>${n} days</option>`).join('')}
            </select></div>
            <div class="field"><label>New end date</label><div class="input" style="display:flex;align-items:center" id="freezeEnd">${fmtDate(toISO(addDays(daysUntil(m.end) >= 0 ? fromISO(m.end) : TODAY, Number(md.days) || 14)))}</div></div>
            <div class="field span2"><label for="freezeNote">Note (optional)</label><input class="input" id="freezeNote" placeholder="Travel, injury, exams…"></div>
            <div class="span2 mut">${icon('info')} Access is blocked immediately. The member keeps every paid day.</div>
          </div>
        </form>`,
        foot: `<button class="btn" data-act="close-modal" type="button">Cancel</button><button class="btn btn--primary" type="submit" form="freezeForm">${icon('snow')}Freeze membership</button>`
      });
    }

    if (md.type === 'edit') {
      const m = memberById(md.id);
      if (!m) { root.innerHTML = ''; return; }
      html = modalShell({
        title: 'Edit member details',
        sub: 'Correct a phone number, fix a plan or adjust the end date.',
        body: `<form id="editForm">
          ${memberMini(m)}
          <div class="form-grid">
            <div class="field span2"><label for="editName">Full name</label><input class="input" id="editName" value="${esc(m.name)}" data-autofocus autocomplete="name"></div>
            <div class="field"><label for="editPhone">Phone</label><input class="input" id="editPhone" value="${m.phone}" inputmode="tel" autocomplete="tel"></div>
            <div class="field"><label for="editPlan">Plan</label><select class="select" id="editPlan">${Object.entries(PLANS).map(([k, p]) => `<option value="${k}" ${Number(k) === m.plan ? 'selected' : ''}>${p.label} · ${inr(p.price)}</option>`).join('')}</select></div>
            <div class="field"><label for="editEnd">End date</label><input class="input" id="editEnd" type="date" value="${m.end}"></div>
            <div class="field"><label for="editPay">Payment</label><select class="select" id="editPay">
              <option value="paid" ${m.pay === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="partial" ${m.pay === 'partial' ? 'selected' : ''}>Part paid</option>
              <option value="unpaid" ${m.pay === 'unpaid' ? 'selected' : ''}>Unpaid</option>
            </select></div>
            <div class="field span2"><label for="editNotes">Notes</label><input class="input" id="editNotes" value="${esc(m.notes || '')}" placeholder="Trainer, slot, referral…"></div>
            <div class="span2 err" id="editErr" role="alert"></div>
          </div>
        </form>`,
        foot: `<button class="btn" data-act="close-modal" type="button">Cancel</button><button class="btn btn--primary" type="submit" form="editForm">${icon('save')}Save changes</button>`
      });
    }

    if (md.type === 'pilot') {
      html = modalShell({
        title: 'Run a pilot in one day',
        sub: `${md.plan || 'Growth'} · 30 days · no hardware, no contract`,
        body: `<div class="detail-grid" style="margin-bottom:14px">
          <div class="detail"><div class="detail__k">Day 1</div><div class="detail__v" style="font-weight:500">Import the member list from Excel and print QR cards.</div></div>
          <div class="detail"><div class="detail__k">Day 2</div><div class="detail__v" style="font-weight:500">Staff training, 20 minutes. Put the tablet at the desk.</div></div>
          <div class="detail span2"><div class="detail__k">Day 30</div><div class="detail__v" style="font-weight:500">Review recovered ₹, reminder delivery and override log. Keep it only if it paid for itself.</div></div>
        </div>
        <div class="result" style="padding:16px;border-radius:12px">
          <div class="result__k">The promise</div>
          <div style="font-family:var(--display);font-size:17px;margin:4px 0 6px">If it does not recover more than its fee in 60 days, you get a refund.</div>
          <div class="mut" style="color:#A9C9B6;font-size:11px">Setup ₹3,999, waived on annual. No commission on payments.</div>
        </div>
        <p class="mut" style="margin-top:12px">Copy the message below and send it to the owner on WhatsApp.</p>`,
        foot: `<button class="btn" data-act="close-modal" type="button">Close</button><button class="btn btn--primary" data-act="pilot-copy" data-plan="${md.plan || 'Growth'}" type="button">${icon('copy')}Copy pitch</button>`
      });
    }

    if (md.type === 'scanner') {
      html = modalShell({
        title: 'Scan member QR',
        sub: 'The token is signed and rotates every 30 seconds.',
        wide: true,
        body: `<div class="scanner">
          <div class="scanner__viewport">
            <video id="scanVideo" playsinline muted></video>
            <div class="scanner__frame" aria-hidden="true"><span></span><span></span><span></span><span></span><i></i></div>
            <div class="scanner__status" id="scanStatus">Requesting camera…</div>
          </div>
          <form id="scanTokenForm" class="scanner__manual">
            <label for="scanToken">No camera? Paste the rotating token from the member app.</label>
            <div class="scanner__row">
              <input class="input" id="scanToken" autocomplete="off" placeholder="DP1|memberId|window|signature">
              <button class="btn btn--primary" type="submit">${icon('shield')}Verify</button>
            </div>
            <div class="err" id="scanErr" role="alert"></div>
          </form>
          <p class="mut" style="font-size:10.5px;margin-top:10px">Tip: open the Member app in another tab, then point a phone camera at the QR. Expired, tampered and unknown tokens are rejected before the door decision.</p>
        </div>`,
        foot: `<button class="btn" data-act="close-modal" type="button">Cancel</button>`
      });
    }

    if (md.type === 'campaign') {
      const targets = md.ids
        ? md.ids.map(memberById).filter(Boolean)
        : riskRadar().slice(0, 8).map(x => x.m);
      const first = targets[0];
      const offer = md.offer || 'free7';
      html = modalShell({
        title: 'Win-back campaign',
        sub: 'One personal message per member. No broadcast blasts.',
        wide: true,
        body: `<form id="campaignForm">
          ${targets.length ? `<div class="camp-targets">
            ${targets.map(m => {
              const score = churnScore(m);
              return `<label class="camp-check">
                <input type="checkbox" data-camp="${m.id}" checked>
                <span class="avatar" style="--h:${m.hue}">${initials(m.name)}</span>
                <span class="camp-check__body">
                  <span class="camp-check__n">${esc(m.name)}</span>
                  <span class="camp-check__s">${esc(churnReasons(m).join(' · '))}</span>
                </span>
                <span class="camp-check__score">${score}</span>
              </label>`;
            }).join('')}
          </div>` : `<div class="empty" style="padding:20px 0"><h3>No one needs a nudge</h3><p>Every member is active and recently seen.</p></div>`}
          <div class="form-grid" style="margin-top:14px">
            <div class="field span2"><label for="campOffer">Offer</label>
              <select class="select" id="campOffer">
                ${Object.entries(CAMPAIGN_OFFERS).map(([k, o]) => `<option value="${k}" ${k === offer ? 'selected' : ''}>${o.label} · ${o.line}</option>`).join('')}
              </select>
            </div>
            <div class="field span2">
              <label for="campMsg">Message template</label>
              <textarea class="input" id="campMsg" rows="4" style="resize:vertical">${esc(campaignTemplate(offer))}</textarea>
              <div class="mut" style="font-size:10.5px;margin-top:5px">Keep <code>{name}</code> — it becomes each member’s first name when the campaign sends.</div>
            </div>
            <div class="span2 camp-preview">
              <span class="camp-preview__k">${icon('whatsapp')}WhatsApp preview</span>
              <div class="camp-bubble" id="campPreview">${esc(first ? campaignMessage(first, offer) : '')}</div>
            </div>
            <div class="span2 err" id="campErr" role="alert"></div>
          </div>
        </form>`,
        foot: `<button class="btn" data-act="close-modal" type="button">Cancel</button><button class="btn btn--primary" type="submit" form="campaignForm" ${targets.length ? '' : 'disabled'}>${icon('send')}Send campaign</button>`
      });
    }

    if (md.type === 'referral') {
      const m = memberById(md.id) || S.members[0];
      if (!m) { root.innerHTML = ''; return; }
      html = modalShell({
        title: 'Referral engine',
        sub: 'Give a friend a perk. Reward the member who brought them.',
        body: `<form id="referralForm">
          <div class="form-grid">
            <div class="field span2"><label for="refMember">Who is sharing?</label>
              <select class="select" id="refMember">${S.members.map(x => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${esc(x.name)} · ${refCodeOf(x)}</option>`).join('')}</select>
            </div>
            <div class="field span2"><label>Tracked link</label>
              <div class="ref-linkbox"><code id="refLinkOut">${esc(refLink(m))}</code><button class="btn btn--xs" type="button" data-act="copy-ref-link" data-id="${m.id}">${icon('copy')}Copy</button></div>
            </div>
            <div class="span2">
              <span class="camp-preview__k">${icon('whatsapp')}Forward-ready message</span>
              <div class="camp-bubble" id="refPreview">${esc(refMessage(m))}</div>
            </div>
            <div class="span2 ref-meta">
              <span>${icon('gift')}Referrer gets <b>+${refRewardDays()} days</b></span>
              <span>${icon('sparkle')}Friend gets <b>${esc(refFriendPerk())}</b></span>
            </div>
          </div>
        </form>`,
        foot: `<button class="btn" data-act="close-modal" type="button">Close</button>
          <button class="btn" data-act="ref-join" data-id="${m.id}" type="button">${icon('checkCircle')}Friend joined</button>
          <button class="btn btn--primary" type="submit" form="referralForm">${icon('send')}Send invite</button>`
      });
    }

    if (md.type === 'actions') {
      const n = pendingTaskCount();
      html = modalShell({
        title: 'Action center',
        sub: n ? `${n} task${n === 1 ? '' : 's'} need the desk today. Tick them off as you go.` : 'Everything is clear. Nothing needs the desk right now.',
        wide: true,
        body: actionCenterMarkup(),
        foot: `<button class="btn" data-act="close-modal" type="button">Close</button>
          <button class="btn" data-act="palette" type="button">${icon('search')}Find anything</button>`
      });
    }

    if (md.type === 'reset') {
      html = modalShell({
        title: 'Reset demo data?',
        sub: 'This clears every check-in, payment and setting you changed in this browser.',
        body: `<div class="banner" style="margin:0;background:var(--bad-soft);color:var(--bad);border-color:color-mix(in srgb,var(--bad) 24%,transparent)">
          ${icon('alert')}<span>The seeded members and events come back. Nothing is deleted from a real gym.</span>
        </div>`,
        foot: `<button class="btn" data-act="close-modal" type="button">Keep my changes</button><button class="btn btn--danger" data-act="reset-confirm" type="button">${icon('refresh')}Reset demo</button>`
      });
    }

    root.innerHTML = html;
    if (md.type === 'scanner') setTimeout(startScanner, 80);
  }

  function receiptMarkup(m, p) {
    const total = p.amount;
    const base = Math.round((total / 1.18) * 100) / 100;
    const gst = Math.round((total - base) * 100) / 100;
    return `<div class="receipt" id="receiptCard">
      <div class="receipt__head">
        <div>
          <div class="receipt__gym">Iron Temple Fitness</div>
          <div class="mut" style="font-size:10px">Anna Nagar · Chennai 600040<br>GSTIN ${S.gym.gstin}</div>
        </div>
        <div class="receipt__no">${p.id}<br>${fmtDate(p.date)}<br>PAID</div>
      </div>
      <div class="receipt__rows">
        <div class="receipt__row"><span>Member</span><b>${esc(m.name)} · #${m.id}</b></div>
        <div class="receipt__row"><span>Plan</span><b>${p.plan ? PLANS[p.plan] ? PLANS[p.plan].label : p.plan + ' month' : 'Day pass'}</b></div>
        <div class="receipt__row"><span>Method</span><b>${p.method}</b></div>
        <div class="receipt__row"><span>Taxable value</span><b>${inr(base)}</b></div>
        <div class="receipt__row"><span>CGST 9%</span><b>${inr(gst / 2)}</b></div>
        <div class="receipt__row"><span>SGST 9%</span><b>${inr(gst / 2)}</b></div>
      </div>
      <div class="receipt__total"><span>Total paid</span><span>${inr(total)}</span></div>
      <div class="receipt__fine">Demo receipt. Membership fees usually attract 18% GST in India — confirm the treatment with your CA. Under the DPDP Act, store consent and support deletion on request.</div>
    </div>`;
  }

  function receiptText(m, p) {
    const base = Math.round((p.amount / 1.18) * 100) / 100;
    const gst = p.amount - base;
    return `IRON TEMPLE FITNESS
Anna Nagar, Chennai · GSTIN ${S.gym.gstin}
Receipt ${p.id} · ${fmtDate(p.date)}

Member: ${m.name} (#${m.id})
Plan: ${p.plan ? (PLANS[p.plan] ? PLANS[p.plan].label : p.plan + ' month') : 'Day pass'}
Method: ${p.method}
Taxable: ${inr(base)}
CGST 9%: ${inr(gst / 2)}
SGST 9%: ${inr(gst / 2)}
Total paid: ${inr(p.amount)}

Demo receipt. Confirm GST treatment with your CA.`;
  }

  /* ============================================================
     COMMAND PALETTE
     ============================================================ */
  function paletteItems() {
    const q = norm(UI.palette.q);
    const items = [];
    VIEWS.forEach(v => items.push({ kind: 'view', id: v.id, title: v.label, sub: 'Go to ' + v.title, icon: v.icon, pill: 'Page' }));
    items.push({ kind: 'action', id: 'add', title: 'Add a member', sub: 'Name, phone, plan, payment', icon: 'plus', pill: 'Action' });
    items.push({ kind: 'action', id: 'scan', title: 'Scan member QR', sub: 'Camera or signed token', icon: 'camera', pill: 'Action' });
    items.push({ kind: 'action', id: 'campaign', title: 'Launch a win-back campaign', sub: `${riskRadar().length} members on the churn radar`, icon: 'sparkle', pill: 'Action' });
    items.push({ kind: 'action', id: 'referral', title: 'Send a referral invite', sub: `${referralStats().joins} joins from ${referralStats().invites} invites`, icon: 'gift', pill: 'Action' });
    items.push({ kind: 'action', id: 'kiosk', title: 'Open kiosk mode', sub: 'Fullscreen self-scan at the door', icon: 'qr', pill: 'Action' });
    items.push({ kind: 'action', id: 'actions', title: 'Open action center', sub: `${pendingTaskCount()} task${pendingTaskCount() === 1 ? '' : 's'} waiting for the desk`, icon: 'bell', pill: 'Action' });
    items.push({ kind: 'action', id: 'automations', title: 'Automation rules', sub: `${rulesOnCount()} of ${RULES.length} rules on`, icon: 'zap', pill: 'Action' });
    items.push({ kind: 'action', id: 'requests', title: 'Review freeze requests', sub: `${freezeRequests().length} waiting for approval`, icon: 'snow', pill: 'Action' });
    items.push({ kind: 'action', id: 'backup', title: 'Export a data backup', sub: 'Download every member and event as JSON', icon: 'download', pill: 'Data' });
    items.push({ kind: 'action', id: 'restore', title: 'Restore from backup', sub: 'Replace this browser’s data with a JSON backup', icon: 'refresh', pill: 'Data' });
    items.push({ kind: 'action', id: 'offline', title: UI.offline ? 'Go back online' : 'Simulate offline', sub: 'Test the fail-open door flow', icon: UI.offline ? 'wifi' : 'wifiOff', pill: 'Action' });
    items.push({ kind: 'action', id: 'theme', title: 'Switch theme', sub: 'Light or dark', icon: 'sun', pill: 'Action' });
    items.push({ kind: 'action', id: 'reset', title: 'Reset demo data', sub: 'Start from a clean state', icon: 'refresh', pill: 'Action' });
    S.members.forEach(m => items.push({
      kind: 'member', id: m.id, title: m.name,
      sub: '#' + m.id + ' · ' + m.phone + ' · ' + planOf(m).label,
      icon: 'user', pill: STATUS[statusOf(m)].label
    }));
    if (!q) {
      return items.filter(i => i.kind === 'view').slice(0, 5).concat(items.filter(i => i.kind === 'member').slice(0, 4));
    }
    return items.filter(i => norm(i.title).includes(q) || norm(i.sub).includes(q) || String(i.id) === q).slice(0, 9);
  }

  function paletteListHTML() {
    const items = paletteItems();
    if (!items.length) return `<div class="palette__empty">Nothing matched “${esc(UI.palette.q)}”.</div>`;
    return items.map((it, i) => `<button type="button" class="palette__item${i === UI.palette.index ? ' is-sel' : ''}" data-palette="1" data-kind="${it.kind}" data-id="${it.id}">
      ${icon(it.icon)}
      <span class="palette__item__body"><span class="palette__item__t">${esc(it.title)}</span><span class="palette__item__s">${esc(it.sub)}</span></span>
      <span class="pill pill--outline">${esc(it.pill)}</span>
    </button>`).join('');
  }

  function renderPalette() {
    const root = $('#palette-root');
    if (!root) return;
    if (!UI.palette.open) { root.innerHTML = ''; syncBodyLock(); return; }
    root.innerHTML = `<div class="overlay" id="paletteOverlay" style="align-items:flex-start">
      <div class="palette" role="dialog" aria-modal="true" aria-label="Command menu">
        <div class="palette__search">
          ${icon('search')}
          <input id="paletteInput" placeholder="Search members, pages or actions…" autocomplete="off" value="${esc(UI.palette.q)}">
          <kbd>Esc</kbd>
        </div>
        <div class="palette__list" id="paletteList">${paletteListHTML()}</div>
      </div>
    </div>`;
    syncBodyLock();
    setTimeout(() => { const i = $('#paletteInput'); if (i) i.focus(); }, 20);
  }
  function refreshPaletteList() {
    const list = $('#paletteList');
    if (list) list.innerHTML = paletteListHTML();
  }
  function openPalette() {
    UI.palette = { open: true, q: '', index: 0 };
    renderPalette();
  }
  function closePalette() {
    UI.palette.open = false;
    renderPalette();
  }
  function choosePalette(kind, id) {
    if (kind === 'view') { closePalette(); go(id); return; }
    if (kind === 'member') { closePalette(); go('door'); selectMember(id); return; }
    closePalette();
    if (id === 'add') { go('dashboard'); openModal('add'); }
    else if (id === 'scan') { go('door'); openModal('scanner'); }
    else if (id === 'campaign') { go('retention'); setTimeout(() => openModal('campaign'), 120); }
    else if (id === 'referral') { go('referrals'); setTimeout(() => openModal('referral', { id: S.members[0] && S.members[0].id }), 120); }
    else if (id === 'kiosk') enterKiosk();
    else if (id === 'actions') openModal('actions');
    else if (id === 'automations') go('automations');
    else if (id === 'requests') { go('dashboard'); UI.filter = 'requests'; render(); setTimeout(() => { const l = $('#memberList'); if (l) l.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); }
    else if (id === 'backup') exportBackup();
    else if (id === 'restore') { const f = $('#backupFile'); if (f) f.click(); }
    else if (id === 'offline') toggleOffline();
    else if (id === 'theme') toggleTheme();
    else if (id === 'reset') openModal('reset');
  }

  /* ============================================================
     MUTATIONS
     ============================================================ */
  function logEntry(m, kind, detail) {
    const titles = {
      entry: `${m.name} checked in`,
      block: `${m.name} blocked at the door`,
      override: `${m.name} released by owner`
    };
    pushEvent(kind, titles[kind], detail, { memberId: m.id, actor: kind === 'override' ? 'Owner' : 'Front desk' });
  }

  function selectMember(id) {
    const m = memberById(id);
    if (!m) return;
    const st = statusOf(m);
    const pass = hasActivePass(m);
    UI.selected = m.id;
    UI.released = null;
    UI.relay = { kind: (!pass && ['expired', 'frozen'].includes(st)) ? 'blocked' : 'open', ts: Date.now() };
    UI.doorRenew = { plan: m.plan, method: UI.offline ? 'cash' : 'upi', busy: false, open: !pass && ['expired', 'grace'].includes(st) };

    const d = daysUntil(m.end);
    const logKey = `${m.id}:${pass ? 'pass' : st}`;
    const now = Date.now();
    const duplicate = UI.lastDoorLog[logKey] && now - UI.lastDoorLog[logKey] < 20000;

    if (!duplicate) {
      UI.lastDoorLog[logKey] = now;
      if (st === 'expired' && !pass) {
        logEntry(m, 'block', `Expired ${-d} day${-d === 1 ? '' : 's'} ago · ${m.pay === 'paid' ? 'payment settled' : 'balance ' + inr(m.balance || planOf(m).price)}`);
      } else if (st === 'frozen') {
        logEntry(m, 'block', 'Membership frozen · owner approval needed');
      } else {
        m.lastSeen = 0;
        m.visits = (m.visits || 0) + 1;
        if (UI.offline) UI.queued++;
        logEntry(m, 'entry', pass ? 'Day pass · entry allowed' : st === 'grace' ? 'Grace period · allowed with a renewal prompt' : `Valid till ${fmtDate(m.end)}`);
      }
    }
    save();
    render();
    if (window.innerWidth <= 760) {
      setTimeout(() => {
        const panel = $('.scan-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }

  function applyRenewal(m, planKey, method, channel) {
    if (channel === 'door') UI.relay = { kind: 'open', ts: Date.now() };
    if (method === 'pass') {
      const p = { id: receiptNo(), date: todayISO(), amount: DAY_PASS, method: 'Cash', plan: 0, status: 'paid' };
      m.history.unshift(p);
      m.passDate = todayISO();
      m.lastSeen = 0;
      m.visits = (m.visits || 0) + 1;
      addCollected(DAY_PASS);
      if (channel === 'door' && UI.offline) UI.queued++;
      pushEvent('payment', `${m.name} bought a day pass`, `₹${DAY_PASS} · one entry today`, {
        amount: DAY_PASS, memberId: m.id, actor: channel === 'member' ? 'Member app' : 'Front desk'
      });
      pushEvent('entry', `${m.name} walked in on a day pass`, `Day pass paid at the door · membership still ends ${fmtDate(m.end)}`, { memberId: m.id, actor: 'Front desk' });
      save();
      return DAY_PASS;
    }

    const plan = PLANS[planKey] || PLANS[1];
    const grace = S.settings.graceDays;
    const base = daysUntil(m.end) >= -grace ? fromISO(m.end) : TODAY;
    const bonus = S.settings.offer && plan.months >= 3 ? S.settings.offerDays : 0;
    const end = addDays(base, plan.months * 30 + bonus);
    const amount = plan.price;

    m.end = toISO(end);
    m.plan = Number(planKey);
    m.pay = 'paid';
    m.balance = 0;
    m.frozen = false;
    m.frozenUntil = null;
    m.freezeDays = 0;
    m.freezeRequest = null;
    m.passDate = null;
    m.lastSeen = 0;
    m.visits = (m.visits || 0) + 1;
    m.reminders = { 7: false, 3: false, 1: false };
    m.history.unshift({ id: receiptNo(), date: todayISO(), amount, method: method === 'cash' ? 'Cash' : 'UPI', plan: plan.months, status: 'paid' });
    addCollected(amount);
    if (channel === 'door' && UI.offline) UI.queued++;

    const where = channel === 'door' ? 'at the door' : channel === 'member' ? 'in the member app' : 'by staff';
    pushEvent('payment', `${m.name} renewed ${where}`, `${plan.label}${bonus ? ' · +' + bonus + ' free days' : ''} · ${method === 'cash' ? 'Cash' : 'UPI'} · now ends ${fmtDate(m.end)}`, {
      amount, memberId: m.id, actor: channel === 'member' ? 'Member app' : 'Front desk'
    });
    if (channel === 'door') {
      pushEvent('entry', `${m.name} walked in after renewal`, `Renewed ${plan.label} · ${inr(amount)} collected`, { memberId: m.id });
    }
    save();
    return amount;
  }

  function startPayment(channel) {
    let m, st;
    if (channel === 'door') { m = memberById(UI.selected); st = UI.doorRenew; }
    else if (channel === 'member') { m = memberById(UI.memberId); st = UI.memberRenew; }
    else { m = memberById(UI.modal && UI.modal.id); st = UI.modal; }
    if (!m || !st || st.busy) return;

    const method = st.method;
    const planKey = st.plan;

    const finish = () => {
      st.busy = false;
      const amount = applyRenewal(m, planKey, method, channel);
      if (channel === 'door') {
        UI.doorRenew.open = false;
        render();
        toast(amount === DAY_PASS ? 'Day pass recorded. Let them in.' : `Renewed. ${m.name.split(' ')[0]} can walk in — owner notified.`, 'ok');
      } else if (channel === 'member') {
        UI.memberRenew.open = false;
        render();
        toast(amount === DAY_PASS ? 'Day pass added.' : `Renewed till ${fmtDate(m.end)}. Receipt sent on WhatsApp.`, 'ok');
      } else {
        closeModal();
        render();
        toast(`Renewal recorded. ${m.name.split(' ')[0]} now ends ${fmtDate(m.end)}.`, 'ok');
      }
    };

    if (method === 'upi') {
      st.busy = true;
      if (channel === 'door' || channel === 'member') render();
      else renderModal();
      toast('UPI request sent. Waiting for the gateway to confirm…', 'warn');
      setTimeout(finish, 1700);
      return;
    }
    finish();
  }

  function recordPartial(m, amount, method, note) {
    const amt = Math.round(amount);
    m.balance = Math.max(0, (m.balance || planOf(m).price) - amt);
    m.pay = m.balance > 0 ? 'partial' : 'paid';
    m.history.unshift({ id: receiptNo(), date: todayISO(), amount: amt, method, plan: m.plan, status: 'paid' });
    addCollected(amt);
    pushEvent('payment', `${m.name} paid ${inr(amt)} part payment`, `${method}${m.balance ? ' · ' + inr(m.balance) + ' still due' : ' · balance cleared'}${note ? ' · ' + note : ''}`, {
      amount: amt, memberId: m.id, actor: 'Owner'
    });
    save();
  }

  function sendReminder(m, openChat) {
    const k = reminderKey(m);
    if (k) {
      m.reminders[k] = true;
      save();
    }
    pushEvent('reminder', `WhatsApp reminder sent to ${m.name}`, `${reminderText(m).slice(0, 60)}…`, { memberId: m.id, actor: 'Front desk' });
    if (openChat) {
      const url = 'https://wa.me/91' + m.phone.replace(/\D/g, '') + '?text=' + encodeURIComponent(reminderText(m));
      window.open(url, '_blank', 'noopener');
    }
    toast(openChat ? 'WhatsApp opened with the reminder template.' : 'Reminder queued and logged.', 'ok');
    render();
  }

  function runQueue() {
    if (UI.queueBusy) return;
    if (!S.settings.autoReminders) { toast('Auto reminders are paused. Turn them on in Automation first.', 'warn'); return; }
    const first = pendingReminders();
    if (!first.length) { toast('No reminders due right now.', 'warn'); return; }
    UI.queueBusy = true;
    render();
    let sent = 0;
    const step = () => {
      const pending = pendingReminders();
      if (!pending.length) {
        UI.queueBusy = false;
        pushEvent('reminder', `Reminder queue completed`, `${sent} WhatsApp reminders · est. ${inr(sent * WA_COST)}`, { actor: 'System' });
        save();
        render();
        toast(`${sent} reminders sent. ${inr(sent * WA_COST)} message cost.`, 'ok');
        return;
      }
      const m = pending[0];
      m.reminders[reminderKey(m)] = true;
      sent++;
      pushEvent('reminder', `Reminder sent to ${m.name}`, `Auto queue · ${reminderKey(m)}-day window`, { memberId: m.id, actor: 'System' });
      save();
      render();
      setTimeout(step, 550);
    };
    setTimeout(step, 450);
  }

  function toggleOffline() {
    UI.offline = !UI.offline;
    if (!UI.offline && UI.queued) {
      const n = UI.queued;
      UI.queued = 0;
      pushEvent('settings', 'Offline queue synced', `${n} check-ins reconciled after reconnect`, { actor: 'System' });
      toast(`Back online. ${n} queued check-in${n === 1 ? '' : 's'} synced.`, 'ok');
    } else {
      toast(UI.offline ? 'Offline mode. Cached list, cash only, fail-open.' : 'Back online. Everything is synced.', 'warn');
    }
    render();
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    render();
  }

  function openDetail(id) {
    closeModal();
    openModal('detail', { id: Number(id) });
  }
  function openRenew(id) {
    const m = memberById(id);
    if (!m) return;
    closeModal();
    openModal('renew', { id: m.id, plan: m.plan, method: UI.offline ? 'cash' : 'upi', busy: false });
  }
  function openReceipt(m, pid) {
    if (!m) return;
    openModal('receipt', { id: m.id, pid });
  }

  function downloadMembers() {
    const rows = [['Member ID', 'Name', 'Phone', 'Plan', 'Ends', 'Status', 'Payment', 'Balance', 'Last visit (days)']];
    filteredMembers().forEach(m => rows.push([
      m.id, m.name, m.phone, planOf(m).label, m.end, STATUS[statusOf(m)].label,
      m.pay, m.balance || 0, m.lastSeen
    ]));
    csvDownload('doorpass-members.csv', rows);
  }
  function downloadAudit() {
    const rows = [['Time', 'Type', 'Event', 'Detail', 'Amount', 'Actor']];
    S.events.forEach(e => rows.push([new Date(e.ts).toLocaleString('en-IN'), e.type, e.title, e.detail || '', e.amount != null ? e.amount : '', e.actor || '']));
    csvDownload('doorpass-audit.csv', rows);
  }

  function downloadReferrals() {
    const f = referralStats();
    const rows = [['Code', 'Member', 'Phone', 'Plan', 'Invites', 'Joins', 'Conversion %', 'Free days earned', 'Reward link']];
    S.members.filter(m => (m.refInvites || 0) || (m.refJoins || 0)).forEach(m => rows.push([
      refCodeOf(m), m.name, m.phone, planOf(m).label,
      m.refInvites || 0, m.refJoins || 0,
      m.refInvites ? Math.round(((m.refJoins || 0) / m.refInvites) * 100) : 0,
      m.refRewardDays || 0, refLink(m)
    ]));
    rows.push([]);
    rows.push(['Totals', `${f.leaders.length} referrers`, '', '', f.invites, f.joins, f.rate + '%', f.days, '']);
    csvDownload('doorpass-referrals.csv', rows);
    toast(`Referral report exported · ${f.leaders.length} referrers, ${f.joins} joins.`, 'ok');
  }

  function saveShift() {
    const box = document.getElementById('shiftNote');
    if (box) S.shiftNote = box.value.slice(0, 600);
    pushEvent('automation', 'Shift handover saved', S.shiftNote ? S.shiftNote.slice(0, 90) : 'Note cleared for the next shift', { actor: 'Front desk' });
    save();
    toast('Shift note saved for the next shift.', 'ok');
  }

  function copyShift() {
    const box = document.getElementById('shiftNote');
    const note = box ? box.value : S.shiftNote;
    if (!note || !note.trim()) { toast('Write a handover note first.', 'warn'); return; }
    copyText(`*Shift handover · Iron Temple*\n${note.trim()}`, 'Handover copied.');
  }

  function submitAdd(form) {
    const name = $('#addName').value.trim();
    const phone = $('#addPhone').value.replace(/\D/g, '');
    const plan = Number($('#addPlan').value);
    const start = $('#addStart').value || todayISO();
    const method = $('#addMethod').value;
    const notes = $('#addNotes').value.trim();
    const err = $('#addErr');
    if (name.length < 2) { err.textContent = 'Enter the member’s full name.'; $('#addName').focus(); return; }
    if (phone.length !== 10) { err.textContent = 'Enter a valid 10-digit phone number.'; $('#addPhone').focus(); return; }
    const clash = S.members.find(x => x.phone === phone);
    if (clash) { err.textContent = `That phone number is already used by ${clash.name}`; $('#addPhone').focus(); return; }
    if (!PLANS[plan]) { err.textContent = 'Pick a plan.'; return; }
    const bonus = S.settings.offer && plan >= 3 ? S.settings.offerDays : 0;
    const end = toISO(addDays(fromISO(start), plan * 30 + bonus));
    const pay = method === 'Pay later' ? 'unpaid' : 'paid';
    const m = {
      id: S.members.reduce((mx, x) => Math.max(mx, x.id), 0) + 1,
      name, phone, plan, end,
      pay, balance: pay === 'paid' ? 0 : PLANS[plan].price,
      lastSeen: 0, visits: 1, hue: (S.members.length * 47) % 360,
      notes, frozen: false, joined: start,
      passDate: null, freezeRequest: null, frozenUntil: null, freezeDays: 0,
      reminders: { 7: false, 3: false, 1: false },
      history: pay === 'paid' ? [{ id: receiptNo(), date: start, amount: PLANS[plan].price, method: method === 'UPI' ? 'UPI' : 'Cash', plan, status: 'paid' }] : []
    };
    S.members.push(m);
    if (pay === 'paid' && start === todayISO()) addCollected(PLANS[plan].price);
    pushEvent('member', `${name} added as a member`, `${PLANS[plan].label}${bonus ? ' · +' + bonus + ' free days' : ''} · ${method}${notes ? ' · ' + notes : ''}`, { memberId: m.id, actor: 'Owner' });
    save();
    closeModal();
    render();
    toast(`${name} added. ${pay === 'paid' ? 'QR sent on WhatsApp.' : 'Marked as pay-later.'}`, 'ok');
  }

  function submitPartial(form) {
    const m = memberById(UI.modal && UI.modal.id);
    if (!m) return;
    const amount = Number($('#partAmount').value);
    const method = $('#partMethod').value;
    const note = $('#partNote').value.trim();
    const err = $('#partErr');
    const due = m.balance || planOf(m).price;
    if (!amount || amount <= 0) { err.textContent = 'Enter an amount above zero.'; return; }
    if (amount > due) { err.textContent = 'That is more than the balance of ' + inr(due) + '.'; return; }
    recordPartial(m, amount, method, note);
    closeModal();
    render();
    toast(`${inr(amount)} recorded. ${m.balance ? inr(m.balance) + ' still due.' : 'Balance cleared.'}`, 'ok');
  }

  function submitFreeze(form) {
    const m = memberById(UI.modal && UI.modal.id);
    if (!m) return;
    const days = Number($('#freezeDays').value) || 14;
    const note = $('#freezeNote').value.trim();
    const base = daysUntil(m.end) >= 0 ? fromISO(m.end) : TODAY;
    m.end = toISO(addDays(base, days));
    m.frozen = true;
    m.frozenUntil = toISO(addDays(TODAY, days));
    m.freezeDays = days;
    m.freezeRequest = null;
    pushEvent('member', `${m.name}'s membership frozen`, `Paused for ${days} days · end date moved to ${fmtDate(m.end)}${note ? ' · ' + note : ''}`, { memberId: m.id, actor: 'Owner' });
    save();
    closeModal();
    render();
    toast(`${m.name.split(' ')[0]} frozen for ${days} days. End date moved to ${fmtDate(m.end)}.`, 'ok');
  }

  function unfreezeMember(m) {
    m.frozen = false;
    m.frozenUntil = null;
    m.freezeRequest = null;
    pushEvent('member', `${m.name}'s membership unfrozen`, 'Access restored · end date already includes the pause', { memberId: m.id, actor: 'Owner' });
    save();
    toast(`${m.name.split(' ')[0]} can enter again.`, 'ok');
  }

  function submitEdit(form) {
    const m = memberById(UI.modal && UI.modal.id);
    if (!m) return;
    const name = $('#editName').value.trim();
    const phone = $('#editPhone').value.replace(/\D/g, '');
    const plan = Number($('#editPlan').value);
    const end = $('#editEnd').value;
    const pay = $('#editPay').value;
    const notes = $('#editNotes').value.trim();
    const err = $('#editErr');
    if (name.length < 2) { err.textContent = 'Enter the member’s full name.'; $('#editName').focus(); return; }
    if (phone.length !== 10) { err.textContent = 'Enter a valid 10-digit phone number.'; $('#editPhone').focus(); return; }
    const clash = S.members.find(x => x.id !== m.id && x.phone === phone);
    if (clash) { err.textContent = `That phone number is already used by ${clash.name}.`; $('#editPhone').focus(); return; }
    if (!PLANS[plan] || !end) { err.textContent = 'Pick a plan and a valid end date.'; return; }
    const previousEnd = m.end;
    Object.assign(m, { name, phone, plan, end, notes });
    m.pay = pay;
    if (pay === 'paid') m.balance = 0;
    else if (!m.balance) m.balance = planOf(m).price;
    pushEvent('member', `${name}’s details updated`, `Plan ${PLANS[plan].label} · ends ${fmtDate(end)}${previousEnd !== end ? ` · was ${fmtDate(previousEnd)}` : ''}`, { memberId: m.id, actor: 'Owner' });
    save();
    closeModal();
    render();
    toast('Member details saved.', 'ok');
  }

  function requestFreeze(m) {
    if (['expired', 'grace'].includes(statusOf(m))) {
      toast('Renew the membership before freezing it.', 'warn');
      return;
    }
    if (m.freezeRequest) {
      toast('A request is already waiting for the owner.', 'warn');
      return;
    }
    m.freezeRequest = { action: m.frozen ? 'unfreeze' : 'freeze', days: 14, ts: new Date().toISOString() };
    pushEvent('member', `${m.name} requested ${m.frozen ? 'an unfreeze' : 'a freeze'}`, m.frozen ? 'Waiting for owner approval · access stays blocked' : '14 days · waiting for owner approval', { memberId: m.id, actor: 'Member app' });
    save();
    render();
    toast(m.frozen ? 'Unfreeze request sent to the owner.' : 'Freeze request sent to the owner.', 'ok');
  }

  function refreshCampPreview() {
    const msg = $('#campMsg');
    const prev = $('#campPreview');
    if (!msg || !prev) return;
    const checked = $('[data-camp]:checked');
    const m = checked ? memberById(Number(checked.dataset.camp)) : null;
    prev.textContent = msg.value.replace(/\{name\}/g, m ? m.name.split(' ')[0] : 'there');
  }

  function submitCampaign(form) {
    const ids = $$('[data-camp]:checked', form).map(i => Number(i.dataset.camp));
    const offer = $('#campOffer').value;
    const template = $('#campMsg').value.trim();
    const err = $('#campErr');
    if (!ids.length) { err.textContent = 'Pick at least one member for this campaign.'; return; }
    if (template.length < 20) { err.textContent = 'Write a slightly longer message — at least 20 characters.'; return; }
    if (!template.includes('{name}')) { err.textContent = 'Keep {name} in the message so every member gets their own greeting.'; return; }
    const label = (CAMPAIGN_OFFERS[offer] || CAMPAIGN_OFFERS.free7).label;
    const now = new Date().toISOString();
    ids.forEach(id => {
      const m = memberById(id);
      if (!m) return;
      m.campaignAt = now;
      pushEvent('campaign', `Win-back sent to ${m.name}`, `${label} · personalised WhatsApp · ${inr(WA_COST)} message cost`, { memberId: m.id, actor: 'Autopilot' });
    });
    save();
    closeModal();
    render();
    toast(`Win-back queued for ${ids.length} member${ids.length === 1 ? '' : 's'}. Replies land at the desk.`, 'ok');
  }

  function submitReferral(form) {
    const sel = $('#refMember');
    const m = memberById(sel ? Number(sel.value) : (UI.modal && UI.modal.id));
    if (!m) return;
    m.refInvites = (m.refInvites || 0) + 1;
    pushEvent('referral', `Referral invite sent · ${m.name}`, `Code ${refCodeOf(m)} · link shared on WhatsApp`, { memberId: m.id, actor: 'Owner' });
    save();
    closeModal();
    render();
    toast(`Invite sent to ${m.name.split(' ')[0]}. Their link is ${refCodeOf(m)}.`, 'ok');
  }

  function markReferralJoin(id) {
    const m = memberById(id);
    if (!m) return;
    const days = refRewardDays();
    m.refJoins = (m.refJoins || 0) + 1;
    const auto = ruleOn('referralAuto');
    if (!auto) {
      pushEvent('referral', `Friend joined with ${m.name}'s code`, `Code ${refCodeOf(m)} · reward held because referral auto-apply is paused`, { memberId: m.id, actor: 'System' });
      save();
      closeModal();
      render();
      toast(`Friend joined. Reward paused — turn on referral auto-apply to add ${days} days.`, 'warn');
      return;
    }
    m.refRewardDays = (m.refRewardDays || 0) + days;
    const base = daysUntil(m.end) >= 0 ? fromISO(m.end) : TODAY;
    m.end = toISO(addDays(base, days));
    if (m.frozen && m.frozenUntil) m.frozenUntil = toISO(addDays(fromISO(m.frozenUntil), days));
    pushEvent('referral', `${m.name} earned ${days} free days`, `A friend joined with code ${refCodeOf(m)} · reward added to membership`, { memberId: m.id, actor: 'System' });
    save();
    closeModal();
    render();
    toast(`${m.name.split(' ')[0]} earned ${days} free days — membership extended.`, 'ok');
  }

  function submitOverride(form) {
    const m = memberById(UI.modal && UI.modal.id);
    if (!m) return;
    const reason = $('#ovReason').value;
    const pin = $$('[data-pin]').map(i => i.value).join('');
    const wrap = $('#pinWrap');
    const err = $('#pinErr');
    if (pin.length !== 4) {
      wrap.classList.add('is-bad');
      err.textContent = 'Enter the 4-digit owner PIN.';
      return;
    }
    if (pin !== OWNER_PIN) {
      wrap.classList.add('is-bad');
      err.textContent = 'Wrong PIN. Try 2468 in this demo.';
      $$('[data-pin]').forEach(i => (i.value = ''));
      setTimeout(() => wrap.classList.remove('is-bad'), 350);
      const first = $('[data-pin]');
      if (first) first.focus();
      return;
    }
    UI.released = m.id;
    UI.relay = { kind: 'open', ts: Date.now() };
    pushEvent('override', `${m.name} released by owner`, `Reason: ${reason} · PIN verified · membership still ${STATUS[statusOf(m)].label.toLowerCase()}`, {
      memberId: m.id, actor: 'Owner', reason
    });
    pushEvent('entry', `${m.name} let in on override`, reason, { memberId: m.id, actor: 'Owner' });
    save();
    closeModal();
    render();
    toast('Door released. Reason and PIN are in the audit log.', 'ok');
  }

  function saveSettings(detail) {
    pushEvent('settings', 'Owner settings updated', detail, { actor: 'Owner' });
    save();
    render();
    toast('Saved.', 'ok');
  }

  function updateAddAmount() {
    const plan = Number($('#addPlan') && $('#addPlan').value);
    const method = $('#addMethod') ? $('#addMethod').value : 'Cash';
    const start = ($('#addStart') && $('#addStart').value) || todayISO();
    const el = $('#addAmount');
    if (!el || !PLANS[plan]) return;
    const bonus = S.settings.offer && plan >= 3 ? S.settings.offerDays : 0;
    const end = toISO(addDays(fromISO(start), plan * 30 + bonus));
    const amount = method === 'Pay later' ? 0 : PLANS[plan].price;
    el.innerHTML = icon(method === 'UPI' ? 'card' : 'cash') +
      (amount ? `Collects <b style="margin:0 3px">${inr(amount)}</b> today · ends <b style="margin:0 3px">${fmtDate(end)}</b>${bonus ? ` · +${bonus} free days` : ''} · receipt on WhatsApp.` : `Marked <b style="margin:0 3px">pay later</b> · ends <b style="margin:0 3px">${fmtDate(end)}</b> · balance stays visible at the door.`);
  }

  function updateROI() {
    const r = UI.roi;
    const f = roiFigures();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('roiMembersV', r.members);
    set('roiFeeV', inr(r.fee));
    set('roiLapsesV', r.lapses + '%');
    set('roiRecoveryV', r.recovery + '%');
    set('roiMonthly', inr(f.monthly));
    set('roiLeak', inr(f.lost));
    set('roiAnnual', inr(f.annual));
    set('roiMultiple', f.multiple.toFixed(1) + '×');
    set('roiNet', inr(f.netAnnual));
    const hint = document.querySelector('.slider__hint');
    if (hint) hint.innerHTML = `That is about <b>${f.lapsedMembers} members</b> slipping out every month at this size.`;
    const callout = document.getElementById('roiCallout');
    if (callout) {
      callout.innerHTML = f.lost < f.plan
        ? `At this size, the fee is <b>not covered</b> by lapses alone. DoorPass is a better fit once a gym is a little bigger — or pitch Door Lock.`
        : `You only need to recover <b>${f.breakEven}%</b> of lapses to cover the fee. The rest is profit.`;
    }
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  function handleAct(act, el, e) {
    const id = Number(el.dataset.id);
    const v = el.dataset.v;

    switch (act) {
      case 'theme': toggleTheme(); break;
      case 'palette': openPalette(); break;
      case 'scan': openModal('scanner'); break;
      case 'dismiss-note': UI.noteDismissed = true; renderShell(); break;
      case 'reset-demo': openModal('reset'); break;
      case 'reset-confirm': resetDemo(); break;
      case 'export-backup': exportBackup(); break;
      case 'import-backup': { const f = $('#backupFile'); if (f) f.click(); break; }
      case 'close-modal': closeModal(); break;

      case 'toggle-offline': toggleOffline(); break;
      case 'sync-offline':
        if (UI.queued) {
          const n = UI.queued;
          UI.queued = 0;
          pushEvent('settings', 'Offline queue synced', `${n} check-ins reconciled`, { actor: 'System' });
          toast(`${n} check-in${n === 1 ? '' : 's'} synced.`, 'ok');
          render();
        }
        break;

      case 'select': selectMember(id); break;
      case 'clear-scan': UI.selected = null; UI.released = null; render(); break;
      case 'door-filter': UI.doorFilter = v; render(); break;
      case 'door-renew-toggle': UI.doorRenew.open = !UI.doorRenew.open; render(); break;
      case 'door-plan': UI.doorRenew.plan = Number(v); render(); break;
      case 'door-method': UI.doorRenew.method = v; render(); break;
      case 'door-pay': startPayment('door'); break;

      case 'override': openModal('override', { id }); break;
      case 'remind': { const m = memberById(id); if (m) sendReminder(m, false); break; }
      case 'toggle-sound': UI.sound = !UI.sound; render(); toast(UI.sound ? 'Relay sounds on.' : 'Relay sounds muted.', 'ok'); break;
      case 'test-relay': UI.relay = { kind: 'open', ts: Date.now() }; render(); toast('Test pulse sent to relay 1.', 'ok'); break;
      case 'campaign': openModal('campaign'); break;
      case 'winback-one': openModal('campaign', { ids: [Number(id)] }); break;
      case 'list-radar': go('dashboard'); UI.filter = 'risk'; render(); setTimeout(() => { const l = $('#memberList'); if (l) l.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); break;
      case 'referral': openModal('referral', { id: Number(id) || (S.members[0] && S.members[0].id) }); break;
      case 'copy-ref-link': { const m = memberById(id); if (m) copyText(refLink(m), `${refCodeOf(m)} link copied.`); break; }
      case 'ref-join': markReferralJoin(id); break;
      case 'kiosk': enterKiosk(); break;
      case 'exit-kiosk': exitKiosk(); break;
      case 'kiosk-scan': openModal('scanner'); break;
      case 'kiosk-demo': {
        const pool = S.members.filter(kioskAllowed);
        const pick = pool[Math.floor(Math.random() * pool.length)] || S.members[0];
        if (pick) acceptScan(tokenFor(pick, Math.floor(Date.now() / 30000)));
        break;
      }
      case 'heat-cell': UI.heatCell = { d: el.dataset.d, h: Number(el.dataset.h) }; render(); break;
      case 'heat-clear': UI.heatCell = null; render(); break;

      case 'action-center': openModal('actions'); break;
      case 'task-toggle': {
        toggleTask(el.dataset.task);
        if (UI.modal && UI.modal.type === 'actions') renderModal();
        break;
      }
      case 'task-jump': jumpTask(el.dataset.task); break;
      case 'save-shift': saveShift(); break;
      case 'copy-shift': copyShift(); break;
      case 'rule-run': runRule(el.dataset.rule); break;
      case 'export-referrals': downloadReferrals(); break;
      case 'audit-automation': go('audit'); UI.auditFilter = 'automation'; render(); break;

      case 'nav': go(el.dataset.view); break;
      case 'kpi': UI.filter = v; render(); setTimeout(() => { const l = $('#memberList'); if (l) l.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 40); break;
      case 'view-requests': UI.filter = 'requests'; render(); setTimeout(() => { const l = $('#memberList'); if (l) l.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 40); break;
      case 'list-filter': UI.filter = v; render(); break;
      case 'clear-list-filter': UI.filter = 'all'; UI.search = ''; render(); break;
      case 'chart-range': UI.chartRange = Number(v); render(); break;
      case 'run-queue': runQueue(); break;
      case 'copy-digest': {
        const c = counts();
        const collected = S.stats.chart[S.stats.chart.length - 1];
        copyText(`*DoorPass daily digest · Iron Temple*\n${inr(collected)} collected today\n${c.expiring} expiring this week\n${c.risk} at risk of quitting\n${c.unpaid} unpaid or part-paid`, 'Digest copied.');
        break;
      }
      case 'export-csv': downloadMembers(); break;
      case 'audit-export': downloadAudit(); break;
      case 'audit-filter': UI.auditFilter = v; render(); break;

      case 'add-member': openModal('add'); break;
      case 'open-member': openDetail(id); break;
      case 'renew-member': openRenew(id); break;
      case 'wa-member': { const m = memberById(id); if (m) sendReminder(m, true); break; }

      case 'preview-member': UI.memberId = id; UI.memberRenew = { plan: memberById(id).plan, method: 'upi', busy: false, open: false }; render(); break;
      case 'member-renew': {
        const m = memberById(UI.memberId);
        if (!m) break;
        UI.memberRenew.open = !UI.memberRenew.open;
        if (UI.memberRenew.open) UI.memberRenew = { plan: m.plan, method: 'upi', busy: false, open: true };
        render();
        break;
      }
      case 'member-freeze': {
        const m = memberById(UI.memberId);
        if (m) requestFreeze(m);
        break;
      }
      case 'member-freeze-cancel': {
        const m = memberById(UI.memberId);
        if (m && m.freezeRequest) {
          m.freezeRequest = null;
          save();
          render();
          toast('Freeze request cancelled.', 'ok');
        }
        break;
      }
      case 'scroll-history': {
        const s = $('.member-section--pay');
        if (s) s.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
      case 'member-notices': toast('2 notices: Zumba on Saturday, and the +5 day renewal offer.', 'ok'); break;
      case 'member-plan': UI.memberRenew.plan = Number(v); render(); break;
      case 'member-method': UI.memberRenew.method = v; render(); break;
      case 'member-pay': startPayment('member'); break;

      case 'modal-plan': UI.modal.plan = Number(v); renderModal(); break;
      case 'modal-method': UI.modal.method = v; renderModal(); break;
      case 'modal-pay': startPayment('modal'); break;

      case 'receipt': { const m = memberById(id); if (m) openReceipt(m, el.dataset.pid); break; }
      case 'receipt-print': window.print(); break;
      case 'receipt-copy': {
        const m = memberById(Number(el.dataset.id));
        const p = m && m.history.find(h => h.id === el.dataset.pid);
        if (m && p) copyText(receiptText(m, p), 'Receipt text copied.');
        break;
      }

      case 'detail-renew': openRenew(id); break;
      case 'detail-partial': {
        const m = memberById(id);
        if (!m) break;
        if (m.pay === 'paid' && !m.balance) { toast('No balance due on this membership.', 'warn'); break; }
        openModal('partial', { id });
        break;
      }
      case 'detail-freeze': {
        const m = memberById(id);
        if (!m) break;
        if (m.frozen) {
          unfreezeMember(m);
          closeModal();
          render();
        } else if (['expired', 'grace'].includes(statusOf(m))) {
          toast('Renew this membership before freezing it.', 'warn');
        } else {
          openModal('freeze', { id: m.id, days: m.freezeRequest && m.freezeRequest.action === 'freeze' ? m.freezeRequest.days : 14 });
        }
        break;
      }
      case 'detail-freeze-approve': {
        const m = memberById(id);
        if (!m || !m.freezeRequest) break;
        if (m.freezeRequest.action === 'unfreeze') {
          unfreezeMember(m);
          closeModal();
          render();
        } else {
          openModal('freeze', { id: m.id, days: m.freezeRequest.days || 14 });
        }
        break;
      }
      case 'detail-freeze-decline': {
        const m = memberById(id);
        if (!m) break;
        if (m.freezeRequest) {
          const action = m.freezeRequest.action;
          m.freezeRequest = null;
          pushEvent('member', `${m.name}'s ${action === 'freeze' ? 'freeze' : 'unfreeze'} request declined`, 'Owner declined the request', { memberId: m.id, actor: 'Owner' });
          save();
          closeModal();
          render();
          toast('Request declined.', 'warn');
        }
        break;
      }
      case 'detail-edit': openModal('edit', { id }); break;
      case 'detail-wa': { const m = memberById(id); if (m) { closeModal(); sendReminder(m, true); } break; }

      case 'roi-preset': {
        const P = {
          'Small gym': { members: 120, fee: 1200, lapses: 5, recovery: 35 },
          'Mid gym': { members: 250, fee: 1500, lapses: 8, recovery: 40 },
          '2-branch chain': { members: 600, fee: 1800, lapses: 12, recovery: 45 }
        }[el.dataset.preset];
        if (P) {
          UI.roi = P;
          ['Members', 'Fee', 'Lapses', 'Recovery'].forEach((k, i) => {
            const map = { Members: 'roiMembers', Fee: 'roiFee', Lapses: 'roiLapses', Recovery: 'roiRecovery' };
            const input = document.getElementById(map[k]);
            if (input) input.value = P[['members', 'fee', 'lapses', 'recovery'][i]];
          });
          updateROI();
        }
        break;
      }
      case 'pilot': openModal('pilot', { plan: el.dataset.plan || 'Growth' }); break;
      case 'pilot-copy': {
        const plan = el.dataset.plan || 'Growth';
        copyText(`Hi! I run DoorPass — the door lock + WhatsApp renewal loop for gyms.

Pilot: 30 days, your real member list, no hardware and no contract. Setup takes one day.
Price: ${plan} at the founding rate, locked for life.
Promise: if it does not recover more than its fee in 60 days, I refund you.
No commission on payments — gateway fees go straight to you.

Can I show you a 5-minute demo on your own phone?`, 'Pitch copied. Paste it into WhatsApp.');
        break;
      }
    }
  }

  document.addEventListener('click', e => {
    if (UI.sidebarOpen && !e.target.closest('#sidebar') && !e.target.closest('#menuBtn')) {
      UI.sidebarOpen = false;
      $('#sidebar').classList.remove('is-open');
      $('#menuBtn').setAttribute('aria-expanded', 'false');
    }
    const navEl = e.target.closest('[data-nav]');
    if (navEl) {
      e.preventDefault();
      closePalette();
      go(navEl.dataset.nav);
      return;
    }
    const pal = e.target.closest('[data-palette]');
    if (pal) {
      e.preventDefault();
      choosePalette(pal.dataset.kind, pal.dataset.id);
      return;
    }
    const actEl = e.target.closest('[data-act]');
    if (!actEl) {
      if (e.target.classList && e.target.classList.contains('overlay')) closeModal();
      if (e.target.id === 'paletteOverlay') closePalette();
      return;
    }
    handleAct(actEl.dataset.act, actEl, e);
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'doorSearch') {
      UI.query = t.value;
      UI.focus = 'doorSearch';
      render();
    } else if (t.id === 'listSearch') {
      UI.search = t.value;
      UI.focus = 'listSearch';
      render();
    } else if (t.id === 'paletteInput') {
      UI.palette.q = t.value;
      UI.palette.index = 0;
      refreshPaletteList();
    } else if (t.matches('[data-pin]')) {
      const val = t.value.replace(/\D/g, '').slice(-1);
      t.value = val;
      if (val && t.nextElementSibling) t.nextElementSibling.focus();
    } else if (t.id.startsWith('roi') && t.type === 'range') {
      UI.roi = {
        members: Number($('#roiMembers').value),
        fee: Number($('#roiFee').value),
        lapses: Number($('#roiLapses').value),
        recovery: Number($('#roiRecovery').value)
      };
      updateROI();
    } else if (t.id === 'forecastRate') {
      updateForecast();
    } else if (t.id === 'campMsg') {
      refreshCampPreview();
    } else if (t.id === 'shiftNote') {
      S.shiftNote = t.value.slice(0, 600);
      save();
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'previewSelect') {
      const m = memberById(Number(t.value));
      UI.memberId = m.id;
      UI.memberRenew = { plan: m.plan, method: 'upi', busy: false, open: false };
      render();
    } else if (t.id === 'sortSelect') {
      UI.sort = t.value;
      render();
    } else if (t.id === 'addPlan' || t.id === 'addMethod') {
      updateAddAmount();
    } else if (t.id === 'addStart') {
      updateAddAmount();
    } else if (t.id === 'freezeDays') {
      const m = memberById(UI.modal && UI.modal.id);
      const end = document.getElementById('freezeEnd');
      if (m && end) {
        const base = daysUntil(m.end) >= 0 ? fromISO(m.end) : TODAY;
        end.textContent = fmtDate(toISO(addDays(base, Number(t.value) || 14)));
      }
    } else if (t.id === 'campOffer') {
      const msg = $('#campMsg');
      if (msg) msg.value = campaignTemplate(t.value);
      refreshCampPreview();
    } else if (t.dataset && t.dataset.camp) {
      refreshCampPreview();
    } else if (t.id === 'setOffer') {
      S.settings.offer = t.checked;
      saveSettings(t.checked ? 'Smart renewal offer enabled' : 'Smart renewal offer disabled');
    } else if (t.id === 'setOfferDays') {
      S.settings.offerDays = Number(t.value);
      saveSettings(`Offer set to +${t.value} free days`);
    } else if (t.id === 'setAuto') {
      S.settings.autoReminders = t.checked;
      saveSettings(t.checked ? 'Automatic reminders enabled' : 'Automatic reminders paused');
    } else if (t.id === 'setGrace') {
      S.settings.graceDays = Number(t.value);
      saveSettings(`Grace period set to ${t.value} day(s)`);
    } else if (t.id === 'setFailOpen') {
      S.settings.failOpen = t.checked;
      saveSettings(t.checked ? 'Fail-open enabled' : 'Door will block when offline');
    } else if (t.id === 'setLang') {
      S.settings.language = t.value;
      saveSettings(`Reminder language set to ${t.options[t.selectedIndex].text}`);
    } else if (t.id === 'refMember') {
      const m = memberById(Number(t.value));
      if (m) { UI.modal.id = m.id; renderModal(); }
    } else if (t.id === 'refReward') {
      S.settings.refReward = Number(t.value) || 7;
      saveSettings(`Referral reward set to +${S.settings.refReward} free days`);
    } else if (t.id === 'refFriend') {
      S.settings.refFriend = t.value;
      saveSettings(`Referral friend offer set to ${t.value}`);
    } else if (t.dataset && t.dataset.rule) {
      toggleRule(t.dataset.rule, t.checked);
    }
  });

  document.addEventListener('submit', e => {
    if (e.target.id === 'addForm') { e.preventDefault(); submitAdd(e.target); }
    else if (e.target.id === 'partialForm') { e.preventDefault(); submitPartial(e.target); }
    else if (e.target.id === 'overrideForm') { e.preventDefault(); submitOverride(e.target); }
    else if (e.target.id === 'freezeForm') { e.preventDefault(); submitFreeze(e.target); }
    else if (e.target.id === 'editForm') { e.preventDefault(); submitEdit(e.target); }
    else if (e.target.id === 'scanTokenForm') {
      e.preventDefault();
      const input = document.getElementById('scanToken');
      const err = document.getElementById('scanErr');
      const ok = acceptScan(input ? input.value : '');
      if (!ok && err) {
        const res = parseScan(input ? input.value : '');
        err.textContent = res.error || 'Could not verify that token.';
      }
    }
    else if (e.target.id === 'campaignForm') { e.preventDefault(); submitCampaign(e.target); }
    else if (e.target.id === 'referralForm') { e.preventDefault(); submitReferral(e.target); }
    else if (e.target.id === 'kioskTokenForm') {
      e.preventDefault();
      const input = document.getElementById('kioskToken');
      const err = document.getElementById('kioskErr');
      const ok = acceptScan(input ? input.value : '');
      if (!ok && err) {
        const res = parseScan(input ? input.value : '');
        err.textContent = res.error || 'Could not verify that token.';
      }
    }
  });

  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select';

    if (e.key === 'Escape') {
      if (UI.palette.open) { closePalette(); return; }
      if (UI.modal) { closeModal(); return; }
      if (UI.kiosk.on) { exitKiosk(); return; }
      if (UI.sidebarOpen) { UI.sidebarOpen = false; $('#sidebar').classList.remove('is-open'); return; }
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (UI.palette.open) closePalette(); else openPalette();
      return;
    }

    if (e.key === '/' && !typing && !UI.modal) {
      e.preventDefault();
      if (UI.view !== 'door') go('door');
      setTimeout(() => { const i = $('#doorSearch'); if (i) i.focus(); }, 30);
      return;
    }

    if (UI.palette.open) {
      const items = paletteItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        UI.palette.index = Math.min(items.length - 1, UI.palette.index + 1);
        refreshPaletteList();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        UI.palette.index = Math.max(0, UI.palette.index - 1);
        refreshPaletteList();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = items[UI.palette.index];
        if (it) choosePalette(it.kind, it.id);
      }
      return;
    }

    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.mtable__row')) {
      e.preventDefault();
      openDetail(Number(e.target.dataset.id));
      return;
    }

    if (e.key === 'Enter' && e.target.matches('[data-act="select"]')) {
      e.preventDefault();
      selectMember(Number(e.target.dataset.id));
      return;
    }

    if (e.key === 'Backspace' && e.target.matches('[data-pin]') && !e.target.value) {
      const prev = e.target.previousElementSibling;
      if (prev) prev.focus();
    }

    if (e.key === 'Tab' && UI.modal) {
      const root = $('#modal-root');
      const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', root).filter(x => !x.disabled && x.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- chart tooltip ---------- */
  function bindChart() {
    const wrap = $('#chartWrap');
    if (!wrap) return;
    const tip = $('#chartTip');
    const svg = wrap.querySelector('svg');
    if (!tip || !svg) return;
    const vb = svg.viewBox.baseVal;
    $$('.chart-hit', wrap).forEach(c => {
      c.addEventListener('pointerenter', () => {
        const rect = wrap.getBoundingClientRect();
        const cx = Number(c.getAttribute('cx'));
        const cy = Number(c.getAttribute('cy'));
        tip.innerHTML = `<span>${esc(c.dataset.label)}</span>${inr(c.dataset.value)}`;
        tip.style.left = ((cx / vb.width) * rect.width) + 'px';
        tip.style.top = ((cy / vb.height) * rect.height) + 'px';
        tip.classList.add('is-on');
      });
      c.addEventListener('pointerleave', () => tip.classList.remove('is-on'));
    });
  }
  function bindROI() {
    if (UI.view !== 'roi') return;
    // Values are bound through delegated input events; this keeps the first paint honest.
    updateROI();
  }

  /* ============================================================
     BOOT
     ============================================================ */
  const hashView = (location.hash || '').replace('#', '');
  if (VIEWS.some(v => v.id === hashView)) UI.view = hashView;

  $('#menuBtn').addEventListener('click', () => {
    UI.sidebarOpen = !UI.sidebarOpen;
    $('#sidebar').classList.toggle('is-open', UI.sidebarOpen);
    $('#menuBtn').setAttribute('aria-expanded', String(UI.sidebarOpen));
  });

  window.addEventListener('hashchange', () => {
    const v = (location.hash || '').replace('#', '');
    if (VIEWS.some(x => x.id === v) && v !== UI.view) {
      UI.view = v;
      closeModal();
      render();
      window.scrollTo(0, 0);
    }
  });

  setInterval(() => { updateQR(false); updateKioskClock(); }, 500);

  let lastSyncToast = 0;
  window.addEventListener('storage', e => {
    if (e.key !== STORE_KEY) return;
    try {
      if (!e.newValue) {
        S = seed();
      } else {
        const next = JSON.parse(e.newValue);
        if (!next || next.version !== 3 || !Array.isArray(next.members)) return;
        S = hydrateState(next);
      }
      if (UI.selected && !memberById(UI.selected)) UI.selected = null;
      render();
      const now = Date.now();
      if (now - lastSyncToast > 1500) {
        lastSyncToast = now;
        toast('Synced with another tab.', 'ok');
      }
    } catch (err) {}
  });

  const backupInput = $('#backupFile');
  if (backupInput) {
    backupInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (file) importBackupFile(file);
      backupInput.value = '';
    });
  }

  render();
})();
