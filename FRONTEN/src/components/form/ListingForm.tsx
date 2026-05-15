import { useState, useRef } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Home,
  MapPin,
  DollarSign,
  Users,
  Layers,
  Wifi,
  Tv,
  Car,
  Utensils,
  Wind,
  Waves,
  Dumbbell,
  Flame,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
} from "lucide-react";
import { api, apiFormData } from "../../lib/api";
import { getImageUrl } from "../../lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Listing } from "../../types";
import axios from "axios";
import { toast } from "sonner";

type ListingType = "apartment" | "house" | "villa" | "cabin";

const AMENITIES = [
  { key: "wifi", label: "WiFi", icon: Wifi },
  { key: "tv", label: "TV", icon: Tv },
  { key: "parking", label: "Parking", icon: Car },
  { key: "kitchen", label: "Kitchen", icon: Utensils },
  { key: "ac", label: "Air Conditioning", icon: Wind },
  { key: "pool", label: "Pool", icon: Waves },
  { key: "gym", label: "Gym", icon: Dumbbell },
  { key: "fireplace", label: "Fireplace", icon: Flame },
];

const LISTING_TYPES: { value: ListingType; label: string; desc: string }[] = [
  { value: "apartment", label: "Apartment", desc: "Urban flat or unit" },
  { value: "house", label: "House", desc: "Standalone home" },
  { value: "villa", label: "Villa", desc: "Luxury property" },
  { value: "cabin", label: "Cabin", desc: "Nature retreat" },
];

const STEPS = ["Basics", "Details", "Amenities", "Photos", "Review"];

interface FormData {
  title: string;
  description: string;
  location: string;
  pricePerNight: string;
  guests: string;
  type: ListingType | "";
  amenities: string[];
  photos: (File | string)[];
}

interface ListingFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  listing?: Listing | null;
}

const getInitialForm = (listing?: Listing | null): FormData => ({
  title: listing?.title || "",
  description: listing?.description || "",
  location: listing?.location || "",
  pricePerNight: listing?.pricePerNight?.toString() || "",
  guests: listing?.guests?.toString() || "",
  type: (listing?.type as ListingType) || "",
  amenities: listing?.amenities || [],
  photos: listing?.photos || [],
});

const getMutationMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
};

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#111] dark:text-white">
        {icon && <span className="text-[#717171]">{icon}</span>}
        {label}
      </label>
      <div className="relative">{children}</div>
      {error && (
        <span className="flex items-center gap-1 text-[11px] text-[#FF385C]">
          <AlertCircle size={11} />
          {error}
        </span>
      )}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
  truncate,
}: {
  label: string;
  value: string | number;
  onEdit: () => void;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-2.5 border-b border-[#EBEBEB] dark:border-[#2A2A2A] last:border-b-0">
      <span className="min-w-22.5 text-[11px] font-semibold text-[#717171] pt-px">
        {label}
      </span>
      <span
        className={`flex-1 text-[13px] text-[#111] dark:text-white break-words${truncate ? " line-clamp-2" : ""}`}
      >
        {value}
      </span>
      <button
        onClick={onEdit}
        className="text-[11px] text-[#717171] underline cursor-pointer whitespace-nowrap pt-0.5 hover:text-[#111] dark:hover:text-white transition-colors bg-transparent border-none"
      >
        Edit
      </button>
    </div>
  );
}

