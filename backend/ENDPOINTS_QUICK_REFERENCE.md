# ÁBACO API Endpoints Quick Reference

## Overview
ÁBACO v2.0.0 exposes 65+ REST endpoints across 9 modules. All endpoints require JWT authentication except for `/api/auth/login` and `/api/auth/register`.

---

## Module 1: Authentication (`/api/auth`)

### Public Endpoints (No JWT Required)
| Method | Endpoint | Description | Payload |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | {name, email, password, role, zoneId?} |
| POST | `/api/auth/login` | Get JWT token | {email, password} |

### Protected Endpoints
| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| POST | `/api/auth/refresh` | Refresh JWT token | {token} |
| POST | `/api/auth/logout` | Invalidate token | {message} |

---

## Module 2: Electoral Core

### 2.1 Voters (`/api/voters`)
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/voters` | page, limit, status, zone_id | List voters with pagination |
| GET | `/api/voters/:voterId` | - | Get voter details |
| POST | `/api/voters` | Body: voter data | Create new voter |
| PUT | `/api/voters/:voterId` | Body: update fields | Update voter |
| DELETE | `/api/voters/:voterId` | - | Deactivate voter |
| GET | `/api/voters/stats/:zoneId` | - | Zone voter statistics |

### 2.2 Users (`/api/users`)
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/users` | page, limit, role | List system users |
| GET | `/api/users/:userId` | - | Get user profile |
| POST | `/api/users` | Body: user data | Create new user |
| PUT | `/api/users/:userId` | Body: update fields | Update user |
| DELETE | `/api/users/:userId` | - | Deactivate user |
| GET | `/api/users/profile` | - | Get current user profile |

### 2.3 Zones (`/api/zones`)
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/zones` | page, limit, priority | List territorial zones |
| GET | `/api/zones/:zoneId` | - | Get zone details |
| POST | `/api/zones` | Body: zone data | Create new zone |
| PUT | `/api/zones/:zoneId` | Body: update fields | Update zone |

### 2.4 Tasks (`/api/tasks`)
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/tasks` | page, limit, status, assignedTo | List tasks |
| GET | `/api/tasks/:taskId` | - | Get task details |
| POST | `/api/tasks` | Body: task data | Create new task |
| PUT | `/api/tasks/:taskId` | Body: update fields | Update task |
| DELETE | `/api/tasks/:taskId` | - | Delete task |
| GET | `/api/tasks/by-zone/:zoneId` | page, limit | Get zone tasks |

---

## Module 3: Citizen Services (`/api/citizen-requests`)

### List & Retrieve
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/citizen-requests` | page, limit, status, priority, zone_id, urgency_min | List all requests |
| GET | `/api/citizen-requests/urgent/priority` | - | Get requests by urgency (priority queue) |
| GET | `/api/citizen-requests/:id` | - | Get request details |
| GET | `/api/citizen-requests/stats` | - | Get aggregate statistics |

### Create & Update
| Method | Endpoint | Body | Description |
|--------|----------|------|------------|
| POST | `/api/citizen-requests` | {request_type, title, description, citizen_name, citizen_phone, citizen_email, zone_id, urgency, lat?, long?} | Create request |
| PUT | `/api/citizen-requests/:id` | {status, priority, assigned_to?, urgency?, resolution_notes?} | Update request |
| DELETE | `/api/citizen-requests/:id` | - | Delete request |

### Case Tracking
| Method | Endpoint | Body | Description |
|--------|----------|------|------------|
| POST | `/api/citizen-requests/:requestId/tracking` | {activity, status_change, notes?} | Add tracking entry |
| GET | `/api/citizen-requests/:requestId/tracking` | - | Get request history |

---

## Module 4: Territorial Communication (`/api/territorial-communication`)

### Events
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/territorial-communication/events` | page, limit, zone_id, status | List events |
| POST | `/api/territorial-communication/events` | {title, description, event_type, zone_id, location, event_date, event_time, expected_attendees?, lat?, long?} | Create event |
| PUT | `/api/territorial-communication/events/:eventId/attendance` | {actual_attendees, report?, status?} | Update attendance |

