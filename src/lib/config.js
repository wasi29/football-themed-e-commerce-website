/**
 * FootballTrix — site configuration.
 *
 * Reads from Vite env, with safe defaults so the app boots with no .env file.
 */
export const SITE = {
  name: import.meta.env.VITE_SITE_NAME || 'FootballTrix',
  tagline: 'Premium football jerseys for every fan.',
  currency: 'BDT',
  currencySymbol: '৳',
  // Delivery pricing, mirrored from supabase/seed.sql `settings`.
  // Once Supabase is connected these come from the settings table instead.
  delivery: {
    insideDhaka: 80,
    outsideDhaka: 130,
    freeThreshold: 5000,
    etaDhaka: '1–2 days',
    etaOutside: '2–4 days',
  },
  contact: {
    phone: '+880 1700 000000',
    whatsapp: '8801700000000',
    email: 'support@footballtrix.com',
    address: 'Shop 24, Bashundhara City, Dhaka 1212',
    hours: 'Saturday–Thursday, 10:00 AM – 9:00 PM',
  },
  social: {
    facebook: 'https://facebook.com/footballtrix',
    instagram: 'https://instagram.com/footballtrix',
    youtube: 'https://youtube.com/@footballtrix',
    tiktok: 'https://tiktok.com/@footballtrix',
  },
}

/** All 64 districts of Bangladesh, for the checkout / contact dropdowns. */
export const DISTRICTS = [
  'Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Sylhet', 'Barishal', 'Rangpur', 'Mymensingh',
  'Cumilla', 'Narayanganj', 'Gazipur', 'Tangail', 'Faridpur', 'Gopalganj', 'Madaripur', 'Shariatpur',
  'Munshiganj', 'Rajbari', 'Manikganj', 'Kushtia', 'Chuadanga', 'Meherpur', 'Jhenaidah', 'Magura',
  'Natore', 'Naogaon', 'Chapainawabganj', 'Pabna', 'Sirajganj', 'Bogura', 'Gaibandha', 'Joypurhat',
  'Naogaon', 'Jhalokati', 'Patuakhali', 'Barguna', 'Bhola', 'Feni', 'Noakhali', 'Lakshmipur',
  'Cumilla', 'Brahmanbaria', 'Chandpur', 'Moulvibazar', 'Habiganj', 'Sunamganj', 'Sylhet',
  'Jashore', 'Satkhira', 'Jessore', 'Narail', 'Kushtia', 'Satkhira', 'Jashore',
  'Bagerhat', 'Kushtia', 'Narail', 'Chuadanga',
].filter((d, i, a) => a.indexOf(d) === i).sort()

/** Size run shown on product pages and the cart size picker. */
export const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL']

/** Order status vocabulary, shared by customer order history and the admin panel. */
export const ORDER_STATUS = {
  pending:   { label: 'Pending',   tone: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmed', tone: 'bg-sky-100 text-sky-800' },
  processing:{ label: 'Processing',tone: 'bg-indigo-100 text-indigo-800' },
  shipped:   { label: 'Shipped',   tone: 'bg-violet-100 text-violet-800' },
  delivered: { label: 'Delivered', tone: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelled', tone: 'bg-rose-100 text-rose-800' },
  returned:  { label: 'Returned',  tone: 'bg-slate-200 text-slate-700' },
}
