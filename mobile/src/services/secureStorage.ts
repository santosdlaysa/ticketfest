import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure storage service that uses Expo SecureStore for sensitive data
 * and falls back to AsyncStorage for non-sensitive data or when SecureStore is unavailable.
 *
 * SecureStore uses:
 * - Keychain on iOS
 * - EncryptedSharedPreferences on Android
 */

const SENSITIVE_KEYS = ['accessToken', 'refreshToken'];

export const secureStorage = {
  /**
   * Store a value securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (SENSITIVE_KEYS.includes(key)) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(key, value);
    }
  },

  /**
   * Retrieve a value securely
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (SENSITIVE_KEYS.includes(key)) {
        return await SecureStore.getItemAsync(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      // Fallback to AsyncStorage if SecureStore fails
      return await AsyncStorage.getItem(key);
    }
  },

  /**
   * Remove a value
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (SENSITIVE_KEYS.includes(key)) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.removeItem(key);
    }
  },

  /**
   * Store multiple key-value pairs
   */
  async multiSet(pairs: Array<[string, string]>): Promise<void> {
    await Promise.all(
      pairs.map(([key, value]) => this.setItem(key, value))
    );
  },

  /**
   * Retrieve multiple values
   */
  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    const results = await Promise.all(
      keys.map(async (key) => {
        const value = await this.getItem(key);
        return [key, value] as [string, string | null];
      })
    );
    return results;
  },

  /**
   * Remove multiple keys
   */
  async multiRemove(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.removeItem(key)));
  },
};

/**
 * Custom storage adapter for Zustand persist middleware
 * This adapter makes SecureStore compatible with Zustand's storage interface
 */
export const createSecureStorage = () => ({
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);

      // Additionally, extract and store tokens securely
      const parsed = JSON.parse(value);
      if (parsed.state) {
        const { accessToken, refreshToken } = parsed.state;

        if (accessToken) {
          await secureStorage.setItem('accessToken', accessToken);
        }
        if (refreshToken) {
          await secureStorage.setItem('refreshToken', refreshToken);
        }
      }
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
      // Also remove tokens from secure storage
      await secureStorage.multiRemove(['accessToken', 'refreshToken']);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },
});
