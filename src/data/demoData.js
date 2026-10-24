/**
 * FootballTrix — demo dataset.
 *
 * Mirrors supabase/seed.sql so the storefront is fully browsable before a
 * Supabase project exists. Ids are stable string slugs rather than UUIDs; the
 * data layer treats ids as opaque, so nothing breaks once real rows arrive.
 *
 * The app NEVER reads this when Supabase is configured. See src/lib/api.js.
 */

import { SIZE_ORDER } from '../lib/config'

const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString()

/** [name, slug, sku, kind, team, short, categorySlug, collectionSlug, base, sale, primary, secondary, featured, best, isNew, rating, count, sold, age] */
const PRODUCT_ROWS = [
  ['Mirpur Reds 2026 Home Jersey', 'mirpur-reds-2026-home-jersey', 'FTX-CLB-1001', 'club', 'Mirpur Reds',
    'Full sublimated home kit with breathable performance mesh.', 'club-jerseys', 'new-season', 2450, 1890, '#DC2626', '#FFFFFF', true, true, true, 4.7, 128, 412, 12,
    '100% Polyester Micro-Mesh',
    ['Sublimated print, no cracks', 'Moisture-wicking fabric', 'Reinforced V-neck collar', 'Taped seams', 'Machine washable'],
    ['home', 'red', 'bangladeshi-league', '2026']],

  ['Abahani Blue Home Kit', 'abahani-blue-home-kit', 'FTX-CLB-1002', 'club', 'Abahani Limited',
    'The iconic sky blue, cut for the modern game.', 'abahani-limited', 'fan-favourite', 2300, null, '#0EA5E9', '#FFFFFF', true, true, false, 4.6, 96, 356, 40,
    '100% Polyester',
    ['Classic sky blue finish', 'White sleeve trim', 'Lightweight knit', 'Fade-resistant dye'],
    ['home', 'blue', 'sky-blue']],

  ['Mohammedan White Away Shirt', 'mohammedan-white-away-shirt', 'FTX-CLB-1003', 'club', 'Mohammedan SC',
    'Crisp white away shirt with black detailing.', 'mohammedan-sc', 'summer-sale', 2200, 1650, '#FFFFFF', '#111827', true, false, false, 4.5, 74, 289, 55,
    '100% Polyester',
    ['Contrast collar trim', 'Shoulder jacquard detail', 'Soft hand feel'],
    ['away', 'white']],

  ['Dhaka United Navy Home', 'dhaka-united-navy-home', 'FTX-CLB-1004', 'club', 'Dhaka United',
    'Deep navy home jersey with a gold crest finish.', 'dhaka-united', 'new-season', 2400, null, '#1E3A8A', '#FACC15', true, false, true, 4.8, 61, 198, 8,
    '100% Polyester',
    ['Raised silicone crest', 'Extended rear hem', 'Gold sleeve stripe'],
    ['home', 'navy', 'gold']],

  ['Bengal Tiger Home Jersey', 'bengal-tiger-home-jersey', 'FTX-NAT-2001', 'national', 'Bangladesh',
    'National colours, ready for matchday.', 'international', 'world-cup-26', 2600, 1950, '#0F7A3D', '#DC2626', true, true, true, 4.9, 204, 690, 5,
    '100% Polyester',
    ['National colour print', 'Gold shoulder panel', 'Matchday cut'],
    ['bangladesh', 'national', 'home']],

  ['Argentina Classic Home', 'argentina-classic-home', 'FTX-NAT-2002', 'national', 'Argentina',
    'Sky blue and white stripes, three gold stars.', 'international', 'world-cup-26', 2700, null, '#7DD3FC', '#FFFFFF', true, true, false, 4.85, 178, 522, 30,
    'Cotton Blend',
    ['Three-star chest detail', 'Classic vertical stripes', 'Soft cotton blend'],
    ['argentina', 'world-cup', 'home']],

  ['Brazil Home 2026', 'brazil-home-2026', 'FTX-NAT-2003', 'national', 'Brazil',
    'Canary yellow with a green collar and trim.', 'international', 'world-cup-26', 2750, 2100, '#FACC15', '#166534', true, false, true, 4.7, 143, 415, 15,
    '100% Polyester',
    ['Contrast green collar', 'Tonal chest graphic', 'Bright sublimation'],
    ['brazil', 'world-cup']],

  ['France Home Jersey', 'france-home-jersey', 'FTX-NAT-2004', 'national', 'France',
    'Deep blue with a red chest band.', 'international', 'world-cup-26', 2700, null, '#1D4ED8', '#DC2626', false, true, false, 4.65, 119, 367, 60,
    '100% Polyester',
    ['Chest band detail', 'Matte texture finish', 'Athletic cut'],
    ['france', 'world-cup', 'home']],

  ['Spain Red Home', 'spain-red-home', 'FTX-NAT-2005', 'national', 'Spain',
    'Bold red with gold trim at the cuffs.', 'international', 'summer-sale', 2600, 1900, '#DC2626', '#F59E0B', false, false, true, 4.55, 88, 254, 18,
    '100% Polyester',
    ['Gold cuff trim', 'Side panel stripe', 'Soft finish'],
    ['spain', 'home']],

  ['World Cup Trophy Home Set', 'world-cup-trophy-home-set', 'FTX-WC-3001', 'international', 'Tournament',
    'Limited-edition tournament jersey with gold print.', 'world-cup', 'world-cup-26', 3500, 2800, '#0B1220', '#C8FF3D', true, false, true, 4.95, 67, 178, 6,
    '100% Polyester Premium',
    ['Metallic gold print', 'Limited edition run', 'Number and name option', 'Gift box included'],
    ['world-cup', 'limited', 'premium']],

  ['Custom Name & Number Jersey', 'custom-name-number-jersey', 'FTX-CUS-4001', 'custom', 'Your Team',
    'Your name, your number, your colours. Made in 3–5 days.', 'custom-jerseys', 'built-for-you', 1800, 1499, '#0B1220', '#C8FF3D', true, false, true, 4.75, 212, 540, 20,
    '100% Polyester Sublimation',
    ['Full sublimation print', 'Custom name and number', 'Badge upload', '3–5 day production', 'Bulk orders welcome'],
    ['custom', 'made-to-order', 'personalised']],

  ['Pro Training Top', 'pro-training-top', 'FTX-TRN-5001', 'training', 'FootballTrix',
    'Lightweight long-sleeve training top.', 'training-wear', 'new-season', 1900, null, '#111827', '#4B5563', false, false, true, 4.6, 103, 312, 10,
    '92% Polyester 8% Elastane',
    ['Flatlock seams', 'Mesh back panel', 'Thumbhole cuffs', 'Four-way stretch'],
    ['training', 'base-layer']],

  ['Matchday Tracksuit Set', 'matchday-tracksuit-set', 'FTX-TRN-5002', 'training', 'FootballTrix',
    'Full zip jacket and matching pant.', 'training-wear', 'fan-favourite', 4200, 3400, '#1F2937', '#F3F4F6', true, true, false, 4.75, 156, 448, 35,
    'Brushed Fleece',
    ['Full zip jacket', 'Matching pant', 'Concealed hood', 'Side pockets'],
    ['tracksuit', 'warmup']],

  ['Match Football (Size 5)', 'match-football-size-5', 'FTX-ACC-6001', 'accessories', 'FootballTrix',
    'Size 5 match ball with a stitched cover.', 'accessories', 'fan-favourite', 1200, 950, '#F8FAFC', '#0B1220', false, false, false, 4.4, 77, 205, 45,
    'PU Cover',
    ['Size 5 regulation', 'Stitched cover', 'All-seam bladder', 'Sold inflated'],
    ['ball', 'accessories', 'size-5']],

  ['Knitted Scarf', 'knitted-scarf', 'FTX-ACC-6002', 'accessories', 'FootballTrix',
    'Soft knitted scarf in club colours.', 'accessories', 'summer-sale', 700, 550, '#0F7A3D', '#DC2626', false, false, false, 4.35, 54, 162, 50,
    'Acrylic Knit',
    ['Woven club name', 'Fringed ends', 'Machine washable'],
    ['scarf', 'accessories']],

  ['Retrofitted Home Jersey', 'retrofitted-home-jersey', 'FTX-CLB-1005', 'club', 'United Road',
    'A late-90s inspired retro cut.', 'europe-clubs', 'fan-favourite', 2900, null, '#7C2D12', '#111827', false, true, false, 4.7, 131, 397, 70,
    '100% Polyester Heavy',
    ['Relaxed retro cut', 'Heavier drape fabric', 'Ribbed collar'],
    ['retro', 'europe']],

  ['Goalkeeper Pro Jersey', 'goalkeeper-pro-jersey', 'FTX-TRN-5003', 'training', 'FootballTrix',
    'Long sleeve goalie kit in high-vis.', 'training-wear', 'fan-favourite', 2600, 2100, '#FACC15', '#111827', false, true, false, 4.8, 98, 342, 25,
    '100% Polyester',
    ['Padded elbow panels', 'Long sleeve', 'High-visibility colourway'],
    ['goalkeeper', 'training']],
]

