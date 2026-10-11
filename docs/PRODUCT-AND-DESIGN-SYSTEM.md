# Ghost Recon Buddy — Product and Design System

This document is the shared product profile for people and coding agents working on the application. Read it before making a user-interface or product-scope change. The goal is for every section to feel like one coherent, trustworthy field reference rather than a set of unrelated pages.

## Product profile

Ghost Recon Buddy is a source-backed research index for *Tom Clancy's Ghost Recon Wildlands*. It helps players inspect the game's weapons and equipment, compare documented performance, understand missions, and follow the evidence behind each claim. It is a research tool, not an official Ubisoft product, a tactical training tool, or a claim that incomplete historical measurements are current-build facts.

The app's primary promise is clarity about what is known and how it is known. Keep these categories distinct:

- **Game/catalog facts:** names, classes, availability, and other facts represented by the curated catalog.
- **Direct evidence:** values or observations explicitly recorded by a cited source, with its test context and locator when available.
- **Derived values:** calculations based on recorded inputs. Label the formula or basis and never style them as direct measurements.
- **Research leads and hypotheses:** useful claims from community discussion or the internet that remain unverified; make uncertainty visible and suggest a way to test them.
- **Unknowns:** missing values remain unknown. Do not silently convert missing information into zero, incompatibility, or a definitive conclusion.

For weapon TTK, keep calculated ideal values separate from archived or current-build measured timing. Calculate ideal body TTK only when the matching fire-mode body STK and recorded cyclic RPM are both available, using `(STK - 1) * 60 / RPM`; label its consecutive-hit assumption and keep semi-auto and full-auto inputs distinct.

Experiment records use explicit research states (`RESEARCH_LEAD`, `NEEDS_TEST`, `TESTING`, `PARTIAL`, `SUPPORTED`, `CONFLICTING`, `NOT_REPRODUCED`, `REJECTED`, `CURRENT_BUILD_VERIFIED`), a separate priority, per-source evidence type/confidence, and a test-context record. Empty result/context slots mean no result has been entered in that experiment record; linked historical data may still exist.

Real-world references belong in the Field Wiki only when a Wildlands item has a defensible direct match. Do not add absent firearms or merely analogous weapons as if they were in-game. Link references to attributable sources and keep real-world classifications separate from in-game performance metrics.

## Application map

- **Weapons:** searchable armory, filters, mission profiles, ranked views, dossiers, and comparisons.
- **Attachments:** documented attachment types and compatibility claims.
- **Missions:** mission reference material and spoiler-aware summaries.
- **Apparel:** a research area; an empty state is preferable to invented coverage.
- **Sources:** provenance ledger for evidence, references, and research leads.
- **Field Wiki:** interpretation guide and confirmed direct real-world weapon references.
- **Info / Experiments:** lower-confidence internet claims, evidence status, and proposed tests.
- **Damage Lab:** archived workbook data, clearly separated from current-build measurements.

The sections share one catalog and evidence vocabulary. Navigation, page headers, filters, status labels, cards, tables, and focus behavior should look and work consistently across them.

## Visual direction: Field Notes

Use a restrained military field-reference mood with more warmth and color than a monochrome tactical dashboard. The palette is inspired by service-associated colors, not an attempt to reproduce official insignia, uniforms, or branding:

- Deep evergreen and charcoal establish the canvas.
- Sage and forest green provide the environmental identity and selected/verified cues.
- Warm brass is the primary action and focus accent; it should be the first color the eye finds.
- Ranger-inspired slate blue signals neutral or technical information.
- Marine-inspired muted red is reserved for destructive, caution, or adverse states.
- A sand tone can support secondary annotations and historical/context labels.

Use colored accents in small, meaningful doses: a selected state, a metric series, a status pill, or an icon. Avoid large saturated blocks, decorative camouflage, flag-like stripes, and using several accent colors at equal strength. Color must never be the only way a status or data series is communicated.

### Theme tokens

The canonical palette lives in `app/globals.css` under `:root, .dark`. Use these semantic tokens instead of introducing new raw color values:

| Token | Use |
| --- | --- |
| `--background` | Application canvas |
| `--card`, `--popover`, `--secondary`, `--muted` | Layered surfaces, in increasing emphasis |
| `--foreground`, `--muted-foreground` | Primary and supporting text |
| `--primary`, `--primary-foreground`, `--ring` | Main action, selected state, keyboard focus |
| `--border`, `--input` | Dividers, outlines, and form controls |
| `--destructive` | Destructive or adverse status only |
| `--field-sage`, `--field-sage-bright` | Verified/success accent and restrained environmental detail |
| `--field-ranger` | Neutral/technical accent |
| `--field-marine` | Warning/adverse accent |
| `--field-beret` | Positive status or a distinct data series |
| `--field-sand` | Historical/contextual annotation |
| `--chart-1` … `--chart-5` | Consistent chart series across pages |

When a component library needs a new semantic color, add a token and map it consistently; do not create another page-local palette. For one-off states, use `color-mix()` with the semantic token and a surface rather than a new hex literal.

## Shared interaction and layout rules

- Keep the page purpose and current context obvious. Page titles, mission profiles, filters, and data scope should not compete for primary emphasis.
- Use the same patterns for repeated controls and content. A selected filter, active tab, evidence label, source link, empty state, and dossier should behave alike wherever they appear.
- Dense data is welcome when it remains scannable: align numeric values, use tabular numerals, retain meaningful units, and explain sorting/ranking criteria.
- Keep provenance close to the claim it supports. An evidence badge should explain confidence, not decorate the record.
- Use progressive disclosure for long technical details; preserve a quick summary before deep tables or source notes.
- Favor shared spacing, typography, border, and radius tokens. Avoid page-specific visual exceptions unless the content genuinely requires one.
- Make layouts fluid and usable at narrow mobile widths as well as desktop. Tables may scroll horizontally when preserving their data is better than crushing columns.

## Accessibility baseline

- Maintain readable text contrast (target WCAG AA), especially for muted metadata and dense table cells.
- Preserve a clearly visible keyboard focus ring and logical keyboard navigation.
- Use semantic headings, labels, buttons, and links; give informative images concise alt text and decorative images empty alt text.
- Never convey evidence status, selection, or chart meaning by color alone; pair color with text, shape, or labels.
- Respect reduced-motion preferences and maintain usability at 200% zoom and a 390px-wide viewport.
- Provide comfortable touch targets for primary mobile controls.

## Change checklist

Before completing a UI change, consider:

1. Does this pattern already exist in another section? Reuse or improve the shared pattern rather than introducing a visual fork.
2. Are colors semantic theme tokens? If a reusable semantic color is missing, add it centrally and document its use here.
3. Does the display preserve the difference between observed, derived, hypothesized, and unknown data?
4. Are loading, empty, error, selected, and disabled states understandable and consistent?
5. Does the page still work by keyboard, at mobile width, and at 200% zoom?
6. Update README or architecture documentation when application scope or data architecture changes. Keep this profile current when global product or design rules change.
