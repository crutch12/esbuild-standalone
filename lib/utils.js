export async function generateHash(text) {
  // Encode the string as a Uint8Array
  const msgBuffer = new TextEncoder().encode(text);

  // Hash the text using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // Convert the ArrayBuffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');

  return hashHex;
}