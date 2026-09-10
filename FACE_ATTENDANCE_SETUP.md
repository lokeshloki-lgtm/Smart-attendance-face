# Face Attendance Setup

This project stores face-api.js descriptors in MongoDB and marks attendance only when the captured descriptor matches an active registered user.

## Install

From the repository root:

```powershell
npm install
npm install --prefix client
npm install --prefix server
```

The required packages are already declared:

- Client: `react-webcam`, `face-api.js`, `axios`
- Server: `express`, `mongoose`, `cors`, `jsonwebtoken`

## Run

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart-attendance
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5176
GROQ_API_KEY=optional-for-ai-pages
```

Start the API and client in separate terminals:

```powershell
npm run dev --prefix server
npm run dev --prefix client
```

The API health check is `http://localhost:5000/api/health`.

For production, set `VITE_FACE_API_MODELS_URL` to a URL hosting these face-api.js model files. The current default is the public face-api.js model host:

- `tiny_face_detector_model-weights_manifest.json` and shard files
- `face_landmark_68_model-weights_manifest.json` and shard files
- `face_recognition_model-weights_manifest.json` and shard files

## Folder Structure

```text
client/src/
  components/
    FaceCapture.jsx       # Webcam + face-api.js descriptor extraction
  pages/
    admin/
      RegisterUserPage.jsx # Create user and register descriptor
      MarkAttendancePage.jsx
    user/
      UserMarkAttendance.jsx
  services/api.js          # Axios API client

server/src/
  models/User.js            # faceDescriptor: [Number]
  models/Attendance.js
  routes/userRoutes.js
  routes/attendanceRoutes.js
  controllers/userController.js
  controllers/attendanceController.js
  utils/validators.js
```

## Face Registration API

Admin authentication is required.

```http
POST /api/users/:userId/face
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "faceDescriptor": [0.0123, -0.0456]
}
```

The real request contains exactly 128 finite numbers. The server validates the length and saves it as `User.faceDescriptor` in MongoDB.

The frontend flow is implemented in `RegisterUserPage.jsx`:

1. `FaceCapture` loads the detector, landmark, and recognition models.
2. It detects one face from the webcam.
3. It creates `Array.from(detection.descriptor)`.
4. It calls `POST /api/users`.
5. It calls `POST /api/users/:id/face` with the descriptor.

Students can register their own face from `/user/register-face`. This page calls:

```http
POST /api/face/register
Authorization: Bearer <student-jwt>
Content-Type: application/json

{ "faceDescriptor": [128 finite numbers] }
```

The endpoint saves the descriptor on the authenticated student's MongoDB `User` document.

## Attendance API

Any authenticated user or trusted kiosk may call:

```http
POST /api/attendance/mark
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "faceDescriptor": [0.0123, -0.0456]
}
```

The server:

1. Validates the descriptor.
2. Loads active users with valid registered descriptors.
3. Calculates Euclidean distance to each descriptor.
4. Selects the closest match.
5. Rejects the request when distance is greater than `0.6`.
6. Rejects duplicate attendance for the same user on the same day.
7. Saves an `Attendance` document with status, check-in time, confidence, and verification method.

The frontend calls this endpoint from both `UserMarkAttendance.jsx` and the admin kiosk after `FaceCapture` returns a descriptor.

## Attendance History API

```http
GET /api/attendance/history?limit=50
Authorization: Bearer <student-jwt>
```

The response contains the authenticated student's saved attendance records, including `studentId`, `studentName`, `date`, `checkInTime`, `status`, and `verificationMethod`.

## Recognition Endpoint

For recognition without marking attendance:

```http
POST /api/users/face/recognize
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "faceDescriptor": [0.0123, -0.0456]
}
```

It returns the matched user and confidence, or `404` when no face is within the configured threshold.
