# Authentication Implementation Plan

## Overview
Implement username/password authentication for the Agenda Management application using JWT tokens.

## Current State Analysis
- User model exists in Prisma schema but lacks authentication fields
- Currently using hardcoded `DEFAULT_USER_ID` for all requests
- Backend: Fastify with Prisma (SQLite), Zod validation
- Frontend: React with React Router, Axios, TanStack Query
- API client already has interceptor infrastructure

## Architecture Decisions

### 1. Authentication Strategy
- **Method**: JWT (JSON Web Tokens)
- **Storage**: localStorage (client-side)
- **Token Expiration**: 7 days
- **Username**: Use email as username OR add separate username field
- **Password**: Hashed with bcrypt (salt rounds: 10)

### 2. Libraries to Install
**Backend:**
- `@fastify/jwt` - JWT plugin for Fastify
- `bcrypt` - Password hashing
- `@types/bcrypt` - TypeScript types

**Frontend:**
- No new dependencies needed (using existing React Context + localStorage)

---

## Implementation Steps

### Phase 1: Database Schema Updates

#### 1.1 Update Prisma Schema
**File**: `packages/backend/prisma/schema.prisma`
- Add `username` field to User model (unique, required)
- Add `password` field to User model (required)
- Make `email` optional (for flexibility) OR required (for username)
- Consider: Should we use email as username or have separate username field?

```prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique  // NEW
  password  String              // NEW (hashed)
  email     String?  @unique
  name      String?
  // ... rest of fields
}
```

#### 1.2 Create Migration
- Run `npm run db:migrate` to create migration
- Update seed file if needed

---

### Phase 2: Backend Authentication

#### 2.1 Install Dependencies
```bash
cd packages/backend
npm install @fastify/jwt bcrypt
npm install -D @types/bcrypt
```

#### 2.2 Create Auth Schemas
**File**: `packages/backend/src/schemas/auth.schema.ts` (NEW)
- Register schema (username, password, optional email/name)
- Login schema (username, password)
- Validation rules (password min length, etc.)

#### 2.3 Create Auth Service
**File**: `packages/backend/src/services/auth.service.ts` (NEW)
- `register(username, password, email?, name?)` - Hash password, create user
- `login(username, password)` - Verify credentials, return user
- `hashPassword(password)` - Bcrypt hash
- `verifyPassword(password, hash)` - Bcrypt compare
- `getUserById(id)` - Get user for token verification

#### 2.4 Create Auth Routes
**File**: `packages/backend/src/routes/auth.ts` (NEW)
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user (protected)

#### 2.5 Configure JWT Plugin
**File**: `packages/backend/src/app.ts`
- Register `@fastify/jwt` plugin
- Configure secret from environment variable
- Set token expiration

#### 2.6 Create Auth Middleware
**File**: `packages/backend/src/middleware/auth.middleware.ts` (NEW)
- Verify JWT token
- Attach user to request object
- Handle unauthorized errors

#### 2.7 Update Existing Routes
**Files**: All route files (`tasks.ts`, `assignments.ts`, etc.)
- Remove hardcoded `DEFAULT_USER_ID`
- Get `userId` from authenticated request
- Add auth middleware to protect routes

#### 2.8 Update TypeScript Types
**File**: `packages/backend/src/types/index.ts`
- Add authenticated request type with user property

#### 2.9 Environment Variables
**File**: `.env` and `.env.example`
- Add `JWT_SECRET` environment variable

---

### Phase 3: Frontend Authentication

#### 3.1 Create Auth Context
**File**: `packages/frontend/src/contexts/AuthContext.tsx` (NEW)
- Auth state (user, token, isAuthenticated, isLoading)
- Auth actions (login, logout, register)
- Token storage/retrieval from localStorage
- Initialize auth state on app load

#### 3.2 Create Auth API
**File**: `packages/frontend/src/api/auth.ts` (NEW)
- `login(username, password)` - Call login endpoint
- `register(username, password, email?, name?)` - Call register endpoint
- `getCurrentUser()` - Call /me endpoint

#### 3.3 Update API Client
**File**: `packages/frontend/src/api/client.ts`
- Add request interceptor to include JWT token in Authorization header
- Add response interceptor to handle 401 (redirect to login)
- Token format: `Bearer <token>`

#### 3.4 Create Auth Pages
**File**: `packages/frontend/src/pages/LoginPage.tsx` (NEW)
- Login form (username, password)
- Error handling
- Redirect to dashboard on success
- Link to register (if implementing registration)

**File**: `packages/frontend/src/pages/RegisterPage.tsx` (NEW) - OPTIONAL
- Register form (username, password, confirm password, email, name)
- Validation
- Redirect to dashboard or login on success

#### 3.5 Create Protected Route Component
**File**: `packages/frontend/src/components/auth/ProtectedRoute.tsx` (NEW)
- Check if user is authenticated
- Redirect to login if not authenticated
- Show loading state while checking auth

#### 3.6 Update App Router
**File**: `packages/frontend/src/App.tsx`
- Wrap app with AuthProvider
- Add login route
- Add register route (optional)
- Wrap existing routes with ProtectedRoute
- Add logout button to navigation

#### 3.7 Update Navigation
**File**: `packages/frontend/src/App.tsx` (Layout component)
- Add logout button
- Show username in nav (optional)
- Handle logout (clear token, redirect to login)

---

### Phase 4: Testing & Polish

#### 4.1 Manual Testing
- Test registration flow
- Test login flow
- Test protected routes
- Test logout
- Test token expiration
- Test invalid credentials
- Test duplicate username registration

#### 4.2 Error Handling
- Proper error messages for all scenarios
- Network error handling
- Token expiration handling

#### 4.3 UX Improvements
- Loading states
- Form validation feedback
- "Remember me" functionality (optional)
- Password strength indicator (optional)

---

## Open Questions for User

1. **Username vs Email**:
   - Use email as username (simpler, one field)?
   - Have separate username + email fields?

2. **Registration**:
   - Should users be able to self-register?
   - Or admin-only user creation?

3. **Password Requirements**:
   - Minimum length? (suggest: 8 characters)
   - Require special characters/numbers?

4. **Token Storage**:
   - localStorage (simpler, survives page refresh)
   - sessionStorage (more secure, lost on tab close)
   - httpOnly cookies (most secure, but requires CORS changes)

5. **Additional Features**:
   - Password reset functionality?
   - Email verification?
   - "Remember me" option?
   - Multi-user support or single user?

---

## Estimated File Changes

### New Files (13)
- Backend: 3 files (auth.schema.ts, auth.service.ts, auth.ts route, auth.middleware.ts)
- Frontend: 5 files (AuthContext.tsx, auth.ts API, LoginPage.tsx, RegisterPage.tsx, ProtectedRoute.tsx)

### Modified Files (8)
- Backend: prisma/schema.prisma, app.ts, all route files (4), types/index.ts, .env.example
- Frontend: App.tsx, api/client.ts

---

## Security Considerations

1. **Password Storage**: Never store plain passwords, always hash with bcrypt
2. **JWT Secret**: Use strong random secret, store in environment variable
3. **HTTPS**: Use HTTPS in production to protect token transmission
4. **Token Expiration**: Implement reasonable expiration time
5. **XSS Protection**: Sanitize user inputs
6. **CORS**: Ensure proper CORS configuration for credentials
7. **SQL Injection**: Prisma provides protection, but validate inputs

---

## Migration Strategy

1. Existing data: If there are existing users without passwords, they'll need passwords added
2. Can create a default admin user via seed script
3. Existing API calls will require authentication after implementation
