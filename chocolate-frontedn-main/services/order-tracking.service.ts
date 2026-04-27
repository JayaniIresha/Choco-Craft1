import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION = "order_trackings";

const SHOP_LOCATION = {
  rider_latitude: 6.914869207446419,
  rider_longitude: 79.97208618882019,
};

export const orderTrackingService = {
  /** Called when a driver is assigned — initialises the tracking doc at shop location */
  async initTracking(orderId: string) {
    const ref = doc(db, COLLECTION, orderId);
    await setDoc(ref, {
      ...SHOP_LOCATION,
      updatedAt: new Date().toISOString(),
    });
  },

  async getTracking(orderId: string) {
    const ref = doc(db, COLLECTION, orderId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  },

  async updateLocation(orderId: string, lat: number, lng: number) {
    const ref = doc(db, COLLECTION, orderId);
    await updateDoc(ref, {
      rider_latitude: lat,
      rider_longitude: lng,
      updatedAt: new Date().toISOString(),
    });
  },
};
