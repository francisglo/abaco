# ÁBACO Backend Modules Documentation

## Overview

ÁBACO is a comprehensive territorial, social, and political management platform. Originally built for electoral analysis, it has evolved into an integral platform for public administration, community engagement, and strategic intelligence.

**API Version**: 2.0.0
**Status**: Production-ready with continuous intelligence capabilities

---

## Module Architecture

### 1. Electoral Core (Original)
Foundation modules for voter management and electoral activities.

#### 1.1 Voters Module (`/api/voters`)
- **Purpose**: Manage voter profiles and electoral data
- **Primary Endpoints**:
  - `GET /api/voters` - List voters with filtering
  - `POST /api/voters` - Register new voter
  - `PUT /api/voters/:voterId` - Update voter information
  - `DELETE /api/voters/:voterId` - Deactivate voter

#### 1.2 Users Module (`/api/users`)
- **Purpose**: System user management and role-based access
- **Primary Endpoints**:
  - `GET /api/users` - List system users
  - `POST /api/users` - Create new user account
  - `PUT /api/users/:userId` - Update user profile
  - `DELETE /api/users/:userId` - Remove user

#### 1.3 Zones Module (`/api/zones`)
- **Purpose**: Territorial organization and zone management
- **Primary Endpoints**:
  - `GET /api/zones` - List territorial zones
  - `POST /api/zones` - Create new zone
  - `PUT /api/zones/:zoneId` - Update zone information

#### 1.4 Tasks Module (`/api/tasks`)
- **Purpose**: Field work and activity assignment
- **Primary Endpoints**:
  - `GET /api/tasks` - List assigned tasks
  - `POST /api/tasks` - Create new task
  - `PUT /api/tasks/:taskId` - Update task status

---

### 2. Citizen Services Module (`/api/citizen-requests`)
**NEW** - Comprehensive citizen request and complaint management system.

#### Purpose
Capture, track, and resolve all citizen requests including petitions, complaints, and suggestions across territories.

#### Key Features
- **Request Types**: Petitions, complaints, suggestions, claims
- **Priority System**: Urgency levels 1-5 with automatic sorting
- **Status Tracking**: Real-time request lifecycle management
- **Case History**: Complete audit trail of all modifications

#### Database Tables
- `citizen_requests` (19 columns): Core request data
- `case_tracking` (8 columns): Request history and modifications

#### Primary Endpoints

##### List Requests
```http
GET /api/citizen-requests?page=1&limit=20&status=pending&zone_id=1&urgency_min=3
```
**Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `status`: Request status (pending, in_progress, resolved)
- `priority`: Request priority (low, medium, high, critical)
- `zone_id`: Filter by zone
- `urgency_min`: Minimum urgency level (1-5)

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "request_type": "complaint",
      "title": "Broken street light",
      "citizen_name": "Juan Pérez",
      "zone_id": 1,
      "urgency": 4,
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

##### Get Request by Priority
```http
GET /api/citizen-requests/urgent/priority
```
Returns requests sorted by urgency descending, ideal for priority queue display.

##### Get Request Statistics
```http
GET /api/citizen-requests/stats
```
**Response**:
```json
{
  "total_requests": 150,
  "by_status": {
    "pending": 45,
    "in_progress": 60,
    "resolved": 45
  },
  "by_type": {
    "complaint": 80,
    "petition": 50,
    "suggestion": 15,
    "claim": 5
  },
  "complaint_rate": 53.3,
  "average_urgency": 3.2
}
```

##### Create Request
```http
POST /api/citizen-requests
Content-Type: application/json

{
  "request_type": "complaint",
  "title": "Pothole on Main Street",
  "description": "Large pothole near the market, dangerous for vehicles",
  "citizen_name": "Maria González",
  "citizen_phone": "+57 312 1234567",
  "citizen_email": "maria@example.com",
  "zone_id": 1,
  "urgency": 3,
  "latitude": 4.7110,
  "longitude": -74.0094
}
```

##### Update Request
```http
PUT /api/citizen-requests/:requestId
Content-Type: application/json

{
  "status": "in_progress",
  "assigned_to": 5,
  "priority": "high"
}
```

##### Case Tracking
```http
POST /api/citizen-requests/:requestId/tracking
Content-Type: application/json

{
  "activity": "Inspector visited location and documented damage",
  "status_change": "in_progress",
  "notes": "Estimated repair time: 2 days"
}
```

```http
GET /api/citizen-requests/:requestId/tracking
```

---

### 3. Territorial Communication Module (`/api/territorial-communication`)
**NEW** - Multi-faceted local engagement and reporting system.

