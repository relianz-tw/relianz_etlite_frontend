const DB_NAME = 'etlite_files';
const STORE_NAME = 'files';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 在單一 transaction 內操作 store；等 transaction 完成才 resolve，確保寫入真的落地 */
async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = run(tx.objectStore(STORE_NAME));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * 以 key 存任何可結構化複製的值（含 File／Blob，檔名與類型都會保留；
 * 可以是 File[] 或夾帶 File 的物件陣列）。
 */
export async function saveValue<T>(key: string, value: T): Promise<void> {
  await withStore('readwrite', store => store.put(value, key));
}

/** 取回 key 對應的值，沒存過回 undefined */
export async function loadValue<T>(key: string): Promise<T | undefined> {
  return withStore<T | undefined>('readonly', store => store.get(key));
}

export async function deleteValue(key: string): Promise<void> {
  await withStore('readwrite', store => store.delete(key));
}
