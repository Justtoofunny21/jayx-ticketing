// EDIT THIS. Prices live ONLY on the server; the browser never sets a price.
export const EVENT = {
  name: 'Your Event Name',
  date: 'Sat, 12 Dec 2026 · 6:00 PM',
  venue: 'Venue name, Lafia',
  prefix: 'JX', // ticket ID prefix
  maxPerOrder: 10,
  tiers: [
    { id: 'regular', label: 'Regular', price: 5000, capacity: 300 }, // price in NGN
    { id: 'vip', label: 'VIP', price: 15000, capacity: 50 },
  ],
};
export const tierById = (id) => EVENT.tiers.find((t) => t.id === id);
