const requiredVars = ['AGORA_APP_ID', 'AGORA_APP_CERTIFICATE'];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  appId: process.env.AGORA_APP_ID,
  appCertificate: process.env.AGORA_APP_CERTIFICATE,
  // Token validity in seconds — 1 hour is comfortable for a halaqah session
  tokenExpirySeconds: parseInt(process.env.AGORA_TOKEN_EXPIRY_SECONDS || '3600', 10),
};