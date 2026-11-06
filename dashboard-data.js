/* Seeded sample data for the AJ Wellness Spa dashboard mockup. Nothing here is AJ's real data. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AJData = api;
})(globalThis, function () {
  const pad = n => String(n).padStart(2, '0');
  // local day on purpose: toISOString() would file a 12:30 AM Manila booking under yesterday
  const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
  const dayNumber = k => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const absMinutes = d => dayNumber(dateKey(d)) * 1440 + d.getHours() * 60 + d.getMinutes();

  function rangeFor(name, now) {
    const to = dateKey(now);
    if (name === 'today') return { from: to, to };
    return { from: addDays(to, -(parseInt(name, 10) - 1)), to };
  }
  function previousRange(r) {
    const days = dayNumber(r.to) - dayNumber(r.from) + 1;
    return { from: addDays(r.from, -days), to: addDays(r.from, -1) };
  }
  function previousNow(r, now) {
    const days = dayNumber(r.to) - dayNumber(r.from) + 1;
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  }
  const percentChange = (cur, prev) => (prev === 0 ? null : Math.round(((cur - prev) / prev) * 100));

  const BRANCHES = [
    { id: 1, name: 'Tetuan', open: 10 * 60, close: 22 * 60, perDay: 11 },
    { id: 2, name: 'Jumbo Bridge', open: 0, close: 24 * 60, perDay: 20 },
    { id: 3, name: 'MCLL Highway', open: 10 * 60, close: 22 * 60, perDay: 9 },
  ];
  const SERVICES = [
    { id: 'combination', name: 'Combination', minutes: 60, price: 600, weight: 20 },
    { id: 'aromatherapy', name: 'Aromatherapy', minutes: 60, price: 650, weight: 11 },
    { id: 'deep', name: 'Deep tissue', minutes: 60, price: 700, weight: 13 },
    { id: 'hilot', name: 'Traditional hilot', minutes: 60, price: 600, weight: 16 },
    { id: 'back', name: 'Back massage', minutes: 30, price: 350, weight: 9 },
    { id: 'foot', name: 'Foot massage', minutes: 30, price: 350, weight: 10 },
    { id: 'stone', name: 'Hot stone with massage', minutes: 90, price: 900, weight: 6 },
    { id: 'ventosa', name: 'Ventosa with massage', minutes: 75, price: 800, weight: 5 },
    { id: 'scrubw', name: 'Body scrub with whitening and massage', minutes: 90, price: 1100, weight: 4 },
    { id: 'scrub', name: 'Body scrub without whitening, with massage', minutes: 90, price: 950, weight: 3 },
    { id: 'ear', name: 'Ear candling', minutes: 30, price: 300, weight: 3 },
  ];
  const THERAPISTS = [
    [1, 'Liza'], [1, 'Jun'], [1, 'Rhea'], [1, 'Noel'],
    [2, 'Marites'], [2, 'Aileen'], [2, 'Dodong'], [2, 'Grace'], [2, 'Bong'], [2, 'Joy'],
    [3, 'Cherry'], [3, 'Ramil'], [3, 'Nene'], [3, 'Arnel'],
  ].map(([branchId, name], i) => ({ id: i + 1, branchId, name }));
  const CHANNELS = ['Walk-in', 'Messenger', 'Phone', 'Website'];
  const COMMISSION_RATE = 0.4;

  const DAY_HOURS = [1, 1, 1, 2, 3, 4, 4, 4, 5, 6, 7, 8]; // 10 AM to 9 PM
  const ALL_HOURS = [3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 8, 7, 6, 4]; // midnight to 11 PM
  const DAY_FACTOR = [1.2, 0.85, 0.85, 0.9, 0.95, 1.15, 1.3]; // Sunday first
  const NORMAL_MIX = [42, 30, 18, 10];
  const LATE_MIX = [12, 50, 10, 28];

  function prng(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(rnd, weights) {
    let r = rnd() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i; }
    return weights.length - 1;
  }

  function makeData({ seed = 20261105, now = new Date(), days = 60 } = {}) {
    const rnd = prng(seed);
    const today = dateKey(now);
    const busy = new Map(THERAPISTS.map(t => [t.id, []]));
    const bookings = [];
    const isFree = (id, start, end) => busy.get(id).every(([s, e]) => end <= s || start >= e);

    for (let back = days - 1; back >= 0; back--) {
      const date = addDays(today, -back);
      const when = fromKey(date);
      const dom = when.getDate();
      const payday = dom === 15 || dom === 16 || dom >= 30 || dom === 1 ? 1.2 : 1;
      const trend = 1 + 0.12 * (1 - back / days);
      for (const branch of BRANCHES) {
        const team = THERAPISTS.filter(t => t.branchId === branch.id);
        const target = Math.round(branch.perDay * DAY_FACTOR[when.getDay()] * payday * trend * (0.88 + rnd() * 0.24));
        for (let k = 0; k < target; k++) {
          for (let attempt = 0; attempt < 14; attempt++) {
            const hour = branch.close - branch.open === 1440 ? pick(rnd, ALL_HOURS) : 10 + pick(rnd, DAY_HOURS);
            const startMin = hour * 60 + 15 * Math.floor(rnd() * 4);
            const service = SERVICES[pick(rnd, SERVICES.map(s => s.weight))];
            if (branch.close !== 1440 && startMin + service.minutes > branch.close) continue;
            const abs = dayNumber(date) * 1440 + startMin;
            const offset = Math.floor(rnd() * team.length);
            const therapist = team.map((_, i) => team[(i + offset) % team.length]).find(t => isFree(t.id, abs, abs + service.minutes));
            if (!therapist) continue;
            busy.get(therapist.id).push([abs, abs + service.minutes]);
            const afterHours = startMin >= 22 * 60 || startMin < 6 * 60;
            bookings.push({
              id: `B${bookings.length + 1}`,
              date, startMin, abs,
              branchId: branch.id,
              serviceId: service.id,
              therapistId: therapist.id,
              minutes: service.minutes,
              price: service.price,
              commission: Math.round(service.price * COMMISSION_RATE),
              channel: CHANNELS[pick(rnd, afterHours ? LATE_MIX : NORMAL_MIX)],
              afterHours,
            });
            break;
          }
        }
      }
    }
    bookings.sort((a, b) => a.abs - b.abs);
    return { branches: BRANCHES, services: SERVICES, therapists: THERAPISTS, channels: CHANNELS, commissionRate: COMMISSION_RATE, bookings };
  }

  function blankBranches(data) { return Object.fromEntries(data.branches.map(b => [b.id, 0])); }

  function summarize(data, { branchId = null, from, to, now }) {
    const nowAbs = absMinutes(now);
    const rows = data.bookings.filter(b => b.date >= from && b.date <= to && (branchId === null || b.branchId === branchId) && b.abs <= nowAbs);
    const dates = [];
    for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);
    const byDay = dates.map(date => ({ date, perBranch: blankBranches(data), total: 0 }));
    const dayIndex = new Map(dates.map((d, i) => [d, i]));
    const byHour = Array.from({ length: 24 }, (_, hour) => ({ hour, perBranch: blankBranches(data), total: 0 }));
    const branches = new Map(data.branches.filter(b => branchId === null || b.id === branchId).map(b => [b.id, { id: b.id, name: b.name, sales: 0, count: 0 }]));
    const therapists = new Map();
    const services = new Map();
    const channels = new Map(data.channels.map(c => [c, { name: c, count: 0 }]));
    let sales = 0, commission = 0, afterHours = 0;

    for (const b of rows) {
      sales += b.price; commission += b.commission; if (b.afterHours) afterHours++;
      const day = byDay[dayIndex.get(b.date)];
      day.perBranch[b.branchId] += b.price; day.total += b.price;
      const hr = byHour[Math.floor(b.startMin / 60)];
      hr.perBranch[b.branchId] += b.price; hr.total += b.price;
      const br = branches.get(b.branchId); br.sales += b.price; br.count++;
      if (!therapists.has(b.therapistId)) {
        const t = data.therapists.find(x => x.id === b.therapistId);
        therapists.set(b.therapistId, { id: t.id, name: t.name, branchId: t.branchId, count: 0, sales: 0, commission: 0 });
      }
      const th = therapists.get(b.therapistId); th.count++; th.sales += b.price; th.commission += b.commission;
      if (!services.has(b.serviceId)) {
        const s = data.services.find(x => x.id === b.serviceId);
        services.set(b.serviceId, { id: s.id, name: s.name, count: 0, sales: 0 });
      }
      const sv = services.get(b.serviceId); sv.count++; sv.sales += b.price;
      channels.get(b.channel).count++;
    }
    return {
      count: rows.length, sales, commission, afterHours,
      average: rows.length ? Math.round(sales / rows.length) : 0,
      byDay, byHour,
      byBranch: [...branches.values()],
      byTherapist: [...therapists.values()].sort((a, b) => b.commission - a.commission),
      byService: [...services.values()].sort((a, b) => b.sales - a.sales),
      byChannel: [...channels.values()].sort((a, b) => b.count - a.count),
    };
  }

  function schedule(data, { branchId = null, date, now }) {
    const nowAbs = absMinutes(now);
    return data.bookings
      .filter(b => b.date === date && (branchId === null || b.branchId === branchId))
      .map(b => ({ ...b, status: b.abs <= nowAbs ? 'done' : 'upcoming', inSession: b.abs <= nowAbs && nowAbs < b.abs + b.minutes }));
  }

  function heatmap(data, { branchId = null, from, to, now }) {
    const nowAbs = absMinutes(now);
    const cells = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const b of data.bookings) {
      if (b.date < from || b.date > to || b.abs > nowAbs) continue;
      if (branchId !== null && b.branchId !== branchId) continue;
      const row = (fromKey(b.date).getDay() + 6) % 7; // Monday first
      cells[row][Math.floor(b.startMin / 60)]++;
    }
    return { cells, max: Math.max(...cells.flat()) };
  }

  function liveStatus(data, { now }) {
    const date = dateKey(now);
    const minute = now.getHours() * 60 + now.getMinutes();
    return data.branches.map(b => {
      const list = schedule(data, { branchId: b.id, date, now });
      const done = list.filter(x => x.status === 'done');
      return {
        id: b.id,
        name: b.name,
        open: minute >= b.open && minute < b.close,
        inSession: list.filter(x => x.inSession).length,
        next: list.find(x => x.status === 'upcoming') || null,
        todaySales: done.reduce((n, x) => n + x.price, 0),
        todayCount: done.length,
      };
    });
  }

  return { dateKey, absMinutes, addDays, rangeFor, previousRange, previousNow, percentChange, makeData, summarize, schedule, heatmap, liveStatus };
});
