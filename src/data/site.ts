// One source of truth for the machine-readable description of this site's
// subject. Hard rule, same as the copy: every value here restates something a
// visitor can already read on the site. Nothing is asserted to a crawler that
// the pages themselves do not support.

export const SITE_URL = 'https://rmtdco.com';

// Stable @id anchors. Every page's JSON-LD graph points at these, so a crawler
// reading any single page can tell that its author is the same entity as the
// homepage's subject rather than a second person with the same name.
export const PERSON_ID = `${SITE_URL}/#person`;
export const SITE_ID = `${SITE_URL}/#website`;

export const NAME = 'Michael Doerffler';
export const EMAIL = 'michael@rmtdco.com';
export const LINKEDIN = 'https://www.linkedin.com/in/michael-doerffler';

/** The professional sentence, in the register the site is written in. Page
 *  meta descriptions vary around it; this is the version machines read. */
export const BIO =
  'Early-career technology and business professional working where data, AI, and automation meet how an organization actually runs. ' +
  'Public-sector systems, AI sales workflows, and business intelligence, carried past analysis into implementation, adoption, and handoff. ' +
  'B.S. in Artificial Intelligence and Business Analytics, University of South Florida, December 2026. ' +
  'Looking for full-time work from December 2026 in consulting, data and analytics, business systems, or revenue operations.';

/** What he is looking for. The footer says this in one compressed line; the
 *  machine layer keeps the four role areas named, because a retrieval system
 *  matching a job description needs the specifics the human line compresses. */
export const SEEKING = 'Full-time roles in technology and management consulting, data and analytics or business intelligence, business systems and solutions, or GTM and revenue operations.';
export const AVAILABLE_FROM = '2026-12';

/** Shorter form, for og:description and the homepage meta description. */
export const BIO_SHORT =
  'Early-career technology and business professional building data, AI, and automation systems for a health department, cybersecurity compliance firm A-LIGN, and a brokerage.';

/** Subjects the site demonstrates. Each one has a case study or a technical
 *  project behind it; none is here to catch a search term. */
export const KNOWS_ABOUT = [
  'Business intelligence',
  'Data analytics',
  'Process automation',
  'Workflow automation',
  'Business systems',
  'Power BI',
  'Power Query',
  'DAX',
  'Microsoft Power Platform',
  'SharePoint',
  'Power Automate',
  'SQL',
  'Python',
  'Large language model workflows',
  'AI-assisted sales workflows',
  'Data modeling',
  'Public-sector technology',
  'Sales operations',
];

/** Organizations named on the site, so a case page's `about` resolves to a
 *  real entity rather than a bare string. */
export const ORGS = {
  doh: { name: 'Florida Department of Health', url: 'https://www.floridahealth.gov/' },
  troubadour: { name: 'Troubadour Health' },
  align: { name: 'A-LIGN', url: 'https://www.a-lign.com/' },
  noll: { name: 'The Noll Team' },
  threeRivers: { name: '3Rivers Federal Credit Union', url: 'https://www.3riversfcu.org/' },
  usf: { name: 'University of South Florida', url: 'https://www.usf.edu/' },
} as const;

/** The Person node. Reused verbatim on the homepage and referenced by @id
 *  everywhere else.
 *
 *  No `jobTitle`: he is a student with a run of internships, and any title
 *  broad enough to cover the work would be a claim the site does not make.
 *  `affiliation` rather than `alumniOf` for the same reason, until Dec 2026. */
export function personNode(imageUrl: string) {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: NAME,
    url: SITE_URL,
    image: imageUrl,
    description: BIO,
    email: `mailto:${EMAIL}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Tampa',
      addressRegion: 'FL',
      addressCountry: 'US',
    },
    affiliation: { '@type': 'CollegeOrUniversity', name: ORGS.usf.name, url: ORGS.usf.url },
    knowsAbout: KNOWS_ABOUT,
    // The semantically correct home for "what roles is he after". Little
    // consumed today, but it costs nothing and the description above carries
    // the same statement in the field retrieval systems actually read.
    seeks: {
      '@type': 'Demand',
      name: SEEKING,
      availabilityStarts: AVAILABLE_FROM,
    },
    sameAs: [LINKEDIN],
  };
}

/** Bare reference to the same person, for pages that are not the profile. */
export const personRef = { '@type': 'Person', '@id': PERSON_ID, name: NAME, url: SITE_URL };