#### Purpose
Organize events, manage volunteer activities, coordinate field reporting, and maintain territorial presence.

#### Key Features
- **Event Management**: Schedule and track community events
- **Activity Coordination**: Link activities to events with progress tracking
- **Volunteer Registry**: Maintain volunteer database with skills and availability
- **Field Reporting**: Structured reporting from field operatives with validation workflow

#### Database Tables
- `events` (17 columns): Community events
- `activities` (10 columns): Event-linked activities
- `volunteers` (13 columns): Volunteer registry
- `volunteer_assignments` (8 columns): Activity assignments
- `field_reports` (14 columns): Field observations

#### Primary Endpoints

##### Events Management
```http
GET /api/territorial-communication/events?zone_id=1&status=scheduled
POST /api/territorial-communication/events
PUT /api/territorial-communication/events/:eventId/attendance
```

##### Activities Management
```http
GET /api/territorial-communication/activities
POST /api/territorial-communication/activities
PUT /api/territorial-communication/activities/:activityId
```

##### Volunteer Management
```http
GET /api/territorial-communication/volunteers?skill_area=coordinator
POST /api/territorial-communication/volunteers
POST /api/territorial-communication/volunteers/:volunteerId/assign
POST /api/territorial-communication/volunteer-assignments/:assignmentId/hours
```

##### Field Reports
```http
GET /api/territorial-communication/field-reports
POST /api/territorial-communication/field-reports
PUT /api/territorial-communication/field-reports/:reportId/review
```

##### Statistics
```http
GET /api/territorial-communication/stats/:zoneId
```

**Response Example**:
```json
{
  "zone_id": 1,
  "events": {
    "total": 12,
    "pending": 3,
    "in_progress": 1,
    "completed": 8
  },
  "activities": {
    "total": 45,
    "completed": 35,
    "pending": 10,
    "average_progress": 78
  },
  "volunteers": {
    "active": 32,
    "total_hours": 950,
    "average_hours": 29.7
  },
  "field_reports": {
    "total": 28,
    "pending_review": 2
  }
}
```

---

### 4. Management Indicators Module (`/api/management-indicators`)
**NEW** - Goal setting, project management, and impact measurement system.

#### Purpose
Track organizational goals, manage projects with milestones, monitor key indicators, and measure territorial impact.

#### Key Features
- **Goal Management**: Define and track progress toward organizational objectives
- **Project Tracking**: Monitor project execution with budget and timeline tracking
- **Milestone Management**: Break projects into actionable milestones
- **Indicator Monitoring**: Track KPIs and calculations of trends
- **Impact Analysis**: Measure and report on actual vs. expected outcomes

#### Database Tables
- `goals` (11 columns): SMART goals with progress
- `projects` (13 columns): Project definitions with budget tracking
- `project_progress` (8 columns): Milestone tracking
- `territorial_indicators` (10 columns): Key metrics and trends

#### Primary Endpoints

##### Goals Management
```http
GET /api/management-indicators/goals?zone_id=1&status=in_progress
POST /api/management-indicators/goals
PUT /api/management-indicators/goals/:goalId/progress
```

**Create Goal Example**:
```json
{
  "title": "Increase community participation",
  "description": "Achieve 85% participation in community meetings",
  "zone_id": 1,
  "manager_id": 5,
  "target_value": 85,
  "unit": "percentage",
  "start_date": "2024-01-01",
  "due_date": "2024-12-31",
  "priority": "high"
}
```

**Update Progress Example**:
```json
{
  "current_value": 72,
  "status": "in_progress"
}
```

##### Projects Management
```http
GET /api/management-indicators/projects?zone_id=1&status=in_execution
POST /api/management-indicators/projects
PUT /api/management-indicators/projects/:projectId
POST /api/management-indicators/projects/:projectId/milestones
PUT /api/management-indicators/milestones/:milestoneId/complete
```

##### Indicators Management
```http
GET /api/management-indicators/indicators?zone_id=1
POST /api/management-indicators/indicators
```

##### Statistics and Impact
```http
GET /api/management-indicators/stats/:zoneId
GET /api/management-indicators/impact/:projectId
```

---

### 5. Strategic Intelligence Module (`/api/strategic-intelligence`)
**NEW** - Advanced analytical and risk assessment capabilities.

#### Purpose
Analyze territorial trends, identify political risks, compare zones, maintain relationships with social leaders, and track commitments.

