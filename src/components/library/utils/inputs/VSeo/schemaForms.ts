/**
 * The structured data forms (backend docs/seo SEO-04): the fields each schema
 * type's form shows, and what Google needs for the type's rich result. The
 * keys are the backend's (library/siteBuilder/schema.ts `schemaProps`), which
 * turns the values into schema.org properties.
 */

export type SchemaFieldKind = 'text' | 'textarea' | 'select' | 'hours' | 'faqs';
export type SchemaField = {
	key: string;
	label: string;
	kind?: SchemaFieldKind;
	placeholder?: string;
	help?: string;
	options?: { value: string; label: string }[];
	/** Shown half width beside the next one. */
	half?: boolean;
};

const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

const ADDRESS: SchemaField[] = [
	{ key: 'street', label: 'Street address', placeholder: 'House 12, Road 4, Dhanmondi' },
	{ key: 'city', label: 'City', placeholder: 'Dhaka', half: true },
	{ key: 'region', label: 'Area or division', half: true },
	{ key: 'postalCode', label: 'Postcode', half: true },
	{ key: 'country', label: 'Country', placeholder: 'BD', help: 'Two letters, like BD or US', half: true },
];
const PRICE: SchemaField[] = [
	{ key: 'price', label: 'Price', placeholder: '1250', half: true },
	{ key: 'currency', label: 'Currency', placeholder: 'BDT', help: 'Three letters, like BDT or USD', half: true },
];
const BUSINESS: SchemaField[] = [
	{ key: 'name', label: 'Name', placeholder: 'The site’s name', help: 'Left empty: the site’s name' },
	{ key: 'logo', label: 'Logo address', placeholder: 'https://…', help: 'Left empty: the site’s logo' },
	{ key: 'telephone', label: 'Phone', placeholder: '+880 1700 000000', half: true },
	{ key: 'email', label: 'Email', half: true },
	...ADDRESS,
	{ key: 'sameAs', label: 'Social profiles', kind: 'textarea', placeholder: 'https://facebook.com/yourpage', help: 'One address per line' },
];

export const SCHEMA_FORMS: Record<string, { about: string; fields: SchemaField[] }> = {
	Organization: { about: 'Your business’s name, logo, contacts and social profiles, for Google’s knowledge panel.', fields: BUSINESS },
	LocalBusiness: {
		about: 'A place customers visit: address, opening hours and phone, for Google Maps and local results.',
		fields: [
			{
				key: 'businessType',
				label: 'Kind of business',
				kind: 'select',
				options: opt([
					['', 'Local business'],
					['Store', 'Shop'],
					['ClothingStore', 'Clothing shop'],
					['ShoeStore', 'Shoe shop'],
					['ElectronicsStore', 'Electronics shop'],
					['Restaurant', 'Restaurant'],
					['CafeOrCoffeeShop', 'Café'],
					['BeautySalon', 'Beauty salon'],
					['HealthAndBeautyBusiness', 'Health and beauty'],
					['MedicalClinic', 'Clinic'],
					['Dentist', 'Dentist'],
					['ProfessionalService', 'Professional service'],
					['LegalService', 'Law firm'],
					['AutoRepair', 'Car repair'],
					['RealEstateAgent', 'Estate agent'],
					['TravelAgency', 'Travel agency'],
					['Hotel', 'Hotel'],
				]),
			},
			...BUSINESS,
			{ key: 'priceRange', label: 'Price range', placeholder: '৳৳', half: true },
			{ key: 'mapUrl', label: 'Map link', placeholder: 'https://maps.google.com/…', half: true },
			{ key: 'hours', label: 'Opening hours', kind: 'hours' },
		],
	},
	Product: {
		about: 'Price, stock and rating under the result.',
		fields: [
			{ key: 'brand', label: 'Brand', half: true },
			{ key: 'sku', label: 'SKU', half: true },
			{ key: 'image', label: 'Image address', placeholder: 'https://…', help: 'Left empty: the share image' },
			...PRICE,
			{
				key: 'availability',
				label: 'Availability',
				kind: 'select',
				options: opt([
					['', '—'],
					['InStock', 'In stock'],
					['OutOfStock', 'Out of stock'],
					['PreOrder', 'Pre-order'],
					['BackOrder', 'Back order'],
					['LimitedAvailability', 'Limited'],
					['Discontinued', 'Discontinued'],
				]),
			},
			{ key: 'ratingValue', label: 'Rating', placeholder: '4.6', help: 'Only with real reviews on the page', half: true },
			{ key: 'reviewCount', label: 'Number of reviews', placeholder: '12', half: true },
		],
	},
	Article: {
		about: 'Author, dates and image for news and article results.',
		fields: [
			{ key: 'author', label: 'Author', half: true },
			{ key: 'authorUrl', label: 'Author page', placeholder: 'https://…', half: true },
			{ key: 'datePublished', label: 'Published', placeholder: '2026-10-27', half: true },
			{ key: 'dateModified', label: 'Updated', placeholder: '2026-10-28', half: true },
			{ key: 'image', label: 'Image address', placeholder: 'https://…', help: 'Left empty: the share image' },
		],
	},
	FAQPage: { about: 'Questions and answers that are on the page itself.', fields: [{ key: 'faqs', label: 'Questions', kind: 'faqs' }] },
	Event: {
		about: 'Date, place and tickets for Google’s event listings.',
		fields: [
			{ key: 'startDate', label: 'Starts', placeholder: '2026-12-01T18:00', half: true },
			{ key: 'endDate', label: 'Ends', placeholder: '2026-12-01T21:00', half: true },
			{
				key: 'attendance',
				label: 'Where',
				kind: 'select',
				half: true,
				options: opt([
					['offline', 'In person'],
					['online', 'Online'],
					['mixed', 'Both'],
				]),
			},
			{
				key: 'status',
				label: 'Status',
				kind: 'select',
				half: true,
				options: opt([
					['', 'Going ahead'],
					['EventPostponed', 'Postponed'],
					['EventRescheduled', 'Moved to a new date'],
					['EventCancelled', 'Cancelled'],
					['EventMovedOnline', 'Moved online'],
				]),
			},
			{ key: 'locationName', label: 'Venue', placeholder: 'Bashundhara Convention Hall' },
			...ADDRESS,
			{ key: 'onlineUrl', label: 'Online link', placeholder: 'https://…', help: 'For an online event' },
			...PRICE,
			{ key: 'ticketUrl', label: 'Tickets link', placeholder: 'https://…' },
			{ key: 'performer', label: 'Performer', half: true },
			{ key: 'organizer', label: 'Organiser', placeholder: 'The site’s name', half: true },
			{ key: 'image', label: 'Image address', placeholder: 'https://…', help: 'Left empty: the share image' },
		],
	},
	Service: {
		about: 'What you offer, where, and from what price.',
		fields: [
			{ key: 'serviceType', label: 'Service', placeholder: 'Shoe repair', half: true },
			{ key: 'areaServed', label: 'Area served', placeholder: 'Dhaka', half: true },
			{ key: 'providerName', label: 'Provided by', placeholder: 'The site’s name' },
			...PRICE,
		],
	},
};
SCHEMA_FORMS.BlogPosting = { ...SCHEMA_FORMS.Article, about: 'Author, dates and image for blog posts.' };

