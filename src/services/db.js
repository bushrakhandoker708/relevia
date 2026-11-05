// Compatibility facade: explicit session identity, in-memory storage by default.
import { chatStore } from './chatStorage.js';
export const DB = async (uid) => chatStore.open(uid);
