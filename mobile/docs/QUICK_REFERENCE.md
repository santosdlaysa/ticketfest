# Secure Storage - Quick Reference

## Installation

```bash
npm install
```

The package `expo-secure-store` has been added to `package.json`.

## Usage

### Import

```typescript
import { secureStorage } from '../services/secureStorage';
```

### Store Token

```typescript
// Single item
await secureStorage.setItem('accessToken', token);

// Multiple items
await secureStorage.multiSet([
  ['accessToken', accessToken],
  ['refreshToken', refreshToken],
]);
```

### Retrieve Token

```typescript
// Single item
const token = await secureStorage.getItem('accessToken');

// Multiple items
const [[, accessToken], [, refreshToken]] = await secureStorage.multiGet([
  'accessToken',
  'refreshToken',
]);
```

### Remove Token

```typescript
// Single item
await secureStorage.removeItem('accessToken');

// Multiple items
await secureStorage.multiRemove(['accessToken', 'refreshToken']);
```

## What's Stored Where?

### SecureStore (Encrypted)
- ✅ `accessToken` → JWT access token
- ✅ `refreshToken` → JWT refresh token

### AsyncStorage (Plain)
- ℹ️ `user` → User profile data (non-sensitive)
- ℹ️ `sessionId` → Cart session ID
- ℹ️ `auth-storage` → Zustand persist data

## Security Features

| Platform | Storage | Encryption | Hardware-Backed |
|----------|---------|------------|-----------------|
| iOS | Keychain | ✅ Yes | ✅ Secure Enclave |
| Android | EncryptedSharedPreferences | ✅ AES-256 | ✅ Keystore |

## Common Patterns

### Login
```typescript
const { accessToken, refreshToken, user } = await authApi.login(email, password);

await secureStorage.multiSet([
  ['accessToken', accessToken],
  ['refreshToken', refreshToken],
  ['user', JSON.stringify(user)],
]);
```

### API Request
```typescript
// In axios interceptor
const token = await secureStorage.getItem('accessToken');
config.headers.Authorization = `Bearer ${token}`;
```

### Logout
```typescript
await secureStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
```

### Token Refresh
```typescript
const refreshToken = await secureStorage.getItem('refreshToken');
const { accessToken } = await refreshTokenApi(refreshToken);
await secureStorage.setItem('accessToken', accessToken);
```

## Error Handling

```typescript
try {
  await secureStorage.setItem('accessToken', token);
} catch (error) {
  // Automatically falls back to AsyncStorage
  console.error('SecureStore failed, using fallback:', error);
}
```

## Zustand Integration

```typescript
import { createSecureStorage } from '../services/secureStorage';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create()(
  persist(
    (set, get) => ({ /* your store */ }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => createSecureStorage()),
    }
  )
);
```

## Troubleshooting

### Tokens not persisting
```typescript
// Check if SecureStore is available
import * as SecureStore from 'expo-secure-store';
const isAvailable = await SecureStore.isAvailableAsync();
console.log('SecureStore available:', isAvailable);
```

### Clear all stored data
```typescript
// Development only - clear all tokens
await secureStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
await AsyncStorage.clear();
```

### Check what's stored
```typescript
// Development only
const accessToken = await secureStorage.getItem('accessToken');
const refreshToken = await secureStorage.getItem('refreshToken');
console.log('Tokens:', {
  hasAccessToken: !!accessToken,
  hasRefreshToken: !!refreshToken
});
```

## Testing Commands

```bash
# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios

# Clear cache and rebuild
npx expo start --clear
```

## Migration Notes

Existing users will need to log in again after this update. This is a one-time migration.

## Files Modified

- ✅ `src/services/secureStorage.ts` (NEW)
- ✅ `src/stores/authStore.ts` (UPDATED)
- ✅ `src/services/api.ts` (UPDATED)
- ✅ `package.json` (UPDATED)

## Key Differences from AsyncStorage

| Feature | AsyncStorage | SecureStore |
|---------|--------------|-------------|
| Encryption | ❌ None | ✅ Hardware-backed |
| Best for | UI state, preferences | Tokens, passwords |
| Size limit | ~6MB | ~2KB per item |
| Speed | Fast | Slightly slower |
| Persistence | App only | OS-level |

## Best Practices

1. ✅ **DO** use SecureStore for tokens and credentials
2. ✅ **DO** use AsyncStorage for non-sensitive data
3. ✅ **DO** handle errors with fallback
4. ❌ **DON'T** store large data in SecureStore
5. ❌ **DON'T** log token values
6. ❌ **DON'T** store tokens in app state only

## Support

See `SECURE_STORAGE_IMPLEMENTATION.md` for detailed documentation.
