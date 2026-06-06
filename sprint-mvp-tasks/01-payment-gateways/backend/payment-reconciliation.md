# Feature: Payment Reconciliation

## Overview

Automated payment reconciliation system matching platform transactions with payment gateway settlements, identifying discrepancies, and generating financial reports for accounting.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-009

## User Stories

As a finance team member, I want automated payment reconciliation, so that all transactions are accounted for accurately.

As an accountant, I want to identify payment discrepancies, so that financial records are correct and disputes are resolved.

As a platform operator, I want daily settlement reports, so that cash flow is tracked and forecasted accurately.

## Backend Specifications

### API Endpoints

**POST /api/payments/reconciliation/run**
- Purpose: Trigger reconciliation process
- Authentication: Required (JWT, Finance role)
- Request body: startDate, endDate, gateway
- Response: Reconciliation job ID

**GET /api/payments/reconciliation/status**
- Purpose: Check reconciliation job status
- Authentication: Required (JWT, Finance role)
- Query params: jobId
- Response: Status, progress, results

**GET /api/payments/reconciliation/discrepancies**
- Purpose: Retrieve unreconciled transactions
- Authentication: Required (JWT, Finance role)
- Query params: startDate, endDate, gateway
- Response: Array of discrepancies

**POST /api/payments/reconciliation/resolve**
- Purpose: Manually resolve discrepancy
- Authentication: Required (JWT, Finance role)
- Request body: discrepancyId, resolution, notes
- Response: Resolution confirmation

**GET /api/payments/reconciliation/reports**
- Purpose: Generate settlement reports
- Authentication: Required (JWT, Finance role)
- Query params: reportType, startDate, endDate
- Response: Report data or PDF URL

### Request Schemas

**RunReconciliationRequest**:
- startDate: date (required)
- endDate: date (required)
- gateway: string (optional) - stripe, paypal, or all
- autoResolve: boolean (optional) - Auto-resolve minor discrepancies

**ResolveDiscrepancyRequest**:
- discrepancyId: int (required)
- resolution: string (required) - matched, refunded, disputed, error
- notes: string (required)
- adjustmentAmount: decimal (optional)

### Response Schemas

**ReconciliationJobResponse**:
- jobId: string
- status: string (queued, running, completed, failed)
- startDate: date
- endDate: date
- gateway: string
- progress: decimal (percentage)

**ReconciliationResultsResponse**:
- totalTransactions: int
- reconciledTransactions: int
- discrepancies: int
- totalAmount: decimal
- reconciledAmount: decimal
- discrepancyAmount: decimal
- summary: object

**DiscrepancyResponse**:
- id: int
- transactionId: string
- bookingId: string
- platformAmount: decimal
- gatewayAmount: decimal
- difference: decimal
- type: string (missing, amount_mismatch, duplicate)
- status: string (open, resolved)
- detectedAt: datetime

### Business Logic

**Reconciliation Process**:
- Fetch platform transactions for date range
- Fetch gateway settlements for same period
- Match transactions by transaction ID
- Compare amounts (platform vs gateway)
- Identify missing transactions
- Identify amount mismatches
- Flag duplicates
- Generate discrepancy report
- Auto-resolve minor differences (<$0.10)
- Alert finance team of significant discrepancies

**Matching Algorithm**:
- Primary match: Transaction ID
- Secondary match: Booking ID + amount + date
- Fuzzy match: Amount + date within tolerance
- Mark unmatched as discrepancies

**Discrepancy Types**:
- Missing in platform: Gateway has transaction, platform doesn't
- Missing in gateway: Platform has transaction, gateway doesn't
- Amount mismatch: Transaction IDs match but amounts differ
- Duplicate: Same transaction appears multiple times
- Timing difference: Transaction dates don't align

**Auto-Resolution Rules**:
- Amount difference <$0.10: Auto-resolve as rounding
- Refunded transactions: Match with refund records
- Voided authorizations: Mark as expected
- Webhook delays: Wait 24 hours before flagging

