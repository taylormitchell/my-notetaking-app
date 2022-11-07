import { useEffect, useState } from "react";

export type Uuid = string;

export type Item = { id: Uuid; type: string };
export type Items<T extends Item> = { [key: Uuid]: T };
export type UpdateItem<T extends Item> = (
  update: Items<T> | ((items: Items<T>) => Items<T>)
) => void;

export function uuid(): Uuid {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const useItems = <T extends Item>(
  initialItems: Items<T> | (() => Items<T>),
  persist = true
): [Items<T>, UpdateItem<T>, () => void] => {
  const [items, setItems] = useState(() => {
    const items = typeof initialItems === "function" ? initialItems() : initialItems;
    Object.entries(items).forEach(([id, item]) => {
      if (item.id !== id) {
        throw new Error(`Item id mismatch: ${id} !== ${item.id}`);
      }
    });
    return items;
  });
  const [dirtyItemIds, setDirtyItemIds] = useState(new Set<string>([...Object.keys(items)]));
  const [syncNeeded, setSyncNeeded] = useState(true);

  /**
   * @param update New/updated {@link Item}s or a function that returns new/updated {@link Item}s.
   */
  function updateItems(update: Items<T> | ((items: Items<T>) => Items<T>)) {
    setItems((items) => {
      const newItems = typeof update === "function" ? update(items) : update;
      Object.entries(newItems).forEach(([id, item]) => {
        if (item.id !== id) {
          throw new Error(`Item id mismatch: ${id} !== ${item.id}`);
        }
      });
      if (persist) {
        setDirtyItemIds((keys) => new Set([...keys, ...Object.keys(newItems)]));
      }
      return { ...items, ...newItems };
    });
  }

  function clearItems() {
    setItems({});
    setDirtyItemIds(new Set());
  }

  // Start sync interval
  useEffect(() => {
    if (!persist) return;
    const interval = setInterval(() => {
      setSyncNeeded(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync items
  useEffect(() => {
    if (!persist || !syncNeeded) return;
    setSyncNeeded(false);
    (async () => {
      console.log("Syncing items", dirtyItemIds);
      const dirtyItems: Items<T> = {};
      dirtyItemIds.forEach((key) => (dirtyItems[key] = items[key]));

      const response = await fetch("/api/db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dirtyItems),
      });
      const updatedItems = await response.json();
      if (!updatedItems || typeof updatedItems !== "object") {
        console.error("Invalid response from server", updatedItems);
        return;
      }
      setDirtyItemIds(new Set());
      setItems((items) => ({ ...items, ...updatedItems }));
    })();
  }, [syncNeeded, dirtyItemIds, items]);

  return [items, updateItems, clearItems];
};
