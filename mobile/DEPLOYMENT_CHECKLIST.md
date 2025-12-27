# Secure Token Storage - Deployment Checklist

## Pre-Deployment Steps

### 1. Install Dependencies
```bash
cd mobile
npm install
# or
yarn install
```

**Verify**:
- [ ] `expo-secure-store` appears in `node_modules`
- [ ] No installation errors
- [ ] Package version matches `package.json` (~14.0.0)

### 2. Code Review
Review the following files to ensure changes are correct:

- [ ] `src/services/secureStorage.ts` - New file created
- [ ] `src/stores/authStore.ts` - Updated to use secureStorage
- [ ] `src/services/api.ts` - Updated to use secureStorage
- [ ] `package.json` - expo-secure-store added

### 3. Test Locally

#### 3.1 Development Build
```bash
# Clear cache first
npx expo start --clear

# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

#### 3.2 Test Cases
Run through these test scenarios:

**Login Flow**:
- [ ] Can login with valid credentials
- [ ] Tokens stored successfully (check logs)
- [ ] User redirected to home screen

**Token Persistence**:
- [ ] Close app completely
- [ ] Reopen app
- [ ] User still logged in
- [ ] Can make authenticated API calls

**Token Refresh**:
- [ ] Trigger 401 error (expire token manually if possible)
- [ ] Token auto-refreshes
- [ ] Request succeeds after refresh

**Logout Flow**:
- [ ] Click logout
- [ ] Tokens cleared from storage (check logs)
- [ ] Redirected to login screen
- [ ] Cannot access authenticated routes

**Error Handling**:
- [ ] App handles SecureStore errors gracefully
- [ ] Fallback to AsyncStorage works if needed
- [ ] No crashes or blank screens

### 4. Platform-Specific Testing

#### iOS
- [ ] Test on physical iOS device
- [ ] Verify Keychain storage (Settings > Passwords)
- [ ] Test with Face ID/Touch ID enabled
- [ ] Test app uninstall/reinstall (tokens should persist)

#### Android
- [ ] Test on physical Android device
- [ ] Verify EncryptedSharedPreferences used
- [ ] Test with fingerprint/pattern lock enabled
- [ ] Test app uninstall/reinstall (tokens cleared)

## Deployment Steps

### 1. Version Bump
```bash
# Update version in package.json
{
  "version": "1.1.0"  // or appropriate version
}
```

### 2. Build Production Version

#### For EAS Build (Recommended)
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Configure EAS (if first time)
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

#### For Local Build
```bash
# iOS
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

### 3. Testing Production Build

- [ ] Install production build on test devices
- [ ] Run through all test cases again
- [ ] Verify no console errors
- [ ] Check app performance
- [ ] Verify encryption is active (SecureStore, not AsyncStorage fallback)

### 4. Store Submission

#### iOS App Store
- [ ] Update release notes mentioning security improvements
- [ ] Submit build through App Store Connect
- [ ] Test with TestFlight before public release

#### Google Play Store
- [ ] Update release notes mentioning security improvements
- [ ] Submit build through Google Play Console
- [ ] Test with internal/beta track before public release

## Post-Deployment

### 1. User Communication

**Release Notes Template**:
```
Version X.X.X

Security Improvements:
- Enhanced token storage with platform-native encryption
- Improved authentication security
- Better protection of user credentials

Note: You will need to log in again after this update due to
security improvements. This is a one-time requirement.

Bug Fixes:
- [Other fixes...]
```

### 2. Monitoring

Monitor these metrics for 24-48 hours after release:

- [ ] Login success rate
- [ ] Authentication errors
- [ ] App crashes related to storage
- [ ] User reports of login issues
- [ ] Performance metrics (app startup time)

### 3. Rollback Plan

If critical issues arise:

```bash
# Revert to previous version
git revert <commit-hash>

# Build and deploy previous version
eas build --platform all

# Submit to stores as emergency update
```

Keep previous version APK/IPA files for quick rollback.

## Troubleshooting

### Users Can't Login After Update

**Expected Behavior**: Users need to log in again (one-time)

**Solution**:
- Verify this is mentioned in release notes
- Provide clear error message in app
- Support team should be briefed

### SecureStore Not Available Errors

**Possible Causes**:
- Running on simulator instead of real device
- Android device API < 23
- iOS device < iOS 12

**Solution**:
- Code automatically falls back to AsyncStorage
- Log warning to monitor fallback usage
- Consider minimum OS version requirements

### App Crashes on Startup

**Possible Causes**:
- Migration issues from old AsyncStorage
- Zustand rehydration errors
- Platform-specific issues

**Solution**:
1. Check error logs
2. Clear app storage (Settings > Apps > Your App > Clear Data)
3. Reinstall app
4. If persistent, rollback deployment

## Success Metrics

After deployment, verify:

- [ ] < 5% increase in login errors
- [ ] < 1% increase in crashes
- [ ] User complaints within acceptable range
- [ ] No security vulnerabilities reported
- [ ] App store ratings remain stable or improve

## Documentation

Ensure team has access to:

- [ ] `SECURE_STORAGE_IMPLEMENTATION.md` - Technical details
- [ ] `IMPLEMENTATION_SUMMARY.md` - Implementation overview
- [ ] `QUICK_REFERENCE.md` - Developer quick reference
- [ ] This checklist (`DEPLOYMENT_CHECKLIST.md`)

## Support Team Briefing

Brief support team on:

1. **Expected User Impact**:
   - Users will need to log in again after update
   - This is a one-time security improvement
   - No data is lost, just need to re-authenticate

2. **Common Questions**:
   - Q: "Why am I logged out?"
   - A: "We've improved security. Please log in again - this is a one-time requirement."

   - Q: "Are my tickets/data gone?"
   - A: "No, your data is safe. Just log in again to access it."

3. **Escalation Path**:
   - If user can't log in after multiple attempts → Dev team
   - If app crashes on startup → Dev team (high priority)
   - General login issues → Standard support flow

## Final Checks

Before marking deployment complete:

- [ ] All tests passing
- [ ] Production builds deployed to stores
- [ ] Release notes published
- [ ] Support team briefed
- [ ] Monitoring in place
- [ ] Rollback plan ready
- [ ] Documentation updated
- [ ] Team notified of deployment

## Sign-off

- [ ] Developer: _____________________ Date: _______
- [ ] QA Lead: _____________________ Date: _______
- [ ] Product Manager: _____________________ Date: _______

---

**Notes**:
- Keep this checklist for future reference
- Update based on lessons learned
- Archive for compliance/audit purposes
