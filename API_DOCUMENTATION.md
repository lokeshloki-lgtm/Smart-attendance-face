# API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.yourdomain.com/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Authentication Endpoints

### 1. Register User
```
POST /auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "USER"  // Optional, defaults to "USER"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    }
  }
}
```

### 2. Login
```
POST /auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "department": "IT",
      "profileImage": "url"
    }
  }
}
```

### 3. Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Logout successful"
}
```

### 4. Get Profile
```
GET /auth/profile
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "department": "IT",
    "phone": "1234567890",
    "profileImage": "url",
    "isActive": true,
    "lastLogin": "2026-08-31T10:30:00Z"
  }
}
```

### 5. Update Profile
```
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "Jane Doe",
  "phone": "0987654321",
  "department": "HR",
  "profileImage": "base64_or_url"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

### 6. Change Password
```
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## User Management Endpoints (Admin Only)

### 1. Get All Users
```
GET /users?page=1&limit=10&search=john&role=USER&department=IT&status=active
Authorization: Bearer <token>

Query Parameters:
- page: Page number (default: 1)
- limit: Records per page (default: 10)
- search: Search by name, email, studentId, employeeId
- role: Filter by ADMIN or USER
- department: Filter by department
- status: active or inactive

Response:
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "studentId": "STU001",
      "employeeId": "EMP001",
      "role": "USER",
      "department": "IT",
      "phone": "1234567890",
      "isActive": true
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "pages": 15
  }
}
```

### 2. Get User by ID
```
GET /users/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { ... user object ... }
}
```

### 3. Create User
```
POST /users
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "DefaultPass123",  // Optional, auto-generated if not provided
  "role": "USER",
  "employeeId": "EMP002",
  "studentId": "STU002",
  "department": "HR",
  "phone": "9876543210"
}

Response:
{
  "success": true,
  "message": "User created successfully",
  "data": { ... }
}
```

### 4. Update User
```
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "Jane Smith Updated",
  "phone": "5555555555",
  "department": "Finance",
  "role": "USER",
  "isActive": true
}

Response:
{
  "success": true,
  "message": "User updated successfully",
  "data": { ... }
}
```

### 5. Delete User
```
DELETE /users/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "User deleted successfully"
}
```

### 6. Register Face Descriptor
```
POST /users/:id/face
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "faceDescriptor": [0.1, 0.2, 0.3, ... 128 numbers array]
}

Response:
{
  "success": true,
  "message": "Face descriptor registered successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "faceRegistered": true
  }
}
```

### 7. Recognize Face
```
POST /users/face/recognize
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "faceDescriptor": [0.1, 0.2, 0.3, ... 128 numbers array]
}

Response:
{
  "success": true,
  "message": "Face recognized successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "studentId": "STU001",
      "department": "IT"
    },
    "confidence": 95.5  // Percentage 0-100
  }
}

Error Response (if not recognized):
{
  "success": false,
  "message": "Face not recognized",
  "confidence": 0
}
```

### 8. Get User Attendance Stats
```
GET /users/:id/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "allTime": {
      "total": 100,
      "present": 85,
      "absent": 10,
      "late": 5,
      "percentage": 90.00
    },
    "lastThirtyDays": {
      "total": 20,
      "present": 18,
      "absent": 1,
      "late": 1,
      "percentage": 95.00
    },
    "recentAttendance": [
      {
        "_id": "...",
        "date": "2026-08-31",
        "checkInTime": "09:15:30",
        "status": "Present"
      }
    ]
  }
}
```

---

## Attendance Endpoints

### 1. Mark Attendance
```
POST /attendance/mark
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "faceDescriptor": [0.1, 0.2, 0.3, ... 128 numbers array],
  "confidence": 0.92
}

Response:
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "_id": "...",
    "userId": "507f1f77bcf86cd799439011",
    "date": "2026-08-31",
    "checkInTime": "09:15:30",
    "status": "Present",
    "recognitionConfidence": 0.92,
    "verificationMethod": "Face Recognition",
    "user": {
      "name": "John Doe",
      "studentId": "STU001",
      "employeeId": "EMP001"
    }
  }
}

Error Responses:
- "Face not recognized" (401)
- "Attendance already marked for today" (400)
```

### 2. Get All Attendance
```
GET /attendance?page=1&limit=10&date=2026-08-31&department=IT&status=Present&search=john
Authorization: Bearer <token>

Query Parameters:
- page: Page number
- limit: Records per page
- date: Filter by specific date (YYYY-MM-DD)
- department: Filter by department
- status: Present, Late, or Absent
- search: Search by user name/email/ID

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": {
        "name": "John Doe",
        "email": "john@example.com",
        "studentId": "STU001"
      },
      "date": "2026-08-31",
      "checkInTime": "09:15:30",
      "status": "Present",
      "recognitionConfidence": 0.92
    }
  ],
  "pagination": { ... }
}
```

### 3. Get Today's Attendance
```
GET /attendance/today
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "attendance": [
      { ... attendance records ... }
    ],
    "summary": {
      "total": 150,
      "present": 120,
      "absent": 20,
      "late": 10
    }
  }
}
```

### 4. Get User's Attendance
```
GET /attendance/user/:userId?startDate=2026-08-01&endDate=2026-08-31&page=1&limit=20
Authorization: Bearer <token>

Query Parameters:
- startDate: Start date (YYYY-MM-DD)
- endDate: End date (YYYY-MM-DD)
- page: Page number
- limit: Records per page