const LONG_COPY = {
  'mirpur-reds-2026-home-jersey':
    'Built for 90 minutes of support. The Mirpur Reds home shirt uses a lightweight micro-mesh knit that moves with you, stays cool under floodlights, and holds its colour wash after wash. Reinforced collar and a taped hem keep the shape game after game.',
  'abahani-blue-home-kit':
    'A faithful take on the Abahani home colours. Sky blue body, white sleeve trim, and the classic chest stripe rendered in a lighter tint so it reads well both in the stadium and on camera.',
  'mohammedan-white-away-shirt':
    'Clean, sharp and made for away days. A full white body with black trim at the collar and cuffs, finished with a subtle jacquard pattern across the shoulders.',
  'dhaka-united-navy-home':
    'Navy that stays deep in the sun, with gold detailing picked out in a raised silicone crest. The cut is slightly longer at the back for a modern, tucked-in look.',
  'bengal-tiger-home-jersey':
    'The colours everyone in the stands wears. Green and red body with a full gold shoulder panel, printed to survive both the wash cycle and the floodlights.',
  'argentina-classic-home':
    'The stripes that generations of fans have owned. Authentic sky blue and white banding, gold star detail above the chest and a soft cotton-blend finish.',
  'brazil-home-2026':
    'Bright canary yellow with a deep green collar, sleeve cuffs and a tonal graphic across the chest. Made for the loudest section in the stadium.',
  'france-home-jersey':
    'A sharp deep blue body with the signature red band across the chest, finished with a matte texture that looks more expensive than it should.',
  'spain-red-home':
    'Full red body, gold cuff trim and a tonal stripe detail down each side. Simple, loud and extremely easy to match on matchday.',
  'world-cup-trophy-home-set':
    'A limited run for tournament season. Matte black base with an all-over gold tonal graphic and metallic gold sleeve detail, printed with a raised metallic ink.',
  'custom-name-number-jersey':
    'Pick your base colour, upload your club badge, and we print your name and number exactly as you want them. Made to order in Dhaka, so please allow 3–5 working days. Add your design notes at checkout and our print team will confirm on WhatsApp before production.',
  'pro-training-top':
    'The layer you wear before kickoff. Ultra-light with flatlock seams to stop chafing, thumbholes at the cuffs and a mesh back panel for airflow.',
  'matchday-tracksuit-set':
    'Warm-up kit that matches the matchday energy. Full-zip jacket with a concealed hood and a matching tapered pant, both in a soft brushed-back fleece.',
  'match-football-size-5':
    'A proper stitched cover rather than a bonded one, so it keeps its shape and flight through a full Dhaka season. Sold inflated.',
  'knitted-scarf':
    'Heavy enough to actually keep the evening chill out, with a subtle woven club name at each end.',
  'retrofitted-home-jersey':
    'Looser through the body, longer in the sleeve, with a slightly heavier fabric that drapes like a real retro kit. For fans of the original fit.',
  'goalkeeper-pro-jersey':
    'Long sleeves, padded elbows and a high-vis colourway that reads clearly to officials. One of our most reordered items.',
}

