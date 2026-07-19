import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./client";
import { MenuCategory, MenuItem } from "../types/menu";

export function useCurrentRestaurant() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubRestaurant: (() => void) | undefined;
    
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setRestaurantId(null);
        setRestaurant(null);
        setLoading(false);
        if (unsubRestaurant) unsubRestaurant();
        return;
      }

      const q = query(
        collection(db, "restaurants"),
        where("ownerId", "==", user.uid),
        limit(1)
      );

      unsubRestaurant = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const doc = snap.docs[0];
          setRestaurantId(doc.id);
          setRestaurant({ id: doc.id, ...doc.data() });
        } else {
          setRestaurantId(null);
          setRestaurant(null);
        }
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubRestaurant) unsubRestaurant();
    };
  }, []);

  return { restaurantId, restaurant, loading };
}

export function useRestaurantMenu(restaurantId: string | null) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const catsQuery = query(
      collection(db, "categories"),
      where("restaurantId", "==", restaurantId),
      orderBy("order")
    );

    const itemsQuery = query(
      collection(db, "menuItems"),
      where("restaurantId", "==", restaurantId),
      orderBy("order")
    );

    let cats: any[] = [];
    let items: any[] = [];

    const buildMenu = () => {
      const itemsByCategory = new Map<string, MenuItem[]>();
      items.forEach((item) => {
        const bucket = itemsByCategory.get(item.categoryId) ?? [];
        bucket.push(item);
        itemsByCategory.set(item.categoryId, bucket);
      });

      const fullMenu = cats.map((cat) => ({
        ...cat,
        items: itemsByCategory.get(cat.id) ?? [],
      })) as MenuCategory[];

      setCategories(fullMenu);
      setLoading(false);
    };

    const unsubCats = onSnapshot(catsQuery, (snap) => {
      cats = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      buildMenu();
    });

    const unsubItems = onSnapshot(itemsQuery, (snap) => {
      items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      buildMenu();
    });

    return () => {
      unsubCats();
      unsubItems();
    };
  }, [restaurantId]);

  return { categories, loading };
}

export function useRestaurantTables(restaurantId: string | null) {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setTables([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "tables"),
      where("restaurantId", "==", restaurantId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort numerically by tableNumber
      docs.sort((a, b) => Number(a.tableNumber) - Number(b.tableNumber));
      setTables(docs);
      setLoading(false);
    });

    return () => unsub();
  }, [restaurantId]);

  return { tables, loading };
}

export function useRestaurantOrders(restaurantId: string | null) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Usually limit this to today's active orders in production
    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", restaurantId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        // Convert Firestore Timestamp to JS Date for the UI
        createdAt: d.data().createdAt?.toDate() || new Date()
      }));
      setOrders(docs);
      setLoading(false);
    });

    return () => unsub();
  }, [restaurantId]);

  return { orders, loading };
}