export default function ListingForm({
  onClose,
  onSuccess,
  listing,
}: ListingFormProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(() => getInitialForm(listing));
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const isEditing = !!listing;

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("description", formData.description.trim());
      data.append("location", formData.location.trim());
      data.append("pricePerNight", formData.pricePerNight);
      data.append("guests", formData.guests);
      data.append("type", formData.type);
      data.append("amenities", JSON.stringify(formData.amenities));

      const newPhotos = formData.photos.filter((p) => p instanceof File);
      newPhotos.forEach((photo) => {
        data.append("photos", photo);
      });

      if (isEditing) {
        const existingPhotos = formData.photos.filter(
          (p) => typeof p === "string",
        );
        data.append("existingPhotos", JSON.stringify(existingPhotos));
        const response = await apiFormData.put(`/listings/${listing.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
      } else {
        data.append("rating", "0");
        const response = await apiFormData.post("/listings", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
      }
    },
    onSuccess: () => {
      toast.success(`Listing ${isEditing ? "updated" : "published"} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", "me"] });
      onSuccess?.();
      onClose();
    },
    onError: (error: unknown) => {
      const message = getMutationMessage(
        error,
        `Failed to ${isEditing ? "update" : "create"} listing`
      );
      toast.error(message);
    },
  });

  const update = (key: keyof FormData, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const toggleAmenity = (key: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter((a) => a !== key)
        : [...f.amenities, key],
    }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newPhotos = [...form.photos, ...valid].slice(0, 10);
    update("photos", newPhotos);
  };

  const removePhoto = (i: number) => {
    update(
      "photos",
      form.photos.filter((_, idx) => idx !== i),
    );
  };

  const validateStep = () => {
    const e: typeof errors = {};
    if (step === 0) {
      if (!form.title.trim()) e.title = "Title is required";
      if (form.title.length < 5)
        e.title = "Title must be at least 5 characters";
      if (!form.description.trim()) e.description = "Description is required";
      if (form.description.length < 20)
        e.description = "Description must be at least 20 characters";
    }
    if (step === 1) {
      if (!form.location.trim()) e.location = "Location is required";
      if (
        !form.pricePerNight ||
        isNaN(Number(form.pricePerNight)) ||
        Number(form.pricePerNight) <= 0
      )
        e.pricePerNight = "Enter a valid price";
      if (!form.guests || isNaN(Number(form.guests)) || Number(form.guests) < 1)
        e.guests = "At least 1 guest";
      if (!form.type) e.type = "Select a type";
    }
    if (step === 3 && form.photos.length === 0) {
      setErrors((prev) => ({
        ...prev,
        photos: "Please add at least one photo",
      }));
      return false;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 4));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    mutation.mutate(form);
  };

  const inputBase =
    "w-full px-3 py-2.5 bg-[#F7F7F7] dark:bg-[#1a2235] border border-[#EBEBEB] dark:border-[#2A2A2A] rounded-xl text-[13px] text-[#111] dark:text-white placeholder:text-[#AAAAAA] outline-none transition-all focus:border-[#111] dark:focus:border-white focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5";
  const inputErr = "!border-[#FF385C] focus:!border-[#FF385C]";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-140 bg-white dark:bg-[#111828] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBEBEB] dark:border-[#2A2A2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#111] dark:bg-white flex items-center justify-center text-white dark:text-[#111]">
              <Home size={14} />
            </div>
            <span className="text-base font-semibold text-[#111] dark:text-white tracking-tight">
              {isEditing ? "Edit Listing" : "New Listing"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#F7F7F7] dark:bg-[#1a2235] border border-[#EBEBEB] dark:border-[#2A2A2A] flex items-center justify-center text-[#717171] hover:bg-[#EBEBEB] dark:hover:bg-[#2A2A2A] hover:text-[#111] dark:hover:text-white transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center px-5 py-3 border-b border-[#EBEBEB] dark:border-[#2A2A2A] overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center shrink-0">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all
                    ${
                      i <= step
                        ? "bg-[#111] dark:bg-white border-[#111] dark:border-white text-white dark:text-[#111]"
                        : "bg-[#F7F7F7] dark:bg-[#1a2235] border-[#EBEBEB] dark:border-[#2A2A2A] text-[#AAAAAA]"
                    }`}
                >
                  {i < step ? <Check size={10} strokeWidth={3} /> : i + 1}
                </div>
                <span
                  className={`text-[11px] font-medium transition-colors whitespace-nowrap
                    ${i === step ? "text-[#111] dark:text-white" : i < step ? "text-[#717171]" : "text-[#AAAAAA]"}`}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-5 h-px bg-[#EBEBEB] dark:bg-[#2A2A2A] mx-1.5 shrink-0" />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {mutation.isError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {getMutationMessage(
                  mutation.error,
                  `Failed to ${isEditing ? "update" : "create"} listing`,
                )}
              </span>
            </div>
          )}

          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold text-[#111] dark:text-white">
                  Tell us about your place
                </h2>
                <p className="text-[13px] text-[#717171] mt-1">
                  A great title and description help guests find your listing.
                </p>
              </div>
              <Field label="Listing title" error={errors.title}>
                <input
                  className={`${inputBase} ${errors.title ? inputErr : ""}`}
                  placeholder="e.g. Cozy downtown apartment with city views"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  maxLength={80}
                />
                <div className="text-[11px] text-[#AAAAAA] text-right mt-1">
                  {form.title.length}/80
                </div>
              </Field>
              <Field label="Description" error={errors.description}>
                <textarea
                  className={`${inputBase} resize-none min-h-27.5 ${errors.description ? inputErr : ""}`}
                  placeholder="Describe your space, the neighborhood, what makes it special…"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  maxLength={500}
                  rows={5}
                />
                <div className="text-[11px] text-[#AAAAAA] text-right mt-1">
                  {form.description.length}/500
                </div>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold text-[#111] dark:text-white">
                  Location & details
                </h2>
                <p className="text-[13px] text-[#717171] mt-1">
                  Help guests understand where they're staying.
                </p>
              </div>
              <Field
                label="Location"
                icon={<MapPin size={13} />}
                error={errors.location}
              >
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] pointer-events-none">
                  <MapPin size={13} />
                </span>
                <input
                  className={`${inputBase} pl-8 ${errors.location ? inputErr : ""}`}
                  placeholder="City, neighborhood or full address"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Price / night (USD)"
                  icon={<DollarSign size={13} />}
                  error={errors.pricePerNight}
                >
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] pointer-events-none">
                    <DollarSign size={13} />
                  </span>
                  <input
                    className={`${inputBase} pl-8 ${errors.pricePerNight ? inputErr : ""}`}
                    placeholder="0.00"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.pricePerNight}
                    onChange={(e) => update("pricePerNight", e.target.value)}
                  />
                </Field>
                <Field
                  label="Max guests"
                  icon={<Users size={13} />}
                  error={errors.guests}
                >
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] pointer-events-none">
                    <Users size={13} />
                  </span>
                  <input
                    className={`${inputBase} pl-8 ${errors.guests ? inputErr : ""}`}
                    placeholder="1"
                    type="number"
                    min={1}
                    max={50}
                    value={form.guests}
                    onChange={(e) => update("guests", e.target.value)}
                  />
                </Field>
              </div>
              <Field
                label="Property type"
                icon={<Layers size={13} />}
                error={errors.type}
              >
                <div className="grid grid-cols-2 gap-2 mt-0.5">
                  {LISTING_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => update("type", t.value)}
                      className={`px-3.5 py-3 border rounded-xl text-left flex flex-col gap-0.5 transition-all
                        ${
                          form.type === t.value
                            ? "border-[#111] dark:border-white bg-white dark:bg-[#1a2235]"
                            : "border-[#EBEBEB] dark:border-[#2A2A2A] bg-[#F7F7F7] dark:bg-[#1a2235] hover:border-[#AAAAAA] dark:hover:border-[#555]"
                        }`}
                    >
                      <span className="text-[13px] font-semibold text-[#111] dark:text-white">
                        {t.label}
                      </span>
                      <span className="text-[11px] text-[#717171]">
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold text-[#111] dark:text-white">
                  Amenities
                </h2>
                <p className="text-[13px] text-[#717171] mt-1">
                  What does your place offer? Select everything that applies.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {AMENITIES.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAmenity(key)}
                    className={`relative px-2 py-3 border rounded-xl flex flex-col items-center gap-1.5 text-[11px] font-medium transition-all
                      ${
                        form.amenities.includes(key)
                          ? "border-[#111] dark:border-white bg-white dark:bg-[#1a2235] text-[#111] dark:text-white"
                          : "border-[#EBEBEB] dark:border-[#2A2A2A] bg-[#F7F7F7] dark:bg-[#1a2235] text-[#717171] hover:border-[#AAAAAA] dark:hover:border-[#555] hover:text-[#111] dark:hover:text-white"
                      }`}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    <span className="text-center leading-tight">{label}</span>
                    {form.amenities.includes(key) && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#111] dark:bg-white flex items-center justify-center text-white dark:text-[#111]">
                        <Check size={8} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {form.amenities.length > 0 && (
                <p className="text-[12px] text-[#717171]">
                  {form.amenities.length} amenit
                  {form.amenities.length === 1 ? "y" : "ies"} selected
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold text-[#111] dark:text-white">
                  Photos
                </h2>
                <p className="text-[13px] text-[#717171] mt-1">
                  Add up to 10 photos. The first photo will be the cover.
                </p>
              </div>
              <div
                className={`border border-dashed rounded-2xl px-5 py-8 flex flex-col items-center gap-2 cursor-pointer transition-all
                  ${
                    form.photos.length === 0 && errors.photos
                      ? "border-red-400 bg-red-50/50 dark:bg-red-900/10"
                      : "border-[#EBEBEB] dark:border-[#2A2A2A] bg-[#F7F7F7] dark:bg-[#1a2235] hover:border-[#AAAAAA] dark:hover:border-[#555] hover:bg-white dark:hover:bg-[#1a2235]"
                  }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
              >
                <Upload size={22} className="text-[#AAAAAA]" />
                <p className="text-[13px] font-medium text-[#111] dark:text-white">
                  Drop photos here or <span className="underline">browse</span>
                </p>
                <p className="text-[11px] text-[#AAAAAA]">
                  JPG, PNG, WEBP up to 10MB each
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
              {form.photos.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {form.photos.map((file, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden border border-[#EBEBEB] dark:border-[#2A2A2A] group"
                    >
                      <img
                        src={
                          typeof file === "string"
                            ? getImageUrl(file)
                            : URL.createObjectURL(file)
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-[#111] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                      <button
                        className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(i);
                        }}
                      >
                        <X size={9} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  {form.photos.length < 10 && (
                    <button
                      className="aspect-square rounded-xl border border-dashed border-[#EBEBEB] dark:border-[#2A2A2A] bg-[#F7F7F7] dark:bg-[#1a2235] flex flex-col items-center justify-center gap-1 text-[#AAAAAA] hover:border-[#AAAAAA] dark:hover:border-[#555] hover:text-[#717171] transition-all text-[10px] font-medium cursor-pointer"
                      onClick={() => fileRef.current?.click()}
                    >
                      <ImageIcon size={16} />
                      <span>Add more</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold text-[#111] dark:text-white">
                  Review & publish
                </h2>
                <p className="text-[13px] text-[#717171] mt-1">
                  Everything look good? You can always edit after publishing.
                </p>
              </div>
              <div className="border border-[#EBEBEB] dark:border-[#2A2A2A] rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <ReviewRow
                  label="Title"
                  value={form.title || "—"}
                  onEdit={() => setStep(0)}
                />
                <ReviewRow
                  label="Description"
                  value={form.description || "—"}
                  onEdit={() => setStep(0)}
                  truncate
                />
                <ReviewRow
                  label="Location"
                  value={form.location || "—"}
                  onEdit={() => setStep(1)}
                />
                <ReviewRow
                  label="Price / night"
                  value={
                    form.pricePerNight
                      ? `$${Number(form.pricePerNight).toFixed(2)}`
                      : "—"
                  }
                  onEdit={() => setStep(1)}
                />
                <ReviewRow
                  label="Guests"
                  value={form.guests || "—"}
                  onEdit={() => setStep(1)}
                />
                <ReviewRow
                  label="Type"
                  value={form.type || "—"}
                  onEdit={() => setStep(1)}
                />
                <ReviewRow
                  label="Amenities"
                  value={
                    form.amenities.length ? form.amenities.join(", ") : "None"
                  }
                  onEdit={() => setStep(2)}
                  truncate
                />
                <ReviewRow
                  label="Photos"
                  value={
                    form.photos.length
                      ? `${form.photos.length} photo${form.photos.length > 1 ? "s" : ""}`
                      : "None"
                  }
                  onEdit={() => setStep(3)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#EBEBEB] dark:border-[#2A2A2A]">
          <button
            onClick={step === 0 ? onClose : prev}
            disabled={mutation.isPending}
            className="inline-flex items-center gap-1 px-4 py-2 bg-transparent border border-[#EBEBEB] dark:border-[#2A2A2A] rounded-xl text-[13px] font-medium text-[#717171] hover:border-[#AAAAAA] dark:hover:border-[#555] hover:text-[#111] dark:hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 0 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft size={14} /> Back
              </>
            )}
          </button>
          <button
            onClick={step === 4 ? handleSubmit : next}
            disabled={mutation.isPending}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-95 cursor-pointer border
              ${
                step === 4
                  ? "bg-[#008A05] border-[#008A05] text-white hover:opacity-80"
                  : "bg-[#111] dark:bg-white border-[#111] dark:border-white text-white dark:text-[#111] hover:opacity-80"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {step === 4 ? (
              mutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditing ? "Saving..." : "Publishing..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Publish listing"
              )
            ) : (
              <>
                Continue <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