const KIND_LABEL = {
  club: 'Club Jersey', international: 'International', national: 'National Team',
  custom: 'Custom', training: 'Training',
}

// Declared before demoProducts: that map runs at module load and reads these,
// so a definition further down the file is a temporal-dead-zone crash.
const CATEGORY_NAME = {
  'club-jerseys': 'Club Jerseys', international: 'International', 'world-cup': 'World Cup',
  'custom-jerseys': 'Custom Jerseys', 'training-wear': 'Training Wear', accessories: 'Accessories',
  'dhaka-united': 'Dhaka United', 'abahani-limited': 'Abahani Limited',
  'mohammedan-sc': 'Mohammedan SC', 'europe-clubs': 'Europe',
}

const COLLECTION_NAME = {
  'summer-sale': 'Summer Sale', 'world-cup-26': 'World Cup 26',
  'new-season': 'New Season', 'fan-favourite': 'Fan Favourite', 'built-for-you': 'Built For You',
}

function buildVariants(row, index) {
  const [, slug, , , , , , , , , primary, secondary] = row
  const code = slug.slice(0, 6).toUpperCase()
  const sizes = SIZE_ORDER.map((size, i) => ({
    id: `${slug}--${size}--home`,
    product_slug: slug,
    size,
    color_name: 'Home Colours',
    color_hex: primary,
    sku: `FTX-${code}-${size}`,
    stock: 6 + ((index * 7 + i * 11) % 34),
    price_override: null,
  }))
  sizes.push({
    id: `${slug}--M--away`,
    product_slug: slug,
    size: 'M',
    color_name: 'Away Colours',
    color_hex: secondary,
    sku: `FTX-${code}-AW`,
    stock: 12,
    price_override: null,
  })
  return sizes
}

