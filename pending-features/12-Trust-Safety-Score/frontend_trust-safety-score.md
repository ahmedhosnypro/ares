# Feature: Trust & Safety Score

## Overview

The Trust & Safety Score is a composite reputation system that provides transparent visibility into user reliability and trustworthiness. This feature calculates a comprehensive trust score based on multiple factors including verification status, booking history, payment reliability, vehicle care, communication quality, cancellation patterns, and account age. The system incentivizes positive behavior, helps hosts and suppliers assess renter reliability, and builds confidence in the platform's community.

## Sprint Category

sprint-01 (Project - Important but can wait until after MVP)

## Feature ID

F-AM-010

## User Stories

**As a renter**, I want to see my trust score and understand what factors contribute to it, so that I can improve my reputation and access better rental opportunities.

**As a vehicle host**, I want to view a renter's trust score before accepting a booking, so that I can make informed decisions about who rents my vehicles.

**As a platform operator**, I want to incentivize good behavior through a transparent trust system, so that the community maintains high standards and reduces fraud.

**As a new user**, I want to understand how to build my trust score, so that I can quickly establish credibility on the platform.

**As a power renter**, I want my excellent track record reflected in my trust score, so that I receive preferential treatment and access to premium vehicles.

## Frontend Specifications

### Pages

#### 1. Trust Score Dashboard (`/account/trust-score`)

**Purpose**: Display comprehensive trust score with breakdown and improvement guidance

**Components**:
- Trust score display (0-100 numeric score or 1-5 star rating)
- Visual score indicator (progress bar, circular gauge, or star display)
- Score trend chart showing changes over time
- Score breakdown by component with individual ratings
- Verification badges for completed verifications
- Improvement tips and recommendations
- Score history timeline
- Comparison to platform average (optional)

**Layout**:
- Hero section with large trust score display
- Component breakdown cards showing each factor
- Timeline view of score changes
- Action items section with improvement suggestions

#### 2. Profile Trust Badge (`/profile`, `/account`)

**Purpose**: Display trust score badge on user profile

**Components**:
- Compact trust score badge (star rating or numeric)
- Verification status indicators
- Quick view tooltip with score breakdown
- Link to full trust score dashboard

**Placement**:
- User profile header
- Booking confirmation pages
- Communication interfaces
- Public profile view (for hosts to see renters)

### UI Components

#### TrustScoreDisplay Component

**Purpose**: Main trust score visualization

**Props**:
- `score`: number (0-100)
- `displayMode`: 'numeric' | 'stars' | 'both'
- `size`: 'small' | 'medium' | 'large'
- `showTrend`: boolean

**Features**:
- Animated score display on load
- Color coding (red: 0-40, yellow: 41-70, green: 71-100)
- Trend indicator (up/down arrow with percentage change)
- Responsive sizing

#### ScoreBreakdown Component

**Purpose**: Detailed breakdown of trust score components

**Props**:
- `components`: Array of score components with weights
- `expandable`: boolean

**Features**:
- Individual component scores with progress bars
- Weight indicators showing importance of each factor
- Expandable details for each component
- Visual indicators for completed vs pending items

#### VerificationBadges Component

**Purpose**: Display completed verification badges

**Props**:
- `verifications`: Array of verification types and statuses
- `layout`: 'horizontal' | 'vertical' | 'grid'

**Features**:
- Badge icons for each verification type
- Checkmark for completed verifications
- Pending/incomplete indicators
- Click to view verification details

#### ImprovementTips Component

**Purpose**: Actionable recommendations to improve trust score

**Props**:
- `currentScore`: number
- `missingVerifications`: Array
- `weakAreas`: Array

**Features**:
- Prioritized list of improvement actions
- Estimated score impact for each action
- Quick action buttons (e.g., "Complete Email Verification")
- Progress tracking for in-progress improvements

#### ScoreHistory Component

**Purpose**: Timeline visualization of score changes

**Props**:
- `history`: Array of score snapshots with dates
- `timeRange`: '30days' | '90days' | '1year' | 'all'

**Features**:
- Line chart showing score over time
- Event markers for significant changes
- Hover tooltips with details
- Time range selector

### User Flows

#### View Trust Score Flow

1. User navigates to account settings or profile
2. User clicks on trust score badge or "View Trust Score" link
3. System displays trust score dashboard with current score
4. User views score breakdown by component
5. User explores score history and trends
6. User reviews improvement tips
7. User clicks on improvement action to complete verification or update profile

#### Improve Trust Score Flow

1. User views trust score dashboard
2. System highlights areas for improvement
3. User selects an improvement action (e.g., "Complete Driver License Verification")
4. System navigates to relevant verification or profile page
5. User completes the action
6. System recalculates trust score
7. System displays updated score with congratulatory message
8. User sees score increase reflected in dashboard

