import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UserCog, UserRound, Mail, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import Spinner from "../../components/Spinner";
import { getImageUrl } from "../../lib/utils";

type UserRole = "guest" | "host" | "admin";

type User = {
  id: string;
  name: string;
  email: string;
  username: string;
  phone?: string | null;
  role: UserRole;
  avatar?: string | null;
  bio?: string | null;
  createdAt: string;
  status: "active" | "banned";
};

const roleConfig: Record<
  UserRole,
  { label: string; className: string }
> = {
  guest: {
    label: "Guest",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  host: {
    label: "Host",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  admin: {
    label: "Admin",
    className: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
};

const getUsers = async (): Promise<User[]> => {
  const response = await api.get("/users");
  return response.data;
};

export default function UserManagement() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getUsers,
  });

  const users = Array.isArray(data) ? data : [];

  const updateRole = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: UserRole;
    }) => {
      const response = await api.post("/auth/assign-role", {
        userId,
        role,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User role updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Could not update user role");
    },
  });
  
  const toggleBan = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.patch(`/users/${userId}/ban`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Could not update user status");
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Could not delete user");
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const openAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (formData: any) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        toast.success("User updated successfully");
      } else {
        await api.post("/users", formData);
        toast.success("User created successfully");
      }
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-0.5 text-[13px] text-[#AAAAAA]">System Administration</p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-2xl font-semibold text-[#111] dark:text-white"
          >
            User Management
          </h1>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-(--color-primary) px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-(--color-primary-dark)"
        >
          <UserRound className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#EBEBEB] bg-white dark:border-[#2A2A2A] dark:bg-[#1A1A1A]">
        <div className="hidden grid-cols-[minmax(250px,1.5fr)_120px_150px_250px] gap-4 border-b border-[#EBEBEB] px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#AAAAAA] dark:border-[#2A2A2A] md:grid">
          <span>User Info</span>
          <span>Role</span>
          <span>Joined</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-[#F5F5F5] dark:divide-[#2A2A2A]">
          {users.length ? (
            users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isUpdating={
                  updateRole.isPending && updateRole.variables?.userId === user.id
                }
                onChangeRole={(role) =>
                  updateRole.mutate({ userId: user.id, role })
                }
                onEdit={openEditModal}
                onBan={toggleBan.mutate}
                onDelete={deleteUser.mutate}
              />
            ))
          ) : (
            <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F7F7F7] dark:bg-[#2A2A2A]">
                <UserRound className="h-5 w-5 text-[#CCCCCC]" />
              </div>
              <p className="text-[13px] font-medium text-[#111] dark:text-white">
                No users found
              </p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateOrUpdate}
        />
      )}
    </div>
  );
}

function UserRow({
  user,
  isUpdating,
  onChangeRole,
  onEdit,
  onBan,
  onDelete,
}: {
  user: User;
  isUpdating: boolean;
  onChangeRole: (role: UserRole) => void;
  onEdit: (user: User) => void;
  onBan: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = roleConfig[user.role];

  return (
    <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(250px,1.5fr)_120px_150px_250px] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        {user.avatar ? (
          <img
            src={getImageUrl(user.avatar)}
            alt={user.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-[13px] font-semibold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#111] dark:text-white">
            {user.name} <span className="text-[11px] font-normal text-[#AAAAAA]">@{user.username}</span>
          </p>
          <div className="flex items-center gap-2 text-[12px] text-[#717171] dark:text-[#AAAAAA]">
            <Mail className="h-3 w-3" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </div>

      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
      >
        {config.label}
      </span>

      <div className="flex items-center gap-1.5 text-[13px] text-[#717171] dark:text-[#AAAAAA]">
        <Calendar className="h-3.5 w-3.5" />
        {new Date(user.createdAt).toLocaleDateString()}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RoleButton
          disabled={isUpdating || user.role === "guest"}
          label="Guest"
          onClick={() => onChangeRole("guest")}
        />
        <RoleButton
          disabled={isUpdating || user.role === "host"}
          label="Host"
          onClick={() => onChangeRole("host")}
        />
        <RoleButton
          disabled={isUpdating || user.role === "admin"}
          label="Admin"
          onClick={() => onChangeRole("admin")}
        />
        <div className="flex items-center gap-2 border-l border-gray-200 pl-2 dark:border-gray-700">
          <ActionButton
            icon={UserCog}
            label="Edit"
            onClick={() => onEdit(user)}
          />
          <ActionButton
            icon={ShieldCheck}
            label={user.status === "banned" ? "Unban" : "Ban"}
            danger={user.status === "active"}
            onClick={() => onBan(user.id)}
          />
          <ActionButton
            icon={UserRound}
            label="Delete"
            danger
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this user?")) {
                onDelete(user.id);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function UserModal({
  user,
  onClose,
  onSubmit,
}: {
  user: User | null;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    username: user?.username || "",
    password: "", // Only for new users
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#1A1A1A]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {user ? "Edit User" : "Add New User"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500">
              Full Name
            </label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary) dark:border-gray-800 dark:bg-black/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500">
              Email Address
            </label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary) dark:border-gray-800 dark:bg-black/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500">
              Username
            </label>
            <input
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary) dark:border-gray-800 dark:bg-black/20"
            />
          </div>
          {!user && (
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                Password
              </label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-(--color-primary) dark:border-gray-800 dark:bg-black/20"
              />
            </div>
          )}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-(--color-primary) py-2.5 text-sm font-semibold text-white hover:bg-(--color-primary-dark)"
            >
              {user ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border border-[#EBEBEB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#111] transition-colors hover:bg-[#F7F7F7] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2A2A2A] dark:bg-[#1A1A1A] dark:text-white dark:hover:bg-[#222]`}
    >
      {label}
    </button>
  );
}
