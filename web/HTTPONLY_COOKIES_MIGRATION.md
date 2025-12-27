# HttpOnly Cookies Migration - Security Enhancement

## Overview

This migration moves token storage from localStorage to httpOnly cookies to protect against XSS (Cross-Site Scripting) attacks. HttpOnly cookies cannot be accessed by JavaScript, making them significantly more secure for storing authentication tokens.

## Changes Made

### 1. Updated Axios Configuration (`src/lib/axios.ts`)

#### Added `withCredentials: true`
```typescript
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});
```

#### Removed Manual Token Headers
- **Before**: Manually read token from localStorage and add to Authorization header
- **After**: Tokens are automatically sent via httpOnly cookies

#### Updated Token Refresh Logic
- **Before**: Read refresh token from localStorage and send in request body
- **After**: Refresh token is automatically sent via httpOnly cookie
```typescript
await axios.post(
  `${API_URL}/auth/refresh-token`,
  {},
  { withCredentials: true }
);
```

### 2. Updated AuthContext (`src/contexts/AuthContext.tsx`)

#### Removed Token Storage from State
- **Before**: Stored `accessToken` and `refreshToken` in Zustand state
- **After**: Only store `user` and `isAuthenticated` in state

#### Removed Zustand Persist Middleware
- **Before**: Used `persist` middleware to save tokens to localStorage
- **After**: No persistence needed - cookies are managed by browser

#### Updated Authentication Methods

**setAuth**:
```typescript
setAuth: (data: AuthResponse) => {
  // Tokens are now stored in httpOnly cookies by the backend
  // We only need to store the user info in the store
  set({
    user: data.user,
    isAuthenticated: true,
  });
}
```

**login**:
- Backend automatically sets httpOnly cookies in response
- Frontend just stores user info

**logout**:
- Calls backend API which clears the httpOnly cookies
- No longer needs to pass refresh token (it's in the cookie)
```typescript
logout: async () => {
  try {
    await authApi.logout(''); // Backend clears cookies
  } catch (error) {
    console.error('Logout error:', error);
  }

  set({
    user: null,
    isAuthenticated: false,
  });
}
```

**checkAuth**:
- Simply calls `/auth/profile` endpoint
- If cookie is valid, request succeeds and we get user data
- If cookie is missing/invalid, request fails and we clear auth state
```typescript
checkAuth: async () => {
  try {
    const user = await authApi.getProfile();
    set({ user, isAuthenticated: true });
    return true;
  } catch (error) {
    set({
      user: null,
      isAuthenticated: false,
    });
    return false;
  }
}
```

### 3. Created Cookie Utility (`src/lib/cookies.ts`)

Created utility functions for working with non-httpOnly cookies (useful for CSRF tokens, preferences, etc.):

- `getCookie(name)` - Get a cookie value
- `setCookie(name, value, days?, options?)` - Set a cookie
- `deleteCookie(name, options?)` - Delete a cookie
- `hasCookie(name)` - Check if cookie exists
- `getAllCookies()` - Get all cookies as an object

**Note**: These utilities cannot access httpOnly cookies - they're for other cookie needs.

## Security Benefits

### Protection Against XSS Attacks
- **Before**: If an attacker injects malicious JavaScript, they can steal tokens from localStorage
- **After**: HttpOnly cookies cannot be accessed by JavaScript, even if XSS occurs

### Automatic CSRF Protection
When combined with backend CSRF tokens and SameSite cookie attributes:
- Cookies with `SameSite=Lax` or `SameSite=Strict` prevent CSRF attacks
- Browser automatically handles cookie security

### Reduced Attack Surface
- Tokens are no longer exposed in browser DevTools Application tab
- No risk of accidentally logging tokens in console
- Tokens are automatically managed by browser security policies

## Backend Requirements

The backend must:

1. **Set HttpOnly Cookies on Login/Register**:
```typescript
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000 // 15 minutes
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

2. **Read Tokens from Cookies**:
```typescript
const accessToken = req.cookies.accessToken;
const refreshToken = req.cookies.refreshToken;
```

3. **Clear Cookies on Logout**:
```typescript
res.clearCookie('accessToken');
res.clearCookie('refreshToken');
```

4. **Enable CORS with Credentials**:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

## Migration Checklist

- [x] Update axios to use `withCredentials: true`
- [x] Remove token from request interceptor
- [x] Update token refresh to use cookies
- [x] Remove `accessToken` and `refreshToken` from AuthContext state
- [x] Remove Zustand persist middleware
- [x] Update `setAuth` to not store tokens
- [x] Update `login` to not store tokens
- [x] Update `logout` to call backend API
- [x] Update `checkAuth` to use profile endpoint
- [x] Create cookie utility for non-httpOnly cookies
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test token refresh on 401
- [ ] Test authentication persistence across page reloads
- [ ] Verify tokens are not accessible in DevTools

## Testing

### Manual Testing Steps

1. **Login Test**:
   - Open DevTools Network tab
   - Login with valid credentials
   - Verify `Set-Cookie` headers in login response
   - Verify cookies are present in Application > Cookies
   - Verify cookies have `HttpOnly` flag

2. **Authentication Persistence**:
   - Login successfully
   - Refresh the page
   - Verify user remains logged in
   - Check Network tab shows cookie being sent

3. **Token Refresh**:
   - Wait for access token to expire (or force a 401)
   - Make an API request
   - Verify refresh endpoint is called
   - Verify new access token cookie is set
   - Verify original request is retried successfully

4. **Logout Test**:
   - Click logout
   - Verify cookies are cleared
   - Verify user is redirected to login
   - Try to access protected page
   - Verify user is denied access

5. **Security Test**:
   - Open DevTools Console
   - Try to access cookies via JavaScript: `document.cookie`
   - Verify auth tokens are NOT visible
   - Verify auth tokens are NOT in localStorage

## Troubleshooting

### Issue: Cookies not being sent
**Solution**: Ensure `withCredentials: true` is set in axios config

### Issue: CORS errors
**Solution**: Ensure backend has:
```typescript
cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
})
```

### Issue: Cookies not being set
**Solution**:
- Check backend is using `res.cookie()` with `httpOnly: true`
- Ensure backend and frontend are on same domain or proper CORS setup
- For development: Use `localhost` for both (not `127.0.0.1` mixed with `localhost`)

### Issue: Token refresh fails
**Solution**:
- Verify refresh endpoint accepts cookies
- Check refresh token cookie hasn't expired
- Ensure refresh endpoint sets new access token cookie

### Issue: User logged out on page refresh
**Solution**:
- Verify `checkAuth()` is called on app initialization
- Check cookies haven't expired
- Ensure cookies have correct `path` and `domain`

## Environment Configuration

Add to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

For production, ensure:
- Backend uses `secure: true` for cookies (HTTPS only)
- Backend uses `sameSite: 'strict'` or `'lax'`
- Frontend and backend are on same domain or properly configured CORS

## Notes

- Session ID for cart operations is still stored in localStorage (not sensitive)
- Mock login still works for development (bypasses cookie mechanism)
- All existing API calls work without modification (cookies sent automatically)