#### Host Views Renter Trust Score Flow

1. Host receives booking request
2. Host views renter profile from booking request
3. System displays renter's trust score badge
4. Host clicks on trust score for detailed breakdown
5. System shows score components and verification status
6. Host makes informed decision to accept or decline booking

### Data Requirements

#### Trust Score Data

```typescript
interface TrustScore {
  userId: string;
  overallScore: number; // 0-100
  displayRating: number; // 1-5 stars
  lastUpdated: Date;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  components: TrustScoreComponent[];
  verifications: VerificationStatus[];
  improvementTips: ImprovementTip[];
  scoreHistory: ScoreSnapshot[];
}

interface TrustScoreComponent {
  name: string; // e.g., "Verification Status"
  score: number; // 0-100
  weight: number; // 0-1 (percentage of overall score)
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  lastUpdated: Date;
}

interface VerificationStatus {
  type: 'email' | 'phone' | 'license' | 'kyc' | 'payment';
  completed: boolean;
  completedDate?: Date;
  expirationDate?: Date;
  status: 'verified' | 'pending' | 'expired' | 'not_started';
}

interface ImprovementTip {
  id: string;
  title: string;
  description: string;
  estimatedImpact: number; // Points increase
  priority: 'high' | 'medium' | 'low';
  actionUrl: string;
  actionLabel: string;
  category: string;
}

interface ScoreSnapshot {
  date: Date;
  score: number;
  event?: string; // Description of what caused change
  changeAmount: number;
}
```

#### API Endpoints

- `GET /api/users/{userId}/trust-score` - Retrieve current trust score
- `GET /api/users/{userId}/trust-score/history` - Retrieve score history
- `GET /api/users/{userId}/trust-score/breakdown` - Detailed component breakdown
- `GET /api/users/{userId}/trust-score/improvement-tips` - Get personalized tips
- `POST /api/users/{userId}/trust-score/recalculate` - Trigger score recalculation

### Responsive Design

**Desktop (1024px+)**:
- Full dashboard layout with side-by-side components
- Large score display with detailed charts
- Multi-column breakdown view

**Tablet (768px - 1023px)**:
- Stacked layout with full-width components
- Medium-sized score display
- Two-column breakdown view

**Mobile (< 768px)**:
- Single-column layout
- Compact score display
- Collapsible component sections
- Simplified charts optimized for small screens

### Accessibility

- ARIA labels for score displays and progress bars
- Keyboard navigation for all interactive elements
- Screen reader announcements for score changes
- High contrast mode support
- Focus indicators on all clickable elements
- Alternative text for badge icons

## Backend Specifications

### API Endpoints

#### GET /api/users/{userId}/trust-score

**Purpose**: Retrieve user's current trust score with breakdown

**Authentication**: Required (JWT token)

**Authorization**: User can view own score; hosts can view renter scores for active bookings

**Request Parameters**:
- `userId` (path): User ID

**Response Schema**:
```json
{
  "userId": "string",
  "overallScore": 85,
  "displayRating": 4.5,
  "lastUpdated": "2026-02-23T10:30:00Z",
  "trend": "up",
  "trendPercentage": 5.2,
  "components": [
    {
      "name": "Verification Status",
      "score": 90,
      "weight": 0.25,
      "status": "excellent",
      "description": "Email, phone, and license verified",
      "lastUpdated": "2026-02-20T14:00:00Z"
    },
    {
      "name": "Booking History",
      "score": 85,
      "weight": 0.20,
      "status": "good",
      "description": "15 completed bookings",
      "lastUpdated": "2026-02-23T10:30:00Z"
    }
  ],
  "verifications": [
    {
      "type": "email",
      "completed": true,
      "completedDate": "2025-12-01T09:00:00Z",
      "status": "verified"
    }
  ],
  "improvementTips": [
    {
      "id": "complete-kyc",
      "title": "Complete Enhanced Verification",
      "description": "Complete KYC verification to increase your score by up to 10 points",
      "estimatedImpact": 10,
      "priority": "high",
      "actionUrl": "/account/verification/kyc",
      "actionLabel": "Start Verification",
      "category": "verification"
    }
  ]
}
```

