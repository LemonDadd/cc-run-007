// IndexedDB 持久层（完全本地，无任何网络请求）
const DB_NAME = 'colokid';
const DB_VERSION = 1;

export const STORES = [
  'profiles',
  'colorProgress',
  'mixingRecords',
  'matchingWorks',
  'coloringWorks',
  'observationLogs',
  'achievements',
  'parentSettings',
  'unlockedStickers',
];

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id', autoIncrement: false });
          if (name !== 'parentSettings') store.createIndex('profileId', 'profileId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db, store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut(store, value) {
  const db = await openDB();
  await promisify(tx(db, store, 'readwrite').put(value));
  return value;
}

export async function idbGet(store, id) {
  const db = await openDB();
  return promisify(tx(db, store).get(id));
}

export async function idbGetAll(store) {
  const db = await openDB();
  return promisify(tx(db, store).getAll());
}

export async function idbDelete(store, id) {
  const db = await openDB();
  await promisify(tx(db, store, 'readwrite').delete(id));
}

export async function idbClear(store) {
  const db = await openDB();
  await promisify(tx(db, store, 'readwrite').clear());
}

export async function idbGetByProfile(store, profileId) {
  const db = await openDB();
  const objectStore = tx(db, store);
  if (objectStore.indexNames.contains('profileId')) {
    return promisify(objectStore.index('profileId').getAll(profileId));
  }
  const all = await promisify(objectStore.getAll());
  return all.filter((r) => r.profileId === profileId);
}

// 导出单个玩家档案的全部数据（JSON）
export async function exportProfile(profileId) {
  const out = { version: 1, exportedAt: Date.now(), profileId };
  for (const store of STORES) {
    if (store === 'parentSettings') continue;
    if (store === 'profiles') {
      out.profiles = [await idbGet('profiles', profileId)];
    } else {
      out[store] = await idbGetByProfile(store, profileId);
    }
  }
  return out;
}

export async function importProfile(data, profileId) {
  if (!data || data.version !== 1) throw new Error('文件格式不正确');
  const pid = profileId || data.profileId;
  for (const p of data.profiles || []) {
    await idbPut('profiles', { ...p, id: pid });
  }
  for (const store of STORES.slice(2)) {
    const rows = data[store] || [];
    for (const row of rows) {
      await idbPut(store, { ...row, profileId: pid });
    }
  }
  return pid;
}

export async function exportAll() {
  const out = { version: 1, app: 'colokid', exportedAt: Date.now() };
  for (const store of STORES) {
    out[store] = await idbGetAll(store);
  }
  return out;
}

export async function importAll(data) {
  if (!data || data.app !== 'colokid') throw new Error('文件不是 ColoKid 的备份');
  for (const store of STORES) {
    const rows = data[store] || [];
    const db = await openDB();
    const objectStore = tx(db, store, 'readwrite');
    await promisify(objectStore.clear());
    for (const row of rows) await promisify(objectStore.put(row));
  }
}

export async function deleteProfileFully(profileId) {
  for (const store of STORES) {
    if (store === 'parentSettings') continue;
    if (store === 'profiles') {
      await idbDelete('profiles', profileId);
      continue;
    }
    const rows = await idbGetByProfile(store, profileId);
    for (const row of rows) await idbDelete(store, row.id);
  }
}