#### Key Features
- **Comparative Analysis**: Multi-metric zone comparison over time
- **Trend Analysis**: 30/60/90-day trend windows for citizen requests, events, volunteers
- **Risk Scoring**: Algorithmic risk assessment with severity levels
- **Strategic Alerts**: Automated alert generation based on thresholds
- **Social Leader Registry**: Track key influencers and relationships
- **Commitment Tracking**: Record and monitor political/social commitments

#### Database Tables
- `strategic_alerts` (11 columns): Risk alerts with acknowledgment
- `social_leaders` (10 columns): Leader registry with influence levels
- `commitments` (11 columns): Pledge and promise tracking
- `zone_comparison` (9 columns): Historical comparative analysis

#### Risk Scoring Algorithm

The risk assessment uses a weighted formula:

```
Risk Score = (Complaint Rate / 100 × 0.40) + 
             (Avg Urgency / 5 × 0.30) + 
             (Pending Requests / Total Requests × 0.30)

Risk Level:
- CRITICAL: Score > 70
- HIGH: Score > 50
- MEDIUM: Score > 30
- LOW: Score ≤ 30
```

#### Primary Endpoints

##### Zone Comparison
```http
POST /api/strategic-intelligence/compare-zones
Content-Type: application/json

{
  "zone_a_id": 1,
  "zone_b_id": 2,
  "metrics": [
    "voters_count",
    "events",
    "pending_requests",
    "volunteers",
    "avg_urgency"
  ]
}
```

**Response**:
```json
{
  "comparison_date": "2024-01-15T10:30:00Z",
  "zone_a": { "name": "Centro", "id": 1 },
  "zone_b": { "name": "Periferia", "id": 2 },
  "metrics": [
    {
      "metric": "voters_count",
      "value_a": 5000,
      "value_b": 3200,
      "difference": 1800,
      "percentage_diff": 56.25,
      "analysis": "Zone A has 56% more registered voters"
    }
  ]
}
```

##### Territorial Trends
```http
GET /api/strategic-intelligence/trends?page=1&limit=20
```

**Query Parameters**:
- `timeframe`: 30, 60, or 90 (days, default: 30)

**Response**:
```json
{
  "timeframe_days": 30,
  "trends": {
    "citizen_requests": [ { "date": "2024-01-01", "count": 5 }, ... ],
    "events": [ { "date": "2024-01-01", "count": 2 }, ... ],
    "volunteers": [ { "date": "2024-01-01", "count": 3 }, ... ]
  }
}
```

##### Risk Analysis
```http
GET /api/strategic-intelligence/risk-analysis/:zoneId
```

**Response**:
```json
{
  "zone_id": 1,
  "zone_name": "Centro",
  "analysis_date": "2024-01-15T10:30:00Z",
  "risk_metrics": {
    "complaint_rate": 45.2,
    "avg_urgency": 3.5,
    "pending_requests_ratio": 30.0
  },
  "risk_score": 58.5,
  "risk_level": "HIGH",
  "recommendations": [
    "Increase field presence in complaint hotspots",
    "Schedule community meeting to address citizen concerns",
    "Assign additional resources to ongoing cases",
    "Implement citizen communication protocol"
  ]
}
```

##### Strategic Alerts
```http
GET /api/strategic-intelligence/alerts
POST /api/strategic-intelligence/alerts
PUT /api/strategic-intelligence/alerts/:alertId/acknowledge
```

**Create Alert Example**:
```json
{
  "title": "High complaint rate in zone",
  "alert_type": "social",
  "severity": "HIGH",
  "zone_id": 1,
  "description": "Complaint rate exceeded 50% threshold",
  "threshold_value": 50,
  "current_value": 52.3,
  "recommendation": "Immediate intervention required"
}
```

##### Social Leaders Management
```http
GET /api/strategic-intelligence/social-leaders?zone_id=1&page=1
POST /api/strategic-intelligence/social-leaders
```

**Record Social Leader Example**:
```json
{
  "name": "Carlos Martínez",
  "organization": "Community Council",
  "zone_id": 1,
  "influence_level": "regional",
  "contact_phone": "+57 312 1234567",
  "contact_email": "carlos@example.com",
  "area_of_influence": "Education and community development",
  "notes": "Key stakeholder in educational initiatives"
}
```

##### Commitments Management
```http
GET /api/strategic-intelligence/commitments
POST /api/strategic-intelligence/commitments
PUT /api/strategic-intelligence/commitments/:commitmentId/complete
```

---

## Authentication & Authorization

### Authentication
All endpoints (except `/api/auth/login`) require JWT Bearer token in the Authorization header.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authorization Levels
1. **admin**: Full system access
2. **operator**: Manage citizens, tasks, and field operations
3. **auditor**: Read-only access to all data
4. **viewer**: Limited read access to assigned zones

