/**
 * The ten planned starter sites, as data for the mock library.
 *
 * `node tests/fixtures/cloud/build.js` turns this into v1/catalog.json and the
 * placeholder preview images. The real catalog is produced by the publishing
 * tools in a later phase; until the designs exist every site is "coming_soon".
 */
const elementor = { slug: 'elementor', name: 'Elementor', file: 'elementor/elementor.php', version: '4.0', source: 'wordpress.org', required: true };
const pro = { slug: 'elementor-pro', name: 'Elementor Pro', file: 'elementor-pro/elementor-pro.php', version: '4.0', source: 'external', required: true, url: 'https://elementor.com/pro/' };
const woo = { slug: 'woocommerce', name: 'WooCommerce', file: 'woocommerce/woocommerce.php', version: '10.0', source: 'wordpress.org', required: true };

const freeParts = { pages: 'elementor', header: 'elementor', footer: 'elementor', 404: 'elementor', blog: 'theme', single: 'theme' };
const proParts = { pages: 'elementor', header: 'elementor', footer: 'elementor', 404: 'elementor', blog: 'elementor', single: 'elementor' };

module.exports = {
	categories: [
		{ slug: 'business', name: 'Business' },
		{ slug: 'creative', name: 'Creative' },
		{ slug: 'technology', name: 'Technology' },
		{ slug: 'shop', name: 'Online store' },
		{ slug: 'food', name: 'Food and drink' },
		{ slug: 'property', name: 'Real estate' },
		{ slug: 'education', name: 'Education' },
		{ slug: 'health', name: 'Health' },
		{ slug: 'publishing', name: 'Blog and magazine' },
	],
	sites: [
		{
			id: 'business', name: 'Business', category: 'business', tier: 'free', tags: [ 'corporate', 'company', 'services', 'consulting' ],
			summary: 'A clear, confident site for service companies: services, projects, team, pricing and a contact page.',
			pages: [ 'Home', 'About', 'Services', 'Service Details', 'Projects', 'Project Details', 'Team', 'Pricing', 'Blog', 'Single Post', 'Contact', '404' ],
			plugins: [ elementor ], editable: freeParts, colors: [ '#0f2a47', '#2f6fed', '#ffffff' ],
		},
		{
			id: 'agency', name: 'Creative Agency', category: 'creative', tier: 'pro', tags: [ 'agency', 'marketing', 'branding', 'studio' ],
			summary: 'A bold studio site built around case studies, with services, careers and a journal.',
			pages: [ 'Home', 'Studio', 'Services', 'Service Details', 'Work', 'Case Study', 'Careers', 'Journal', 'Single Post', 'Contact', '404' ],
			plugins: [ elementor, pro ], editable: proParts, colors: [ '#111111', '#c6f432', '#ffffff' ],
		},
		{
			id: 'saas', name: 'SaaS', category: 'technology', tier: 'pro', tags: [ 'software', 'app', 'startup', 'technology', 'ai' ],
			summary: 'A product site for software companies: features, pricing, integrations, customers and a demo request.',
			pages: [ 'Home', 'Features', 'Feature Details', 'Pricing', 'Integrations', 'Customers', 'About', 'Blog', 'Single Post', 'Contact', 'Privacy', 'Terms', '404' ],
			plugins: [ elementor, pro ], editable: proParts, colors: [ '#2a1f6b', '#7c5cff', '#ffffff' ],
		},
		{
			id: 'portfolio', name: 'Portfolio', category: 'creative', tier: 'free', tags: [ 'personal', 'designer', 'freelancer', 'resume' ],
			summary: 'A personal site for designers and freelancers: selected work, services, a resume and notes.',
			pages: [ 'Home', 'About', 'Work', 'Project Details', 'Services', 'Service Details', 'Resume', 'Notes', 'Single Post', 'Contact', '404' ],
			plugins: [ elementor ], editable: freeParts, colors: [ '#f3efe8', '#c2410c', '#1c1917' ],
		},
		{
			id: 'shop', name: 'Shop', category: 'shop', tier: 'pro', tags: [ 'store', 'e-commerce', 'products', 'woocommerce' ],
			summary: 'An online store with a lookbook, shipping information and a journal, built on WooCommerce.',
			pages: [ 'Home', 'Shop', 'Product', 'Cart', 'Checkout', 'My Account', 'About', 'Lookbook', 'Shipping and Returns', 'Journal', 'Single Post', 'Contact', '404' ],
			plugins: [ elementor, pro, woo ], editable: Object.assign( { shop: 'elementor' }, proParts ), colors: [ '#efe6da', '#1f2937', '#1f2937' ],
		},
		{
			id: 'restaurant', name: 'Restaurant', category: 'food', tier: 'free', tags: [ 'cafe', 'food', 'menu', 'reservations' ],
			summary: 'A warm site for restaurants and cafes: the menu, reservations, private events and a gallery.',
			pages: [ 'Home', 'Our Story', 'Menu', 'Reservations', 'Private Events', 'Gallery', 'Journal', 'Single Post', 'Contact and Location', '404' ],
			plugins: [ elementor ], editable: freeParts, colors: [ '#1e3a2f', '#e0b25c', '#ffffff' ],
		},
		{
			id: 'real-estate', name: 'Real Estate', category: 'property', tier: 'pro', tags: [ 'property', 'agents', 'listings', 'homes' ],
			summary: 'A site for agencies and agents: listings, property pages, agent profiles and services.',
			pages: [ 'Home', 'Listings', 'Property Details', 'Agents', 'Agent Profile', 'Services', 'Service Details', 'About', 'Blog', 'Single Post', 'Contact', '404' ],
			plugins: [ elementor, pro ], editable: proParts, colors: [ '#26323d', '#c9a26b', '#ffffff' ],
		},
		{
			id: 'education', name: 'Education', category: 'education', tier: 'free', tags: [ 'academy', 'courses', 'school', 'coaching' ],
			summary: 'A site for academies and coaching: courses, instructors, admissions and events.',
			pages: [ 'Home', 'Courses', 'Course Details', 'Instructors', 'Admissions and Fees', 'Events', 'About', 'Blog', 'Single Post', 'Contact', '404' ],
			plugins: [ elementor ], editable: freeParts, colors: [ '#0b4f8a', '#ffcf4a', '#ffffff' ],
		},
		{
			id: 'medical', name: 'Medical', category: 'health', tier: 'free', tags: [ 'clinic', 'doctor', 'healthcare', 'dentist' ],
			summary: 'A calm, trustworthy site for clinics: departments, doctors, patient information and appointments.',
			pages: [ 'Home', 'About', 'Departments', 'Service Details', 'Doctors', 'Doctor Profile', 'Book an Appointment', 'Patient Information', 'Blog', 'Single Post', 'Contact', '404' ],
			plugins: [ elementor ], editable: freeParts, colors: [ '#0e6e6e', '#bfe9e4', '#ffffff' ],
		},
		{
			id: 'magazine', name: 'Magazine', category: 'publishing', tier: 'pro', tags: [ 'blog', 'news', 'editorial', 'publication' ],
			summary: 'An editorial front page with category, article and author layouts for blogs and publications.',
			pages: [ 'Front Page', 'Category', 'Single Article', 'Author', 'About', 'Subscribe', 'Contact', '404' ],
			plugins: [ elementor, pro ], editable: proParts, colors: [ '#ffffff', '#d7263d', '#111111' ],
		},
	],
};
