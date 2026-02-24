# ✨ Portfolio

<p align="center">
  <a href="https://jdbjerrekaer.github.io/portfolio/"><strong>🔗 View Live Portfolio</strong></a>
</p>

<p align="center">
  A content-driven developer portfolio built with <strong>Next.js 16</strong>, <strong>React 19</strong>, <strong>TypeScript</strong>, and <strong>SCSS</strong>.
  <br/>
  Includes project case studies authored in <strong>MDX</strong> and deployed via <strong>GitHub Pages</strong>.
</p>

<p align="center">
  <a href="https://jdbjerrekaer.github.io/portfolio/"><img alt="Live Portfolio" src="https://img.shields.io/badge/Live%20Site-Visit%20Now-0A66C2?style=for-the-badge" /></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

<p align="center">
  <a href="https://jdbjerrekaer.github.io/portfolio/">
    <img src="assets/readme/portfolio-preview.jpg" alt="Portfolio preview" width="900" />
  </a>
</p>

---

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Sass/SCSS
- HeroUI (`@heroui/react`)
- MDX content parsing with `gray-matter`
- Runtime/content validation with `zod`

---

## Project Structure

```txt
app/                    # Routes, layout, providers
components/             # Reusable UI + section components
content/projects/       # Project case studies (.mdx)
lib/content/            # Content loaders, mapping, sorting logic
lib/utils/              # Shared utilities (e.g. base-path helpers)
public/                 # Static assets (images, fonts, icons)
styles/                 # Global styles
scripts/                # Build/deploy validation utilities
.github/workflows/      # GitHub Actions (Pages deploy)
```

---

## Content Model (Projects)

Projects are stored as MDX files in `content/projects/*.mdx`.

Each file contains frontmatter consumed by `lib/content/projects.ts`:

- `title` (string)
- `summary` (string)
- `date` (string)
- `role` (string)
- `tags` (string[])
- `links` (optional record)
- `gallery` (optional array of `{ src, alt }`)
- `coverImage` (optional string)
- `featured` (optional boolean)
- `comingSoon` (optional boolean)

Featured projects on the homepage are generated from real project files via `lib/content/featuredProjects.ts`.

---

## Local Development

Install dependencies:

```bash
npm ci
```

Run dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Lint:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

Serve static export:

```bash
npm run start:static
```

Build + watch content/app files + re-serve export:

```bash
npm run start
```

---

## Static Export + Base Path

The project uses static export in `next.config.ts`:

- `output: "export"`
- `trailingSlash: true`
- `basePath` and `assetPrefix` from `BASE_PATH`
- `images.unoptimized: true`

This allows deployment under a subpath such as:

`https://<user>.github.io/<repo>/`

### Base path environment variables

- `BASE_PATH` (build/runtime config)
- `NEXT_PUBLIC_BASE_PATH` (client-side access)

For local dev, leave these empty.

---

## GitHub Pages Deployment

Deployment is handled by `.github/workflows/gh-pages.yml` on pushes to `main`.

The workflow:

1. Installs dependencies and builds static output to `out/`
2. Sets `BASE_PATH` and `NEXT_PUBLIC_BASE_PATH` to `/${{ github.event.repository.name }}`
3. Ensures `out/.nojekyll` exists
4. Verifies and patches `404.html` behavior for Pages routing
5. Verifies `cookie-policy` output and creates redirect helper file
6. Uploads `out/` and deploys with `actions/deploy-pages`

### Required setup in repository settings

- **Settings → Pages → Source: GitHub Actions**

---

## Analytics & Consent

Global providers include:

- Microsoft Clarity integration
- Cookie banner / consent manager

If used, set the secret in GitHub Actions:

- `NEXT_PUBLIC_CLARITY_PROJECT_ID`

---

## Troubleshooting

### Assets or links broken on GitHub Pages

Usually a base-path issue. Confirm:

- workflow sets `BASE_PATH` and `NEXT_PUBLIC_BASE_PATH`
- `next.config.ts` uses `basePath` and `assetPrefix`

### 404 page shows default Next.js content

The workflow includes strict 404 verification/patch steps. Check the failed workflow logs around `404.html` generation and fallback copy operations.

### Project content not appearing

- Verify MDX file exists in `content/projects`
- Validate required frontmatter fields
- Check date format and `featured`/`comingSoon` values

---

## Authoring Workflow (Suggested)

1. Create/update a file in `content/projects/*.mdx`
2. Add/adjust gallery assets under `public/projects/...`
3. Run `npm run dev` and verify locally
4. Run `npm run build`
5. Push to `main` to trigger Pages deployment

---

## License

This project is licensed under the [MIT License](./LICENSE).
