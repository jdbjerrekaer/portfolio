# Design critique — Assessment A (design director review, no detector)

**Surface:** home page of the static Next.js 16 portfolio at `http://127.0.0.1:4173/` (source root `/home/jonatan/projects/portfolio`).
**Method:** code-and-context review only. Source files read in full, plus the built `out/index.html` to confirm what actually renders. No files edited for this review, no browser used.
**Binding context:** `PRODUCT.md`, `DESIGN.md` (Open Runde, `#F5F5F7` canvas, `#0071E3` reserved for links/focus, 4/8/12…32 rhythm, radii 6/8/10/14, 150-250ms, no control translate on hover, cards scale 1.01, respect `prefers-reduced-motion`).

---

## 1. Design specificity verdict

**Partially grounded, then generic.** The top of the page could only be this person's. The bottom of the page could be dropped onto any freelance designer's site with a find-and-replace.

Specific to this product:
- The hero claim "I design interfaces that developers actually want to build" (`app/page.tsx:34`) is the positioning statement of `PRODUCT.md:21`, not a slogan. The featured cards then pay it off with a real shipped artifact and a real number: "Figma design-system QA plugin used by 500+ users globally" (`content/projects/yadl.mdx:6`). That is `PRODUCT.md:51` (proof over polish) working as designed.
- `DESIGN.md` is load-bearing, not decorative. `styles/globals.scss:7-66` implements it one-to-one, the accent is genuinely reserved (I found no decorative use of `#0071e3` outside links, focus rings and the `ActionLink` wash), interactive cards are flat until hover and scale exactly `1.01` (`components/ui/Card/Card.module.scss:22-25`), pressable controls go to `.98` (`components/ui/Button/Button.module.scss:49-51`), and every animated file I opened gates on `prefers-reduced-motion`. Templates do not do this. This is the site demonstrating the craft it advertises (`PRODUCT.md:53`), and it is the single strongest thing on the surface.

Generic, would survive an unrelated rebrand unchanged:
- The bottom four sections are stock portfolio furniture: an infinite auto-scrolling marquee, a testimonial grid, a logo wall, a centred "Available for…" card (`app/page.tsx:87-110`). None of them is about a design engineer who ships.
- `WritingSection` links out to six adservice marketing posts on an employer's blog (`lib/content/writing.ts:9-51`) under a header that promises "How I approach complex technical problems and bridge the gap between design and engineering" (`components/WritingSection/WritingSection.tsx:10-11`). The promise and the payload are unrelated.
- The signature thesis line defined in `PRODUCT.md:38` ("AI almost never says no. Design is the discipline of saying no.") appears exactly once in the entire repo: inside `PRODUCT.md`. The most distinctive voice asset the product owns is not on the product.

---

## 2. Holistic

**Hierarchy and IA.** Scroll order is hero, three featured cards, carousel, writing, testimonials, logos, CTA. Two structural problems. (a) Six consecutive block types are centre-aligned: the hero (`app/page.module.scss:18-25`), every `SectionHeader` description, both card grids, the logo grid, the CTA card (`components/AvailabilityCTA/AvailabilityCTA.module.scss:8-11`). One centred block is a statement; six identical ones is a template. (b) The strongest artifact in the content folder is not in Featured. `Adtraction Brands: From Directory to Storefront` reports quick backs falling 68% to 29% and dead clicks 22% to 17% against partners on the old platform, measured over the same 90 days (`content/projects/adtraction-brands.mdx:6,95`) — and it sits fifth in `PROJECT_PRIORITY_ORDER` (`lib/content/projects.ts:101-114`), while `getFeaturedProjects` sorts by date (`lib/content/projects.ts:148-156`) and `app/page.tsx:16` slices the first three. What a hiring manager sees first is chosen by date, not by judgment.

**Emotional fit.** Calm, literate, restrained — right for the audience. The one element with the wrong register is the carousel's permanent motion (see 4).

**Discoverability.** `/projects/` is reachable four times on one page (header, hero button, section action link, footer). Contact is reachable twice. Nothing is lost, except the thing that matters: there is no route that shows how he thinks. The only writing is external, on an employer's marketing blog.

