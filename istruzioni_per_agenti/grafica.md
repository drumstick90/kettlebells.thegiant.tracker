# PyAlex Homepage Aesthetic Playbook

Audience: UI coders/design engineers building a mobile app in a different product, while preserving the exact aesthetic intelligence of the PyAlex homepage.

Primary source files:

- `pyalex_web/templates/index.html`
- `pyalex_web/templates/base.html`
- `pyalex_web/static/css/input.css`
- `pyalex_web/static/css/app.css` (compiled output)
- `tailwind.config.js`
- `package.json` (build pipeline)

---

## 1) Aesthetic Thesis (Design Intent)

This homepage is a restrained editorial-tech hybrid. It borrows from print layout discipline (clear hierarchy, generous negative space, typographic contrast) and combines it with product clarity (explicit calls to action, discoverable workflows).

Professor-level reading:

- The design is intentionally low-saturation to project trust and seriousness.
- Emotional tone is "calm competence", not "excited innovation".
- Contrast is created by weight, scale, and spatial rhythm rather than color.
- The dark side panel is the only high-drama gesture; it acts as a conceptual counterweight to the informational left panel.

---

## 2) Style Authority Stack (What Wins in Cascade)

Order of style influence:

1. `app.css` (global reset + Tailwind utilities + shared components)
2. `index.html` inline `<style>` block (page-specific definitions)
3. Element-level inline `style=""` attributes in the template (highest local priority)
4. JS runtime style changes (for status text color)

Important implication for replication:

- The homepage look is mostly authored in `index.html` custom CSS, not pure utility classes.
- A faithful mobile implementation should prioritize semantic component styles over utility-class-only composition.

---

## 3) Libraries / Frameworks Involved

- **Template/runtime:** Flask + Jinja templates (`index.html` extends `base.html`)
- **Typography and base utilities:** Tailwind CSS build output in `app.css`
- **Post-processing:** PostCSS + Autoprefixer
- **Font delivery:** self-hosted `GeneralSans` variable font via `@font-face`
- **Chart.js:** loaded globally in `base.html` but not central to homepage visuals

Build command:

- `npm run build:css`

from `package.json`:

- input: `pyalex_web/static/css/input.css`
- output: `pyalex_web/static/css/app.css`

---

## 4) Typography System

### 4.1 Font Families

- Primary UI/system voice: `GeneralSans` (variable 200-700)
- Mono accents/input semantics: `SF Mono`, `Monaco`, fallback monospace stack

### 4.2 Typographic Personality

- Headline (`.hero-title`): very light weight (`300`), tight leading, slight negative tracking
- Emphasis within headline (`strong`): `600` to create semantic anchor
- Labels/eyebrows: uppercase, high tracking, tiny size (`~0.65rem`)
- Body copy: neutral gray with comfortable line-height (`1.45-1.55`)

Professor comment:

- The system understands rhetorical pacing: whisper (eyebrow), thesis (hero title), explanation (subtitle), action (button labels). This is stronger than generic "big heading + paragraph".

---

## 5) Color Language (Core Tokens in Practice)

Not formalized as CSS variables in homepage, but used consistently:

- **Ink / primary text:** `#333` / near `#222`
- **Muted text:** `#6f6f6f`, `#9d9d9d`
- **Borders:** `#eee`, occasional `#ddd`
- **Background light:** `#fff`, `#fafafa`
- **Dark panel:** `#333` with translucent white overlays
- **Interaction emphasis:** black on hover (`#000`) for commitment state

Minor exception:

- Email saved state uses green (`#22c55e`) via JS style assignment (functional feedback, not brand color).

Professor comment:

- This palette avoids chromatic fatigue. It lets content semantics carry meaning while preserving a "premium data tool" tone.

---

## 6) Layout Proportions and Spatial Grammar

### 6.1 Macro Layout

- Content max width: `1200px` (`.landing-wrap`)
- Outer padding: `2rem 1.25rem 4rem`
- Hero split:
  - left: `1.15fr`
  - right: `0.85fr`
- Gap in hero: `1.25rem`

### 6.2 Micro Rhythm

- Frequent vertical increments around `0.5rem`, `0.75rem`, `1rem`, `1.25rem`
- Borders define blocks more than shadow
- Cards are mostly rectangular with subtle rounding only on logo tile

Professor comment:

- The proportioning is asymmetrical but balanced. The right panel is intentionally narrower, preventing visual competition with the primary input workflow.

---

## 7) Component Anatomy (Homepage)

### 7.1 Brand Mark

- Small square dark tile (`26x26`) with white `P`
- Minimal radius (`4px`) and bold letter

### 7.2 Navigation Chips (`.quick-link`)

- Thin border, tiny text, compact padding
- Hover inversion is subtle (border + text darken only)