**Status Codes**:
- 200: Success
- 401: Unauthorized
- 403: Forbidden (cannot view other user's score)
- 404: User not found

#### GET /api/users/{userId}/trust-score/history

**Purpose**: Retrieve historical trust score data

**Authentication**: Required

**Request Parameters**:
- `userId` (path): User ID
- `timeRange` (query): '30days' | '90days' | '1year' | 'all'
- `limit` (query): Maximum number of snapshots (default: 100)

**Response Schema**:
```json
{
  "userId": "string",
  "timeRange": "90days",
  "snapshots": [
    {
      "date": "2026-02-23T10:30:00Z",
      "score": 85,
      "event": "Completed booking #1234",
      "changeAmount": 2
    },
    {
      "date": "2026-02-15T14:20:00Z",
      "score": 83,
      "event": "Driver license verified",
      "changeAmount": 5
    }
  ]
}
```

#### POST /api/users/{userId}/trust-score/recalculate

**Purpose**: Trigger trust score recalculation

**Authentication**: Required

**Authorization**: User can recalculate own score; system can trigger for any user

**Request Body**: None

**Response Schema**:
```json
{
  "userId": "string",
  "previousScore": 80,
  "newScore": 85,
  "changeAmount": 5,
  "recalculatedAt": "2026-02-23T10:30:00Z",
  "changedComponents": [
    {
      "name": "Verification Status",
      "previousScore": 75,
      "newScore": 90,
      "reason": "Driver license verified"
    }
  ]
}
```

### Business Logic

#### Trust Score Calculation Algorithm

**Overall Score Formula**:
```
Overall Score = Σ (Component Score × Component Weight)
```

**Component Weights**:
- Verification Status: 25%
- Booking History: 20%
- Payment Reliability: 20%
- Vehicle Care: 15%
- Communication Quality: 10%
- Cancellation Rate: 5%
- Account Age: 5%

**Component Scoring Rules**:

1. **Verification Status (0-100)**:
   - Email verified: +20 points
   - Phone verified: +20 points
   - Driver license verified: +30 points
   - KYC completed: +20 points
   - Payment method added: +10 points

2. **Booking History (0-100)**:
   - 0 bookings: 0 points
   - 1-5 bookings: 40 points
   - 6-15 bookings: 70 points
   - 16-30 bookings: 85 points
   - 31+ bookings: 100 points

3. **Payment Reliability (0-100)**:
   - No late payments: 100 points
   - 1 late payment: 80 points
   - 2-3 late payments: 60 points
   - 4+ late payments: 40 points
   - Chargebacks: -20 points each

4. **Vehicle Care (0-100)**:
   - No damage claims: 100 points
   - 1 minor damage: 85 points
   - 2+ minor damages: 70 points
   - 1 major damage: 50 points
   - 2+ major damages: 30 points

5. **Communication Quality (0-100)**:
   - Average response time < 1 hour: 100 points
   - Average response time 1-4 hours: 85 points
   - Average response time 4-24 hours: 70 points
   - Average response time > 24 hours: 50 points
   - Host ratings average: (rating / 5) × 100

6. **Cancellation Rate (0-100)**:
   - 0% cancellation rate: 100 points
   - 1-5% cancellation rate: 90 points
   - 6-10% cancellation rate: 75 points
   - 11-20% cancellation rate: 50 points
   - 21%+ cancellation rate: 25 points

7. **Account Age (0-100)**:
   - < 1 month: 40 points
   - 1-3 months: 60 points
   - 3-6 months: 75 points
   - 6-12 months: 85 points
   - 12+ months: 100 points

#### Score Update Triggers

Trust score should be recalculated when:
- User completes a verification (email, phone, license, KYC)
- Booking is completed
- Payment is processed or becomes late
- Vehicle return inspection is completed
- Damage claim is filed
- User cancels a booking
- Host rates the user
- User responds to host communication
- Account reaches age milestones (1 month, 3 months, etc.)

#### Improvement Tip Generation

System generates personalized improvement tips based on:
- Missing verifications (highest priority)
- Low-scoring components
- Recent negative events
- Comparison to platform average
- User segment and goals

### Authentication Requirements

- JWT token required for all endpoints
- User can view own trust score
- Hosts can view renter trust scores for active/pending bookings
- Admins can view any user's trust score
- Public profiles may show limited trust score (stars only, no breakdown)

### Performance Considerations

- Cache trust scores for 1 hour to reduce calculation overhead
- Invalidate cache on score-affecting events
- Use background jobs for score recalculation
- Index database tables for efficient component queries
- Implement rate limiting on recalculation endpoint

## Database Specifications

### Schema Changes

#### New Table: trust_scores

**Purpose**: Store calculated trust scores and component breakdowns

```sql
CREATE TABLE trust_scores (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  overall_score DECIMAL(5,2) NOT NULL,
  display_rating DECIMAL(3,2) NOT NULL,
  verification_score DECIMAL(5,2) NOT NULL,
  booking_history_score DECIMAL(5,2) NOT NULL,
  payment_reliability_score DECIMAL(5,2) NOT NULL,
  vehicle_care_score DECIMAL(5,2) NOT NULL,
  communication_score DECIMAL(5,2) NOT NULL,
  cancellation_rate_score DECIMAL(5,2) NOT NULL,
  account_age_score DECIMAL(5,2) NOT NULL,
  calculated_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_overall_score (overall_score),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### New Table: trust_score_history

**Purpose**: Track trust score changes over time

```sql
CREATE TABLE trust_score_history (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  previous_score DECIMAL(5,2),
  change_amount DECIMAL(5,2),
  event_type VARCHAR(50),
  event_description TEXT,
  component_changed VARCHAR(50),
  recorded_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_recorded_at (recorded_at),
  INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### New Table: trust_score_components

**Purpose**: Store detailed component metrics for score calculation

```sql
CREATE TABLE trust_score_components (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  component_name VARCHAR(50) NOT NULL,
  raw_value DECIMAL(10,2),
  calculated_score DECIMAL(5,2) NOT NULL,
  weight DECIMAL(3,2) NOT NULL,
  status ENUM('excellent', 'good', 'fair', 'poor') NOT NULL,
  description TEXT,
  last_updated DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_component_name (component_name),
  INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### New Table: improvement_tips

**Purpose**: Store generated improvement recommendations

```sql
CREATE TABLE improvement_tips (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  estimated_impact DECIMAL(5,2) NOT NULL,
  priority ENUM('high', 'medium', 'low') NOT NULL,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  status ENUM('active', 'completed', 'dismissed') DEFAULT 'active',
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table Modifications

#### users table

Add trust score reference fields:

```sql
ALTER TABLE users
ADD COLUMN current_trust_score DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN trust_score_updated_at DATETIME,
ADD INDEX idx_trust_score (current_trust_score);
```

### Relationships

- `trust_scores.user_id` → `users.id` (Many-to-One)
- `trust_score_history.user_id` → `users.id` (Many-to-One)
- `trust_score_components.user_id` → `users.id` (Many-to-One)
- `improvement_tips.user_id` → `users.id` (Many-to-One)

### Indexes

**Performance Optimization**:
- Index on `trust_scores.user_id` for fast user lookup
- Index on `trust_scores.overall_score` for leaderboard queries
- Index on `trust_scores.expires_at` for cache invalidation
- Index on `trust_score_history.user_id` and `recorded_at` for timeline queries
- Composite index on `improvement_tips(user_id, status)` for active tips

**Query Optimization**:
- Use covering indexes for common queries
- Partition `trust_score_history` by date for large datasets
- Archive old history records (> 2 years) to separate table

### Data Integrity

**Constraints**:
- All score values must be between 0 and 100
- Weights must sum to 1.0 across all components
- `expires_at` must be greater than `calculated_at`
- `recorded_at` in history must be chronological

**Triggers**:
- Update `users.current_trust_score` when `trust_scores` is updated
- Create history entry when trust score changes
- Validate score ranges on insert/update

### Migration Strategy

1. Create new tables in order: `trust_scores`, `trust_score_history`, `trust_score_components`, `improvement_tips`
2. Add columns to `users` table
3. Backfill trust scores for existing users (background job)
4. Create indexes after data population
5. Enable triggers and constraints

## Technology Stack

- **Backend**: .NET 8+ with C#, ASP.NET Core Web API
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Frontend**: Next.js 14+ with React 18+, TypeScript
- **Caching**: Redis for trust score caching
- **Background Jobs**: Hangfire for score recalculation
- **Authentication**: JWT tokens with .NET Identity

## Implementation Notes

### Score Calculation Performance

- Calculate scores asynchronously using background jobs
- Cache calculated scores for 1 hour
- Invalidate cache immediately on score-affecting events
- Use database views for complex component calculations
- Consider pre-calculating component scores nightly

### Privacy Considerations

- Users control visibility of trust score on public profile
- Hosts only see scores for active/pending bookings
- Score breakdown may be limited for privacy
- Comply with GDPR for score data export and deletion

### Gamification Strategy

- Display score improvements with celebratory animations
- Send notifications when score increases
- Highlight milestones (first 80+ score, 90+ score, etc.)
- Show progress toward next tier or badge
- Compare to platform average (optional, user-controlled)

### Testing Requirements

- Unit tests for score calculation algorithm
- Integration tests for score update triggers
- Load tests for score calculation performance
- A/B tests for score display formats
- User acceptance testing for improvement tips

### Future Enhancements

- Machine learning model for fraud detection
- Predictive scoring based on behavior patterns
- Peer-to-peer reputation system
- Cross-platform reputation portability (DID integration)
- Dynamic weight adjustment based on user segment