**Typography.** Open Runde is loaded correctly — three self-hosted weights via `next/font/local`, `display: swap`, preloaded (`app/layout.tsx:9-29`). That is genuinely good practice. But the type scale has no ratio: across the SCSS I counted distinct sizes at 0.75, 0.8125, 0.84, 0.875 (x13), 0.9 (x2), 0.9375 (x11), 0.95 (x2), 0.975, 1, 1.0625, 1.125, 1.25, 1.5, 2rem — fifteen steps, two of them near-duplicates (0.875 against 0.9375, 1.0625 against 1.125) that will read as inconsistency at 1200px. `DESIGN.md:20` fixes a spacing rhythm and is silent on type, so this is a gap in the spec as much as in the code.

**Colour.** Disciplined, with two failures against the site's own declared standard (`PRODUCT.md:59`, WCAG 2.1 AA). `--color-text-tertiary: #8b919c` on the canvas is **2.91:1** (`styles/globals.scss:16`, used for the footer copyright at `components/SiteFooter/SiteFooter.module.scss:32`), and the carousel placeholder label `#86868b` on `#e5e5e7` is **2.88:1** (`components/DesignCarousel/DesignCarousel.tsx:365-366`). Everything else I measured clears: secondary text 4.44 to 4.83, accent 4.70, primary button 16.83, success badge 5.96.

**States.** Good: `:focus-visible` outlines are consistent on buttons, links and action links; the coming-soon treatment is the best-designed state on the site — image desaturated until hover restores colour (`components/ProjectCard/ProjectCard.module.scss:50-64`), status carried in the accessible name of the non-interactive wrapper (`components/ProjectCard/ProjectCard.tsx:88`). Missing: the featured card shows no status badge at all, because the badge is gated on `variant === "catalog"` (`components/ProjectCard/ProjectCard.tsx:54-56`), so the most prominent cards are the least informative; there is no empty state when `featuredProjects` is empty (`app/page.tsx:60` silently drops the section, while `app/projects/page.tsx:54-59` does have one); the "Email me" control renders as `role="button"` on an anchor (`components/ui/Button/Button.tsx:46`) which is the wrong role for a mailto link.

**Copy.** Mostly precise and human, which is the hardest thing to get right on a portfolio. One sentence of AI-slop: "I bridge product strategy, UX, design systems, and engineering feasibility so teams can move from messy problems to shipped product quality" (`components/AvailabilityCTA/AvailabilityCTA.tsx:51`) — four abstractions in a row ending in a phrase that means nothing. Two voice-rule violations against `PRODUCT.md:39` (no em dashes): `app/about/aboutData.ts:142` renders an em dash in a role bullet. Two typos in user-visible strings: the About page section heading renders **"Approach"** (`app/about/page.tsx:54`, component file `app/about/ApproachList.tsx`), and a writing card renders **"Shopify Tracking Implementations"** (`lib/content/writing.ts:18`), plus "Affiliate" at `:39` and `:40`.

**Edge cases.** 26 of the 42 client logos have never been named: `name: "Brand 1"` through `"Brand 26"` with `alt: "Brand N logo"` ship to production (`lib/content/clientLogos.ts:12-138`, confirmed live in `out/index.html`). Two carousel items share the accessible label "Brand Page" (`lib/content/designCarouselItems.ts:22,35`) so keyboard users hear near-identical announcements for different work. The contact block's status popover is pre-rendered into the DOM with the wrong content: `out/index.html` contains `role="status" aria-live="polite"` whose only text is **"Opening your email app"** before any interaction (`components/AvailabilityCTA/AvailabilityCTA.tsx:85-87`, `components/ui/AnchoredPopover/AnchoredPopover.tsx:66-74`) — an announcement for an event that has not happened.

---

## 3. Cognitive load

Checklist failures:
- **Two decision points exceed four visible options.** The hero carries View Projects, About Me, GitHub — three co-equal buttons, one size, one tint separating primary from secondary (`app/page.tsx:39-56`). The CTA carries Copy email, Email me, LinkedIn (`components/AvailabilityCTA/AvailabilityCTA.tsx:54-84`). Neither moment has a default action.
- **Signal competes with noise between the work and the reader.** 32 tabbable buttons (16 items duplicated for the loop, `components/DesignCarousel/DesignCarousel.tsx:476`) sit in the tab order directly after the three cards the reader should be reading, each announcing "Open X design N" (`:565`).
- **Unlabelled data.** The proof section "Who I've worked with" (`app/page.tsx:100-107`) presents a grid in which 26 of 42 entries are machine placeholders.
- **Redundant role strings.** All three featured cards carry the identical `role: "Design Engineer"` in the same slot (`content/projects/yadl.mdx`, `iriz.mdx`, `yet-another-countdown.mdx`) — three reads of the same string that differentiate nothing.
- The one thing a reader most wants to do, contact him, is three ways hard (5).

