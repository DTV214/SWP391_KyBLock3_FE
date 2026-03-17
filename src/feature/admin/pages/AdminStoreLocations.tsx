import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Loader2,
  MapPin,
  Plus,
  Search,
  Store,
  Trash2,
  X,
} from "lucide-react";
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
  type StoreLocationUpsertPayload,
} from "@/feature/contact/services/storeLocationService";
import {
  geocodingService,
  type AddressSuggestion,
} from "@/feature/contact/services/geocodingService";

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009];
const DEFAULT_ZOOM = 13;
const PICKER_ZOOM = 16;

const storeMarkerIcon = new L.DivIcon({
  html: `<div style="width:12px;height:12px;border-radius:9999px;background:#fff;border:3px solid #7a160e;box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div>`,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const selectedMarkerIcon = new L.DivIcon({
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#f4d2af;border:4px solid #7a160e;box-shadow:0 4px 10px rgba(0,0,0,0.3)"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface StoreLocationFormState {
  name: string;
  addressLine: string;
  mapSearchAddress: string;
  latitude: string;
  longitude: string;
  phoneNumber: string;
  openHoursText: string;
  isActive: boolean;
}

const createEmptyFormState = (): StoreLocationFormState => ({
  name: "",
  addressLine: "",
  mapSearchAddress: "",
  latitude: "",
  longitude: "",
  phoneNumber: "",
  openHoursText: "",
  isActive: true,
});

const parseCoordinate = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function MapViewportUpdater({
  position,
  zoom,
}: {
  position: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, zoom);
  }, [map, position, zoom]);

  return null;
}

function MapClickPicker({
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

export default function AdminStoreLocations() {
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreLocation | null>(null);
  const [formData, setFormData] = useState<StoreLocationFormState>(
    createEmptyFormState(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);

  const selectedLatitude = parseCoordinate(formData.latitude);
  const selectedLongitude = parseCoordinate(formData.longitude);
  const selectedPosition: [number, number] =
    selectedLatitude !== null && selectedLongitude !== null
      ? [selectedLatitude, selectedLongitude]
      : DEFAULT_CENTER;

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storeLocationService.getAllStoreLocations();
      setStores(data);
    } catch (err: unknown) {
      console.error("Error fetching store locations:", err);
      setError("Không thể tải danh sách cửa hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStores();
  }, []);

  useEffect(() => {
    if (!showModal || !isAddressFocused) return;

    const query = formData.mapSearchAddress.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchingAddress(true);
      const suggestions = await geocodingService.searchAddress(query);
      if (!cancelled) {
        setAddressSuggestions(suggestions);
      }
      setSearchingAddress(false);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.mapSearchAddress, showModal, isAddressFocused]);

  const filteredStores = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return stores.filter((store) => {
      const matchKeyword =
        normalizedKeyword.length === 0 ||
        store.name.toLowerCase().includes(normalizedKeyword) ||
        store.addressLine.toLowerCase().includes(normalizedKeyword) ||
        (store.phoneNumber || "").toLowerCase().includes(normalizedKeyword);

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && store.isActive) ||
        (statusFilter === "INACTIVE" && !store.isActive);

      return matchKeyword && matchStatus;
    });
  }, [stores, keyword, statusFilter]);

  const resetForm = () => {
    setFormData(createEmptyFormState());
    setFormError(null);
    setAddressSuggestions([]);
    setSearchingAddress(false);
    setIsAddressFocused(false);
    setReverseLoading(false);
  };

  const openCreateModal = () => {
    setEditingStore(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (store: StoreLocation) => {
    setEditingStore(store);
    setFormError(null);
    setAddressSuggestions([]);
    setSearchingAddress(false);
    setIsAddressFocused(false);
    setReverseLoading(false);
    setFormData({
      name: store.name,
      addressLine: store.addressLine,
      mapSearchAddress: store.addressLine,
      latitude: String(store.latitude),
      longitude: String(store.longitude),
      phoneNumber: store.phoneNumber || "",
      openHoursText: store.openHoursText || "",
      isActive: store.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStore(null);
    resetForm();
  };

  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      mapSearchAddress: suggestion.displayName,
      latitude: suggestion.latitude.toFixed(6),
      longitude: suggestion.longitude.toFixed(6),
    }));
    setAddressSuggestions([]);
    setIsAddressFocused(false);
  };

  const handlePickLocationFromMap = async (
    latitude: number,
    longitude: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
    setAddressSuggestions([]);
    setIsAddressFocused(false);

    setReverseLoading(true);
    const resolvedAddress = await geocodingService.reverseGeocode(
      latitude,
      longitude,
    );
    if (resolvedAddress) {
      setFormData((prev) => ({
        ...prev,
        mapSearchAddress: resolvedAddress,
      }));
    }
    setReverseLoading(false);
  };

  const validateForm = (): { ok: true } | { ok: false; message: string } => {
    if (!formData.name.trim()) {
      return { ok: false, message: "Vui lòng nhập tên cửa hàng." };
    }
    if (!formData.addressLine.trim()) {
      return { ok: false, message: "Vui lòng nhập địa chỉ." };
    }

    const latitude = parseCoordinate(formData.latitude);
    const longitude = parseCoordinate(formData.longitude);
    if (latitude === null || longitude === null) {
      return {
        ok: false,
        message: "Vui lòng nhập tọa độ hợp lệ (latitude/longitude).",
      };
    }
    if (latitude < -90 || latitude > 90) {
      return { ok: false, message: "Latitude phải nằm trong khoảng [-90, 90]." };
    }
    if (longitude < -180 || longitude > 180) {
      return {
        ok: false,
        message: "Longitude phải nằm trong khoảng [-180, 180].",
      };
    }

    return { ok: true };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validation = validateForm();
    if (!validation.ok) {
      setFormError(validation.message);
      return;
    }

    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);
    const payload: StoreLocationUpsertPayload = {
      name: formData.name.trim(),
      addressLine: formData.addressLine.trim(),
      latitude,
      longitude,
      phoneNumber: formData.phoneNumber.trim(),
      openHoursText: formData.openHoursText.trim(),
      isActive: formData.isActive,
    };

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingStore) {
        await storeLocationService.updateStoreLocation(
          editingStore.storeLocationId,
          payload,
        );
      } else {
        await storeLocationService.createStoreLocation(payload);
      }

      closeModal();
      await fetchStores();
    } catch (err: unknown) {
      console.error("Error saving store location:", err);
      setFormError("Không thể lưu cửa hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (store: StoreLocation) => {
    if (!window.confirm(`Bạn có chắc muốn xóa cửa hàng "${store.name}"?`)) {
      return;
    }

    try {
      await storeLocationService.deleteStoreLocation(store.storeLocationId);
      await fetchStores();
    } catch (err: unknown) {
      console.error("Error deleting store location:", err);
      setError("Không thể xóa cửa hàng.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-tet-primary">
              Quản lý cửa hàng
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Admin có thể thêm, cập nhật, xóa chi nhánh và quản lý vị trí bản
              đồ.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-full bg-tet-primary px-6 py-3 font-bold text-white shadow-md transition-all hover:bg-tet-accent"
          >
            <Plus size={18} />
            Thêm cửa hàng
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên, địa chỉ, số điện thoại..."
              className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm outline-none transition-all focus:border-tet-accent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none transition-all focus:border-tet-accent"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đang ẩn</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-gray-100 bg-white py-16">
          <Loader2 className="h-8 w-8 animate-spin text-tet-primary" />
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white py-16 text-center">
          <Store size={40} className="mx-auto text-gray-300" />
          <p className="mt-3 text-gray-500">Không có cửa hàng phù hợp.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {[
                    "Cửa hàng",
                    "Địa chỉ",
                    "Liên hệ",
                    "Tọa độ",
                    "Trạng thái",
                    "Thao tác",
                  ].map((header) => (
                    <th
                      key={header}
                      className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 ${
                        header === "Thao tác" ? "text-right" : "text-left"
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStores.map((store) => (
                  <tr key={store.storeLocationId} className="hover:bg-gray-50/80">
                    <td className="px-5 py-4">
                      <p className="font-bold text-tet-primary">{store.name}</p>
                      <p className="text-xs text-gray-400">
                        ID: {store.storeLocationId}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {store.addressLine}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      <p>{store.phoneNumber || "-"}</p>
                      <p className="text-xs text-gray-500">
                        {store.openHoursText || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      <p>Lat: {store.latitude.toFixed(6)}</p>
                      <p>Lng: {store.longitude.toFixed(6)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          store.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {store.isActive ? "Đang hoạt động" : "Đang ẩn"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(store)}
                          className="rounded-lg p-2 text-yellow-600 transition-colors hover:bg-yellow-50"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => void handleDelete(store)}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-xl font-serif font-bold text-tet-primary">
                {editingStore ? "Cập nhật cửa hàng" : "Thêm cửa hàng mới"}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
                <div className="space-y-4 p-6">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Tên cửa hàng <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={formData.name}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="Ví dụ: TetGift - HCM (Quận 1)"
                      className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition-all focus:border-tet-accent"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Địa chỉ gốc <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={formData.addressLine}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          addressLine: event.target.value,
                        }))
                      }
                      placeholder="Nhập địa chỉ chính xác bạn muốn lưu"
                      className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition-all focus:border-tet-accent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Địa chỉ này sẽ được lưu và hiển thị cho khách hàng.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Địa chỉ để tìm map
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!formData.addressLine.trim()) return;
                          setFormData((prev) => ({
                            ...prev,
                            mapSearchAddress: prev.addressLine,
                          }));
                          setIsAddressFocused(true);
                        }}
                        className="text-xs font-semibold text-tet-primary hover:underline"
                      >
                        Dùng địa chỉ gốc
                      </button>
                    </div>
                    <div className="relative">
                      <MapPin
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        value={formData.mapSearchAddress}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            mapSearchAddress: event.target.value,
                          }))
                        }
                        onFocus={() => setIsAddressFocused(true)}
                        onBlur={() => {
                          setTimeout(() => setIsAddressFocused(false), 120);
                        }}
                        placeholder="Nhập địa chỉ gần đúng để lấy gợi ý map"
                        className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm outline-none transition-all focus:border-tet-accent"
                      />
                    </div>

                    {isAddressFocused &&
                      (searchingAddress || addressSuggestions.length > 0) && (
                        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                          {searchingAddress ? (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500">
                              <Loader2 size={14} className="animate-spin" />
                              Đang tìm địa chỉ...
                            </div>
                          ) : (
                            addressSuggestions.map((suggestion, index) => (
                              <button
                                key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  handleSelectAddressSuggestion(suggestion);
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

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        Latitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={formData.latitude}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            latitude: event.target.value,
                          }))
                        }
                        placeholder="10.773124"
                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition-all focus:border-tet-accent"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        Longitude <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={formData.longitude}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            longitude: event.target.value,
                          }))
                        }
                        placeholder="106.700930"
                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition-all focus:border-tet-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        Số điện thoại
                      </label>
                      <input
                        value={formData.phoneNumber}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            phoneNumber: event.target.value,
                          }))
                        }
                        placeholder="02812345678"
                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition-all focus:border-tet-accent"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">
                        Giờ mở cửa
                      </label>
                      <input
                        value={formData.openHoursText}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            openHoursText: event.target.value,
                          }))
                        }
                        placeholder="08:00 - 21:00"
                        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition-all focus:border-tet-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Trạng thái
                    </label>
                    <select
                      value={formData.isActive ? "ACTIVE" : "INACTIVE"}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: event.target.value === "ACTIVE",
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition-all focus:border-tet-accent"
                    >
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="INACTIVE">Đang ẩn</option>
                    </select>
                  </div>

                  {formError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {formError}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 p-6 lg:border-l lg:border-t-0">
                  <p className="mb-3 text-sm font-bold text-tet-primary">
                    Chọn vị trí trên bản đồ
                  </p>
                  <p className="mb-4 text-xs text-gray-500">
                    Nhấn vào bản đồ để tự điền latitude/longitude và lấy địa chỉ
                    gần đúng cho ô tìm map.
                  </p>
                  <div className="contact-store-map h-[360px] overflow-hidden rounded-2xl border border-gray-200">
                    <MapContainer
                      center={selectedPosition}
                      zoom={selectedLatitude !== null ? PICKER_ZOOM : DEFAULT_ZOOM}
                      scrollWheelZoom
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <MapViewportUpdater
                        position={selectedPosition}
                        zoom={
                          selectedLatitude !== null ? PICKER_ZOOM : DEFAULT_ZOOM
                        }
                      />
                      <MapClickPicker onPick={handlePickLocationFromMap} />

                      {stores.map((store) => (
                        <Marker
                          key={store.storeLocationId}
                          position={[store.latitude, store.longitude]}
                          icon={storeMarkerIcon}
                        >
                          <Popup>
                            <p className="font-semibold text-[#7a160e]">
                              {store.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {store.addressLine}
                            </p>
                          </Popup>
                        </Marker>
                      ))}

                      {selectedLatitude !== null && selectedLongitude !== null && (
                        <Marker
                          position={[selectedLatitude, selectedLongitude]}
                          icon={selectedMarkerIcon}
                        >
                          <Popup>Vị trí đang chỉnh sửa</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>

                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                    {reverseLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={13} className="animate-spin" />
                        Đang lấy địa chỉ gần đúng từ vị trí map...
                      </span>
                    ) : (
                      "Mẹo: giữ nguyên Địa chỉ gốc nếu map không tìm chính xác, rồi chỉnh lat/lng bằng cách click điểm gần nhất."
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-gray-200 px-6 py-2.5 font-bold text-gray-700 transition-all hover:bg-gray-50"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-tet-primary px-6 py-2.5 font-bold text-white shadow-md transition-all hover:bg-tet-accent disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {editingStore ? "Cập nhật cửa hàng" : "Tạo cửa hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
