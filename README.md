# rmtdco.com

Michael Doerffler's portfolio. Live at **https://rmtdco.com**.

Built with [Astro](https://astro.build) as a static site: there is no server and no database.
Every page is turned into plain HTML at build time and served as files. That is why it is fast,
free to host, and impossible to take down with a traffic spike.

---

## Making a change

1. Edit a file (see the map below).
2. `npm run dev` and open http://localhost:4321 to see it as you type.
3. `npm run build` to check nothing broke. This must pass before you commit.
4. Commit and push to `main` in GitHub Desktop.
5. Watch the **Actions** tab. Three jobs run in order; all three should go green.

The site updates roughly two minutes after the push.

## Where the content lives

Nothing about the site's copy requires touching layout code. Almost all of it is in
`src/data/`, which holds content as plain data rather than markup.

| To change | Edit |
| --- | --- |
| Name, bio, email, LinkedIn, availability, `knowsAbout`, organisation names | `src/data/site.ts` |
| The three case-study rows on the homepage | `src/data/cases.ts` |
| The 3Rivers card and the three coursework projects | `src/data/technical.ts` |
| Hero caption and the top navigation | `src/components/Hero.astro` |
| "Case Studies" heading and the line under it | `src/components/work/WorkIndex.astro` |
| "The machinery behind the case studies" and the skill stream | `src/components/TechnicalSection.astro` |
| All 22 timeline entries, the era labels, the timeline caption | `src/components/TimelineSection.astro` |
| The availability line and contact links in the footer | `src/components/Footer.astro` |
| A case study's full body copy | `src/pages/work/<case>.astro` |
| A page's title and description, the verification and analytics tags | `src/layouts/Base.astro` |
| The summary written for AI systems | `public/llms.txt` (hand-maintained) |

Three rules of thumb: `src/data/` is content, `src/components/` is content plus layout, and
`src/layouts/Base.astro` is the machinery every page inherits.

Some values are deliberately single-source. The email address exists once, in `site.ts`, and
the footer imports it. Change it there and it updates in the footer, the structured data, and
everywhere else at once.

## What `npm run build` actually does

Three steps, in order. If any fails, the whole thing fails and nothing deploys.

```
astro build                          → turns src/ into dist/, the real HTML
node scripts/make-machine-mirrors.mjs → writes a clean .md copy of each page
node scripts/check-build.mjs          → refuses to ship a broken page
```

**`make-machine-mirrors.mjs`** generates `/index.md`, `/work/*.md`, `/technical/*.md` and
`llms-full.txt` from the built HTML. AI systems can read those instead of parsing styled
markup. They are generated, never edited by hand, so they cannot drift from the real pages.

**`check-build.mjs`** is the safety net. It fails the build on a missing title or description,
a canonical pointing somewhere other than rmtdco.com, invalid structured data, more or fewer
than one `<h1>`, a broken or redirecting internal link, a missing markdown mirror, or a
malformed sitemap. If the build fails, read its output: it names the page and the problem.

## Deploying

`.github/workflows/deploy.yml` runs on every push to `main`:

- **build** — installs, runs `npm run build`, uploads `dist/`.
- **deploy** — publishes to GitHub Pages.
- **ping-indexnow** — tells Bing, Yandex and others the site changed, so they re-crawl in
  hours instead of weeks. This one is allowed to warn without failing the deploy.

## Things that will bite you

- **Only `main` deploys.** Work on `main`. A commit on another branch pushes fine and changes
  nothing on the live site.
- **The custom domain lives in repo settings, not in a file.** Settings → Pages → Custom
  domain. Changing the Pages source can clear it, and the symptom is rmtdco.com showing
  "Site not found" while the `github.io` address works.
- **`public/CNAME` is not the authority** for the custom domain under GitHub Actions
  deployment. It ships with the build, but the setting above is what GitHub obeys.
- **Analytics only counts the real site, and you can take yourself out of it.** The Plausible
  tag in `src/layouts/Base.astro` is only rendered when Astro builds for production, so
  `npm run dev` serves pages with no analytics in them at all, and the built tracker only
  initializes when the page is served from rmtdco.com, which keeps `npm run preview` and the
  Netlify preview silent. Your own visits to the live site do count until you opt out: open
  rmtdco.com/?analytics=off once in each browser on each device, and ?analytics=on to undo it.
  Custom events only appear in the dashboard if a goal with the exact same name exists in the
  Plausible site settings.

## Branches

- **`main`** — the site. This is what deploys.
- **`old-site`** — deleted from GitHub in August 2026 after an unredacted client screenshot
  was found on it. Archived locally as `archive/old-site` on the machine that deleted it.

## Local commands

```
npm run dev      # live preview at localhost:4321
npm run build    # full build plus all checks
npm run preview  # serve the built site exactly as it will be published
```