const filled = (v: unknown) => (typeof v === 'string' ? !!v.trim() : typeof v === 'number' ? true : Array.isArray(v) ? v.length > 0 : !!v);

/** What the type's rich result needs and what it's missing (`need`), and what would help (`could`). */
export const schemaGaps = (type: string, d: Record<string, any> = {}) => {
	const need: string[] = [];
	const could: string[] = [];
	const f = (k: string) => filled(d[k]);
	switch (type) {
		case 'LocalBusiness':
			if (!f('street') && !f('city')) need.push('The address');
			if (!f('telephone')) could.push('A phone number');
			if (!(Array.isArray(d.hours) && d.hours.length)) could.push('Opening hours');
			break;
		case 'Product':
			if (!(f('price') && f('currency')) && !(f('ratingValue') && f('reviewCount'))) need.push('A price with its currency, or a rating with the number of reviews');
			if (f('price') && !f('currency')) need.push('The currency');
			if (!f('availability')) could.push('Availability');
			if (!f('brand')) could.push('The brand');
			break;
		case 'Article':
		case 'BlogPosting':
			if (!f('author')) could.push('The author');
			if (!f('datePublished')) could.push('The date it was published');
			if (!f('image')) could.push('An image (the share image is used)');
			break;
		case 'FAQPage':
			if (!(Array.isArray(d.faqs) && d.faqs.some((q: any) => filled(q?.question) && filled(q?.answer)))) need.push('At least one question with its answer');
			break;
		case 'Event': {
			if (!f('startDate')) need.push('When it starts');
			const where = d.attendance || 'offline';
			if (where !== 'online' && !f('locationName') && !f('street') && !f('city')) need.push('The venue or its address');
			if (where !== 'offline' && !f('onlineUrl')) need.push('The online link');
			if (!f('price')) could.push('A ticket price');
			break;
		}
		case 'Organization':
			if (!f('sameAs')) could.push('Social profiles');
			break;
	}
	return { need, could };
};

/** Google's Rich Results Test, for a live address (or empty, to type one in there). */
export const richResultsTest = (url: string) => `https://search.google.com/test/rich-results${url ? `?url=${encodeURIComponent(url)}` : ''}`;
