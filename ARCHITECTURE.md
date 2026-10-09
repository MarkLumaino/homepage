# Frontend architecture

> **Status: planned, not yet built.** The live site is still the single page made of `index.html`, `css/styles.css` and `js/main.js`, deployed from the branch root. This document describes the next version and the decisions behind it. Update it when a decision changes.

## 0. Goals and audience

| Decision | Choice |
|---|---|
| Primary visitor | An overseas hiring manager filling a **full-time remote** role |
| Title on the page | **Full-Stack Engineer**. Seniority comes from 5+ years and team-lead experience, not from the title. |
| Availability line | Remote · Cebu, PH (UTC+8) · Flexible hours · Open to full-time |
| Primary action | **Download CV (PDF)**. LinkedIn and GitHub are secondary. |
| Proof | Four case studies, all public with real names: DEX (Rak Son OPC, **in development**, no public link yet), Japanese clinic sites (Human Incubator), admin/business systems, freelance sites |
| Removed | The Services section (aimed at clients) and the project filter (four items don't need filtering) |

A hiring manager decides in about 60 seconds, so the page answers in this order: **what role → how senior → does the time zone work → is there proof → where's the CV.**

## 1. System overview

```
content/portfolio.json ──┐
templates/*.mjs ─────────┤   scripts/build.mjs          dist/
src/styles/*.css ────────┼─▶ (Node, no dependencies) ─▶ ├─ index.html
src/js/*.js ─────────────┤   runs in a GitHub Action    ├─ work/<slug>/index.html  ×4
assets/ (images, CV PDF) ┘   on every push              ├─ 404.html
                                                        ├─ cv.pdf
                                                        ├─ css/site.css   (files joined)
                                                        ├─ js/main.js     (ES module)
                                                        └─ sitemap.xml
```

- **Source of truth:** `content/portfolio.json`. Case-study bodies are stored as typed blocks (`problem`, `decision`, `result`, `figure`). That forces every case study into the same structure, and Node can read the file without installing any packages.
- **Templates:** plain JavaScript functions that return HTML strings. There's no framework; each component in section 2 is one function.
- **Build-time validation:** the build fails on:
  - a missing required field
  - a duplicate slug
  - an image file that doesn't exist
  - a project link that is `#` or `#contact`
  - a case study marked `live` that has no URL

  Placeholder links can't ship.
- **Project status:** every case study has `status: "live" | "in-development"`. An in-development project shows an **In development** badge instead of a link, so unfinished work reads as current work rather than a broken promise. Switching it to `live` once there's a URL is a one-field change.
- **Link previews:** each page gets its own title, description, canonical URL and preview image from the data file. `site.url` in the data file replaces the `YOUR_USERNAME` placeholder.
- **Deploy:** `actions/upload-pages-artifact` then `actions/deploy-pages`. **One-time change:** in repo settings, Pages switches its source from the branch to **GitHub Actions**.
- **Local preview (optional):** `node scripts/build.mjs --serve` builds the site and serves `dist/` from a built-in server. It needs only Node. Opening the generated HTML files straight from disk also works, because every page is fully rendered.

### CV

| | |
|---|---|
| Source | `assets/Mark_Lumaino_Updated_CV.docx` (edit this one) |
| Published file | `assets/Mark_Lumaino_Updated_CV.pdf`, exported from Microsoft Word |
| Served at | `/cv.pdf`. Its link uses `download="Mark-Lumaino-Full-Stack-Engineer-CV.pdf"`, so the downloaded file gets a sensible name. |
| Re-export | In Word: **File → Export → Create PDF/XPS**, overwriting the PDF. Use Word rather than converting on GitHub's servers: Linux converters substitute fonts and the layout shifts. |
| Guard | The build warns when the .docx has a newer commit than the PDF (`git log -1 --format=%ct`), and fails if the PDF is missing. |

## 2. Component tree

### Shared layout

```
Document
├─ <head>
│  ├─ PageMeta          title, description, canonical, page-specific link-preview tags
│  ├─ FontLoader        preconnect + Google Fonts stylesheet (Archivo, Newsreader, IBM Plex Mono)
│  ├─ StructuredData    Person data on home, article data on case studies
│  └─ Analytics         GoatCounter script (async)
├─ SkipLink
├─ SiteHeader
│  ├─ Brand             monogram + name → /
│  ├─ CvButton (compact) always visible, including on mobile
│  ├─ MenuToggle        mobile only
│  └─ PrimaryNav        Work · Experience · How I work · Stack · Contact
├─ <main>               page content (below)
├─ SiteFooter (dark)
│  ├─ Brand
│  ├─ Tagline
│  ├─ ProfileLinks      GitHub, LinkedIn, Email
│  └─ Copyright
└─ BackToTop
```

### Home: `/`

```
HomePage
├─ Hero
│  ├─ AvailabilityBadge   "Open to full-time · Remote · UTC+8 · Flexible hours"
│  ├─ Headline (h1)       "Full-Stack Engineer" + italic emphasis phrase
│  ├─ Lede
│  ├─ ActionRow
│  │  ├─ CvButton (primary)
│  │  └─ Button (ghost) → #work
│  └─ Portrait            figure + caption
├─ ProofStrip
│  └─ Stat ×3–4           number + label (e.g. "20+ / clinic sites shipped")
├─ Section#work
│  ├─ SectionLabel        "01 / Selected work"
│  ├─ SectionHeading
│  └─ CaseStudyList
│     ├─ CaseStudyCard (featured)  DEX
│     └─ CaseStudyCard ×3          clinic sites, admin systems, freelance
│        ├─ Cover          screenshot (the flat illustration is the fallback)
│        ├─ Meta           company · year · role · StatusBadge (in development only)
│        ├─ Title
│        ├─ OutcomeLine    one measurable result
│        ├─ StackChips
│        └─ CardLink       → /work/<slug>/ (the whole card is clickable via a stretched link)
├─ Section#experience
│  └─ Timeline
│     └─ Role ×3
│        ├─ DateRange (+ live dot on the current role)
│        ├─ Title, Company
│        ├─ OutcomeList   bullet points with numbers, not duties
│        └─ StackChips
├─ Section#how-i-work     (replaces Services and About)
│  └─ PracticeList
│     └─ Practice ×4      code review, CI/CD & releases, mentoring/OJT, async communication
├─ Section#stack
│  └─ StackGroup ×4       number, title, blurb, Chips
└─ ContactSection (dark)
   ├─ Heading
   ├─ CvButton (large)
   ├─ EmailCopy            email link + Copy button + screen-reader announcement
   └─ ProfileLinks
```

### Case study: `/work/<slug>/`

```
CaseStudyPage
├─ BackLink               "← All work" → /#work
├─ CaseHero
│  ├─ Eyebrow             company · year
│  ├─ Title (h1)
│  ├─ Summary
│  └─ FactsList           Role · Team · Timeline · Stack · Links (live / repo) or StatusBadge
├─ CoverFigure
├─ CaseBody
│  ├─ SectionNav          Problem · What I did · Decisions · Results (desktop: sticky)
│  ├─ Block.problem
│  ├─ Block.role
│  ├─ DecisionList
│  │  └─ Decision ×n      choice · why · trade-off
│  ├─ ResultGrid
│  │  └─ Stat ×n
│  └─ Gallery
│     └─ Figure ×n        screenshot + caption
├─ CaseCta                CvButton + "Next case study"
└─ PrevNextNav
```

### 404: `/404.html`

```
ErrorPage → Eyebrow · Headline · Message · Button "← Back home"
```

### Browser scripts (`src/js/`, about 3 KB, progressive enhancement)

| Script | Attaches to | Job |
|---|---|---|
| `nav.js` | `MenuToggle`, `PrimaryNav` | Open/close the menu, Escape to close, close when a link is chosen, highlight the current section |
| `header.js` | `SiteHeader`, `BackToTop` | Header hairline once scrolled, back-to-top visibility |
| `reveal.js` | `[data-reveal]` | Fade sections in on scroll (off when the visitor prefers reduced motion) |
| `copy-email.js` | `EmailCopy` | Copy to clipboard and show the result |
| *(no script)* | `CvButton`, `CardLink`, `ProfileLinks` | GoatCounter counts clicks through `data-goatcounter-click` attributes |

## 3. Layout structure

**Approach:** styles are written for phones first and widen with `min-width` breakpoints. The current stylesheet works the other way, starting from desktop and narrowing.

| Token | Range | Used for |
|---|---|---|
| base | < 640px | Phones: one column |
| `md` | ≥ 640px | Large phones and tablets: two-column grids |
| `lg` | ≥ 1024px | Desktop: full grids, sticky side elements |

- **Width:** content is capped at `--wrap` (1160px) and centred, with a gutter of `--gutter`.
- **Desktop grid:** 12 columns with a 32px gap.
- **Container queries:** the hero headline and the case-study cards size themselves from the width of the space they sit in, not the window, so the same card works in a wide or narrow slot.
- **Scroll snapping:** only the phone case-study row snaps (`scroll-snap-type: x mandatory`). Page-level vertical snapping was tested and dropped: with `y proximity`, Chrome pulls each mouse-wheel notch back to the end of any section taller than the screen, so the page could not be scrolled past it.

| Region | Mobile (< 640) | Desktop (≥ 1024) |
|---|---|---|
| **Header** | Brand, compact **CV** pill and menu button. Nav opens as a full-width panel with large links. | Brand on the left; nav and CV pill on the right. Sticky, with a hairline once scrolled. |
| **Hero** | Stacked: badge, h1, lede, two equal-width buttons, availability, portrait (max 320px) | h1 spans all 12 columns. Below it: intro across columns 1–7 and portrait across 10–12, tops aligned. |
| **ProofStrip** | 2×2 grid, rules between items | 4 columns divided by vertical hairlines |
| **Work** | A swipeable row that snaps card by card (cards 86% wide so the next one peeks), with a 01 / 04 counter | DEX card full width (image across 7 columns, text across 5), then the other three in a row of 3 |
| **Experience** | Date above role, single column | Date column (3 columns) and role details (9 columns) |
| **How I work** | Stacked list | Heading sticks in the left column (5 columns); list on the right (7 columns) |
| **Stack** | 1 column (2 from `md`) | 4 columns |
| **Contact** | Heading, then the large CV button full width, then email + Copy | Heading across the full width; CV button and email + Copy side by side below |
| **Footer** | Stacked | One row: brand · tagline · links · © |
| **Case hero** | Title, summary, then the facts as a two-column list | Title + summary across 8 columns; facts down a 4-column side column |
| **Case body** | Section nav hidden; text full width | Section nav sticky in a 3-column side column; text across 8 columns, line length capped at `--measure` |

## 4. State management

**Principle:** the site keeps almost no state. Each piece lives in the most durable, shareable place available. There is no global store, no `localStorage` and no cookies.

| Layer | What it holds | Where it lives | Lifetime |
|---|---|---|---|
| **Content** | Profile, case studies, experience, stack, stats | `content/portfolio.json`, checked at build time | Until the next push |
| **Address (URL)** | Which page and which section | `/work/<slug>/`, `#experience` | Shareable; back/forward always work |
| **Interface** | Menu open, header scrolled, current section, revealed sections, copy feedback | Attributes on the page itself | One page view |
| **Preferences** | Light/dark, reduced motion | The visitor's system settings (`prefers-color-scheme`, `prefers-reduced-motion`) | Never stored |
| **Analytics** | CV downloads, case-study opens, outbound clicks | GoatCounter (outside the site) | Kept by GoatCounter |

**Rules:**

1. **One source of truth per state.** Accessibility attributes double as styling hooks: `aria-expanded` on the menu button and `aria-current="true"` on the current nav item. CSS reads them directly, so what screen readers announce and what the page shows can't disagree.
2. **States are spelled out.** The copy button uses `data-state="idle | copied | failed"`. After 2 seconds it returns to idle, and a hidden `aria-live="polite"` region announces "Email copied".
3. **No state that needs to live in the URL.** The project filter is gone, so nothing needs query parameters.
4. **Everything works without JavaScript.** The menu only collapses once the `.js` class is present, so without JavaScript the links show in a wrapping row. (The current site hides the nav on phones even when JavaScript never runs.)

**Failure modes:**

| Failure | Behaviour |
|---|---|
| JavaScript blocked or failing | All content visible; nav shows as plain links; no scroll animations |
| Clipboard blocked | Copy button becomes `failed`: the email text is selected and the message reads "Press Ctrl+C". The mailto link still works. |
| Analytics blocked | Nothing changes for the visitor; downloads still work |
| Fonts fail to load | Fallback fonts, size-adjusted to keep layout shift small |
| CV PDF missing | Build fails, so a broken CV link never goes live |

### Analytics events

| Event | Fired from |
|---|---|
| `cv-download-{header,hero,contact,case}` | Each `CvButton`, labelled by where it sits |
| `case-open-{slug}` | `CardLink` |
| `outbound-{linkedin,github}` | `ProfileLinks` |
| `email-copy` | `EmailCopy` |

## 5. Design tokens

The names carry over from the current `css/styles.css`. Colour, layout, motion and z-index tokens already exist there; they move into `src/styles/tokens.css`. The spacing scale and type scale below are new.

### Colour

Contrast ratios are measured against `--paper` in that theme. Every text role passes WCAG AA.

| Token | Light | Dark | Dark sections (contact/footer) | Role | Contrast (light / dark) |
|---|---|---|---|---|---|
| `--paper` | `#f3f0e9` | `#12110e` | `#16140f` (`#0a0907` in dark mode) | Page background | — |
| `--paper-2` | `#e8e3d7` | `#1c1a16` | `#221f19` | Recessed surfaces, hover fills | — |
| `--ink` | `#16140f` | `#efeae0` | `#f3f0e9` | Headings, main text, strong rules | 16.2 / 15.8 |
| `--ink-2` | `#4a453c` | `#b9b2a4` | `#bdb6a8` | Body text | 8.4 / 9.0 |
| `--ink-3` | `#6b6559` | `#8f887b` | `#958e80` | Meta text, captions | 5.1 / 5.4 |
| `--rule` | `#d3ccbc` | `#2f2c26` | `#3a362e` | Hairline dividers | decorative |
| `--signal` | `#ee4b12` | `#ff5a1f` | `#ff5a1f` | Fills and display-size text only | 3.3 / 6.1 |
| `--signal-ink` | `#b23709` | `#ff7b47` | `#ff7b47` | Accent text at reading sizes | 5.4 / 7.4 |
| `--on-signal` | `#16140f` | `#12110e` | `#16140f` | Text on orange fills | 5.0 / 6.1 |

How colour is used:
- **One accent, used sparingly.** Orange appears only on the availability dot, the emphasis words in the hero and contact headlines, the primary-button hover, the current nav item, label numbers and stat numbers.
- **No gradients, glows or soft shadows.** The only shadow-like effect is the solid orange block offset behind the portrait.

### Spacing (4px base)

| Token | Value | Typical use |
|---|---|---|
| `--space-1` | 4px | Gaps between chips, padding inside pill groups |
| `--space-2` | 8px | Gap between an icon or arrow and its label |
| `--space-3` | 12px | Gaps between buttons and between meta items |
| `--space-4` | 16px | Card padding, gaps inside lists |
| `--space-5` | 24px | Space between related blocks |
| `--space-6` | 32px | Grid column gap |
| `--space-7` | 48px | Heading → content |
| `--space-8` | 64px | Between major blocks |
| `--space-block` | `clamp(40px, 6vw, 80px)` | Section heading → section body |
| `--space-section` | `clamp(80px, 10vw, 144px)` | Section top padding (top only, so gaps never double) |
| `--gutter` | `clamp(20px, 5vw, 64px)` | Page side margins |

### Layout, shape, motion

| Token | Value |
|---|---|
| `--wrap` | 1160px (maximum content width) |
| `--measure` | 64ch (maximum line length for case-study text) |
| `--header-h` | 64px mobile / 72px desktop |
| `--radius-pill` | 999px: every interactive element (buttons, chips, nav pill, back-to-top) |
| `--radius-box` | 0: every container (cards, images, sections) |
| `--rule-hair` / `--rule-strong` | 1px / 2px (strong rules mark the top of each section) |
| `--ease` | `cubic-bezier(.22, .8, .24, 1)` |
| `--dur-fast` / `--dur-base` / `--dur-slow` | 200ms (colour changes) / 400ms (arrow nudges, underlines) / 700ms (scroll reveals, card illustrations) |
| `--z-header` / `--z-backtop` / `--z-skip` | 20 / 30 / 50 |

### Typography

**Families:**

| Token | Typeface | Role |
|---|---|---|
| `--display` | Archivo (variable, weight 400–800, width 75–125) | Headings and interface text (nav, buttons, links) |
| `--serif` | Newsreader (variable, optical sizing; roman and italic) | Body text, ledes, italic emphasis inside headlines |
| `--mono` | IBM Plex Mono 400/500 | Labels, dates, chips, captions, meta |

**Type scale** (fluid):

| Token | Size | Line height | Tracking | Weight / face | Used for |
|---|---|---|---|---|---|
| `--text-display-xl` | `clamp(2.25rem, 7.4cqi, 6.25rem)` | .90 | −.045em | Archivo 750 | Hero h1, 404 h1 |
| `--text-display-l` | `clamp(2.5rem, 1.5rem + 4.4vw, 5.25rem)` | .94 | −.035em | Archivo 750 | Section h2 |
| `--text-display-m` | `clamp(3rem, 1.5rem + 7vw, 7rem)` | .90 | −.035em | Archivo 750 | Contact h2 |
| `--text-stat` | `clamp(2.5rem, 2rem + 2vw, 3.5rem)` | 1.0 | −.03em | Archivo 750, tabular numerals | ProofStrip, ResultGrid |
| `--text-heading-l` | `clamp(1.5rem, 1.15rem + 1.2vw, 2.25rem)` | 1.05 | −.015em | Archivo 650 | Role titles, case-study section heads |
| `--text-heading-m` | `clamp(1.375rem, 1.2rem + .5vw, 1.75rem)` | 1.08 | −.015em | Archivo 650 | Card titles, stack groups |
| `--text-lead` | `clamp(1.25rem, 1.05rem + .8vw, 1.625rem)` | 1.40 | 0 | Newsreader 400 | Hero lede, case summary |
| `--text-body` | 1.0625rem (17px) | 1.60 | 0 | Newsreader 400 | Body text |
| `--text-small` | 1rem | 1.50 | 0 | Newsreader 400 | Card text, footer |
| `--text-ui` | .9375rem (15px) | 1.0 | −.01em | Archivo 500–600 | Nav, buttons, links |
| `--text-label` | .75rem (12px) | 1.40 | +.08em, uppercase | Plex Mono 500 | Section labels, dates, captions, meta |

**Emphasis rule:** an `<em>` inside an h1 or h2 switches to Newsreader italic at weight 400 and 1.06em. It is orange only in the hero and contact headlines, which open and close the page.

## 6. Open items

- [x] CV exported to PDF (`assets/Mark_Lumaino_Updated_CV.pdf`)
- [ ] For each case study: live link and/or repo, role, team size, dates, two or three measurable results, screenshots (cover at least 1600px wide)
- [ ] DEX (in development): decide what can be shown before launch, e.g. staging screenshots, an architecture diagram or a short screen recording
- [ ] GoatCounter site code (a placeholder until it exists)
- [ ] Switch the GitHub Pages source to GitHub Actions when the build lands
