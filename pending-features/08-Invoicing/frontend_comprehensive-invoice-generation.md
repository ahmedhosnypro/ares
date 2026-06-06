# Feature: Comprehensive Invoice Generation

## Overview

Detailed, professional invoice generation for all transactions with complete breakdown of charges, tax details, discount application, payment method information, and transaction references. Supports multiple formats including PDF download, email delivery, print-friendly layout, digital receipt view, and expense management system integration (Concur, Expensify, QuickBooks).

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-PB-009

## User Stories

### As a business traveler
I want a detailed invoice for my rental, so that I can submit it for expense reimbursement with all required information.

### As a customer
I want to download a PDF invoice, so that I can keep it for my records and tax purposes.

### As a corporate account manager
I want invoices automatically sent to our accounting system, so that we can streamline expense processing.

### As an accountant
I want invoices with complete tax breakdowns, so that I can properly categorize expenses and comply with tax regulations.

## Frontend Specifications

### Pages

**Invoice View Page** (`/invoices/{invoiceId}`)
- Display complete invoice details
- Professional invoice layout
- Download PDF button
- Email invoice button
- Print invoice button
- Export to expense system options

**Invoice History Page** (`/account/invoices`)
- List all invoices chronologically
- Filter by date range, booking, or amount
- Search by invoice number or booking reference
- Bulk download option
- Export to CSV/Excel

### UI Components

**InvoiceDocument Component**
- Professional invoice header with logo
- Invoice number and issue date
- Booking reference number
- Customer billing information
- Supplier/platform information
- Itemized line items table
- Tax breakdown section
- Payment method display
- Transaction ID reference
- Total amount prominently displayed
- Footer with terms and payment instructions

**InvoiceLineItem Component**
- Description column
- Quantity column
- Unit price column
- Total column
- Subtotal rows for categories
- Tax rows with rates
- Discount rows (negative amounts)
- Grand total row

**InvoiceActions Component**
- Download PDF button with loading state
- Email invoice button with recipient input
- Print button (opens print dialog)
- Export dropdown (Concur, Expensify, QuickBooks)
- Share invoice link button

**TaxBreakdownTable Component**
- Tax type column
- Tax rate column
- Taxable amount column
- Tax amount column
- Jurisdiction column
- Total tax row

**ExpenseIntegrationModal Component**
- Select expense system
- Map invoice fields to expense categories
- Authenticate with expense system
- Submit invoice
- Confirmation message

### User Flows

**Invoice Generation Flow**:
1. Payment transaction completes successfully
2. System automatically generates invoice
3. System assigns sequential invoice number
4. System sends invoice via email
5. User receives email with PDF attachment
6. User can also access invoice in account dashboard
7. User clicks "View Invoice"
8. System displays professional invoice layout
9. User clicks "Download PDF"
10. System generates and downloads PDF file

**Expense Integration Flow**:
1. User views invoice
2. User clicks "Export to Expense System"
3. System displays expense system options
4. User selects Concur/Expensify/QuickBooks
5. System prompts for authentication if needed
6. User authenticates with expense system
7. System maps invoice fields to expense categories
8. User reviews and confirms mapping
9. System submits invoice to expense system
10. System displays confirmation message

### Data Requirements

**From Backend APIs**:
- GET `/api/invoices/{id}` - Retrieve invoice details
- GET `/api/invoices/booking/{bookingId}` - Get invoice for booking
- GET `/api/invoices` - List user's invoices
- POST `/api/invoices/{id}/email` - Email invoice
- GET `/api/invoices/{id}/pdf` - Generate PDF invoice
- POST `/api/invoices/{id}/export` - Export to expense system

**Invoice Data**:
- Invoice number and issue date
- Booking reference
- Customer billing information
- Supplier information
- Line items with descriptions and amounts
- Tax breakdown
- Payment method used
- Transaction ID
- Total amount

## Backend Specifications

### API Endpoints

**GET `/api/v1/invoices/{id}`**
- Purpose: Retrieve invoice details
- Authentication: Required (JWT)
- Authorization: User must own invoice or have Admin role
- Path Parameters:
  - `id` (guid, required): Invoice ID
- Response: Complete invoice details

**GET `/api/v1/invoices/booking/{bookingId}`**
- Purpose: Get invoice for specific booking
- Authentication: Required (JWT)
- Authorization: User must own booking
- Path Parameters:
  - `bookingId` (guid, required): Booking ID
- Response: Invoice details

**GET `/api/v1/invoices`**
- Purpose: List user's invoices
- Authentication: Required (JWT)
- Query Parameters:
  - `startDate` (date, optional): Filter from date
  - `endDate` (date, optional): Filter to date
  - `page` (int, optional): Page number
  - `pageSize` (int, optional): Items per page
- Response: Paginated invoice list

**POST `/api/v1/invoices/{id}/email`**
- Purpose: Email invoice to recipient
- Authentication: Required (JWT)
- Authorization: User must own invoice
- Path Parameters:
  - `id` (guid, required): Invoice ID
- Request Body:
  - `recipientEmail` (string, required): Email address
  - `message` (string, optional): Custom message
- Response: Success confirmation

**GET `/api/v1/invoices/{id}/pdf`**
- Purpose: Generate and download PDF invoice
- Authentication: Required (JWT)
- Authorization: User must own invoice
- Path Parameters:
  - `id` (guid, required): Invoice ID
- Response: PDF file (application/pdf)

**POST `/api/v1/invoices/{id}/export`**
- Purpose: Export invoice to expense management system
- Authentication: Required (JWT)
- Authorization: User must own invoice
- Path Parameters:
  - `id` (guid, required): Invoice ID