---

## 4. Emotional journey (peak-end rule)

**Peaks.** Two, both earned, both misplaced. The featured row, where a plugin with 500+ users and a dated source says the thing without adjectives. And the case study sitting fifth in a list nobody scrolls to, whose method (two live platforms, same 90 days, same product, two interfaces) is the most senior-looking piece of evidence in the repo.

**Valleys, in scroll order.**
1. The carousel. The visual centrepiece between the work and the writing, moving at a constant 30px/s (`components/DesignCarousel/DesignCarousel.tsx:45`), uncaptioned, unattributed to any project, with no way to stop it. It is the one block on the page a visitor cannot read, and it comes immediately after the three blocks they should read.
2. "Writing & Thinking." The only section that claims to show thinking delivers "Increase Online Exposure" and "Affiliate Marketing: A Win-Win Situation" (`lib/content/writing.ts:39-50`), one of them in Danish. It is the deepest valley precisely because it is the only valley with a promise attached.
3. The logo wall, where "Brand 1" undoes the credibility of the sentence above it.

**Reassurance at the high-stakes moment: absent.** The contact block is maximum friction and minimum support. The email address is a `<p>`, not a link (`components/AvailabilityCTA/AvailabilityCTA.tsx:53`), and the universal fallback gesture — select and copy — is blocked: `user-select: none` appears 84 times across the SCSS, including the footer (`components/SiteFooter/SiteFooter.module.scss:5-8`) and the hero (`app/page.module.scss:35`). What reassurance exists is real and good — the success badge with the dot, the visible address, the clipboard-then-mailto fallback that fails toward the user's intent (`components/AvailabilityCTA/AvailabilityCTA.tsx:39-43`) — but it announces itself with a status region that is already lying.

**The ending.** Weak. A centred 600px card with four abstractions, then a 0.75rem copyright at 2.91:1, then six 0.75rem footer links. The final impression of a site whose whole thesis is precision is a page where a heading reads "Approach" wrongly spelled and an article is titled "Shopify". The peak-end rule is working against him: the two best things on the site are in the middle, and the last things a reader meets are the weakest.

---

## 5. Nielsen heuristics

Scores 0 broken, 1 poor, 2 adequate, 3 good, 4 excellent.

| # | Heuristic | Score | Why |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Staged hero entry (`app/page.module.scss:27-73`), scroll-reactive header (`components/SiteHeader/SiteHeader.tsx:29-33`), copy feedback via the popover. But the one live region on the page ships pre-populated with a false message, and there is no loading, empty or error state anywhere. |
| 2 | Match with real world | 3 | "Read case study", "Coming soon", "View all 42 logos" speak the reader's language. Undermined by three identical role strings and by "Brand N logo" as a label for something a human could name. |
| 3 | User control and freedom | 2 | Escape, backdrop click and arrow navigation in the image modal (`components/ui/ImageModal/ImageModal.tsx:43-66,168-187`). But the visitor cannot stop the carousel at all, and there is no exit from the 32-button tab trap. |
| 4 | Consistency and standards | 2 | The component vocabulary matches `DESIGN.md:26-33` exactly, which is rare and good. Then: one control is a `button` and its sibling is a `role="button"` anchor for the same intent; the site names itself three different ways ("Jonatan Designer Portfolio" in `<title>`, `app/layout.tsx:33`; "Jonatan Daugbjerg Bjerrekær" in `components/SiteHeader/SiteHeader.tsx:69`; "Jonatan Bjerrekær" in `app/about/page.tsx:37`). |
| 5 | Error prevention and recovery | 2 | Coming-soon cards cannot be activated into a dead end, which is excellent prevention. Recovery from a lost link is a joke page with a draggable zero and one "Go Home" button (`components/NotFoundContent/NotFoundContent.tsx:31-68`). The clipboard failure path is a bare `window.location.href = mailto:` (`:42`). |
| 6 | Recognition rather than recall | 3 | Icons carry every nav item and every button (`components/SiteHeader/SiteHeader.tsx:10-14`). Tags are recognition failures: "Competitor Analysis" on Iriz (`content/projects/iriz.mdx`) tells the reader nothing about Iriz. |
| 7 | Flexibility and efficiency | n/a | Read-only marketing surface with a single conversion; there is no repeatable task, no shortcut path and nothing to personalise. |
| 8 | Aesthetic and minimalist design | 3 | Genuinely restrained — no gradients, no heavy glass, shadows at the token's 6% black, per `DESIGN.md:50`. Minus one: six consecutive centred blocks means the page is symmetrical rather than composed, and the marquee animates for its own sake, which `DESIGN.md:40` forbids. |
| 9 | Help users recognise, diagnose, recover | 2 | The unavailable-card tooltip explains exactly why a card cannot be opened (`components/ProjectCard/ProjectCard.tsx:82`). Nothing on the page explains what a Product Design Engineer is, which is the question the site exists to answer. |
| 10 | Help and documentation | n/a | Not a tool; there is no behaviour to document. |