### Activities
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/territorial-communication/activities` | page, limit, event_id, status | List activities |
| POST | `/api/territorial-communication/activities` | {event_id, activity_type, description, assigned_to, scheduled_date} | Create activity |
| PUT | `/api/territorial-communication/activities/:activityId` | {status?, progress?, completion_date?, notes?} | Update activity |

### Volunteers
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/territorial-communication/volunteers` | page, limit, zone_id, skill_area, status | List volunteers |
| POST | `/api/territorial-communication/volunteers` | {name, email, phone, skill_area, availability, zone_id, organization?} | Register volunteer |
| POST | `/api/territorial-communication/volunteers/:volunteerId/assign` | {activity_id} | Assign to activity |
| POST | `/api/territorial-communication/volunteer-assignments/:assignmentId/hours` | {volunteer_id, hours_worked, feedback?} | Record hours |

### Field Reports
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/territorial-communication/field-reports` | page, limit, zone_id, status | List field reports |
| POST | `/api/territorial-communication/field-reports` | {zone_id, report_type, title, observations, findings?, photos_count?, location?, lat?, long?} | Submit report |
| PUT | `/api/territorial-communication/field-reports/:reportId/review` | {status, review_notes?} | Review report |

### Statistics
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/territorial-communication/stats/:zoneId` | - | Get zone statistics |
| GET | `/api/territorial-communication/stats` | - | Get global statistics |

---

## Module 5: Management Indicators (`/api/management-indicators`)

### Goals
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/management-indicators/goals` | page, limit, zone_id, status | List goals |
| POST | `/api/management-indicators/goals` | {title, description, zone_id, manager_id, target_value, unit, start_date, due_date, priority?} | Create goal |
| PUT | `/api/management-indicators/goals/:goalId/progress` | {current_value, status?, notes?} | Update progress |

### Projects
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/management-indicators/projects` | page, limit, zone_id, status | List projects |
| POST | `/api/management-indicators/projects` | {name, description, zone_id, manager_id, budget, start_date, due_date, priority?, expected_impact?} | Create project |
| PUT | `/api/management-indicators/projects/:projectId` | {status?, spent?, completion_date?, actual_impact?} | Update project |

### Milestones
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| POST | `/api/management-indicators/projects/:projectId/milestones` | {milestone, description?, planned_date} | Add milestone |
| PUT | `/api/management-indicators/milestones/:milestoneId/complete` | {progress, actual_date, notes?} | Complete milestone |

### Indicators
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/management-indicators/indicators` | page, limit, zone_id | List indicators |
| POST | `/api/management-indicators/indicators` | {zone_id, indicator_name, indicator_type, value, baseline?, target?, unit, data_source?} | Record indicator |

### Statistics & Analysis
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/management-indicators/stats/:zoneId` | - | Get management statistics |
| GET | `/api/management-indicators/stats` | - | Get global statistics |
| GET | `/api/management-indicators/impact/:projectId` | - | Get project impact analysis |

---

## Module 6: Strategic Intelligence (`/api/strategic-intelligence`)

### Zone Comparison
| Method | Endpoint | Body | Description |
|--------|----------|------|------------|
| POST | `/api/strategic-intelligence/compare-zones` | {zone_a_id, zone_b_id, metrics: [voters_count, events, pending_requests, volunteers, avg_urgency]} | Compare zones |

### Trends Analysis
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/strategic-intelligence/trends` | page, limit, timeframe (30/60/90) | Get territorial trends |

### Risk Analysis
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/strategic-intelligence/risk-analysis/:zoneId` | - | Analyze political risks |

### Strategic Alerts
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/strategic-intelligence/alerts` | page, limit, zone_id, severity | List active alerts |
| POST | `/api/strategic-intelligence/alerts` | {title, alert_type, severity, zone_id, description, indicator_id?, threshold_value?, current_value?, recommendation?} | Create alert |
| PUT | `/api/strategic-intelligence/alerts/:alertId/acknowledge` | - | Acknowledge alert |

### Social Leaders
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/strategic-intelligence/social-leaders` | page, limit, zone_id, influence_level | List social leaders |
| POST | `/api/strategic-intelligence/social-leaders` | {name, organization, zone_id, influence_level, contact_phone?, contact_email?, area_of_influence, notes?} | Record leader |

