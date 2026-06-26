# Messages Directory Structure

This directory contains all internationalization (i18n) message files for the Ares Car Rental platform, powered by [next-intl](https://next-intl.dev/).

## Overview

Messages are organized in a modular structure that mirrors the `app/[locale]/` page hierarchy. Each page/feature has its own type definition, English translation, and Arabic translation file.

## Directory Structure

```
shared/messages/
├── en.ts                    # English root — composes from en/
├── ar.ts                    # Arabic root — composes from ar/
├── types/
│   ├── message.ts           # MessageSchema — composes all type imports
│   ├── common.ts            # CommonLabels type (shared across all pages)
│   ├── auth.ts              # AuthLabels type
│   ├── errors.ts            # ErrorsLabels type
│   ├── auth/                # (future) auth page-specific types
│   ├── customer/            # (future) customer page-specific types
│   ├── dashboard/           # (future) dashboard page-specific types
│   ├── public/              # (future) public page-specific types
│   └── root/                # (future) root page-specific types
├── en/
│   ├── common.ts            # English common translations
│   ├── auth.ts              # English auth translations
│   ├── errors.ts            # English error translations
│   ├── auth/                # (future) auth page-specific English translations
│   ├── customer/            # (future) customer page-specific English translations
│   ├── dashboard/           # (future) dashboard page-specific English translations
│   ├── public/              # (future) public page-specific English translations
│   └── root/                # (future) root page-specific English translations
└── ar/
    ├── common.ts            # Arabic common translations
    ├── auth.ts              # Arabic auth translations
    ├── errors.ts            # Arabic error translations
    ├── auth/                # (future) auth page-specific Arabic translations
    ├── customer/            # (future) customer page-specific Arabic translations
    ├── dashboard/           # (future) dashboard page-specific Arabic translations
    ├── public/              # (future) public page-specific Arabic translations
    └── root/                # (future) root page-specific Arabic translations
```

## Conventions

### Adding Translations for a New Page

When translating a page (e.g. `/(public)/about`):

1. **Create the type file** at `types/public/about.ts` — define the labels type for that page
2. **Register the type** in `types/message.ts` — import and add it to `MessageSchema`
3. **Create the English file** at `en/public/about.ts` — export the English translations
4. **Create the Arabic file** at `ar/public/about.ts` — export the Arabic translations
5. **Import into root files** — import the new namespace in both `en.ts` and `ar.ts`

### Naming Convention

- Type files: `{namespace}.ts` exporting `{Namespace}Labels` (e.g. `AboutLabels`)
- Translation files: `{namespace}.ts` exporting a `const` matching the type (e.g. `const about: AboutLabels`)
- Each file imports its type from the relative `types/` path (e.g. `import type { AboutLabels } from "../../types/public/about"`)

### Key Principles

- **Type safety first** — every translation must have a corresponding TypeScript type
- **Modular structure** — one file per page/feature, mirroring the app route structure
- **`common` namespace** — shared UI strings (Save, Cancel, etc.) go in `common`, not duplicated per page
- **Namespace per feature** — page-specific strings live under their own namespace (e.g. `auth.login.title`)

## Current Locales

| Locale  | Code | Direction |
| ------- | ---- | --------- |
| Arabic  | `ar` | RTL       |
| English | `en` | LTR       |

## Related Files

- **i18n request config**: `shared/i18n/request.ts`
- **i18n routing**: `shared/i18n/routing.ts`
- **Next.js config**: `next.config.ts` (uses `createNextIntlPlugin`)
- **Translation plan**: `.plans/translation/`