**Applicable maximum = 4 x 8 = 32. Total = 21/32.** Above the mid-point of the band most real interfaces land in, well short of what a surface advertising design craft should reach.

---

## 6. Strengths (real)

1. **The design system is a demonstration, not a claim.** `styles/globals.scss` implements `DESIGN.md` to the letter, the accent is reserved as specified, motion honours the 150-250ms window and `prefers-reduced-motion` everywhere I checked, fonts are self-hosted with preloads. A design lead who reads the CSS learns more about the candidate than the copy tells them.
2. **The unavailable state is better designed than the available one.** Desaturating a coming-soon cover until hover, keeping the card out of the tab order, and carrying title plus status in the accessible name (`components/ProjectCard/ProjectCard.tsx:79-93`) is a more considered solution than most portfolios give their live work.
3. **Evidence discipline holds.** `PRODUCT.md:47` forbids fabricated testimonials, and the four shipped are named people at named companies making specific, checkable observations — "It is easy for me as a developer to follow his idea of how the UI should be built and which components to use" from a software developer at Adtraction (`components/Testimonials/Testimonials.tsx:14-18`). The 500+ and 60+ figures carry a dated source (`PRODUCT.md:45`). On a surface where the modal entry is invention, this is a genuine differentiator.

---

## 7. Priority issues

### P1 — The strongest evidence is not on the home page
**What.** `Adtraction Brands` is the only case study with a controlled comparison against the incumbent platform (quick backs 68% to 29%, dead clicks 22% to 17%, same 90 days, `content/projects/adtraction-brands.mdx:6,95`). It is not in Featured. The three cards a hiring manager sees are chosen by `getFeaturedProjects().sort(date)` (`lib/content/projects.ts:152-155`) then sliced (`app/page.tsx:16`).
**Where.** `lib/content/projects.ts:148-156`, `lib/content/featuredProjects.ts:36-45`, `app/page.tsx:16`.
**Why it costs an interview.** "Quick backs fell from 68% to 29%" is the single most repeatable sentence in the portfolio — the one a design lead says to a colleague after the meeting. The home page currently shows a plugin, an app and a widget instead, all of which could be someone's side projects. In three minutes the reader gets three solo artefacts and no measurement.
**Fix sketch.** Have `getFeaturedProjects` sort by the already-exported `PROJECT_PRIORITY_ORDER` instead of by date, and add an explicit `featuredOrder` frontmatter field for the three cards you want on the first screen. One comparator, one call site, and the proof moves to the fold.

### P2 — Twenty-six placeholder logos are shipping as the trust proof
**What.** `lib/content/clientLogos.ts:12-138` defines entries `name: "Brand 1"` … `"Brand 26"` with `alt: "Brand N logo"`; the last sixteen have real names (Seiska, Femina, Fortum, Elisa), proving the pattern is unfinished work, not a constraint. Confirmed in `out/index.html`.
**Where.** `lib/content/clientLogos.ts:12-138`; rendered by `components/LogoGrid/LogoGrid.tsx:88-101` under the heading "Who I've worked with" (`app/page.tsx:100-107`).
**Why it costs an interview.** This section's only function is transferred credibility. A design lead who scans it sees a wall of "Brand N" and concludes the site was scaffolded from a theme and never finished; a screen-reader user hears a count. It directly contradicts `PRODUCT.md:51` (proof over polish) and `PRODUCT.md:55` (human-signed voice) in the one place where proof is claimed.
**Fix sketch.** Name all 42, then cut the grid to twelve that a reader can actually verify and delete the expander. Twelve named logos with no "View all 42 logos" button is a stronger claim than forty-two of which 26 are unnamed.

