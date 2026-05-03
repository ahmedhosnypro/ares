# Account Privacy Page

## Page Info

- **Route**: `/account/privacy`
- **Access**: 🔒 Protected — requires authenticated customer
- **Purpose**: Manage privacy settings, app permissions, data sharing preferences, marketing opt-ins, cookie consent, and GDPR rights (data export, account deletion).

---

## API Endpoints

### `GET /api/users/{userId}/privacy-settings`

Retrieve user's privacy settings.

**Response (200 OK)**

```json
{
  "profileVisibility": "public | private | friends",
  "appPermissions": {
    "location": "granted | denied | not_requested",
    "camera": "granted | denied | not_requested",
    "notifications": "granted | denied | not_requested"
  },
  "dataSharing": {
    "analyticsData": "boolean",
    "marketingPartners": "boolean",
    "insuranceProviders": "boolean"
  },
  "marketingPreferences": {
    "emailMarketing": "boolean",
    "smsMarketing": "boolean",
    "pushMarketing": "boolean"
  },
  "cookiePreferences": {
    "functionalCookies": "boolean",
    "analyticsCookies": "boolean",
    "marketingCookies": "boolean"
  }
}
```

**Error Responses**: 401 Unauthorized, 403 Forbidden

---

### `PUT /api/users/{userId}/privacy-settings`

Update privacy settings. All fields optional (partial update).

**Request Body**: Same structure as GET response (all fields optional).

**Error Responses**: 400 Validation error, 401 Unauthorized

---

### `POST /api/users/{userId}/data-export`

Request a GDPR-compliant export of all personal data.

**Response (202 Accepted)**

```json
{
  "requestId": "string",
  "status": "pending",
  "estimatedReadyAt": "string (ISO 8601)"
}
```

---

### `POST /api/users/{userId}/account-deletion`

Request permanent account deletion (GDPR Right to Erasure).

**Request Body**

```json
{
  "password": "string",
  "reason": "string",
  "confirmDeletion": true
}
```

**Error Responses**: 400 Active bookings exist, 401 Unauthorized
