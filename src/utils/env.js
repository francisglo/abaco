// src/utils/env.js

export function getGoogleClientId() {
  return String(process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}
