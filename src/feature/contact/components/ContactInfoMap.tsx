import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Loader2, MapPin, Navigation, X } from "lucide-react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  storeLocationService,
  type StoreLocation,
  type TravelMode,
} from "@/feature/contact/services/storeLocationService";
import {
  geocodingService,
  type AddressSuggestion,
} from "@/feature/contact/services/geocodingService";

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

const originPinIcon = new L.DivIcon({
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#ffffff;border:4px solid #1d4ed8;box-shadow:0 4px 10px rgba(0,0,0,0.25)"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapViewportController({
  selectedStore,
}: {
  selectedStore: StoreLocation | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedStore) {
      map.flyTo([selectedStore.latitude, selectedStore.longitude], FOCUSED_ZOOM, {
        duration: 0.8,
      });
      return;
    }

    map.setView(HCMC_CENTER, DEFAULT_ZOOM);
  }, [map, selectedStore]);

  return null;
}

function DirectionsMapViewportController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

function DirectionsMapClickPicker({
  onPick,
}: {
  onPick: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click: (event) => {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

type OriginPoint = {
  latitude: number;
  longitude: number;
};

export default function ContactInfoMap() {
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [originSearch, setOriginSearch] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<AddressSuggestion[]>(
    [],
  );
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [isOriginSearchFocused, setIsOriginSearchFocused] = useState(false);
  const [originPoint, setOriginPoint] = useState<OriginPoint | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);

  const modalMapCenter: [number, number] = useMemo(() => {
    if (originPoint) {
      return [originPoint.latitude, originPoint.longitude];
    }
    if (selectedStore) {
      return [selectedStore.latitude, selectedStore.longitude];
    }
    return HCMC_CENTER;
  }, [originPoint, selectedStore]);

  const modalMapZoom = originPoint ? 16 : selectedStore ? 14 : DEFAULT_ZOOM;

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

  useEffect(() => {
    if (!showDirectionsModal || !isOriginSearchFocused) return;

    const query = originSearch.trim();
    if (query.length < 3) {
      setOriginSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchingOrigin(true);
      const suggestions = await geocodingService.searchAddress(query);
      if (!cancelled) {
        setOriginSuggestions(suggestions);
      }
      setSearchingOrigin(false);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [originSearch, showDirectionsModal, isOriginSearchFocused]);

  const handleSelectStore = async (location: StoreLocation) => {
    setSelectedStore(location);
    setDirectionsError(null);
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

  const openDirectionsModal = () => {
    setDirectionsError(null);
    setShowDirectionsModal(true);
    setOriginSearch("");
    setOriginSuggestions([]);
    setIsOriginSearchFocused(false);
    setOriginPoint(null);
    setReverseLoading(false);
  };

  const closeDirectionsModal = () => {
    setShowDirectionsModal(false);
    setOriginSuggestions([]);
    setIsOriginSearchFocused(false);
    setReverseLoading(false);
  };

  const handleSelectOriginSuggestion = (suggestion: AddressSuggestion) => {
    setOriginSearch(suggestion.displayName);
    setOriginPoint({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    setOriginSuggestions([]);
    setIsOriginSearchFocused(false);
  };

  const handlePickOriginOnMap = async (latitude: number, longitude: number) => {
    setOriginPoint({ latitude, longitude });
    setDirectionsError(null);
    setOriginSuggestions([]);
    setIsOriginSearchFocused(false);

    setReverseLoading(true);
    const resolvedAddress = await geocodingService.reverseGeocode(latitude, longitude);
    if (resolvedAddress) {
      setOriginSearch(resolvedAddress);
    }
    setReverseLoading(false);
  };

  const handleFindDirections = async () => {
    if (!selectedStore) {
      setDirectionsError("Vui long chon cua hang.");
      return;
    }

    if (!originPoint) {
      setDirectionsError("Vui long chon vi tri cua ban tren map hoac tu goi y.");
      return;
    }

    const routeWindow = window.open("", "_blank", "noopener,noreferrer");
    const openInCurrentTab = !routeWindow;

    try {
      setDirectionsLoading(true);
      setDirectionsError(null);

      const result = await storeLocationService.getDirectionsToStore(
        selectedStore.storeLocationId,
        {
          fromLat: originPoint.latitude,
          fromLng: originPoint.longitude,
          travelMode,
        },
      );

      if (!result.url) {
        setDirectionsError("Khong nhan duoc link chi duong tu he thong.");
        routeWindow?.close();
        return;
      }

      if (openInCurrentTab) {
        window.location.href = result.url;
      } else {
        routeWindow.location.href = result.url;
      }
      closeDirectionsModal();
    } catch (err) {
      console.error(err);
      setDirectionsError("Khong the tim duong luc nay. Vui long thu lai.");
      routeWindow?.close();
    } finally {
      setDirectionsLoading(false);
    }
  };

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
                  <p className="text-sm font-medium">Dang tai vi tri cua hang...</p>
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
                        <p className="font-semibold text-[#7a160e]">{location.name}</p>
                        <p className="text-xs text-gray-600">{location.addressLine}</p>
                        <p className="text-xs text-gray-500">{location.openHoursText}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </motion.div>

          <div className="w-full lg:w-1/2">
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
                  <Clock size={24} /> Giờ mở cửa
                </h4>
                {detailLoading && (
                  <span className="text-xs text-white/70">Dang cap nhat...</span>
                )}
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
                {selectedStore ? (
                  <div className="space-y-3 text-sm md:text-base">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="opacity-80">Chi nhánh</span>
                      <span className="font-bold text-right">{selectedStore.name}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-2">
                      <span className="opacity-80">Địa chỉ</span>
                      <span className="max-w-[70%] text-right font-bold">
                        {selectedStore.addressLine}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="opacity-80">Mở cửa</span>
                      <span className="font-bold italic">{selectedStore.openHoursText}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-80">Điện thoại</span>
                      <span className="font-bold text-tet-secondary">
                        {selectedStore.phoneNumber}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/80">
                    Chọn một cửa hàng trên màn hình để xem thông tin
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={openDirectionsModal}
                  disabled={!selectedStore}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#f4d2af] px-4 text-sm font-bold text-[#7a160e] transition-all hover:bg-[#f0c496] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Navigation size={15} /> Tìm đường
                </button>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  Danh sách cửa hàng
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
                            {isActive ? "Đang xem" : "Mở bản đồ"}
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

      {showDirectionsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeDirectionsModal}
          />

          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-tet-primary">Tìm đường</h3>
                <p className="text-sm text-gray-500">
                  Đến: {selectedStore?.name || "Chưa chọn cửa hàng"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDirectionsModal}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
              <div className="space-y-4 border-b border-gray-100 p-6 lg:border-b-0 lg:border-r">
                <div className="relative">
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Vị trí của bạn
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      value={originSearch}
                      onChange={(event) => setOriginSearch(event.target.value)}
                      onFocus={() => setIsOriginSearchFocused(true)}
                      onBlur={() => {
                        setTimeout(() => setIsOriginSearchFocused(false), 120);
                      }}
                      placeholder="Nhập địa chỉ của bạn..."
                      className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm outline-none transition-all focus:border-tet-accent"
                    />
                  </div>

                  {isOriginSearchFocused &&
                    (searchingOrigin || originSuggestions.length > 0) && (
                      <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                        {searchingOrigin ? (
                          <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500">
                            <Loader2 size={14} className="animate-spin" />
                            Đang tìm địa chỉ...
                          </div>
                        ) : (
                          originSuggestions.map((suggestion, index) => (
                            <button
                              key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleSelectOriginSuggestion(suggestion);
                              }}
                              className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm text-gray-700 transition-colors last:border-b-0 hover:bg-[#fff7ee]"
                            >
                              {suggestion.displayName}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Phương tiện
                  </label>
                  <select
                    value={travelMode}
                    onChange={(event) => setTravelMode(event.target.value as TravelMode)}
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition-all focus:border-tet-accent"
                  >
                    <option value="driving">Lái xe</option>
                    <option value="walking">Đi bộ</option>
                    <option value="bicycling">Xe đạp</option>
                    <option value="transit">Phương tiện công cộng</option>
                  </select>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  {originPoint ? (
                    <>
                      <p>
                        Origin: {originPoint.latitude.toFixed(6)}, {" "}
                        {originPoint.longitude.toFixed(6)}
                      </p>
                      <p className="mt-1">
                        Ban co the click truc tiep len map neu goi y khong dung dia chi.
                      </p>
                    </>
                  ) : (
                    <p>
                      Chọn ví trí xuất phát của bạn.
                    </p>
                  )}

                  {reverseLoading && (
                    <p className="mt-2 inline-flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin" />
                      Dang cap nhat dia chi tu vi tri map...
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="contact-store-map h-[380px] overflow-hidden rounded-2xl border border-gray-200">
                  <MapContainer
                    center={modalMapCenter}
                    zoom={modalMapZoom}
                    scrollWheelZoom
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <DirectionsMapViewportController
                      center={modalMapCenter}
                      zoom={modalMapZoom}
                    />
                    <DirectionsMapClickPicker onPick={handlePickOriginOnMap} />

                    {selectedStore && (
                      <Marker
                        position={[selectedStore.latitude, selectedStore.longitude]}
                        icon={activeStoreIcon}
                      >
                        <Popup>{selectedStore.name}</Popup>
                      </Marker>
                    )}

                    {originPoint && (
                      <Marker
                        position={[originPoint.latitude, originPoint.longitude]}
                        icon={originPinIcon}
                      >
                        <Popup>Vi tri cua ban</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              {directionsError && (
                <p className="mr-auto text-sm font-medium text-red-600">
                  {directionsError}
                </p>
              )}
              <button
                type="button"
                onClick={closeDirectionsModal}
                className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50"
                disabled={directionsLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleFindDirections()}
                disabled={directionsLoading || !selectedStore || !originPoint}
                className="inline-flex items-center gap-2 rounded-full bg-tet-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-tet-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {directionsLoading && <Loader2 size={14} className="animate-spin" />}
                {directionsLoading ? "Đang xử lý..." : "Mở Google Maps"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