### Commitments
| Method | Endpoint | Parameters | Description |
|--------|----------|-----------|------------|
| GET | `/api/strategic-intelligence/commitments` | page, limit, zone_id, status | List commitments |
| POST | `/api/strategic-intelligence/commitments` | {commitment_type, title, description, committed_to, committed_by, zone_id, due_date, notes?} | Record commitment |
| PUT | `/api/strategic-intelligence/commitments/:commitmentId/complete` | {completion_date, notes?} | Complete commitment |

---

## Common Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Sorting
- `sort_by`: Column name for sorting
- `sort_order`: 'asc' or 'desc' (default: 'desc')

### Time-based Filters
- `start_date`: ISO format (2024-01-15)
- `end_date`: ISO format (2024-01-20)
- `timeframe`: 30, 60, or 90 days

---

## Common Response Formats

### Success Response (200)
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Single Item Response (200)
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Error Response (400/500)
```json
{
  "error": "Error title",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "message": "Descriptive error message",
  "details": [...],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Authentication Header

All requests except login/register must include:

```http
Authorization: Bearer <JWT_TOKEN>
```

**Token Expiration**: 7 days
**Refresh**: Use `/api/auth/refresh` to extend expiration

---

## Rate Limits

- **General**: 100 requests per minute per user
- **Authentication**: 5 login attempts per minute
- **Data Export**: 10 bulk operations per hour

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET successful |
| 201 | Created | POST successful |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid or missing JWT |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 500 | Server Error | Unexpected error |

---

## Common Validations

### Request Types (Citizen Requests)
- `petition`
- `complaint`
- `suggestion`
- `claim`

### Urgency Levels (Citizen Requests)
- 1 = Low
- 2 = Medium-Low
- 3 = Medium
- 4 = Medium-High
- 5 = Critical

### Request Status
- `pending` → `in_progress` → `resolved`

### User Roles
- `admin` - Full system access
- `operator` - Manage field operations
- `auditor` - Read-only access
- `viewer` - Limited read access

### Equipment Status
- `pending`
- `in_progress`
- `completed`
- `cancelled`

---

## Example curl Commands

### Login and Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Create Citizen Request
```bash
curl -X POST http://localhost:3000/api/citizen-requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"request_type":"complaint","title":"Broken Street Light","description":"...","citizen_name":"Juan","citizen_phone":"+57 123456789","citizen_email":"juan@example.com","zone_id":1,"urgency":4}'
```

### List Requests by Zone
```bash
curl -X GET "http://localhost:3000/api/citizen-requests?zone_id=1&status=pending&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Zone Statistics
```bash
curl -X GET "http://localhost:3000/api/territorial-communication/stats/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Analyze Risk
```bash
curl -X GET "http://localhost:3000/api/strategic-intelligence/risk-analysis/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Subscription Plan
```bash
curl -X POST http://localhost:3000/api/subscriptions/plans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Plan Institucional","model_type":"saas","tier":"institutional","billing_cycle":"monthly","price_min_millions":3,"price_max_millions":6,"setup_fee_millions":1,"features":["Solicitudes","Indicadores","Inteligencia"]}'
```

### Create Subscription
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"organization_name":"Alcaldía Demo","organization_type":"municipality","scope":"municipal","plan_id":1,"model_type":"saas","billing_cycle":"monthly","amount_millions":4.5,"setup_fee_millions":1,"start_date":"2026-02-01","next_billing_date":"2026-03-01","users_limit":25,"zones_limit":10}'
```

---

## API Documentation Files

For detailed information:
- **MODULES.md** - Comprehensive module documentation with examples
- **IMPLEMENTATION_STATUS.md** - Project status and checklist
- **TESTING.md** - Test procedures and scripts
- **DEPLOYMENT.md** - Production deployment guide

---

## Endpoint Count by Module

| Module | Endpoints | Status |
|--------|-----------|--------|
| Authentication | 4 | ✅ Complete |
| Voters | 6 | ✅ Complete |
| Users | 6 | ✅ Complete |
| Zones | 4 | ✅ Complete |
| Tasks | 6 | ✅ Complete |
| Citizen Requests | 8 | ✅ Complete |
| Territorial Communication | 12 | ✅ Complete |
| Management Indicators | 8 | ✅ Complete |
| Strategic Intelligence | 9 | ✅ Complete |
| Subscriptions | 10 | ✅ Complete |
| **TOTAL** | **75+** | **✅ 100%** |

---

**Last Updated**: January 2024
**Version**: 2.0.0
**API Standard**: REST with JSON
