# Suppliers Translation Tasks

## Page Overview

- Route: `/(public)/suppliers`
- Source: app/[locale]/(public)/suppliers/

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Shared Components

None (placeholder page)

## Component Discovery

| File       | Type             | Hardcoded Strings |
| ---------- | ---------------- | ----------------- |
| `page.tsx` | Server Component | "Suppliers Page"  |

## Translation Keys Created

| Key                        | English                                  | Arabic                                  |
| -------------------------- | ---------------------------------------- | --------------------------------------- |
| `pageTitle`                | Suppliers \| Ares Car Rental             | الموردين \| أريس لتأجير السيارات        |
| `heading`                  | Our Suppliers                            | موردونا                                 |
| `subtitle`                 | Browse and compare rental suppliers...   | تصفح وقارن موردي تأجير السيارات...      |
| `searchPlaceholder`        | Search suppliers by name...              | ابحث عن الموردين بالاسم...              |
| `noResultsTitle`           | No suppliers found matching your search. | لم يتم العثور على موردين مطابقين لبحثك. |
| `noResultsSuggestion`      | Try adjusting your filters...            | حاول تعديل عوامل التصفية...             |
| `minRating`                | Minimum Rating                           | الحد الأدنى للتقييم                     |
| `location`                 | Location                                 | الموقع                                  |
| `specialization`           | Specialization                           | التخصص                                  |
| `fleetSize`                | Fleet Size                               | حجم الأسطول                             |
| `sortBy`                   | Sort By                                  | ترتيب حسب                               |
| `sortRating`               | Rating                                   | التقييم                                 |
| `sortName`                 | Name                                     | الاسم                                   |
| `sortFleetSize`            | Fleet Size                               | حجم الأسطول                             |
| `sortResponseTime`         | Response Time                            | وقت الاستجابة                           |
| `sortOrder`                | Sort Order                               | ترتيب                                   |
| `sortAsc`                  | Ascending                                | تصاعدي                                  |
| `sortDesc`                 | Descending                               | تنازلي                                  |
| `specializationLuxury`     | Luxury                                   | فاخر                                    |
| `specializationElectric`   | Electric                                 | كهربائي                                 |
| `specializationAccessible` | Accessible                               | متاح للجميع                             |
| `specializationCommercial` | Commercial                               | تجاري                                   |
| `specializationBudget`     | Budget                                   | اقتصادي                                 |
| `fleetSizeSmall`           | Small                                    | صغير                                    |
| `fleetSizeMedium`          | Medium                                   | متوسط                                   |
| `fleetSizeLarge`           | Large                                    | كبير                                    |
| `reviewCount`              | {count} reviews                          | {count} تقييم                           |
| `vehiclesAvailable`        | {count} vehicles available               | {count} مركبة متاحة                     |
| `viewProfile`              | View Profile                             | عرض الملف الشخصي                        |
| `compare`                  | Compare                                  | مقارنة                                  |
| `compareTitle`             | Compare Suppliers                        | مقارنة الموردين                         |
| `loadError`                | Failed to load suppliers...              | فشل تحميل الموردين...                   |

## Translation Tasks

- [x] Created type file: `shared/messages/types/public/suppliers.ts`
- [x] Created English translation: `shared/messages/en/public/suppliers.ts`
- [x] Created Arabic translation: `shared/messages/ar/public/suppliers.ts`
- [x] Updated `shared/messages/types/message.ts` - Added SuppliersLabels import/export and `suppliers: PublicSuppliersSchema` to PublicPagesSchema
- [x] Updated `shared/messages/en.ts` - Added suppliers import and nested object under publicPages.suppliers
- [x] Updated `shared/messages/ar.ts` - Added suppliers import and nested object under publicPages.suppliers
- [x] Updated `app/[locale]/(public)/suppliers/page.tsx` - Replaced hardcoded string with getTranslations("publicPages.suppliers.index")
