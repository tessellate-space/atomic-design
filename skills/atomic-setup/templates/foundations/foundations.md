# Foundations

The design tokens this library may use, and how to use them. Components take their
colour, type, spacing and radii from here and nowhere else. A literal in a library
file fails the `tokens-only` check.

- Token source: `{{token_source}}`, in `{{token_path}}`
- Spacing grid: {{grid}}px
- Live values: the Storybook page **Foundations / Tokens**
- Reviewer: {{reviewer}}

**Status: draft.** This file was drafted from the token names and from how the code uses
them. Anything marked `needs design input` is not backed by a design decision yet.
Review the file with design before treating it as settled.

## Colour

Colour is used by role, never by hue. Pick the role first, then the token.

### Surface
- **Tokens:** (list the surface tokens)
- **Use for:** (backgrounds of pages, cards, panels)
- **Never for:** (text, borders, state)
- **Evidence:** (where the code uses it, with counts)

### Text
- **Tokens:**
- **Use for:**
- **Never for:**
- **Evidence:**

### Accent
- **Tokens:**
- **Use for:**
- **Never for:**
- **Evidence:**

### State
- **Tokens:** (success, warning, danger, info, as the source has them)
- **Use for:**
- **Never for:**
- **Evidence:**

### Border
- **Tokens:**
- **Use for:**
- **Never for:**
- **Evidence:**

## Type

- **Families:**
- **Scale:** (each step with its intended use)
- **Weights:**
- **Never:** (an ad-hoc `font-family`, a size outside the scale)

## Spacing

- **Grid:** {{grid}}px. Every gap, padding and margin is a multiple of it.
- **Tokens or steps:**
- **Use for:**
- **Never for:**

## Radii

- **Tokens:**
- **Use for:**
- **Never for:**

## Elevation

- **Tokens:**
- **Use for:**
- **Never for:**

## Rules for components

- Use a token for every colour, family, radius and shadow. No `#hex`, `rgb()`, `hsl()` or
  `oklch()` in a library file.
- A value you need that has no token: ask the reviewer to add the token first.
- Exempt from the check: the token source itself, and the globs in `tokens.exempt` of
  `.atomic-design.json` (for example icon files).
