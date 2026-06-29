# Translation Plan: Supplier Detail Page (`/(public)/suppliers/[supplierId]`)

## Status: Complete

## Components Audited

| File       | Hardcoded Strings       | Status    |
| ---------- | ----------------------- | --------- |
| `page.tsx` | `Supplier Profile Page` | Extracted |

## Message Keys

| Key         | English          | Arabic     |
| ----------- | ---------------- | ---------- |
| `pageTitle` | Supplier Profile | ملف المورد |

## Files Created

- `shared/messages/types/public/suppliers/_supplierId.ts`
- `shared/messages/en/public/suppliers/_supplierId.ts`
- `shared/messages/ar/public/suppliers/_supplierId.ts`

## Files Modified

- `shared/messages/types/message.ts` - Added `SupplierDetailLabels` import, `PublicSuppliersSchema`, and `suppliers` to `PublicPagesSchema`
- `shared/messages/en.ts` - Added `supplierDetail` import and `suppliers: { detail: supplierDetail }` to `publicPages`
- `shared/messages/ar.ts` - Added `supplierDetail` import and `suppliers: { detail: supplierDetail }` to `publicPages`
- `frontend/app/[locale]/(public)/suppliers/[supplierId]/page.tsx` - Replaced hardcoded string with `getTranslations()`