- Request Body:
  - `system` (string, required): concur, expensify, quickbooks
  - `credentials` (object, required): System-specific auth
  - `mapping` (object, optional): Field mapping overrides
- Response: Export confirmation with external reference

### Business Logic

**Invoice Generation**:
- Trigger on successful payment transaction
- Generate sequential invoice number (format: INV-YYYY-MM-NNNN)
- Compile all line items from booking
- Calculate tax breakdown by jurisdiction
- Apply discounts and show savings
- Include payment method and transaction ID
- Store invoice as JSON in database
- Generate PDF asynchronously
- Send email with PDF attachment

**PDF Generation**:
- Use professional invoice template
- Include company logo and branding
- Format currency and dates per locale
- Generate QR code with invoice URL
- Optimize for printing (A4/Letter size)
- Include page numbers for multi-page invoices
- Add footer with terms and contact information

**Email Delivery**:
- Send from no-reply email address
- Include PDF as attachment
- Include invoice summary in email body
- Provide link to view online
- Track email delivery status
- Retry failed deliveries

**Expense System Integration**:
- Implement OAuth authentication for each system
- Map invoice fields to system-specific formats
- Handle API rate limits and retries
- Store integration credentials securely
- Validate successful submission
- Provide error messages for failed exports

### Authentication Requirements

- JWT token required for invoice access
- User can only access own invoices
- Admin role can access all invoices
- Supplier role can access invoices for their bookings
- Corporate admin can access company invoices

## Database Specifications

### Table Definitions

**Invoices Table**:
```sql
CREATE TABLE Invoices (
  InvoiceId CHAR(36) PRIMARY KEY,
  BookingId CHAR(36) NOT NULL,
  UserId CHAR(36) NOT NULL,
  InvoiceNumber VARCHAR(50) NOT NULL,
  IssueDate DATE NOT NULL,
  DueDate DATE NULL COMMENT 'For corporate invoices',
  Status ENUM('draft', 'issued', 'sent', 'paid', 'cancelled') NOT NULL,
  InvoiceData JSON NOT NULL COMMENT 'Complete invoice details',
  PdfUrl VARCHAR(500) NULL,
  PdfGeneratedAt DATETIME NULL,
  EmailSentAt DATETIME NULL,
  EmailRecipient VARCHAR(255) NULL,
  TotalAmount DECIMAL(10,2) NOT NULL,
  Currency CHAR(3) NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId) ON DELETE RESTRICT,
  FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE RESTRICT,
  
  INDEX idx_user_id (UserId, IssueDate DESC),
  INDEX idx_booking_id (BookingId),
  INDEX idx_invoice_number (InvoiceNumber),
  INDEX idx_status (Status, IssueDate),
  UNIQUE KEY uk_invoice_number (InvoiceNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**InvoiceLineItems Table**:
```sql
CREATE TABLE InvoiceLineItems (
  LineItemId CHAR(36) PRIMARY KEY,
  InvoiceId CHAR(36) NOT NULL,
  LineNumber INT NOT NULL,
  ItemType ENUM('rental', 'insurance', 'service', 'tax', 'fee', 'discount') NOT NULL,
  Description VARCHAR(255) NOT NULL,
  Quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  UnitPrice DECIMAL(10,2) NOT NULL,
  Amount DECIMAL(10,2) NOT NULL,
  TaxRate DECIMAL(5,4) NULL,
  TaxAmount DECIMAL(10,2) NULL,
  
  FOREIGN KEY (InvoiceId) REFERENCES Invoices(InvoiceId) ON DELETE CASCADE,
  
  INDEX idx_invoice_id (InvoiceId, LineNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- `Invoices.BookingId` → `Bookings.BookingId` (One-to-One)
- `Invoices.UserId` → `Users.UserId` (Many-to-One)
- `InvoiceLineItems.InvoiceId` → `Invoices.InvoiceId` (Many-to-One)

### Indexes

- `idx_user_id` on `Invoices(UserId, IssueDate DESC)` - User invoice history
- `idx_invoice_number` on `Invoices(InvoiceNumber)` - Invoice lookup
- `idx_status` on `Invoices(Status, IssueDate)` - Status filtering
- `idx_invoice_id` on `InvoiceLineItems(InvoiceId, LineNumber)` - Line item retrieval

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+
- Frontend: Next.js 14+ with TypeScript
- PDF Generation: PuppeteerSharp or IronPDF
- Email Service: SendGrid or AWS SES

## Implementation Notes

**Invoice Number Format**:
- Format: INV-YYYY-MM-NNNN
- Sequential numbering per month
- Reset counter each month
- Ensure uniqueness with database constraint

**PDF Generation**:
- Use HTML template for invoice layout
- Convert HTML to PDF using headless browser
- Store PDF in cloud storage (S3, Azure Blob)
- Generate PDF asynchronously to avoid blocking
- Cache PDF URL in database

**Email Delivery**:
- Send invoice immediately after generation
- Include PDF as attachment (max 5MB)
- Provide fallback link if attachment fails
- Track email opens and clicks
- Retry failed deliveries (3 attempts)

**Expense System Integration**:
- Implement OAuth 2.0 for authentication
- Store refresh tokens securely
- Handle token expiration and renewal
- Map invoice fields to system-specific formats
- Validate successful submission
- Provide clear error messages

**Testing Requirements**:
- Test invoice generation for various booking types
- Test PDF generation and formatting
- Test email delivery
- Test expense system integrations
- Test invoice number uniqueness
- Verify tax calculations

## Related Features

- F-PB-007: Transparent Pricing Breakdown (Pricing calculation)
- F-PB-001: Multiple Payment Methods (Payment processing)
- F-BM-001: Multi-Step Checkout (Booking integration)
