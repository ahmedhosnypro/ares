# Fix: Static public assets returning 404 after next-intl setup

## Root Cause

The middleware in `frontend/proxy.ts` has a matcher pattern that intercepts **all** requests except `api`, `_next/static`, `_next/image`, and `favicon.ico`. This includes requests for static public assets like:

- `/cover.mp4`
- `/img/view-on-map.png`
- `/site.webmanifest`
- `/img/favicon/logo_transparent.png`

When `next-intl` middleware (`intlMiddleware`) processes these requests, it tries to apply locale routing logic to them. With `localePrefix: "never"` in the routing config, the middleware may rewrite or redirect these paths in unexpected ways, causing Next.js to fail to find them in the `public/` directory — resulting in 404s.

The middleware matcher at line 60:
```
"/((?!api|_next/static|_next/image|favicon.ico).*)"
```
is too broad. It catches static file requests from the `public/` directory that should be served directly by the Next.js static file handler without any middleware interference.

## Fix

Update the middleware matcher in `frontend/proxy.ts` (line 60) to exclude common static file extensions and the specific files in `public/`:

```ts
"/((?!api|_next/static|_next/image|favicon\\.ico|site\\.webmanifest|cover\\.mp4|img/|.*\\.(?:mp4|webm|ogg|mp3|wav|flac|aac|png|jpg|jpeg|gif|svg|ico|webp|avif|bmp|tiff|woff|woff2|ttf|otf|eot|json|xml|txt|pdf|zip)).*)"
```

This excludes:
1. **`site.webmanifest`** — PWA manifest file
2. **`cover.mp4`** — Video file
3. **`img/`** — All image assets under `/img/`
4. **Common static file extensions** — Videos, images, fonts, documents, etc.

### Alternative simpler approach

Since the `public/` directory has specific known paths, a simpler alternative is to just exclude the known patterns:

```ts
"/((?!api|_next/static|_next/image|favicon\\.ico|site\\.webmanifest|img/|cover\\.mp4|ares_logo\\.png|ares\\.png).*)"
```

However, the regex extension pattern is more future-proof since any new static file added to `public/` would also be affected.

## File to Change

- `frontend/proxy.ts` — Update matcher pattern on line 60