Response:
{
  "success": true,
  "data": [ ... attendance records ... ],
  "pagination": { ... }
}
```

### 5. Get Attendance Report
```
GET /attendance/report?startDate=2026-08-01&endDate=2026-08-31&department=IT
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "summary": {
      "totalRecords": 500,
      "present": 420,
      "absent": 50,
      "late": 30,
      "presentPercentage": 90.00,
      "absentPercentage": 10.00,
      "latePercentage": 6.00,
      "averageConfidence": 0.9234
    },
    "byDepartment": {
      "IT": {
        "total": 150,
        "present": 135,
        "absent": 10,
        "late": 5,
        "presentPercentage": 93.33
      }
    },
    "records": [ ... all attendance records ... ]
  }
}
```

### 6. Update Attendance
```
PUT /attendance/:id
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "status": "Late",
  "checkOutTime": "17:30:00"
}

Response:
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": { ... }
}
```

### 7. Delete Attendance
```
DELETE /attendance/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Attendance record deleted successfully"
}
```

---

## Dashboard Endpoints

### 1. Admin Dashboard
```
GET /dashboard/admin
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 150,
      "totalAdmins": 2,
      "totalUserAccounts": 148,
      "presentToday": 120,
      "absentToday": 20,
      "lateToday": 10,
      "averageAttendance": 87.5
    },
    "recentAttendance": [
      { ... last 10 attendance records ... }
    ],
    "dailyAttendance": [
      {
        "date": "2026-08-31",
        "total": 130,
        "present": 120
      }
    ],
    "departmentStats": {
      "IT": 50,
      "HR": 30,
      "Finance": 25
    },
    "systemStatus": "Operational"
  }
}
```

### 2. User Dashboard
```
GET /dashboard/user
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "profile": { ... user data ... },
    "stats": {
      "allTime": {
        "total": 100,
        "present": 85,
        "absent": 10,
        "late": 5,
        "percentage": 90.00
      },
      "lastThirtyDays": {
        "total": 20,
        "present": 18,
        "absent": 1,
        "late": 1,
        "percentage": 95.00
      },
      "todayStatus": {
        "marked": true,
        "status": "Present",
        "checkInTime": "09:15:30"
      }
    },
    "recentAttendance": [ ... last 10 records ... ],
    "monthlyChart": [
      {
        "month": "Aug 2026",
        "present": 18,
        "total": 20
      }
    ]
  }
}
```

---

## Analytics Endpoints (Admin Only)

### 1. Analytics Overview
```
GET /analytics/overview
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "totalRecords": 5000,
    "totalUsers": 150,
    "presentCount": 4200,
    "absentCount": 500,
    "lateCount": 300,
    "presentPercentage": 84.00,
    "absentPercentage": 10.00,
    "latePercentage": 6.00,
    "averageConfidence": 0.9145
  }
}
```

### 2. Monthly Analytics
```
GET /analytics/monthly?year=2026
Authorization: Bearer <token>

Response:
{
  "success": true,
  "year": 2026,
  "data": [
    {
      "month": "Jan",
      "present": 450,
      "absent": 50,
      "late": 30,
      "total": 530
    },
    ...
  ]
}
```

### 3. Department Analytics
```
GET /analytics/department?startDate=2026-08-01&endDate=2026-08-31
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "department": "IT",
      "total": 150,
      "present": 135,
      "absent": 10,
      "late": 5,
      "presentPercentage": 93.33,
      "absentPercentage": 6.67,
      "latePercentage": 3.33
    }
  ]
}
```

### 4. User Attendance Percentage
```
GET /analytics/user-percentage
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "IT",
      "present": 85,
      "absent": 10,
      "late": 5,
      "total": 100,
      "attendancePercentage": 90.00
    }
  ]
}
```

### 5. Attendance Trends
```
GET /analytics/trends?days=30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "days": 30,
  "data": [
    {
      "date": "2026-08-02",
      "present": 130,
      "absent": 15,
      "late": 5,
      "total": 150
    }
  ]
}
```

---

## AI Assistant Endpoints

### 1. Chat with AI
```
POST /ai/chat
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "message": "Show me today's attendance summary"
}

Response:
{
  "success": true,
  "data": {
    "userMessage": "Show me today's attendance summary",
    "aiMessage": "Today's attendance shows 120 employees present out of 150 total registered. This represents an 80% attendance rate. Late arrivals: 10 employees. Absent: 20 employees.",
    "timestamp": "2026-08-31T10:30:00Z"
  }
}
```

### 2. Generate Attendance Summary
```
GET /ai/summary?startDate=2026-08-01&endDate=2026-08-31
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "statistics": {
      "total": 500,
      "present": 420,
      "absent": 50,
      "late": 30,
      "percentage": 90.00
    },
    "summary": "Your attendance data shows strong overall performance with 90% attendance over the selected period..."
  }
}
```

---

## HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error

## Rate Limiting

- **Authentication**: 10 requests per 15 minutes
- **General API**: 100 requests per 15 minutes
- **AI Endpoint**: 20 requests per 15 minutes
- **Attendance**: 10 requests per minute

## Error Codes

### Common Errors
```
{
  "success": false,
  "message": "User not found"
}

{
  "success": false,
  "message": "Face not recognized"
}

{
  "success": false,
  "message": "Attendance already marked for today"
}

{
  "success": false,
  "message": "Invalid email or password"
}

{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

## Examples

### Complete Authentication Flow
```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Response includes token

# 2. Use token in subsequent requests
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <token>"

# 3. Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

### Mark Attendance with Face Recognition
```bash
curl -X POST http://localhost:5000/api/attendance/mark \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "faceDescriptor": [0.1, 0.2, ... 128 numbers],
    "confidence": 0.95
  }'
```
