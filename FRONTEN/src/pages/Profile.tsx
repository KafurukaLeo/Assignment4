import { useState } from "react";
import { useAuthStore } from "../store/auth.store";
import type { User as AuthUser } from "../store/auth.store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiFormData } from "../lib/api";
import { toast } from "sonner";
import {
  Camera,
  CalendarDays,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";

const getProfileFormData = (user: AuthUser) => ({
  name: user.name,
  email: user.email,
  username: user.username,
  phone: user.phone || "",
  bio: user.bio || "",
});

export default function Profile() {
  const { user, fetchUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    username: user?.username || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiFormData.put("/users/me", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      setIsEditing(false);
      fetchUser();
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("avatar", file);
      const response = await apiFormData.post(`/upload/users/${user?.id}/avatar`, fd);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Avatar updated");
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchUser();
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: () => toast.error("Failed to update avatar"),
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete("/auth/avatar");
      return response.data;
    },
    onSuccess: () => {
      toast.success("Avatar removed");
      fetchUser();
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: () => toast.error("Failed to remove avatar"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      const response = await api.post("/auth/change-password", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password updated");
      setPasswordData({ currentPassword: "", newPassword: "" });
    },
    onError: () => toast.error("Failed to update password"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("username", formData.username);
    data.append("phone", formData.phone);
    data.append("bio", formData.bio);
    updateProfileMutation.mutate(data);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:150ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  const displayAvatar = avatarPreview || user.avatar;
  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const identityLabel = user.role === "host" ? "host" : "guest";

  return (
    <div className="min-h-screen py-8">
      <div className="mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">
          Account
        </p>
        <h1
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="mt-1 text-3xl font-semibold text-gray-950 dark:text-white"
        >
          Profile
        </h1>
        <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
          Manage your public details and {identityLabel} identity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#111827]">
            <div className="flex flex-col items-center text-center">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={user.name}
                  className="h-28 w-28 rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-(--color-primary)/10 text-3xl font-semibold text-(--color-primary)">
                  {initials}
                </div>
              )}
              <h2 className="mt-4 text-lg font-semibold text-gray-950 dark:text-white">
                {user.name}
              </h2>
              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                @{user.username}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-(--color-primary)/10 px-3 py-1 text-[12px] font-semibold text-(--color-primary) capitalize">
                <ShieldCheck className="h-3.5 w-3.5" />
                {user.role}
              </span>
              {user.createdAt && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-white/[0.07] px-3 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  <CalendarDays className="h-3 w-3" />
                  Member since {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.createdAt))}
                </span>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:border-(--color-primary) hover:text-(--color-primary) dark:border-white/[0.08] dark:text-gray-300">
                <Camera className="h-4 w-4" />
                Change photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              {avatarFile && (
                <button
                  onClick={() => updateAvatarMutation.mutate(avatarFile)}
                  disabled={updateAvatarMutation.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--color-primary) px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {updateAvatarMutation.isPending
                    ? "Uploading..."
                    : "Upload photo"}
                </button>
              )}
              {user.avatar && !avatarFile && (
                <button
                  onClick={() => deleteAvatarMutation.mutate()}
                  disabled={deleteAvatarMutation.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteAvatarMutation.isPending
                    ? "Removing..."
                    : "Remove photo"}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#111827]">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-gray-400">
              Details
            </p>
            <InfoLine icon={Mail} label={user.email} />
            <InfoLine icon={Phone} label={user.phone || "No phone added"} />
            <InfoLine icon={User} label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
          </div>
        </aside>

        <main className="space-y-6">
          <section className="rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#111827] md:p-7">
            {!isEditing ? (
              <div>
                <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 dark:border-white/[0.08] sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                      Personal information
                    </h2>
                    <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
                      {user.role === "host"
                        ? "Guests use these details to recognize your host account."
                        : "These details help hosts recognize your account."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(getProfileFormData(user));
                      setIsEditing(true);
                    }}
                    className="w-fit rounded-xl bg-(--color-primary) px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
                  >
                    Edit profile
                  </button>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ViewField label="Full name" value={user.name} />
                  <ViewField label="Username" value={`@${user.username}`} />
                  <ViewField label="Email" value={user.email} />
                  <ViewField label="Phone" value={user.phone || "Not added"} />
                </div>

                <div className="mt-4 rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.04]">
                  <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">
                    Bio
                  </p>
                  <p className="mt-2 text-[14px] leading-6 text-gray-600 dark:text-gray-300">
                    {user.bio || "No bio added yet."}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="border-b border-gray-200 pb-6 dark:border-white/[0.08]">
                  <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                    Edit profile
                  </h2>
                  <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
                    Update the details shown on your guest profile.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <FormField label="Full name">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                      required
                    />
                  </FormField>
                  <FormField label="Username">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                      required
                    />
                  </FormField>
                  <FormField label="Email">
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 opacity-60 outline-none transition-colors dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                    />
                  </FormField>
                  <FormField label="Phone">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                    />
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField label="Bio">
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={4}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                    />
                  </FormField>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-white/[0.08]">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-(--color-primary) px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {updateProfileMutation.isPending
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(getProfileFormData(user));
                    }}
                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:border-(--color-primary) hover:text-(--color-primary) dark:border-white/[0.08] dark:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#111827] md:p-7">
            <div className="border-b border-gray-200 pb-6 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--color-primary)/10 text-(--color-primary)">
                  <KeyRound className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                    Password
                  </h2>
                  <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
                    Update your sign in password.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <FormField label="Current password">
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  required
                />
              </FormField>
              <FormField label="New password">
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  required
                />
              </FormField>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-(--color-primary) px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {changePasswordMutation.isPending
                    ? "Updating..."
                    : "Update password"}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-gray-100 py-3 first:border-t-0 dark:border-white/[0.06]">
      <Icon className="h-4 w-4 text-(--color-primary)" />
      <span className="truncate text-[14px] text-gray-600 dark:text-gray-300">
        {label}
      </span>
    </div>
  );
}

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.04]">
      <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className="mt-2 truncate text-[14px] font-semibold text-gray-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </span>
      {children}
    </label>
  );
}