export const demoProducts = PRODUCT_ROWS.map((row, index) => {
  const [
    name, slug, sku, kind, teamName, shortDescription, categorySlug, collectionSlug,
    basePrice, salePrice, primary, secondary, isFeatured, isBestSeller, isNewArrival,
    ratingAvg, ratingCount, soldCount, age, material, features, tags,
  ] = row

  return {
    id: slug,
    name,
    slug,
    sku,
    brand: 'FootballTrix',
    team_name: teamName,
    kind,
    kind_label: KIND_LABEL[kind] ?? 'Jersey',
    short_description: shortDescription,
    description: LONG_COPY[slug] ?? shortDescription,
    category_slug: categorySlug,
    category_name: CATEGORY_NAME[categorySlug] ?? 'Jerseys',
    collection_slug: collectionSlug,
    collection_name: COLLECTION_NAME[collectionSlug] ?? 'Collection',
    base_price: basePrice,
    sale_price: salePrice,
    thumbnail_url: null,
    images: [],
    primary_color: primary,
    secondary_color: secondary,
    material,
    fit_type: 'Regular Fit',
    sleeve_type: 'Half Sleeve',
    collar_type: 'V-Neck',
    features,
    tags,
    is_featured: isFeatured,
    is_best_seller: isBestSeller,
    is_new_arrival: isNewArrival,
    is_on_sale: Boolean(salePrice),
    is_active: true,
    status: 'active',
    rating_avg: ratingAvg,
    rating_count: ratingCount,
    sold_count: soldCount,
    created_at: daysAgo(age),
    variants: buildVariants(row, index),
  }
})

