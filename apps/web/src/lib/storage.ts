export interface GuestProfile {
    name: string;
    avatar?: string;
}

const DB_NAME = "BedrudWebDB";
const STORE_NAME = "guest_profile";
const SETTINGS_STORE = "settings";
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
            if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                db.createObjectStore(SETTINGS_STORE);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveGuestProfile(profile: GuestProfile): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(profile, "current");
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getGuestProfile(): Promise<GuestProfile | null> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get("current");

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error("Failed to get guest profile from IndexedDB", err);
        return null;
    }
}

export async function saveSetting(key: string, value: any): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(SETTINGS_STORE, "readwrite");
    const store = tx.objectStore(SETTINGS_STORE);
    store.put(value, key);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
        const db = await openDB();
        const tx = db.transaction(SETTINGS_STORE, "readonly");
        const store = tx.objectStore(SETTINGS_STORE);
        const request = store.get(key);

        return new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result ?? defaultValue);
            request.onerror = () => resolve(defaultValue);
        });
    } catch (err) {
        return defaultValue;
    }
}
