// Shared Kitten Nest asset resolver.
// Purpose: keep future /cloud runtime integration from copying test-page code.
// Current priority:
// 1. Real local image override in IndexedDB kittenNestLabDB/images
// 2. Supabase active room_asset_slots -> published nest_assets -> public_url
// 3. GitHub/static fallback path

(function () {
  const SUPABASE_URL = 'https://pmkxzmogolxllijzqnfr.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_a_E9X0r3m6i641s0KluUrg_squa6uc_';

  const DB = 'kittenNestLabDB';
  const STORE = 'images';

  const FALLBACKS = {
    'coffeeCorner|background.main': '/assets/rooms/coffee-corner/morning-evening.jpg',
    'home|background.day': '/assets/rooms/home/day.jpg',
    'home|background.night': '/assets/rooms/home/night.jpg'
  };

  const LOCAL_KEYS = {
    'coffeeCorner|background.main': 'gameRoom',
    'home|background.day': 'homeOn',
    'home|background.night': 'homeOff'
  };

  function slotKey(roomId, slot) {
    return `${roomId}|${slot}`;
  }

  function localKeyFor(roomId, slot) {
    return LOCAL_KEYS[slotKey(roomId, slot)] || null;
  }

  function fallbackFor(roomId, slot) {
    return FALLBACKS[slotKey(roomId, slot)] || null;
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getLocalBlob(roomId, slot) {
    const key = localKeyFor(roomId, slot);
    if (!key) return null;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const q = tx.objectStore(STORE).get(key);
      q.onsuccess = () => resolve(q.result || null);
      q.onerror = () => reject(q.error);
    });
  }

  async function deleteLocalBlob(roomId, slot) {
    const key = localKeyFor(roomId, slot);
    if (!key) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function supabaseGet(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        Accept: 'application/json'
      }
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
    return data;
  }

  async function getSupabaseAsset(roomId, slot) {
    const slots = await supabaseGet(
      `room_asset_slots?select=room_id,slot,asset_id,status&room_id=eq.${encodeURIComponent(roomId)}&slot=eq.${encodeURIComponent(slot)}&status=eq.active&limit=1`
    );
    if (!slots.length) return null;

    const assetId = slots[0].asset_id;
    const assets = await supabaseGet(
      `nest_assets?select=asset_id,room_id,status,storage_path,public_url,scene_group,scene_key,visibility,lock_state&asset_id=eq.${encodeURIComponent(assetId)}&status=eq.published&limit=1`
    );
    if (!assets.length) return null;

    return { slotRow: slots[0], asset: assets[0] };
  }

  async function resolveAsset(roomId, slot) {
    const localKey = localKeyFor(roomId, slot);

    const localBlob = await getLocalBlob(roomId, slot).catch(() => null);
    if (localBlob) {
      return {
        source: 'indexeddb-local-override',
        url: URL.createObjectURL(localBlob),
        room_id: roomId,
        slot,
        local_key: localKey
      };
    }

    const supabase = await getSupabaseAsset(roomId, slot).catch(() => null);
    if (supabase?.asset?.public_url) {
      return {
        source: 'supabase-slot-binding',
        url: supabase.asset.public_url,
        room_id: roomId,
        slot,
        local_key: localKey,
        slotRow: supabase.slotRow,
        asset: supabase.asset
      };
    }

    return {
      source: 'git-fallback',
      url: fallbackFor(roomId, slot),
      room_id: roomId,
      slot,
      local_key: localKey
    };
  }

  window.KittenNestAssetResolver = {
    resolveAsset,
    deleteLocalBlob,
    localKeyFor,
    fallbackFor,
    constants: {
      DB,
      STORE,
      FALLBACKS,
      LOCAL_KEYS,
      SUPABASE_URL
    }
  };
})();
