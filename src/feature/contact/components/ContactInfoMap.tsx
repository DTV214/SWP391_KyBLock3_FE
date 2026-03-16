import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Loader2, MapPin, Phone, Store } from "lucide-react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  storeLocationService,
  type StoreLocation,
} from "@/feature/contact/services/storeLocationService";

const HCMC_CENTER: [number, number] = [10.7769, 106.7009];
const DEFAULT_ZOOM = 11;
const FOCUSED_ZOOM = 15;

const activeStoreIcon = new L.DivIcon({
  html: `
    <div style="position:relative;width:42px;height:52px;">
      <div style="position:absolute;left:50%;top:2px;transform:translateX(-50%);width:36px;height:36px;border-radius:14px 14px 14px 4px;background:linear-gradient(180deg,#8d1f14 0%,#6f140c 100%);border:3px solid #fff7ee;box-shadow:0 12px 28px rgba(111,20,12,.28);display:flex;align-items:center;justify-content:center;">
        <div style="position:relative;width:18px;height:14px;">
          <div style="position:absolute;left:1px;right:1px;top:0;height:4px;background:#f6d6b8;border-radius:4px 4px 2px 2px;"></div>
          <div style="position:absolute;left:0;right:0;top:3px;height:3px;background:repeating-linear-gradient(90deg,#fff7ee 0 4px,#d77a45 4px 8px);border-radius:2px;"></div>
          <div style="position:absolute;left:1px;right:1px;bottom:0;height:9px;background:#fff7ee;border-radius:0 0 4px 4px;"></div>
          <div style="position:absolute;left:7px;bottom:0;width:4px;height:6px;background:#d77a45;border-radius:2px 2px 0 0;"></div>
        </div>
      </div>
      <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:14px solid #6f140c;"></div>
    </div>
  `,
  className: "",
  iconSize: [42, 52],
  iconAnchor: [21, 52],
});

function MapViewportController({
  selectedStore,
}: {
  selectedStore: StoreLocation | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedStore) {
      map.flyTo(
        [selectedStore.latitude, selectedStore.longitude],
        FOCUSED_ZOOM,
        { duration: 0.8 },
      );
      return;
    }

    map.setView(HCMC_CENTER, DEFAULT_ZOOM);
  }, [map, selectedStore]);

  return null;
}

export default function ContactInfoMap() {
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await storeLocationService.getActiveStoreLocations();
        setLocations(data);

        const defaultStore =
          data.find((item) => item.name.toLowerCase().includes("hcm")) ??
          data[0] ??
          null;

        setSelectedStore(defaultStore);

        if (defaultStore) {
          try {
            const detail = await storeLocationService.getStoreLocationById(
              defaultStore.storeLocationId,
            );
            setSelectedStore(detail);
          } catch {
            // Keep list item if detail request fails.
          }
        }
      } catch (err) {
        console.error(err);
        setError("Khong the tai vi tri cua hang luc nay.");
      } finally {
        setLoading(false);
      }
    };

    void loadLocations();
  }, []);

  const handleSelectStore = async (location: StoreLocation) => {
    setSelectedStore(location);
    setDetailLoading(true);
    try {
      const detail = await storeLocationService.getStoreLocationById(
        location.storeLocationId,
      );
      setSelectedStore(detail);
    } catch {
      setSelectedStore(location);
    } finally {
      setDetailLoading(false);
    }
  };

  const contactHighlights = useMemo(() => {
    if (!selectedStore) {
      return [];
    }

    return [
      {
        icon: <Store className="text-tet-accent" />,
        title: "Cua hang dang hien thi",
        content: selectedStore.name,
      },
      {
        icon: <MapPin className="text-tet-accent" />,
        title: "Dia chi",
        content: selectedStore.addressLine,
      },
      {
        icon: <Phone className="text-tet-accent" />,
        title: "Hotline",
        content: selectedStore.phoneNumber,
      },
    ];
  }, [selectedStore]);

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-16 lg:flex-row">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="contact-store-map relative z-0 h-[450px] w-full overflow-hidden rounded-[2.5rem] border-8 border-[#FBF5E8] shadow-2xl md:h-[600px] lg:w-1/2"
          >
            {loading ? (
              <div className="flex h-full items-center justify-center bg-[#fffaf5] text-[#7a160e]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm font-medium">
                    Dang tai vi tri cua hang...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center bg-[#fffaf5] p-8 text-center text-sm text-red-600">
                {error}
              </div>
            ) : (
              <MapContainer
                center={HCMC_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapViewportController selectedStore={selectedStore} />

                {locations.map((location) => (
                  <Marker
                    key={location.storeLocationId}
                    position={[location.latitude, location.longitude]}
                    icon={activeStoreIcon}
                    eventHandlers={{
                      click: () => {
                        void handleSelectStore(location);
                      },
                    }}
                  >
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-semibold text-[#7a160e]">
                          {location.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {location.addressLine}
                        </p>
                        <p className="text-xs text-gray-500">
                          {location.openHoursText}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </motion.div>

          <div className="w-full space-y-10 lg:w-1/2">
            <div className="grid gap-8">
              {contactHighlights.map((detail, index) => (
                <motion.div
                  key={detail.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-5 rounded-3xl border border-tet-secondary/20 bg-[#FBF5E8]/30 p-6 transition-shadow hover:shadow-md"
                >
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    {detail.icon}
                  </div>
                  <div>
                    <h4 className="mb-1 text-xl font-bold text-tet-primary">
                      {detail.title}
                    </h4>
                    <p className="text-sm italic leading-relaxed text-gray-600 md:text-base">
                      {detail.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[2.5rem] bg-tet-primary p-8 text-white shadow-xl md:p-10"
            >
              <div className="absolute right-0 top-0 p-4 opacity-5">
                <Clock size={100} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <h4 className="flex items-center gap-3 text-2xl font-bold text-tet-secondary">
                  <Clock size={24} /> Gio mo cua
                </h4>
                {detailLoading && (
                  <span className="text-xs text-white/70">Dang cap nhat...</span>
                )}
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
                {selectedStore ? (
                  <div className="space-y-3 text-sm md:text-base">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="opacity-80">Chi nhanh</span>
                      <span className="font-bold text-right">
                        {selectedStore.name}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="opacity-80">Mo cua</span>
                      <span className="font-bold italic">
                        {selectedStore.openHoursText}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">Dien thoai</span>
                      <span className="font-bold text-tet-secondary">
                        {selectedStore.phoneNumber}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/80">
                    Chon mot cua hang tren ban do de xem thong tin.
                  </p>
                )}
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  Danh sach cua hang dang hoat dong
                </p>
                <div className="space-y-3">
                  {locations.map((location) => {
                    const isActive =
                      selectedStore?.storeLocationId === location.storeLocationId;

                    return (
                      <button
                        key={location.storeLocationId}
                        type="button"
                        onClick={() => void handleSelectStore(location)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                          isActive
                            ? "border-[#f4d2af] bg-[#fff3e5] text-[#7a160e] shadow-sm"
                            : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{location.name}</p>
                            <p
                              className={`mt-1 text-xs ${
                                isActive ? "text-[#8b5e49]" : "text-white/65"
                              }`}
                            >
                              {location.addressLine}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                              isActive
                                ? "bg-[#7a160e] text-white"
                                : "bg-white/10 text-white/70"
                            }`}
                          >
                            {isActive ? "Dang xem" : "Mo map"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