---

## Error Handling

All API responses follow a standardized error format:

### Validation Error (400)
```json
{
  "error": "Validation error",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "details": [
    {
      "field": "citizen_email",
      "message": "must be a valid email"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Not Found (404)
```json
{
  "error": "Citizen request not found",
  "code": "NOT_FOUND",
  "statusCode": 404,
  "message": "No citizen request found with ID 999",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Server Error (500)
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Use Cases Supported

ÁBACO now supports 25+ specific use cases including:

### Public Administration
- Citizen request management and resolution
- Public complaint tracking and follow-up
- Municipal priority goal tracking
- Project management with budgets and impact measurement

### Social Programs
- Event and activity coordination
- Volunteer management and development
- Community intervention tracking
- Social impact measurement

### Political/Territorial Strategy
- Territory comparison and benchmarking
- Risk identification and early warning
- Social leader relationship management
- Commitment tracking and fulfillment
- Trend analysis and forecasting
- Continuous voter base development

---

## Integration Examples

### Complete Citizen Request Workflow
```
1. POST /api/citizen-requests → Create request
2. GET /api/citizen-requests/:id → View request details
3. POST /api/citizen-requests/:requestId/tracking → Add tracking entry
4. PUT /api/citizen-requests/:id → Assign to operator
5. POST /api/citizen-requests/:requestId/tracking → Log progress
6. PUT /api/citizen-requests/:id → Update to resolved
7. GET /api/citizen-requests/stats → View impact metrics
```

### Risk Assessment and Response
```
1. GET /api/strategic-intelligence/risk-analysis/:zoneId → Check risk
2. GET /api/strategic-intelligence/trends → Analyze historical data
3. POST /api/strategic-intelligence/alerts → Create alert if needed
4. POST /api/territorial-communication/events → Schedule intervention event
5. GET /api/strategic-intelligence/social-leaders → Engage leaders
```

### Project Tracking Workflow
```
1. POST /api/management-indicators/projects → Create project
2. POST /api/management-indicators/projects/:id/milestones → Add milestones
3. PUT /api/management-indicators/projects/:id → Update status and spending
4. PUT /api/management-indicators/milestones/:id/complete → Mark milestone done
5. GET /api/management-indicators/impact/:id → View impact analysis
```

### Subscription Monetization Workflow
```
1. POST /api/subscriptions/plans → Create commercial plan
2. POST /api/subscriptions → Create customer subscription
3. POST /api/subscriptions/:id/payments → Register payment
4. GET /api/subscriptions/metrics/revenue → Monitor recurring revenue
5. POST /api/subscriptions/:id/renew → Renew contract cycle
```

---

## Subscription Module

### 6. Business Monetization Module (`/api/subscriptions`)

#### Purpose
Manage SaaS plans, annual/institutional contracts, campaign licenses, renewals, and recurring revenue tracking.

#### Primary Endpoints
- `GET /api/subscriptions/plans` - List commercial plans
- `POST /api/subscriptions/plans` - Create plan (admin)
- `PUT /api/subscriptions/plans/:id` - Update plan (admin)
- `GET /api/subscriptions` - List subscriptions with filters
- `POST /api/subscriptions` - Create subscription contract
- `PUT /api/subscriptions/:id` - Update subscription details
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/subscriptions/:id/renew` - Renew subscription
- `POST /api/subscriptions/:id/payments` - Register payment
- `GET /api/subscriptions/metrics/revenue` - Revenue metrics (MRR/cash-in)

#### Data Model
- `subscription_plans`: catalog of plans (SaaS, hybrid, campaign, annual)
- `subscriptions`: active contracts per organization
- `subscription_payments`: payment history for billing and reporting

---

## Database Schema Overview

**Total Tables**: 22
- 8 Electoral core tables (users, voters, zones, tasks, etc.)
- 14 New feature tables (citizen requests, events, volunteers, goals, projects, etc.)

**Total Columns**: 200+
**Performance Indexes**: 35+

---

## Best Practices

### Rate Limiting
- 100 requests per minute per user
- Batch operations for large data imports

### Pagination
- Always use pagination for list endpoints
- Default limit is 20 items per page
- Maximum limit is 100 items per page

### Filtering
- Use specific filters to reduce query load
- Combine filters for more precise results

### Error Handling
- Check response status code before processing data
- Handle Validation errors (400) distinctly from server errors (500)
- Retry transient errors with exponential backoff

### Audit Trail
- All CREATE, UPDATE, DELETE operations are logged
- Access logs maintained for compliance
- Audit queries available for admin users

---

Last Updated: January 2024
Version: 2.0.0
