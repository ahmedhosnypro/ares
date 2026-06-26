# Plan: Integrate MUI Theme with next-intl for RTL Support in Ares

## Summary

Ares/frontend has next-intl with ar/en locales and MUI theming, but the theme is not direction-aware and lacks RTL CSS-in-JS support. Port the proven RTL architecture from Siraj into Ares.

## Package Manager: Bun Only

All commands MUST use Bun exclusively - no npm, yarn, or pnpm. Use the full binary path `~/.bun/bin/bun` as specified in the project AGENTS.md.

## Siraj Reference vs Ares Gaps

| Aspect | Siraj | Ares Gap |
|---|---|---|
| createAppTheme | createAppTheme(mode, direction, locale) | Only createAppTheme(mode) |
| Emotion Cache | Dual LTR/RTL caches with stylis-plugin-rtl | Single LTR-only cache |
| ThemeProvider | useLocale(), direction sync, document.dir | No locale/direction logic |
| Language Switch | useLanguageSwitch hook + /api/set-locale | Missing both |
| LanguageSwitcher | Popover component | Missing |
| RTL Packages | stylis, stylis-plugin-rtl, @types/stylis | None installed |
| ThemeContext | isThemeChanging, setIsThemeChanging | Missing these fields |

## Implementation Steps

### Step 1: Install RTL Dependencies
`ash
cd ares/frontend && ~/.bun/bin/bun add stylis stylis-plugin-rtl @types/stylis
`

### Step 2: Update createAppTheme (frontend/providers/theme.ts)
- Change signature: createAppTheme(mode, direction="ltr", locale="en")
- Import MUI locale presets: arEG, enUS from @mui/material/locale; arSD, enUS from @mui/x-data-grid/locales
- Add locale resolver function (switch on ar/en)
- Add direction to theme config
- Spread locale overrides as second arg to createTheme(...locales(locale))
- Update appTheme export

### Step 3: Update EmotionCacheProvider (frontend/lib/emotion-cache.tsx)
- Import useLocale from next-intl, prefixer from stylis, rtlPlugin from stylis-plugin-rtl
- Create cacheLtr (key "ltr") and cacheRtl (key "rtl", stylisPlugins: [prefixer, rtlPlugin])
- Select cache based on locale: isRtl ? cacheRtl : cacheLtr
- Remove useState-based single cache pattern

### Step 4: Update ThemeProvider (frontend/providers/ThemeProvider.tsx)
- Import useLocale from next-intl, add useMemo
- Derive direction from locale: locale === "ar" ? "rtl" : "ltr"
- Pass (mode, direction, locale) to createAppTheme via useMemo
- Sync document.dir and document.lang in useEffect
- Add isThemeChanging state

### Step 5: Update ThemeContext (frontend/context/ThemeContext.tsx)
- Add isThemeChanging: boolean and setIsThemeChanging to ThemeContextType

### Step 6: MuiProvider - No changes needed

### Step 7: Create useLanguageSwitch hook (frontend/hooks/useLanguageSwitch.ts)
- Port from Siraj: POST /api/set-locale -> set NEXT_LOCALE cookie -> router.refresh()
- Returns { currentLocale, switchLanguage, isPending }

### Step 8: Create /api/set-locale route (frontend/app/api/set-locale/route.ts)
- Port from Siraj: validate locale, set NEXT_LOCALE cookie server-side

### Step 9: Create LanguageSwitcher (frontend/components/ui/LanguageSwitcher.tsx)
- IconButton + Menu (Ares-style, not Siraj NavbarIcon+Popover)
- Uses useLanguageSwitch() and useTranslations("common")
- Translation keys (langAr, langEn, langArShort, langEnShort, languageSwitcher) already exist

### Step 10: Create rtlFlipIconSx utility (frontend/utils/rtlFlipIconSx.ts)
- Port from Siraj: scaleX(-1) when theme.direction === "rtl"

### Step 11: Root layout - No changes needed (already sets dir)

### Step 12: Add LanguageSwitcher to Header (frontend/components/layout/HeaderClient.tsx)
- Place next to ThemeSwitcher in desktop toolbar and mobile drawer

## Files to Create
1. frontend/hooks/useLanguageSwitch.ts
2. frontend/app/api/set-locale/route.ts
3. frontend/components/ui/LanguageSwitcher.tsx
4. frontend/utils/rtlFlipIconSx.ts

## Files to Modify
1. frontend/providers/theme.ts
2. frontend/lib/emotion-cache.tsx
3. frontend/providers/ThemeProvider.tsx
4. frontend/context/ThemeContext.tsx
5. frontend/components/layout/HeaderClient.tsx

## Verification Checklist
1. LTR (English): Components render correctly
2. RTL (Arabic): html dir=rtl, MUI flips, Emotion CSS RTL-prefixed, theme.direction=rtl
3. Language switch: cookie set, router.refresh() applies
4. Theme switch: light/dark works independently
5. Directional icons: rtlFlipIconSx works
6. DataGrid: Arabic locale preset applies
7. No hydration mismatch