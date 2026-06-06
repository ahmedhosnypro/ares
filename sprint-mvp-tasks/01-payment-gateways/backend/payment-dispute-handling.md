# Feature: Payment Dispute Handling

## Overview

Comprehensive payment dispute and chargeback management system handling dispute notifications, evidence submission, resolution tracking, and prevention strategies to minimize financial losses.

## Sprint Category

sprint-mvp

## Feature ID

F-INT-PAY-010

## User Stories

As a platform operator, I want to handle payment disputes systematically, so that chargebacks are minimized and legitimate disputes are resolved fairly.

As a support agent, I want to submit dispute evidence efficiently, so that we can win disputes with proper documentation.

As a finance team, I want to track dispute rates and costs, so that prevention strategies can be improved.

## Backend Specifications

### API Endpoints

**POST /api/payments/disputes/webhook**
- Purpose: Receive dispute notifications from gateways
- Authentication: Gateway webhook signature
- Request body: Dispute event from gateway
- Response: 200 OK acknowledgment

**GET /api/payments/disputes/list**
- Purpose: Retrieve all disputes
- Authentication: Required (JWT, Admin role)
- Query params: status, gateway, startDate, endDate
- Response: Array of disputes

**GET /api/payments/disputes/details**
- Purpose: Get dispute details
- Authentication: Required (JWT, Admin role)
- Query params: disputeId
- Response: Dispute details, evidence, timeline

**POST /api/payments/disputes/submit-evidence**
- Purpose: Submit evidence for dispute
- Authentication: Required (JWT, Admin role)
- Request body: disputeId, evidence
- Response: Submission confirmation

**POST /api/payments/disputes/accept**
- Purpose: Accept dispute and issue refund
- Authentication: Required (JWT, Admin role)
- Request body: disputeId, reason
- Response: Acceptance confirmation

### Request Schemas

**SubmitEvidenceRequest**:
- disputeId: string (required)
- evidence: object (required)
  - customerName: string
  - customerEmail: string
  - bookingReference: string
  - serviceDate: date
  - serviceDescription: string
  - customerSignature: string (URL)
  - vehicleInspectionPhotos: array of URLs
  - communicationLogs: array of objects
  - cancellationPolicy: string (URL)
  - refundPolicy: string (URL)
  - additionalDocuments: array of URLs

**AcceptDisputeRequest**:
- disputeId: string (required)
- reason: string (required)
- refundAmount: decimal (required)
- adminNotes: string (optional)

### Response Schemas

**DisputeListResponse**:
- disputes: array
  - id: string
  - bookingId: string
  - amount: decimal
  - currency: string
  - reason: string
  - status: string
  - createdAt: datetime
  - dueDate: datetime

**DisputeDetailsResponse**:
- disputeId: string
- bookingId: string
- transactionId: string
- amount: decimal
- currency: string
- reason: string (fraudulent, duplicate, product_not_received, etc.)
- status: string (warning_needs_response, needs_response, under_review, won, lost)
- evidence: object
- timeline: array of status updates
- dueDate: datetime
- gateway: string

### Business Logic

**Dispute Detection**:
- Receive dispute webhook from gateway
- Extract dispute details
- Link to booking and transaction
- Determine dispute type
- Calculate response deadline
- Alert support team immediately
- Create dispute record in database

**Evidence Collection**:
- Gather booking confirmation
- Collect customer signature
- Retrieve vehicle inspection photos
- Export communication logs
- Compile service delivery proof
- Prepare cancellation and refund policies
- Format evidence per gateway requirements

**Evidence Submission**:
- Validate evidence completeness
- Format for gateway API
- Submit through gateway dispute API
- Track submission status
- Monitor response deadline
- Send confirmation to support team

**Dispute Resolution**:
- Monitor dispute status through webhooks
- Update status on gateway decisions
- Handle won disputes (no action needed)
- Handle lost disputes (refund processed)
- Log resolution details
- Notify finance team
- Update dispute statistics