### P3 — "Writing & Thinking" is the deepest valley on the page
**What.** The header promises design-engineering thinking (`components/WritingSection/WritingSection.tsx:10-11`); the payload is six posts on an employer's marketing blog about Magento tracking extensions, a Shopify plugin, Google Ads integration and affiliate ROI (`lib/content/writing.ts:9-51`), one titled in Danish, two with typos ("Shopify" `:18`, "Affiliate" `:39,:40`).
**Where.** `lib/content/writing.ts:9-51`, `components/WritingSection/WritingSection.tsx:10-11`.
**Why it costs an interview.** It is the only section that claims to show how he thinks, and a reader who clicks two of the six gets affiliate-marketing copy. Either the candidate wrote that copy, which weakens the "precise, plain" voice claim, or they did not, which makes the section dishonest by attribution. Both readings cost.
**Fix sketch.** Retitle it to what it is, "Technical guides I wrote for Adservice partners", which is honest and is still a design-engineering signal. Or replace it with two or three written pieces about design decisions. Or delete it. Do not leave an unmet promise next to a wall of proof.

### P4 — The loudest element on the page says the least, and cannot be stopped
**What.** A 661-line auto-scrolling marquee at 30px/s (`components/DesignCarousel/DesignCarousel.tsx:45`), items duplicated for a seamless loop (`:476`), 32 tabbable buttons (`:565`), with `stopOnMouseEnter: false` and `stopOnInteraction: false` (`:72-73`), no caption, and no link from any item to its case study. Two items share the label "Brand Page" (`lib/content/designCarouselItems.ts:22,35`).
**Where.** `components/DesignCarousel/DesignCarousel.tsx`, mounted at `app/page.tsx:87-91`; `lib/content/designCarouselItems.ts`.
**Why it costs an interview.** For a reader with minutes, an unpausable marquee placed between the work and the writing is an attention tax, and it violates the site's own motion rule that animation follows interaction, not mere existence (`DESIGN.md:40`). A reviewer who tabs through it will hit 32 items before reaching the writing.
**Fix sketch.** Pause on focus and on hover rather than slow to 30% (`:316`), reuse the existing `prefers-reduced-motion` branch (`:305`) as a user-facing pause control, give every item a unique accessible label, and make each item navigate to its case study rather than only to a modal.

### P5 — The contact moment is the least supported moment
**What.** The address is a `<p>`, not a link (`components/AvailabilityCTA/AvailabilityCTA.tsx:53`); the copy button's status popover is rendered unconditionally into the live DOM with the text "Opening your email app" (`:85-87`, confirmed in `out/index.html`); and text selection is disabled site-wide (84 `user-select: none` declarations, including `components/SiteFooter/SiteFooter.module.scss:5-8`), which removes the one gesture every visitor reaches for.
**Where.** `components/AvailabilityCTA/AvailabilityCTA.tsx:53,85-87`, `components/ui/AnchoredPopover/AnchoredPopover.tsx:66-74`, `styles/globals.scss` and the SCSS files carrying the user-select rules.
**Why it costs an interview.** This is the moment of maximum stakes and the design gives it the least. A screen reader is likely to announce "Opening your email app" on arrival, which teaches the reader not to trust the interface's status messages; a reader who cannot select the address has one route fewer to act.
**Fix sketch.** Make the address an `<a href="mailto:…?subject=…">`, render popover content only while `isOpen`, and drop `user-select: none` from anything containing words a reader might want to quote — keep it on icons.

---

## 8. Persona red flags (what could cost the interview)

