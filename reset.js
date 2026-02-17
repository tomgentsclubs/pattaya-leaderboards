const admin = require('firebase-admin');

// Initialise Firebase Admin using the service account from GitHub Secrets
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'pattaya-leaderboards'
});

const db = admin.firestore();

async function weeklyReset() {
  console.log('Starting weekly reset...');

  const collection = db.collection('weekly_submissions');
  const snapshot = await collection.get();

  if (snapshot.empty) {
    console.log('Nothing to reset — weekly_submissions is already empty.');
    process.exit(0);
  }

  // Delete in batches of 500 (Firestore limit)
  const batchSize = 500;
  const docs = snapshot.docs;
  let deleted = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += Math.min(batchSize, docs.length - i);
    console.log(`Deleted ${deleted} / ${docs.length} documents...`);
  }

  console.log(`Weekly reset complete — ${deleted} submission records cleared.`);
  console.log('Scores and vote history are preserved. Users can now vote again.');
  process.exit(0);
}

weeklyReset().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
