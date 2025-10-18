/*
migrate-usernames.js

Adds a `usernameLower` field to every document in the `users` collection (Firestore).
Also prints duplicates found (case-insensitive). Run this once from the project root.

Usage:
  1) Create a service account JSON in Firebase Console -> Project settings -> Service accounts -> Generate new private key.
  2) Set the env var (PowerShell):
       $Env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\to\service-account.json'
  3) Run:
       node migrate-usernames.js

This script uses the Admin SDK and will update documents in-place. It logs actions and duplicates.
*/

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
async function main() {
  // Allow passing the service account path as the first argument:
  // node migrate-usernames.js C:\full\path\to\key.json
  const arg = process.argv[2];
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const useAdcFlag = arg === '--use-adc' || process.env.USE_ADC === 'true' || arg === '--adc';

  if (useAdcFlag) {
    console.log('Using Application Default Credentials (ADC). Ensure you ran: gcloud auth application-default login');
    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } catch (e) {
      console.error('Failed to initialize admin SDK with ADC:', e);
      process.exit(1);
    }
  } else {
    const chosen = arg || envPath;

    if (!chosen) {
      console.error('No service account path provided. Provide as argument, set GOOGLE_APPLICATION_CREDENTIALS, or use --use-adc.');
      console.error('Usage:');
      console.error('  node migrate-usernames.js C:\\path\\to\\service-account.json');
      console.error('  node migrate-usernames.js --use-adc   # use gcloud application-default credentials');
      process.exit(1);
    }

    const absPath = path.resolve(chosen);
    if (!fs.existsSync(absPath)) {
      console.error(`Service account file not found: ${absPath}`);
      process.exit(1);
    }

    // Validate JSON parseability
    try {
      const raw = fs.readFileSync(absPath, 'utf8');
      JSON.parse(raw);
    } catch (e) {
      console.error(`Service account file is not valid JSON: ${absPath}`);
      console.error(e.message || e);
      process.exit(1);
    }

    // Set env var so admin.credential.applicationDefault() can pick it up
    process.env.GOOGLE_APPLICATION_CREDENTIALS = absPath;

    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } catch (e) {
      console.error('Failed to initialize admin SDK:', e);
      process.exit(1);
    }
  }

  const db = admin.firestore();
  const usersRef = db.collection('users');

  console.log('Fetching users...');
  const snapshot = await usersRef.get();
  console.log(`Found ${snapshot.size} user docs.`);

  const seen = new Map();
  const ops = [];

  snapshot.forEach(doc => {
    const data = doc.data() || {};
    const username = (data.username || '').toString();
    const lower = username.toLowerCase();

    if (!username) {
      console.warn(`Doc ${doc.id} has no username; skipping.`);
      return;
    }

    if (seen.has(lower)) {
      console.warn(`Duplicate username (case-insensitive): ${username} (doc ${doc.id}) and doc ${seen.get(lower)}`);
    } else {
      seen.set(lower, doc.id);
    }

    if (data.usernameLower !== lower) {
      ops.push({ id: doc.id, lower });
    }
  });

  console.log(`Will update ${ops.length} documents to add/patch usernameLower.`);
  for (const op of ops) {
    console.log(`Updating ${op.id} -> usernameLower=${op.lower}`);
    await usersRef.doc(op.id).set({ usernameLower: op.lower }, { merge: true });
  }

  console.log('Migration complete.');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(2);
});