**Settlement Reports**:
- Daily settlement summary by gateway
- Transaction breakdown by type
- Fee analysis
- Refund summary
- Net settlement amount
- Discrepancy summary
- Export to CSV/Excel for accounting systems

### Authentication Requirements

- JWT authentication required
- Finance role for reconciliation operations
- Admin role for manual resolution
- Audit logging for all reconciliation actions
- Rate limiting on reconciliation jobs (1 per hour)

## Database Specifications

### Schema Changes

Add reconciliation tracking tables.

### Table Definitions

**ReconciliationJobs** (new table):
```
CREATE TABLE ReconciliationJobs (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    JobId VARCHAR(50) NOT NULL UNIQUE,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Gateway ENUM('stripe', 'paypal', 'all') NOT NULL,
    Status ENUM('queued', 'running', 'completed', 'failed') NOT NULL DEFAULT 'queued',
    TotalTransactions INT DEFAULT 0,
    ReconciledTransactions INT DEFAULT 0,
    DiscrepancyCount INT DEFAULT 0,
    StartedAt DATETIME,
    CompletedAt DATETIME,
    CreatedBy INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reconciliation_jobs_user 
        FOREIGN KEY (CreatedBy) REFERENCES Users(Id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PaymentDiscrepancies** (new table):
```
CREATE TABLE PaymentDiscrepancies (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    ReconciliationJobId INT NOT NULL,
    TransactionId VARCHAR(255),
    BookingId INT,
    Gateway ENUM('stripe', 'paypal') NOT NULL,
    DiscrepancyType ENUM('missing_platform', 'missing_gateway', 'amount_mismatch', 'duplicate') NOT NULL,
    PlatformAmount DECIMAL(10,2),
    GatewayAmount DECIMAL(10,2),
    Difference DECIMAL(10,2),
    Status ENUM('open', 'resolved', 'investigating') NOT NULL DEFAULT 'open',
    Resolution: VARCHAR(500),
    ResolvedBy INT,
    ResolvedAt DATETIME,
    Notes TEXT,
    DetectedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_discrepancies_job 
        FOREIGN KEY (ReconciliationJobId) REFERENCES ReconciliationJobs(Id) ON DELETE CASCADE,
    CONSTRAINT fk_discrepancies_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE SET NULL,
    CONSTRAINT fk_discrepancies_resolver 
        FOREIGN KEY (ResolvedBy) REFERENCES Users(Id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- ReconciliationJobs → Users (many-to-one, created by)
- PaymentDiscrepancies → ReconciliationJobs (many-to-one)
- PaymentDiscrepancies → Bookings (optional)
- PaymentDiscrepancies → Users (optional, resolved by)

### Indexes

- UNIQUE INDEX idx_job_id ON ReconciliationJobs(JobId)
- INDEX idx_status ON ReconciliationJobs(Status)
- INDEX idx_date_range ON ReconciliationJobs(StartDate, EndDate)
- INDEX idx_reconciliation_job ON PaymentDiscrepancies(ReconciliationJobId)
- INDEX idx_status_discrepancy ON PaymentDiscrepancies(Status)
- INDEX idx_gateway ON PaymentDiscrepancies(Gateway)

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+

## Implementation Notes

- Implement daily reconciliation job (runs at 2 AM)
- Fetch platform transactions from database
- Fetch gateway settlements via API
- Match transactions by ID and amount
- Identify discrepancies automatically
- Auto-resolve minor differences (<$0.10)
- Alert finance team of significant discrepancies
- Generate daily settlement reports
- Export reports to CSV for accounting
- Implement manual resolution workflow
- Track resolution status and notes
- Monitor reconciliation success rates
- Alert on high discrepancy rates
- Implement authorization hold tracking
- Monitor authorization expiration
- Capture authorizations before expiry
- Support partial captures
- Track captured vs authorized amounts
- Handle authorization voids
- Generate authorization reports
- Reconcile authorizations with captures
- Implement settlement payout tracking
- Match payouts with transactions
- Track gateway fees
- Calculate net settlement amounts
