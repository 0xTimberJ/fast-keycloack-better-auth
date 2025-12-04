# 🔐 Keycloak + Better Auth - Stateless Setup

> Stateless OAuth authentication with Keycloak and Better Auth, featuring encrypted token storage in cookies (no database required).

## 📋 Overview

This implementation uses **Better Auth** with **Keycloak OAuth** in a **stateless mode**:
- ✅ No database required
- ✅ Tokens stored in encrypted cookies
- ✅ Auto-refresh when tokens expire
- ✅ Secure token management with AES-256-GCM

## 🏗️ Architecture

```
User Login → Keycloak OAuth → Better Auth → 3 Encrypted Cookies
                                              ├─ keycloak_id_token
                                              ├─ keycloak_access_token  
                                              └─ keycloak_refresh_token
```

---

## 🚀 Quick Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

**Required variables:**
- `BETTER_AUTH_SECRET` - Random 32+ character string (for encryption)
- `KEYCLOAK_ISSUER` - Your Keycloak realm URL
- `KEYCLOAK_CLIENT_ID` - Your client ID
- `KEYCLOAK_CLIENT_SECRET` - Your client secret
- `BETTER_AUTH_URL` - Your app URL (http://localhost:3000 in dev)

### 2. Keycloak Configuration

In Keycloak Admin Console:

**Client Settings:**
- Client ID: `your-client-id`
- Client Protocol: `openid-connect`
- Access Type: `confidential`
- Valid Redirect URIs: `http://localhost:3000/api/auth/callback/keycloak`
- Web Origins: `http://localhost:3000`

**Token Settings (Recommended):**
- Access Token Lifespan: `1 hour` (default: 10 min)
- Refresh Token Lifespan: `7 days` (default: 30 min)
- SSO Session Idle: `8 hours`
- SSO Session Max: `30 days`

### 3. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 4. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

### 5. Test the Setup

Visit: http://localhost:3000/test-tokens

Run all tests to verify:
- ✅ Cookies created
- ✅ Tokens encrypted
- ✅ Refresh working

---

## 📁 Key Files

### Core Authentication

| File | Purpose |
|------|---------|
| [`src/lib/auth.ts`](src/lib/auth.ts) | Better Auth configuration + OAuth setup |
| [`src/lib/auth-client.ts`](src/lib/auth-client.ts) | Client-side auth hooks |
| [`src/lib/auth-helper.ts`](src/lib/auth-helper.ts) | Token retrieval helpers |
| [`src/lib/crypto.ts`](src/lib/crypto.ts) | AES-256-GCM encryption utilities |

### Token Management

| File | Purpose |
|------|---------|
| [`src/app/actions/refresh-tokens.ts`](src/app/actions/refresh-tokens.ts) | Token refresh logic |
| [`src/app/actions/logout.ts`](src/app/actions/logout.ts) | Logout with Keycloak |

### API Integration

| File | Purpose |
|------|---------|
| [`src/app/actions/backend-api-example.ts`](src/app/actions/backend-api-example.ts) | Examples for calling NestJS backend |

### Testing

| File | Purpose |
|------|---------|
| [`src/app/actions/test-tokens.ts`](src/app/actions/test-tokens.ts) | 7 automated tests |
| [`src/app/test-tokens/page.tsx`](src/app/test-tokens/page.tsx) | Test UI page |

---

## 🔑 How It Works

### Login Flow

1. User clicks "Login with Keycloak"
2. Redirected to Keycloak OAuth screen
3. After authentication, Keycloak returns tokens
4. Better Auth receives tokens and:
   - Stores them in **3 encrypted cookies**
   - Creates a Better Auth session (JWE)

### Token Storage

Three separate cookies (to respect 4KB browser limit):

```
keycloak_id_token       → For Keycloak logout
keycloak_access_token   → For backend API calls
keycloak_refresh_token  → For refreshing expired tokens
```

All encrypted with **AES-256-GCM** using `BETTER_AUTH_SECRET`.

### Auto-Refresh

When `getAccessToken()` is called:
1. Check if access token exists
2. If expired/missing → Use refresh token to get new one
3. Update cookies with new tokens
4. Return fresh access token

**Timeline:**
- 0-10 min: Access token valid
- 10-30 min: Auto-refresh with refresh token
- \> 30 min: User must re-login

---

## 🛠️ Usage

### Client-Side Login/Logout

```tsx
import { signIn, signOut, useSession } from "@/lib/auth-client";

// Login
await signIn.social({ provider: "keycloak" });

// Logout
await signOut();

// Get session
const { data: session } = useSession();
```

### Server-Side Token Access

```typescript
import { getAccessToken, getIdToken } from "@/lib/auth-helper";

// Get access token for API calls
const accessToken = await getAccessToken();

// Get ID token for logout
const idToken = await getIdToken();
```

### Call Backend API

```typescript
import { getAccessToken } from "@/lib/auth-helper";

const token = await getAccessToken();

await fetch('https://your-backend.com/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

See [`backend-api-example.ts`](src/app/actions/backend-api-example.ts) for complete examples.

---

## 🧪 Testing

### Quick Test

```bash
# 1. Login with Keycloak
# 2. Visit http://localhost:3000/test-tokens
# 3. Click "Run All Tests"
# 4. Check terminal for results
```

All 7 tests should pass ✅

### Manual Verification

Check cookies in DevTools:
- **Chrome/Edge**: F12 → Application → Cookies → localhost
- **Firefox**: F12 → Storage → Cookies → localhost

You should see 3 cookies starting with `keycloak_*`.

---

## 🔒 Security Features

- ✅ Tokens encrypted with AES-256-GCM
- ✅ Cookies: `httpOnly`, `secure`, `sameSite: lax`
- ✅ Automatic token refresh
- ✅ No tokens in localStorage (XSS protection)
- ✅ Session cookie encrypted with JWE

---

## 🔧 Backend Integration (NestJS)

For securing your NestJS backend with these Keycloak tokens, see the guides in the artifacts directory.

Quick setup:
1. Install: `@nestjs/passport`, `passport-jwt`, `jwks-rsa`
2. Create Keycloak Strategy (validates token with JWKS)
3. Add Auth Guard to routes
4. Access user data via `req.user`

---

## ⚠️ Limitations

### Without Database

- ❌ Cannot access tokens via Better Auth API (`listUserAccounts`)
- ❌ No multi-device session management
- ❌ No session revocation history

**Solution:** Add a database adapter (SQLite, PostgreSQL, etc.) to unlock these features.

### Token Expiration

Default Keycloak settings:
- Access Token: 10 minutes
- Refresh Token: 30 minutes

**Recommendation:** Increase these in Keycloak Admin Console (see Setup section above).

---

## 🚨 Troubleshooting

### Cookies not created

**Check:**
1. `BETTER_AUTH_SECRET` is defined in `.env.local`
2. Server restarted after env changes
3. Look for `✅ Tokens cookies stored successfully` in terminal

### Tokens not encrypted

**Symptom:** Cookie values start with `eyJ` (plain JWT)

**Fix:** Ensure `BETTER_AUTH_SECRET` is at least 32 characters.

### Auto-refresh not working

**Check:**
1. Refresh token cookie exists (`keycloak_refresh_token`)
2. Refresh token not expired (< 30 min since login)
3. Check terminal for refresh errors

---

## 🎯 Production Checklist

- [ ] Set strong `BETTER_AUTH_SECRET` (32+ random chars)
- [ ] Configure HTTPS URLs in Keycloak redirect URIs
- [ ] Update `BETTER_AUTH_URL` to production domain
- [ ] Set `secure: true` for cookies (automatic in production)
- [ ] Configure proper CORS on backend API
- [ ] Increase Keycloak token lifespans (1h access, 7d refresh)
- [ ] Test token refresh flow
- [ ] Monitor cookie sizes (< 4KB limit)

---

**Built with:**
- [Better Auth](https://www.better-auth.com/)
- [Keycloak](https://www.keycloak.org/)
- [Next.js](https://nextjs.org/)