### 7.3 Hero Input

- Underline-style field (`border-bottom: 2px solid #333`)
- Transparent background, mono font, large readable input size
- Placeholder intentionally pale (`#c8c8c8`)

### 7.4 CTA Hierarchy

- Primary: filled dark (`.submit-btn`)
- Secondary: ghost bordered (`.ghost-btn`)
- Tertiary examples: lightweight pills (`.example-pill`)

### 7.5 Dark Capability Panel

- Deep charcoal background
- Decorative circle outlines via pseudo-elements (`:before`, `:after`)
- White translucent stat blocks and labels
- This panel is conceptual storytelling, not utility controls

### 7.6 Workflow Cards

- Uniform grid (`4-up desktop, 2-up tablet, 1-up mobile`)
- Card language is strict: border, white fill, no color-coding

---

## 8) Motion, Transitions, and Interaction Feel

Motion is intentionally quiet:

- Most transitions are `0.2s`
- Hover effects:
  - color/border shifts
  - no bouncy transforms
- Input focus:
  - underline darkens to black

No decorative keyframe animation on homepage itself. The perceived sophistication comes from compositional calm, not motion theatrics.

Professor comment:

- This is mature restraint. The design trusts hierarchy and content, avoiding animation as a substitute for visual order.

---

## 9) Inline Styles and Overrides You Must Know

Inline style usages in `index.html` that alter baseline patterns:

- Hero title tracking (`letter-spacing: -0.02em`)
- Email input fine-tuning:
  - smaller font
  - thinner bottom border
- Email status text style controlled dynamically in JS

If porting to mobile:

- Convert these inline styles into named tokens/components.
- Keep exact intent, but remove ad-hoc inline declarations to improve maintainability.

---

## 10) Responsive Behavior

From homepage rules:

- <= `1024px`: tool grid `4 -> 2`
- <= `860px`: hero split collapses to one column
- <= `640px`:
  - container padding reduced
  - hero blocks tighten padding
  - top nav stacks vertically
  - all card grids become single-column

Professor comment:

- The responsive strategy is structural, not cosmetic. It preserves narrative order first, then density.

---

## 11) Design Hierarchy Blueprint (Transfer to Mobile)

Use this hierarchy exactly:

1. **Identity line** (small brand)
2. **Primary thesis** (hero title)
3. **Primary task input** (DOI field)
4. **Immediate CTA**
5. **Alternative pathways**
6. **Capability proof panel**
7. **Workflow chooser cards**
8. **Secondary entry form**
9. **Intent clarifiers and metrics**

If mobile constraints force reduction:

- Never remove (2), (3), (4), or (7).
- Fold (8), (9) under progressive disclosure.

---

## 12) What Makes This Aesthetic "Super Cool"

In design-crit terms, the page succeeds because:

- It has a clear dominant axis (DOI-first), then offers adjacent routes.
- Visual contrast is intellectual, not decorative.
- Every element looks "authored", not framework-default.
- The dark side panel is a controlled accent, not a competing UI.
- Copy tone, spacing, and typography are aligned to the same brand voice.

The result is not merely "minimal"; it is "editorial operational".

---

## 13) Porting Checklist for Mobile UI Coders

- [ ] Use a variable sans with light weights (200-700 range)
- [ ] Keep monochrome-first token set
- [ ] Preserve underline-style primary input
- [ ] Maintain CTA stack hierarchy (filled -> ghost -> pills)
- [ ] Retain one dramatic dark panel/surface for narrative contrast
- [ ] Keep uppercase micro-labels with generous tracking
- [ ] Avoid saturated accent colors for core navigation
- [ ] Keep transitions subtle (~200ms), no springy gimmicks
- [ ] Convert one-off inline styles into reusable design tokens
- [ ] Test visual rhythm in grayscale screenshots to validate hierarchy

---

## 14) Suggested Tokenization (for your next product)

Recommended token names based on this homepage:

- `color.ink.900 = #222`
- `color.ink.800 = #333`
- `color.text.muted = #6f6f6f`
- `color.text.quiet = #9d9d9d`
- `color.border.soft = #eee`
- `color.surface.base = #fff`
- `color.surface.soft = #fafafa`
- `color.surface.inverse = #333`

- `font.family.primary = GeneralSans`
- `font.family.mono = SF Mono / Monaco`

- `radius.brand = 4px`
- `radius.system = 0-2px` (mostly square language)

- `motion.fast = 200ms`

---

## 15) Final Direction

If your mobile team reproduces:

- the monochrome hierarchy,
- the typography weight choreography,
- the DOI-first input ritual,
- and the dark narrative counter-surface,

they will reproduce the signature aesthetic even in a different product domain.

