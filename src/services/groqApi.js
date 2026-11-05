// Retired frontend integration. Historical implementation remains in Git.
// Provider credentials must never be read by browser code.
export async function fetchGroqResponse() {
  throw new Error('Cloud inference is disabled. Use the local inference service.');
}
