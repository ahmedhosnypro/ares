# About Page

## Page Info

- **Route**: `/about`
- **Access**: Public
- **Purpose**: Dynamic, DB-backed page describing the platform, its mission, and key features.

---

## API Endpoints

| Method | Endpoint          | Auth   | Description                         |
| ------ | ----------------- | ------ | ----------------------------------- |
| GET    | `/api/about`      | Public | Get all sections ordered by `order` |
| GET    | `/api/about/{id}` | Public | Get section by ID                   |
| POST   | `/api/about`      | Admin  | Create section                      |
| PUT    | `/api/about/{id}` | Admin  | Update section                      |
| DELETE | `/api/about/{id}` | Admin  | Delete section                      |

## Section Types

Each section has a `sectionType` that drives its visual layout on the public page:

| Type     | Layout                                                                     |
| -------- | -------------------------------------------------------------------------- |
| `hero`   | Full-width primary banner with headline and subtitle                       |
| `story`  | Two-column text with accent left border                                    |
| `offer`  | Grid of feature cards (content parsed as `Label: Description` lines)       |
| `stats`  | Centered stats strip (content parsed as `Label: Value` lines)              |
| `values` | Two-column card grid (content parsed as `Label: Description` lines)        |
| `cta`    | Centered call-to-action with primary background and Browse Vehicles button |

## Admin Management

Sections are managed via `/admin/settings` → **About Page** tab.
