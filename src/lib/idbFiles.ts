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

/** 以 key 存一組檔案（File 可直接結構化複製進 IndexedDB，檔名與類型都會保留） */
export async function saveFiles(key: string, files: File[]): Promise<void> {
  await withStore('readwrite', store => store.put(files, key));
}

/** 取回 key 對應的檔案，沒存過回空陣列 */
export async function loadFiles(key: string): Promise<File[]> {
  return (await withStore<File[] | undefined>('readonly', store => store.get(key))) ?? [];
}

export async function deleteFiles(key: string): Promise<void> {
  await withStore('readwrite', store => store.delete(key));
}
