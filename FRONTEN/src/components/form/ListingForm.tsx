import { useState, useRef } from "react";
import {
  X,
  ChevronRight,
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
import { apiFormData } from "../../lib/api";
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
            className="w-9 h-9 rounded-full bg-[var(--bg-sub)] flex items-center justify-center text-[var(--text-sub)] hover:bg-[var(--border-main)] hover:text-[var(--text-main)] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center px-6 py-4 border-b border-[var(--border-main)] overflow-x-auto custom-scrollbar bg-[var(--bg-sub)]">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold transition-all duration-300
                    ${
                      i <= step
                        ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white premium-shadow"
                        : "bg-white dark:bg-white/5 border-[var(--border-main)] text-[var(--text-sub)]"
                    }`}
                >
                  {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
                </div>
                <span
                  className={`text-[12px] font-semibold transition-colors whitespace-nowrap
                    ${i === step ? "text-[var(--text-main)]" : "text-[var(--text-sub)]"}`}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-2.5 shrink-0 rounded-full transition-colors duration-500 ${i < step ? "bg-[var(--color-primary)]" : "bg-[var(--border-main)]"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          {mutation.isError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-2xl flex items-center gap-3 animate-fade-up">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-[13px] font-medium text-red-700 dark:text-red-300">
                {getMutationMessage(
                  mutation.error,
                  `Failed to ${isEditing ? "update" : "create"} listing`,
                )}
              </span>
            </div>
          )}

          {step === 0 && (
            <div className="flex flex-col gap-6 animate-fade-up">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[var(--text-main)]">
                  Tell us about your place
                </h2>
                <p className="text-[14px] text-[var(--text-sub)] mt-1.5">
                  A great title and description help guests find your listing.
                </p>
              </div>
              <Field label="Listing title" error={errors.title}>
                <input
                  className={`input ${errors.title ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="e.g. Cozy downtown apartment with city views"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  maxLength={80}
                />
                <div className="text-[11px] text-[var(--text-sub)] font-medium text-right mt-1.5">
                  {form.title.length}/80
                </div>
              </Field>
              <Field label="Description" error={errors.description}>
                <textarea
                  className={`input min-h-32 resize-none ${errors.description ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="Describe your space, the neighborhood, what makes it special…"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  maxLength={500}
                  rows={5}
                />
                <div className="text-[11px] text-[var(--text-sub)] font-medium text-right mt-1.5">
                  {form.description.length}/500
                </div>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6 animate-fade-up">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[var(--text-main)]">
                  Location & details
                </h2>
                <p className="text-[14px] text-[var(--text-sub)] mt-1.5">
                  Help guests understand where they're staying.
                </p>
              </div>
              <Field
                label="Location"
                icon={<MapPin size={13} />}
                error={errors.location}
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)] pointer-events-none">
                    <MapPin size={15} />
                  </span>
                  <input
                    className={`input pl-11 ${errors.location ? "border-red-500 focus:border-red-500" : ""}`}
                    placeholder="City, neighborhood or full address"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                  />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Price / night (USD)"
                  icon={<DollarSign size={13} />}
                  error={errors.pricePerNight}
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)] pointer-events-none">
                      <DollarSign size={15} />
                    </span>
                    <input
                      className={`input pl-11 ${errors.pricePerNight ? "border-red-500 focus:border-red-500" : ""}`}
                      placeholder="0.00"
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.pricePerNight}
                      onChange={(e) => update("pricePerNight", e.target.value)}
                    />
                  </div>
                </Field>
                <Field
                  label="Max guests"
                  icon={<Users size={13} />}
                  error={errors.guests}
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)] pointer-events-none">
                      <Users size={15} />
                    </span>
                    <input
                      className={`input pl-11 ${errors.guests ? "border-red-500 focus:border-red-500" : ""}`}
                      placeholder="1"
                      type="number"
                      min={1}
                      max={50}
                      value={form.guests}
                      onChange={(e) => update("guests", e.target.value)}
                    />
                  </div>
                </Field>
              </div>
              <Field
                label="Property type"
                icon={<Layers size={13} />}
                error={errors.type}
              >
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {LISTING_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => update("type", t.value)}
                      className={`px-4 py-4 border-2 rounded-2xl text-left flex flex-col gap-1 transition-all duration-300
                        ${
                          form.type === t.value
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-4 ring-[var(--color-primary)]/5"
                            : "border-[var(--border-main)] bg-[var(--bg-main)] hover:border-[var(--text-sub)]/50"
                        }`}
                    >
                      <span className={`text-[14px] font-bold ${form.type === t.value ? "text-[var(--color-primary)]" : "text-[var(--text-main)]"}`}>
                        {t.label}
                      </span>
                      <span className="text-[12px] text-[var(--text-sub)] font-medium">
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 animate-fade-up">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[var(--text-main)]">
                  Amenities
                </h2>
                <p className="text-[14px] text-[var(--text-sub)] mt-1.5">
                  What does your place offer? Select everything that applies.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {AMENITIES.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAmenity(key)}
                    className={`relative px-3 py-4 border-2 rounded-2xl flex flex-col items-center gap-2.5 transition-all duration-300
                      ${
                        form.amenities.includes(key)
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/5"
                          : "border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-sub)] hover:border-[var(--text-sub)]/50"
                      }`}
                  >
                    <Icon size={20} strokeWidth={form.amenities.includes(key) ? 2.5 : 2} />
                    <span className="text-[12px] font-bold text-center leading-tight">{label}</span>
                    {form.amenities.includes(key) && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white premium-shadow">
                        <Check size={10} strokeWidth={4} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 animate-fade-up">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[var(--text-main)]">
                  Photos
                </h2>
                <p className="text-[14px] text-[var(--text-sub)] mt-1.5">
                  Add up to 10 photos. The first photo will be the cover.
                </p>
              </div>
              <div
                className={`border-3 border-dashed rounded-[2rem] px-8 py-12 flex flex-col items-center gap-3 cursor-pointer transition-all duration-300
                  ${
                    form.photos.length === 0 && errors.photos
                      ? "border-red-400 bg-red-50 dark:bg-red-900/10"
                      : "border-[var(--border-main)] bg-[var(--bg-sub)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.02]"
                  }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
              >
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center premium-shadow text-[var(--color-primary)]">
                  <Upload size={24} />
                </div>
                <p className="text-[15px] font-bold text-[var(--text-main)] mt-2">
                  Drop photos here or <span className="text-[var(--color-primary)] underline">browse</span>
                </p>
                <p className="text-[12px] text-[var(--text-sub)] font-medium">
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
                <div className="grid grid-cols-4 gap-3">
                  {form.photos.map((file, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[var(--border-main)] group premium-shadow"
                    >
                      <img
                        src={
                          typeof file === "string"
                            ? getImageUrl(file)
                            : URL.createObjectURL(file)
                        }
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-2 left-2 bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg premium-shadow">
                          Cover
                        </span>
                      )}
                      <button
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 border-none cursor-pointer backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(i);
                        }}
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  {form.photos.length < 10 && (
                    <button
                      className="aspect-square rounded-2xl border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-sub)] flex flex-col items-center justify-center gap-2 text-[var(--text-sub)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all duration-300 cursor-pointer"
                      onClick={() => fileRef.current?.click()}
                    >
                      <ImageIcon size={20} />
                      <span className="text-[11px] font-bold">Add more</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6 animate-fade-up">
              <div>
                <h2 className="font-heading text-2xl font-bold text-[var(--text-main)]">
                  Review & publish
                </h2>
                <p className="text-[14px] text-[var(--text-sub)] mt-1.5">
                  Everything look good? You can always edit after publishing.
                </p>
              </div>
              <div className="border-2 border-[var(--border-main)] rounded-[1.5rem] overflow-hidden bg-[var(--bg-main)] premium-shadow">
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

        <div className="flex items-center justify-between px-6 py-5 border-t border-[var(--border-main)] bg-[var(--bg-sub)]">
          <button
            onClick={step === 0 ? onClose : prev}
            disabled={mutation.isPending}
            className="button-secondary !py-2 !px-5 !text-[13px]"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={step === 4 ? handleSubmit : next}
            disabled={mutation.isPending}
            className="button-primary !py-2 !px-6 !text-[13px] flex items-center gap-2"
          >
            {step === 4 ? (
              mutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditing ? "Saving..." : "Publishing..."}
                </>
              ) : isEditing ? "Save Changes" : "Publish listing"
            ) : (
              <>
                Continue <ChevronRight size={14} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
