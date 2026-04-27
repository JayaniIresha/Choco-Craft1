# Authentication & File Upload API Documentation

## Base URL

```
http://localhost:5001/api
```

---

## Authentication Endpoints

### 1. Register User

**Endpoint**: `POST /auth/register`
**Authentication**: None (Public)

**Request Body**:

```json
{
  "name": "",
  "email": "john@example.com",
  "password": "password123",
  "role": "staff"
}
```

**Response** (201 Created):

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "",
    "email": "john@example.com",
    "role": "staff"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation**:

- `name`: Min 2 characters
- `email`: Valid email format
- `password`: Min 6 characters
- `role`: Default is "staff"

---

### 2. Login User

**Endpoint**: `POST /auth/login`
**Authentication**: None (Public)

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (200 OK):

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "",
    "email": "john@example.com",
    "role": "staff"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error** (400 Bad Request):

```json
{
  "error": "Invalid email or password"
}
```

---

### 3. Get Current User Profile

**Endpoint**: `GET /auth/me`
**Authentication**: Required (Bearer Token)

**Headers**:

```
Authorization: Bearer <token>
```

**Response** (200 OK):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "",
  "email": "john@example.com",
  "role": "staff",
  "avatar": "1709097856000-profile.jpg",
  "createdAt": "2024-02-28T10:30:00Z"
}
```

---

### 4. Update User Profile

**Endpoint**: `PATCH /auth/profile`
**Authentication**: Required (Bearer Token)

**Headers**:

```
Authorization: Bearer <token>
```

**Request Body** (at least one field):

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response** (200 OK):

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "staff",
    "avatar": "1709097856000-profile.jpg"
  }
}
```

**Validation**:

- `name`: Min 2 characters (optional)
- `email`: Valid email format (optional)

---

### 5. Forgot Password

**Endpoint**: `POST /auth/forgot-password`
**Authentication**: None (Public)

**Request Body**:

```json
{
  "email": "john@example.com"
}
```

**Response** (200 OK):

```json
{
  "message": "Password reset link sent to email"
}
```

**Email Content**:
User receives an email with a reset link:

```
Reset Your Password

Click the link below to reset your password. This link expires in 1 hour.
http://localhost:3000/reset-password?token=<reset_token>
```

**Note**: `CLIENT_URL` can be set in `.env` (defaults to `http://localhost:3000`)

---

### 6. Reset Password

**Endpoint**: `POST /auth/reset-password`
**Authentication**: None (Public)

**Request Body**:

```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "newpassword123"
}
```

**Response** (200 OK):

```json
{
  "message": "Password reset successfully"
}
```

**Validation**:

- `token`: Must be valid and not expired (1 hour expiry)
- `newPassword`: Min 6 characters

**Error** (400 Bad Request):

```json
{
  "error": "Invalid or expired reset token"
}
```

---

## File Upload Endpoints

### 7. Upload File

**Endpoint**: `POST /files/upload`
**Authentication**: Required (Bearer Token)
**Content-Type**: `multipart/form-data`

**Headers**:

```
Authorization: Bearer <token>
```

**Form Data**:

- `file`: Image file (JPEG, PNG, WebP)
- Max file size: 5MB

**Response** (200 OK):

```json
{
  "message": "File uploaded successfully",
  "filename": "1709097856000-profile.jpg",
  "url": "/api/files/upload/1709097856000-profile.jpg"
}
```

**Error** (400 Bad Request):

```json
{
  "error": "Only JPEG, PNG, and WebP images are allowed"
}
```

---

### 8. Get File

**Endpoint**: `GET /files/upload/:filename`
**Authentication**: None (Public)

**Example**:

```
GET /files/upload/1709097856000-profile.jpg
```

**Response**: Binary image file

**Error** (404 Not Found):

```json
{
  "error": "File not found"
}
```

---

### 9. Upload Avatar

**Endpoint**: `POST /files/avatar`
**Authentication**: Required (Bearer Token)
**Content-Type**: `multipart/form-data`

**Headers**:

```
Authorization: Bearer <token>
```

**Form Data**:

- `avatar`: Image file (JPEG, PNG, WebP)
- Max file size: 5MB

**Response** (200 OK):

```json
{
  "message": "Avatar uploaded successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "",
    "email": "john@example.com",
    "role": "staff",
    "avatar": "1709097856000-profile.jpg"
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized

```json
{
  "error": "Not authenticated"
}
or
{
  "error": "Invalid token"
}
or
{
  "error": "No token provided"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied"
}
```

### 500 Internal Server Error

```json
{
  "error": "Error message"
}
```

---

## Token Usage

### Getting JWT Token

After login or register, use the returned token for authenticated requests:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5001/api/auth/me
```

### Token Expiry

- Tokens expire after **7 days**
- After expiry, user must login again to get a new token

### Token Format

```
Authorization: Bearer <jwt_token>
```

---

## Examples using cURL

### Register

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "email": "john@example.com",
    "password": "password123",
    "role": "staff"
  }'
```

### Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Profile

```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Update Profile

```bash
curl -X PATCH http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe"
  }'
```

### Forgot Password

```bash
curl -X POST http://localhost:5001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### Reset Password

```bash
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "newPassword": "newpassword123"
  }'
```

### Upload File

```bash
curl -X POST http://localhost:5001/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg"
```

### Upload Avatar

```bash
curl -X POST http://localhost:5001/api/files/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/path/to/avatar.jpg"
```

### Download File

```bash
curl -X GET http://localhost:5001/api/files/upload/1709097856000-profile.jpg \
  -o downloaded-image.jpg
```

---

## Environment Variables

Add these to `.env` for full functionality:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-here

# Email Configuration (for forgot password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Client URL (for password reset links)
CLIENT_URL=http://localhost:3000
```

---

## Database Schema

### User Model

```prisma
model User {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  name              String
  email             String   @unique
  password          String   (hashed with bcrypt)
  role              String
  avatar            String?  (filename of uploaded avatar)
  resetToken        String?  (for password reset)
  resetTokenExpiry  DateTime? (expires in 1 hour)

  isDeleted         Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

## Security Notes

1. **Password Hashing**: Passwords are hashed with bcrypt (10 rounds)
2. **JWT Expiry**: Tokens expire after 7 days
3. **Reset Token Expiry**: Password reset tokens expire after 1 hour
4. **File Upload**: Only JPEG, PNG, WebP images allowed (5MB max)
5. **File Security**: Filenames are sanitized to prevent directory traversal
6. **Soft Delete**: Deleted users are flagged with `isDeleted: true` instead of permanent deletion

---

## Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | OK - Request successful              |
| 201  | Created - Resource created           |
| 400  | Bad Request - Validation error       |
| 401  | Unauthorized - No/invalid token      |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource not found       |
| 500  | Server Error - Internal error        |

---

## File Storage

Uploaded files are stored in:

```
backend/uploads/
```

Files are named with timestamp + random ID to prevent collisions:

```
1709097856000-9876543210-filename.jpg
```

Files can be accessed via:

```
GET /api/files/upload/<filename>
or
GET /uploads/<filename>
```

---

## Testing with Postman

1. **Register**: Create a new user
2. **Copy Token**: Get JWT from register/login response
3. **Set Authorization**: In Postman, go to Authorization tab → Bearer Token → paste token
4. **Test Protected Endpoints**: GET /auth/me, PATCH /auth/profile
5. **Upload File**: POST /files/upload with form data

All endpoints are ready for testing!