**Chargeback Prevention**:
- Analyze dispute patterns
- Identify high-risk bookings
- Implement preventive measures
- Improve customer communication
- Enhance service documentation
- Train support team on dispute handling

**Dispute Analytics**:
- Track dispute rate by gateway
- Calculate dispute costs
- Analyze dispute reasons
- Monitor win/loss rates
- Identify improvement opportunities
- Generate monthly dispute reports

### Authentication Requirements

- JWT authentication for all endpoints
- Admin or Support role for dispute management
- Finance role for dispute reports
- Gateway webhook signature verification
- Audit logging for all dispute actions

## Database Specifications

### Schema Changes

Add dispute tracking and evidence tables.

### Table Definitions

**PaymentDisputes** (new table):
```
CREATE TABLE PaymentDisputes (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    DisputeId VARCHAR(255) NOT NULL UNIQUE,
    BookingId INT NOT NULL,
    TransactionId VARCHAR(255) NOT NULL,
    Gateway ENUM('stripe', 'paypal') NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    Currency VARCHAR(3) NOT NULL,
    Reason VARCHAR(100) NOT NULL,
    Status ENUM(
        'warning_needs_response',
        'needs_response',
        'under_review',
        'won',
        'lost',
        'accepted'
    ) NOT NULL,
    DueDate DATETIME NOT NULL,
    EvidenceSubmittedAt DATETIME,
    ResolvedAt DATETIME,
    Resolution VARCHAR(50),
    DisputeCost DECIMAL(10,2) DEFAULT 0.00,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_disputes_booking 
        FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE,
    INDEX idx_dispute_id (DisputeId),
    INDEX idx_booking_id (BookingId),
    INDEX idx_status (Status),
    INDEX idx_due_date (DueDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**DisputeEvidence** (new table):
```
CREATE TABLE DisputeEvidence (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    DisputeId VARCHAR(255) NOT NULL,
    EvidenceType VARCHAR(100) NOT NULL,
    EvidenceData JSON NOT NULL,
    DocumentUrls JSON,
    SubmittedBy INT NOT NULL,
    SubmittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_dispute 
        FOREIGN KEY (DisputeId) REFERENCES PaymentDisputes(DisputeId) ON DELETE CASCADE,
    CONSTRAINT fk_evidence_user 
        FOREIGN KEY (SubmittedBy) REFERENCES Users(Id) ON DELETE CASCADE,
    INDEX idx_dispute_id (DisputeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Relationships

- PaymentDisputes → Bookings (many-to-one)
- DisputeEvidence → PaymentDisputes (many-to-one)
- DisputeEvidence → Users (many-to-one, submitted by)

### Indexes

- UNIQUE INDEX idx_dispute_id ON PaymentDisputes(DisputeId)
- INDEX idx_booking_id ON PaymentDisputes(BookingId)
- INDEX idx_status ON PaymentDisputes(Status)
- INDEX idx_due_date ON PaymentDisputes(DueDate)
- INDEX idx_dispute_id_evidence ON DisputeEvidence(DisputeId)

## Technology Stack

- Backend: .NET 8+ with C#
- Database: MySQL 8.0+

## Implementation Notes

- Receive dispute webhooks from gateways
- Alert support team immediately on new disputes
- Track response deadlines (typically 7-14 days)
- Collect evidence automatically from booking records
- Submit evidence before deadline
- Monitor dispute status through webhooks
- Update statistics on resolution
- Calculate dispute costs (chargeback fees)
- Track dispute rates by gateway
- Analyze dispute reasons for patterns
- Implement preventive measures
- Generate monthly dispute reports
- Train support team on evidence submission
- Maintain evidence templates
- Store all dispute communications
- Implement dispute escalation workflow
- Monitor win/loss rates
- Identify high-risk booking patterns
- Improve customer communication to prevent disputes
- Enhance service documentation
- Implement dispute cost tracking
- Generate dispute analytics dashboard
