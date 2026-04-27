"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, MapPin, Navigation } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyBqT1du1URwz87JLadp7PUbrm_XhRBV_ao";

const SHOP_LOCATION = { lat: 6.914869207446419, lng: 79.97208618882019 };

const MAP_CONTAINER_STYLE = { width: "100%", height: "420px" };

interface TrackingData {
  rider_latitude: number;
  rider_longitude: number;
  updatedAt?: string;
}

interface RiderTrackingModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  /** Optional label shown in the dialog title (e.g. delivery person name) */
  label?: string;
}

export default function RiderTrackingModal({
  open,
  onClose,
  orderId,
  label,
}: RiderTrackingModalProps) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [firestoreError, setFirestoreError] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: "google-map-script",
  });

  // Real-time Firestore listener — only when modal is open
  useEffect(() => {
    if (!open || !orderId) return;

    setTracking(null);
    setFirestoreError(false);

    const ref = doc(db, "order_trackings", orderId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setTracking(snap.data() as TrackingData);
        } else {
          setFirestoreError(true);
        }
      },
      () => setFirestoreError(true)
    );

    return () => unsub();
  }, [open, orderId]);

  // Pan map to rider when coordinates update
  useEffect(() => {
    if (mapRef.current && tracking) {
      mapRef.current.panTo({
        lat: tracking.rider_latitude,
        lng: tracking.rider_longitude,
      });
    }
  }, [tracking]);

  const riderPos = tracking
    ? { lat: tracking.rider_latitude, lng: tracking.rider_longitude }
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-amber-600" />
            Live Rider Tracking
          </DialogTitle>
          <DialogDescription>
            {label ? `Tracking rider for: ${label}` : `Order #${orderId.slice(-8)}`}
            {tracking?.updatedAt && (
              <span className="ml-2 text-xs text-stone-400">
                · Last updated {new Date(tracking.updatedAt).toLocaleTimeString()}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Coordinate strip */}
        {riderPos && (
          <div className="px-6 pb-3 flex gap-6 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-500" />
              Rider: {riderPos.lat.toFixed(6)}, {riderPos.lng.toFixed(6)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              Shop: {SHOP_LOCATION.lat.toFixed(6)}, {SHOP_LOCATION.lng.toFixed(6)}
            </span>
          </div>
        )}

        {/* Map area */}
        <div className="relative">
          {/* Loading states */}
          {(!isLoaded || (!tracking && !firestoreError)) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-stone-100 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm text-stone-500">
                {!isLoaded ? "Loading map…" : "Fetching rider location…"}
              </p>
            </div>
          )}

          {firestoreError && (
            <div className="flex flex-col items-center justify-center bg-stone-100 gap-2 h-[420px]">
              <Navigation className="w-8 h-8 text-stone-300" />
              <p className="text-sm text-stone-500">No tracking data available for this order.</p>
            </div>
          )}

          {loadError && (
            <div className="flex flex-col items-center justify-center bg-stone-100 gap-2 h-[420px]">
              <p className="text-sm text-red-500">Failed to load Google Maps.</p>
            </div>
          )}

          {isLoaded && riderPos && (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={riderPos}
              zoom={14}
              onLoad={(map) => { mapRef.current = map; }}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
                zoomControl: true,
              }}
            >
              {/* Rider marker */}
              <Marker
                position={riderPos}
                title="Rider"
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
              />

              {/* Shop marker */}
              <Marker
                position={SHOP_LOCATION}
                title="Our Shop"
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
              />
            </GoogleMap>
          )}
        </div>

        {/* Legend */}
        {isLoaded && riderPos && (
          <div className="px-6 py-3 flex gap-6 text-xs text-stone-500 border-t border-stone-100">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              Rider
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              Shop
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
