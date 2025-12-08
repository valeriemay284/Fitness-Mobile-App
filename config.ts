import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Update this to your development machine LAN IP if needed.
const DEFAULT_LAN = '10.41.81.30';

const LOCALHOST = `http://192.168.1.79:8080`;
const ANDROID_EMULATOR = `http://192.168.1.79:8080`;
const LAN = `http://${DEFAULT_LAN}:8080`;

export const API_BASE = Platform.OS === 'android' && !Constants.isDevice ? ANDROID_EMULATOR : Platform.OS === 'web' ? LOCALHOST : LAN;

export function api(path: string) {
  if (!path) return API_BASE;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}

export default API_BASE;