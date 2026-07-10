import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keysPath = path.join(__dirname, '../.vapid-keys.json');

function loadOrGenerateVapidKeys() {
  // Prefer environment variables
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
      subject: process.env.VAPID_SUBJECT || 'mailto:admin@almeida.marketing',
    };
  }

  // Try loading from persistent file
  if (fs.existsSync(keysPath)) {
    try {
      return JSON.parse(fs.readFileSync(keysPath, 'utf8'));
    } catch {
      // fall through and regenerate
    }
  }

  // Generate new VAPID keys and persist them
  const { publicKey, privateKey } = webpush.generateVAPIDKeys();
  const config = {
    publicKey,
    privateKey,
    subject: 'mailto:admin@almeida.marketing',
  };
  fs.writeFileSync(keysPath, JSON.stringify(config, null, 2));
  console.log('[VAPID] Generated new keys and saved to .vapid-keys.json');
  return config;
}

export const vapidKeys = loadOrGenerateVapidKeys();

webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);

export default webpush;
