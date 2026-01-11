# Secure Token Storage Implementation

## Overview

This implementation replaces plain AsyncStorage with expo-secure-store for storing sensitive authentication tokens (accessToken and refreshToken). This significantly improves the security of the mobile application by using native encryption mechanisms.

## Security Benefits

### iOS
- Tokens are stored in the **iOS Keychain**
- Uses hardware-backed encryption when available
- Protected by device passcode/biometrics
- Survives app reinstalls (unless explicitly deleted)

### Android
- Tokens are stored in **EncryptedSharedPreferences**
- Uses AES-256 encryption
- Keys are stored in Android Keystore
- Protected by hardware security module when available

## Changes Made

### 1. New File: `src/services/secureStorage.ts`

Created a secure storage service that:
- Uses `expo-secure-store` for sensitive data (tokens)
- Falls back to `AsyncStorage` for non-sensitive data (user info, session ID)
- Provides a Zustand-compatible storage adapter for the persist middleware
- Implements error handling with automatic fallback

**Key Features:**
- `setItem()`, `getItem()`, `removeItem()` - Single item operations
- `multiSet()`, `multiGet()`, `multiRemove()` - Batch operations
- `createSecureStorage()` - Zustand persist middleware adapter

### 2. Updated: `src/stores/authStore.ts`

Modified the authentication store to:
- Import and use `secureStorage` instead of `AsyncStorage`
- Use secure storage for all token operations
- Maintain compatibility with Zustand persist middleware

**Changes:**
- `setAuth()` - Now stores tokens in SecureStore
- `logout()` - Clears tokens from SecureStore
- `checkAuth()` - Retrieves tokens from SecureStore
- Persist middleware - Uses custom secure storage adapter

### 3. Updated: `src/services/api.ts`

Updated API service to:
- Import and use `secureStorage` for token retrieval
- Retrieve tokens from SecureStore in request interceptor
- Store refreshed tokens in SecureStore
- Clear SecureStore on authentication failure

**Changes:**
- Request interceptor - Uses `secureStorage.getItem('accessToken')`
- Response interceptor - Uses `secureStorage` for token refresh
- Error handling - Clears SecureStore on auth failure

### 4. Updated: `package.json`

Added `expo-secure-store` dependency:
```json
"expo-secure-store": "~14.0.0"
```

## Installation

Run the following command to install the new dependency:

```bash
cd mobile
npm install
# or
yarn install
```

For development builds, you may need to rebuild:
```bash
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```

## Migration Notes

### Existing Users

Users who are already logged in will need to log in again after this update because:
1. Tokens are moving from AsyncStorage to SecureStore
2. The storage locations are different
3. This is a one-time migration

### Data Flow

**Before:**
```
AsyncStorage
├── accessToken (PLAIN TEXT)
├── refreshToken (PLAIN TEXT)
└── user (JSON)
```

**After:**
```
SecureStore (Encrypted)
├── accessToken
└── refreshToken

AsyncStorage (Plain)
└── user (JSON - non-sensitive)
└── sessionId (non-sensitive)
```

## Security Considerations

### What's Protected
- Access tokens (JWT)
- Refresh tokens
- All authentication credentials

### What's Not Protected
- User profile data (name, email) - stored in AsyncStorage
- Session IDs - stored in AsyncStorage
- App preferences - stored in AsyncStorage

### Best Practices Implemented
1. Tokens are never logged or exposed
2. Automatic fallback to AsyncStorage if SecureStore fails
3. Proper error handling to prevent token leakage
4. Tokens are cleared on logout and authentication failure
5. Zustand persist middleware integration maintains state rehydration

## Testing

### Test Cases

1. **Login Flow**
   - Login with valid credentials
   - Verify tokens are stored in SecureStore
   - Verify user data is stored in AsyncStorage

2. **Token Refresh**
   - Trigger a 401 error
   - Verify token refresh uses SecureStore
   - Verify new token is stored in SecureStore

3. **Logout Flow**
   - Logout
   - Verify tokens are removed from SecureStore
   - Verify user data is cleared

4. **App Restart**
   - Close and reopen app
   - Verify tokens are retrieved from SecureStore
   - Verify authentication state is restored

5. **Fallback Behavior**
   - Simulate SecureStore failure
   - Verify fallback to AsyncStorage
   - Verify app continues to function

## API Reference

### secureStorage

```typescript
import { secureStorage } from '../services/secureStorage';

// Store a value
await secureStorage.setItem('key', 'value');

// Retrieve a value
const value = await secureStorage.getItem('key');

// Remove a value
await secureStorage.removeItem('key');

// Batch operations
await secureStorage.multiSet([
  ['key1', 'value1'],
  ['key2', 'value2']
]);

const values = await secureStorage.multiGet(['key1', 'key2']);
await secureStorage.multiRemove(['key1', 'key2']);
```

### createSecureStorage (for Zustand)

```typescript
import { createSecureStorage } from '../services/secureStorage';
import { persist, createJSONStorage } from 'zustand/middleware';

persist(
  (set, get) => ({ /* your store */ }),
  {
    name: 'storage-name',
    storage: createJSONStorage(() => createSecureStorage()),
  }
)
```

## Troubleshooting

### Tokens not persisting
- Check if SecureStore is available on the device
- Verify expo-secure-store is properly installed
- Check for errors in console logs

### Authentication failing after update
- This is expected for existing users
- Users need to log in again after the update
- Tokens are migrated to secure storage

### Build errors
- Run `npx expo prebuild` to regenerate native code
- Ensure expo-secure-store is in package.json
- Clean and rebuild: `cd android && ./gradlew clean` (Android)

## Future Improvements

1. **Token Migration**: Automatically migrate existing tokens from AsyncStorage to SecureStore
2. **Biometric Protection**: Add optional biometric authentication for token access
3. **Token Rotation**: Implement automatic token rotation on sensitive operations
4. **Secure Wipe**: Add secure wipe on too many failed authentication attempts
5. **Key Attestation**: Implement hardware key attestation on supported devices

## References

- [Expo SecureStore Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [iOS Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Android EncryptedSharedPreferences](https://developer.android.com/topic/security/data)
- [Zustand Persist Middleware](https://github.com/pmndrs/zustand#persist-middleware)