export const demoCategories = [
  { id: 'club-jerseys', name: 'Club Jerseys', slug: 'club-jerseys', description: 'Official-style kits from the biggest clubs in Bangladesh and beyond.', icon: 'shield', position: 1, is_active: true, parent_id: null, subcategories: ['dhaka-united', 'abahani-limited', 'mohammedan-sc', 'europe-clubs'] },
  { id: 'international', name: 'International', slug: 'international', description: 'National team kits for the World Cup, Euro and Copa America.', icon: 'globe', position: 2, is_active: true, parent_id: null, subcategories: [] },
  { id: 'world-cup', name: 'World Cup', slug: 'world-cup', description: 'Tournament-ready jerseys and fan editions for the global stage.', icon: 'trophy', position: 3, is_active: true, parent_id: null, subcategories: [] },
  { id: 'custom-jerseys', name: 'Custom Jerseys', slug: 'custom-jerseys', description: 'Your name, your number, your design. Made to order in 3–5 days.', icon: 'paint', position: 4, is_active: true, parent_id: null, subcategories: [] },
  { id: 'training-wear', name: 'Training Wear', slug: 'training-wear', description: 'Training tops, tracksuits, base layers and pre-match jerseys.', icon: 'bolt', position: 5, is_active: true, parent_id: null, subcategories: [] },
  { id: 'accessories', name: 'Accessories', slug: 'accessories', description: 'Scarves, caps, socks and match balls to finish the kit.', icon: 'ball', position: 6, is_active: true, parent_id: null, subcategories: [] },
  { id: 'dhaka-united', name: 'Dhaka United', slug: 'dhaka-united', description: 'Dhaka United kits, home and away.', icon: 'shield', position: 1, is_active: true, parent_id: 'club-jerseys', subcategories: [] },
  { id: 'abahani-limited', name: 'Abahani Limited', slug: 'abahani-limited', description: 'Abahani Limited kits and supporters wear.', icon: 'shield', position: 2, is_active: true, parent_id: 'club-jerseys', subcategories: [] },
  { id: 'mohammedan-sc', name: 'Mohammedan SC', slug: 'mohammedan-sc', description: 'Mohammedan Sporting Club kits.', icon: 'shield', position: 3, is_active: true, parent_id: 'club-jerseys', subcategories: [] },
  { id: 'europe-clubs', name: 'Europe', slug: 'europe-clubs', description: 'Premier League, La Liga, Serie A and Bundesliga clubs.', icon: 'shield', position: 4, is_active: true, parent_id: 'club-jerseys', subcategories: [] },
]

export const demoCollections = [
  { id: 'world-cup-26', name: 'World Cup 26', slug: 'world-cup-26', description: 'National kits for the biggest tournament on earth.', accent_color: '#C8FF3D', is_featured: true, position: 2, is_active: true },
  { id: 'summer-sale', name: 'Summer Sale', slug: 'summer-sale', description: 'Up to 30% off selected club and international kits.', accent_color: '#FF4D4D', is_featured: true, position: 1, is_active: true },
  { id: 'new-season', name: 'New Season', slug: 'new-season', description: "This season's newest arrivals, just landed.", accent_color: '#38BDF8', is_featured: true, position: 3, is_active: true },
  { id: 'fan-favourite', name: 'Fan Favourite', slug: 'fan-favourite', description: 'The kits our customers keep coming back for.', accent_color: '#A78BFA', is_featured: true, position: 4, is_active: true },
  { id: 'built-for-you', name: 'Built For You', slug: 'built-for-you', description: 'Custom jerseys made to your exact spec.', accent_color: '#FB923C', is_featured: true, position: 5, is_active: true },
]

