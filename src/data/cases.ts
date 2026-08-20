// The three flagship case studies, kept out of the component so the rows are
// data rather than markup. Same arrangement src/data/technical.ts already uses
// for the technical work.
//
// Hard rule, as everywhere: no em dashes. Meta labels follow one convention:
// organization · sector · year.

export interface CaseStudy {
  title: string;
  desc: string;
  meta: string;
  href: string;
  /** False parks a case in the index without linking it. */
  live: boolean;
}

export const cases: CaseStudy[] = [
  {
    title: 'Public Health System Modernization',
    desc: 'A county permitting project had stalled, so I stepped into the technical build and helped turn it into a working digital system with automated workflows, centralized records, and a clean handoff to the department.',
    meta: 'FLORIDA DEPARTMENT OF HEALTH · GOVERNMENT · 2026',
    href: '/work/permit-modernization/',
    live: true,
  },
  {
    title: 'AI Sales Workflow Automation',
    desc: 'What started as an early AI prospecting workflow became a repeatable system for a 14-person BDR team, with my work focused on rebuilding, testing, and making it usable enough to support broader adoption.',
    meta: 'A-LIGN · B2B CYBERSECURITY COMPLIANCE · 2026',
    href: '/work/prospecting-automation/',
    live: true,
  },
  {
    title: 'Data & Analytics in Real Estate',
    desc: 'A brokerage had years of sales, relationship, and client data but no connected way to use it. I built the reporting, analysis, and systems that helped turn it into usable business intelligence.',
    meta: 'THE NOLL TEAM · DATA & ANALYTICS · 2025',
    href: '/work/noll-team/',
    live: true,
  },
];