- **"Approach"** as a section heading (`app/about/page.tsx:54`) and **"Shopify"** as an article title (`lib/content/writing.ts:18`). On a site whose positioning is precision, two visible typos invite the reviewer to doubt the QA claims in the case studies.
- **A placeholder wall inside a proof claim** (`lib/content/clientLogos.ts:12-138`) sitting under the sentence "From large international brands to local Danish, Swedish, Norwegian, and Finnish companies" (`app/page.tsx:103-104`). An assertion above evidence that does not support it.
- **Two WCAG failures against the site's own stated standard** (`PRODUCT.md:59`): 2.91:1 footer copyright, 2.88:1 carousel placeholder text. A lead who opens devtools will find both, and will also find the accessibility policy the site does not meet.
- **The 404 is the only page with personality** (`components/NotFoundContent/NotFoundContent.tsx:31-68`) — a draggable zero and "Whoops! You broke it." It is charming, and it is what a recruiter sees if a link from a job posting is stale.
- **Identity drift across the site.** Title "Jonatan Designer Portfolio", header "Jonatan Daugbjerg Bjerrekær", intro "Jonatan Bjerrekær", contact `jonatanbjerrekaer@gmail.com`, and a percent-encoded LinkedIn slug `/in/jonatandbjerrek%C3%A6r` that differs from the header spelling (`app/layout.tsx:33`, `components/SiteHeader/SiteHeader.tsx:69`, `app/about/page.tsx:37`, `components/AvailabilityCTA/AvailabilityCTA.tsx:8,75`). A recruiter who cannot find him on LinkedIn in one attempt is a recruiter lost.
- **"10+ years of full-contact discipline"** (`app/page.tsx:37`) against a career dated from 2019 (`app/about/aboutData.ts:148-156`), which is seven. A number checkable in ten seconds that will not survive the check.

---

## 9. Minor observations

- `DESIGN.md:20` specifies a spacing rhythm and no type ramp. Fifteen font sizes from 0.75rem to 2rem with no ratio is the predictable result; write the ramp into the design document before the next component ships.
- `--header-height: 64px` (`styles/globals.scss:46`) against actual heights of 52px and 48px (`components/SiteHeader/SiteHeader.module.scss:27,150`); the hero's `min-height: calc(100svh - var(--header-height) - 72px)` (`app/page.module.scss:14`) is computed from a constant that is wrong by 12px.
- `app/page.module.scss:76-88`: three empty rules containing only comments. Dead code that does not even hold a placeholder.
- `app/page.tsx:88` names the carousel region via `aria-labelledby` on an `sr-only` heading, while the inner `<section>` also carries `aria-label="Design carousel"` (`components/DesignCarousel/DesignCarousel.tsx:526`). Two competing names for one region; the accessible one is the worse of the two.
- The carousel's edge fades use `--color-background` (`components/DesignCarousel/DesignCarousel.module.scss:35,40`) — white — while the section sits on the `#F5F5F7` canvas. The edges fade to a colour that is not there.
- `padding: 0 !important` (`components/ProjectCard/ProjectCard.module.scss:23`) and nine `!important` declarations in `components/ui/Button/Button.module.scss` alone. A system that has to override itself is a system that will be overridden.
- The same `role: "Design Engineer"` string in the same slot on all three featured cards, while the `featured` variant drops the status badge that `catalog` shows (`components/ProjectCard/ProjectCard.tsx:54-56`). The prominent cards are the less informative variant.
- `components/Testimonials/Testimonials.tsx:11,42` names the real, sourced array `placeholderTestimonials`. The name is wrong and the content is right; the name should follow the content.
- No `robots.txt`, no `sitemap.xml`, no Open Graph or Twitter metadata anywhere under `app/`. A portfolio's first impression is often a link unfurled in a Slack channel, and this one unfurls as nothing.
- `components/CookieBanner/CookieBanner.tsx:144` ships `console.log("Add logic for the required Necessary here")` as production code, and a consent banner plus an analytics layer with no analytics id configured (`components/Clarity/Clarity.tsx:95-102` returns null without an env var) — machinery running for a policy nobody audits.

---

## 10. Questions a design director would ask

1. You have a case study with a controlled comparison against the live old platform, and a plugin with 500+ users and a dated source, and your home page shows neither first. What is your rule for what goes into Featured, who is it optimised for, and why is that rule encoded as a date sort rather than as a decision?
2. The section called "Writing & Thinking" links to six articles about affiliate-marketing on your employer's blog. In three minutes, what does that section tell a design lead about your judgement that the case studies do not, and would you defend it or cut it?
3. Your positioning is "AI-aware design engineering" and your thesis is that design is the discipline of saying no. Where on this page does the site say no — to a section, to a carousel item, to a testimonial, to one of forty-two logos?
