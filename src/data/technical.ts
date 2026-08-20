// Technical project content, per Michael's complete handoff. Shared between
// the homepage index (TechnicalSection) and the project pages under
// /technical/, so the two can never drift apart.
//
// Hard rule: no em dashes anywhere. Labels follow one convention: domain · context.

export interface TechnicalProject {
  slug: string;
  tag: string;
  title: string;
  paras: string[];
  stack: string;
  method: string;
  /** Meta description for the page. Kept under 155 so search results do not cut it. */
  description: string;
  /** Structured-data only: the subject areas the project demonstrates. These
   *  restate what the tag and the copy already say. No dates: the site does
   *  not state when the coursework ran, so neither does the markup. */
  domains: string[];
}

/** The 3Rivers dossier: hand-built rather than generated, because it carries a
 *  diagram and a manager endorsement the coursework pages do not. Its card copy
 *  sits here rather than inline in TechnicalSection so the section renders from
 *  data like the three coursework projects beside it. */
export const featured = {
  slug: '3rivers',
  tag: 'DATA ENGINEERING & BI · REGULATED FINANCIAL INSTITUTION',
  title: '3Rivers Federal Credit Union',
  blurb:
    'A mortgage inquiry intelligence report built on protected member data, shaped directly with the team that uses it.',
};

export const projects: TechnicalProject[] = [
  {
    slug: 'default-risk',
    tag: 'MACHINE LEARNING · GRADUATE COURSEWORK (ISM 6136)',
    title: 'Modeling Default Risk',
    paras: [
      'An end-to-end pipeline predicting loan defaults, and using the results to propose an actual lending strategy, not just a model.',
      'After EDA, I ran k-Means clustering (k=4, silhouette 0.514) to segment borrowers, then compared Decision Trees against neural networks for the prediction task. I selected a reduced neural network on recall (0.83) and F1 (0.72), because in default prediction, missing a defaulter costs far more than flagging a good borrower, so recall matters more than raw accuracy.',
      'The clusters mapped to default rates ranging from 7.6% to 73.7%, which let me propose a two-stage lending pipeline: segment first, then score, turning the model into a decision the business could act on.',
    ],
    stack: 'Python · scikit-learn · Keras · pandas',
    method: 'EDA · k-Means clustering (k=4, silhouette 0.514) · Decision Tree vs. neural network · model selection on recall/F1 over accuracy · cluster-to-default-rate mapping into a two-stage pipeline',
    description: 'An end-to-end pipeline predicting loan defaults, selected on recall over accuracy, and turned into a two-stage lending strategy the business could act on.',
    domains: ['Machine learning', 'Predictive modeling', 'Clustering', 'Credit risk', 'Model evaluation'],
  },
  {
    slug: 'sports-cities',
    tag: 'DATA INTEGRATION & VISUALIZATION · GROUP PROJECT (ISM 4930)',
    title: 'Do Sports Teams Make Cities Richer?',
    paras: [
      "Cities spend billions in public money on stadiums, betting that teams drive local growth. We tested whether that's actually true: 90 teams across three leagues, four seasons, joined to federal income and employment data for 40 metro areas.",
      "The hard part was the data, not the analysis. Teams belong to metro areas; government economic data is published by county; and mid-project, the BEA discontinued the metric we'd planned to use. We rebuilt around personal income, aggregated counties up to metros using OMB delineations, and joined 360 team-seasons to the economic data on a shared key in Tableau.",
      "The finding: teams cluster in cities that were already wealthy. Payroll growth and income growth move independently over time, so the correlation is city size, not cause. The money doesn't follow the teams.",
    ],
    stack: 'Tableau · Excel · public data (Spotrac, Sports Reference, BEA, BLS, Census, OMB)',
    method: 'County-to-MSA aggregation via OMB delineations · shared Metro Area join key · three-table model (360 team-seasons across 40 metros) · correlation vs. causation via growth comparison',
    description: '90 teams, four seasons, joined to federal economic data for 40 metros. The finding: teams cluster in cities that were already wealthy.',
    domains: ['Data integration', 'Data visualization', 'Public economic data', 'Correlation and causation', 'Sports economics'],
  },
  {
    slug: 'finedu',
    tag: 'DATABASE DESIGN · SQL · PASSION PROJECT',
    title: 'FinEdu',
    paras: [
      "Not a class prompt. FinEdu is the financial-literacy venture I've carried since founding an investment club in high school and writing a 16-page DECA business plan around making financial education accessible to underserved communities. This is where I gave that mission a real backend.",
      'A normalized relational database (6 tables: Customer, Product, Order, OrderDetail, Instructor, CommunityPartner) modeling how the business would actually run: customers referred by community partners, services delivered by instructors, orders resolved through a many-to-many bridge. Designed to Third Normal Form for data integrity and clean scaling.',
      'Then the queries the business would actually ask: top-selling services, average order value ranked per customer, cumulative spend over time, customers spanning multiple categories, using JOINs, nested subqueries, and window functions (RANK, PARTITION BY).',
    ],
    stack: 'MySQL · SQL',
    method: 'ERD and schema design · 3NF normalization · PK/FK constraints · many-to-many resolution via bridge table · complex queries (multi-table JOINs, nested subqueries, window functions)',
    description: 'The financial-literacy venture I have carried since high school, given a real backend: a 3NF relational database and the queries a business would ask.',
    domains: ['Database design', 'Relational modeling', 'Normalization', 'Window functions', 'Financial literacy'],
  },
];
