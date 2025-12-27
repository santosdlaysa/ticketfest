/**
 * Cookie utility functions
 *
 * Note: These utilities are for reading non-httpOnly cookies only.
 * Auth tokens are stored in httpOnly cookies and cannot be accessed by JavaScript.
 * They are automatically sent with requests via axios withCredentials: true.
 */

/**
 * Get a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }

  return null;
};

/**
 * Set a non-httpOnly cookie
 * @param name - Cookie name
 * @param value - Cookie value
 * @param days - Days until expiration (optional)
 * @param options - Additional cookie options
 */
export const setCookie = (
  name: string,
  value: string,
  days?: number,
  options?: {
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  let cookieString = `${name}=${value}`;

  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  cookieString += `; path=${options?.path || '/'}`;

  if (options?.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options?.secure) {
    cookieString += '; secure';
  }

  if (options?.sameSite) {
    cookieString += `; SameSite=${options.sameSite}`;
  }

  document.cookie = cookieString;
};

/**
 * Delete a cookie by name
 * @param name - Cookie name
 * @param options - Cookie options (should match the options used when setting)
 */
export const deleteCookie = (
  name: string,
  options?: {
    path?: string;
    domain?: string;
  }
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;

  cookieString += `; path=${options?.path || '/'}`;

  if (options?.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  document.cookie = cookieString;
};

/**
 * Check if a cookie exists
 * @param name - Cookie name
 * @returns True if cookie exists, false otherwise
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

/**
 * Get all cookies as an object
 * @returns Object with cookie name-value pairs
 */
export const getAllCookies = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }

  const cookies: Record<string, string> = {};

  document.cookie.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });

  return cookies;
};