export const demoBanners = [
  { id: 'hero-desktop', title: 'WEAR YOUR PASSION', subtitle: 'Premium Football Jerseys for Every Fan.', eyebrow: 'New Season Collection', placement: 'hero_desktop', cta_label: 'Shop Now', cta_link: '/shop', secondary_cta_label: 'Explore Collections', secondary_cta_link: '/category/club-jerseys', accent_color: '#C8FF3D', position: 1, is_active: true, image_url: null, mobile_image_url: null },
  { id: 'hero-mobile', title: 'WEAR YOUR PASSION', subtitle: 'Premium Football Jerseys for Every Fan.', eyebrow: 'New Season Collection', placement: 'hero_mobile', cta_label: 'Shop Now', cta_link: '/shop', secondary_cta_label: 'Explore Collections', secondary_cta_link: '/category/club-jerseys', accent_color: '#C8FF3D', position: 2, is_active: true, image_url: null, mobile_image_url: null },
  { id: 'wc-midpage', title: 'World Cup 2026', subtitle: 'National kits, ready for the big stage.', eyebrow: 'Tournament', placement: 'midpage', cta_label: 'Shop World Cup', cta_link: '/category/world-cup', accent_color: '#38BDF8', position: 1, is_active: true, image_url: null, mobile_image_url: null },
  { id: 'custom-midpage', title: 'Built For You', subtitle: 'Custom jerseys printed in Dhaka in 3–5 days.', eyebrow: 'Made to order', placement: 'midpage', cta_label: 'Start Customising', cta_link: '/category/custom-jerseys', accent_color: '#FB923C', position: 2, is_active: true, image_url: null, mobile_image_url: null },
  { id: 'sale-strip', title: 'Up to 30% off selected kits', subtitle: 'Summer Sale ends soon.', eyebrow: 'Sale', placement: 'strip', cta_label: 'Shop Sale', cta_link: '/shop?onSale=true', accent_color: '#FF4D4D', position: 1, is_active: true, image_url: null, mobile_image_url: null },
]

export const demoReviews = [
  { id: 'r1', product_slug: 'bengal-tiger-home-jersey', author_name: 'Rakib H.', rating: 5, title: 'Exactly as pictured', body: 'Ordered on Tuesday, got it Wednesday morning inside Dhaka. The print has not cracked after three washes yet. Fitting is true to size.', is_approved: true, is_verified: true, created_at: daysAgo(9) },
  { id: 'r2', product_slug: 'bengal-tiger-home-jersey', author_name: 'Tanvir A.', rating: 5, title: 'Worth every taka', body: 'Cheaper than the ones near my area and the quality is honestly better. Got two for me and my brother.', is_approved: true, is_verified: true, created_at: daysAgo(14) },
  { id: 'r3', product_slug: 'bengal-tiger-home-jersey', author_name: 'Sadia I.', rating: 4, title: 'Good quality, size runs slightly large', body: 'Really nice finish. I usually wear M and this felt a touch roomy, so size down if you are between sizes.', is_approved: true, is_verified: false, created_at: daysAgo(18) },
  { id: 'r4', product_slug: 'bengal-tiger-home-jersey', author_name: 'Imran K.', rating: 5, title: 'Fast delivery, great cloth', body: 'Bought for a match day and it survived an entire 90 in the rain. Proper breathable material.', is_approved: true, is_verified: true, created_at: daysAgo(21) },
  { id: 'r5', product_slug: 'bengal-tiger-home-jersey', author_name: 'Nayeem R.', rating: 4, title: 'Happy with the purchase', body: 'Colour is slightly brighter in person but that is a good thing. Stitching is neat, no loose threads.', is_approved: true, is_verified: false, created_at: daysAgo(26) },
  { id: 'r6', product_slug: 'bengal-tiger-home-jersey', author_name: 'Farhan S.', rating: 5, title: 'Repeat customer', body: 'Third one I have ordered. Consistent quality, which is more than I can say for most sellers here.', is_approved: true, is_verified: true, created_at: daysAgo(31) },
  { id: 'r7', product_slug: 'mirpur-reds-2026-home-jersey', author_name: 'Jahid M.', rating: 5, title: 'Best in Dhaka at this price', body: 'Compared three shops before buying here. This was the best finish by a clear margin.', is_approved: true, is_verified: true, created_at: daysAgo(7) },
  { id: 'r8', product_slug: 'custom-name-number-jersey', author_name: 'Arif H.', rating: 5, title: 'Exactly what I asked for', body: 'Sent my club badge and they called on WhatsApp to confirm the print before starting. Arrived in four days.', is_approved: true, is_verified: true, created_at: daysAgo(11) },
]

export const demoTestimonials = [
  { name: 'Rakib Hasan', city: 'Dhaka', rating: 5, text: 'Ordered Tuesday, wearing it Wednesday. The print still looks new after a month of weekly washes.' },
  { name: 'Tanvir Ahmed', city: 'Chattogram', rating: 5, text: 'Better finish than the shop near my area, and half the price. Already ordered three more.' },
  { name: 'Sadia Islam', city: 'Sylhet', rating: 4, text: 'Fabric is genuinely breathable. I wore it for a full match in the afternoon sun and it was fine.' },
  { name: 'Imran Kabir', city: 'Khulna', rating: 5, text: 'Custom jersey came out exactly like the design I sent. The size run is accurate too.' },
  { name: 'Nayeem Rahman', city: 'Rajshahi', rating: 5, text: 'Third order from them. The quality is consistent, which is rare with jerseys here.' },
  { name: 'Farhan Solaiman', city: 'Comilla', rating: 4, text: 'Delivery inside Dhaka took one day. Packaging was simple but the jersey was well protected.' },
]

export const demoCoupons = [
  { code: 'FTX10', description: '10% off your first order', type: 'percent', value: 10, min_order: 1500, max_discount: 500, is_active: true },
  { code: 'FTX200', description: 'Flat ৳200 off orders over ৳2500', type: 'fixed', value: 200, min_order: 2500, max_discount: 200, is_active: true },
  { code: 'FREESHIP', description: 'Free delivery inside Dhaka', type: 'fixed', value: 80, min_order: 800, max_discount: 80, is_active: true },
]

export const demoSettings = {
  'store.name': 'FootballTrix',
  'store.tagline': 'Premium football jerseys for every fan.',
  'announcement.text': 'Free delivery inside Dhaka on orders over ৳5,000',
  'contact.phone': '+880 1700 000000',
  'contact.whatsapp': '8801700000000',
  'contact.email': 'support@footballtrix.com',
  'contact.address': 'Shop 24, Bashundhara City, Dhaka 1212',
  'contact.hours': 'Saturday–Thursday, 10:00 AM – 9:00 PM',
}

/** Deterministic pseudo-random so SSR-less reloads stay stable. */
function seeded(seed) {
  let s = 0
  for (let i = 0; i < seed.length; i += 1) s = (s * 31 + seed.charCodeAt(i)) % 233280
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** Demo order history for /orders when logged in but Supabase is absent. */
export function demoOrders() {
  const rand = seeded('footballtrix-orders')
  const statuses = ['delivered', 'delivered', 'shipped', 'processing', 'cancelled']
  return Array.from({ length: 5 }, (_, i) => {
    const picks = [
      demoProducts[4], demoProducts[0], demoProducts[10],
      demoProducts[9], demoProducts[12],
    ].slice(0, 2 + Math.floor(rand() * 2))

    const items = picks.map((p) => {
      const qty = 1 + Math.floor(rand() * 2)
      const unit = p.sale_price ?? p.base_price
      const size = p.variants[Math.floor(rand() * 4)]
      return {
        id: `oi-${i}-${p.slug}`,
        product_id: p.slug,
        product_name: p.name,
        product_slug: p.slug,
        image_url: null,
        variant_label: `Size ${size.size} · ${size.color_name}`,
        unit_price: unit,
        quantity: qty,
        line_total: unit * qty,
        primary_color: p.primary_color,
        secondary_color: p.secondary_color,
      }
    })

    const subtotal = items.reduce((sum, it) => sum + it.line_total, 0)
    const delivery = subtotal >= 5000 ? 0 : 80
    const status = statuses[i]

    return {
      id: `demo-order-${i}`,
      order_number: `FTX-2609-${String(1041 - i * 7).padStart(4, '0')}`,
      status,
      payment_status: status === 'cancelled' ? 'refunded' : 'due_on_delivery',
      payment_method: 'cod',
      customer_name: 'Demo Customer',
      customer_phone: '01700000000',
      customer_email: 'demo@footballtrix.com',
      address_line1: 'House 12, Road 5, Dhanmondi',
      area: 'Dhanmondi',
      city: 'Dhaka',
      district: 'Dhaka',
      subtotal,
      delivery_fee: delivery,
      discount: 0,
      total: subtotal + delivery,
      placed_at: daysAgo(i * 9 + 3),
      delivered_at: status === 'delivered' ? daysAgo(i * 9) : null,
      items,
    }
  })
}
