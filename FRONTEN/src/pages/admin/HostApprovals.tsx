import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, ShieldAlert, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import Spinner from "../../components/Spinner";
import { getImageUrl } from "../../lib/utils";

type HostStatus = "pending" | "approved" | "restricted";

type HostAccount = {
  id: string;
  name: string;
  email: string;
  username: string;
  phone?: string | null;
  avatar?: string | null;
  bio?: string | null;
  hostStatus: HostStatus;
  createdAt: string;
  _count: {
    listings: number;
    bookings: number;
  };
};

const statusConfig: Record<
  HostStatus,
  { label: string; icon: typeof Clock3; className: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock3,
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  restricted: {
    label: "Restricted",
    icon: ShieldAlert,
    className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

const getHosts = async (): Promise<HostAccount[]> => {
  const response = await api.get("/users/hosts");
  return response.data.data;
};

export default function HostApprovals() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "hosts"],
    queryFn: getHosts,
  });

  const hosts = Array.isArray(data) ? data : [];

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      hostStatus,
    }: {
      id: string;
      hostStatus: HostStatus;
    }) => {
      const response = await api.patch(`/users/hosts/${id}/status`, {
        hostStatus,
      });
      return response.data.user as HostAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hosts"] });
      toast.success("Host account updated");
    },
    onError: () => {
      toast.error("Could not update host account");
    },
  });

  const counts = hosts.reduce(
    (acc, host) => {
      acc[host.hostStatus] += 1;
      return acc;
    },
    { pending: 0, approved: 0, restricted: 0 } as Record<HostStatus, number>,
  );

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
          <p className="mb-0.5 text-[13px] text-[#AAAAAA]">Admin</p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-2xl font-semibold text-[#111] dark:text-white"
          >
            Host approvals
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:w-auto">
          {(Object.keys(statusConfig) as HostStatus[]).map((status) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            return (
              <div
                key={status}
                className="rounded-lg border border-[#EBEBEB] bg-white px-3 py-2 dark:border-[#2A2A2A] dark:bg-[#1A1A1A]"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-[#AAAAAA]">
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </div>
                <p className="mt-1 text-lg font-semibold text-[#111] dark:text-white">
                  {counts[status]}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#EBEBEB] bg-white dark:border-[#2A2A2A] dark:bg-[#1A1A1A]">
        <div className="hidden grid-cols-[minmax(220px,1.4fr)_110px_100px_100px_220px] gap-4 border-b border-[#EBEBEB] px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#AAAAAA] dark:border-[#2A2A2A] md:grid">
          <span>Host</span>
          <span>Status</span>
          <span>Listings</span>
          <span>Bookings</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-[#F5F5F5] dark:divide-[#2A2A2A]">
          {hosts.length ? (
            hosts.map((host) => (
              <HostRow
                key={host.id}
                host={host}
                isUpdating={
                  updateStatus.isPending && updateStatus.variables?.id === host.id
                }
                onChangeStatus={(hostStatus) =>
                  updateStatus.mutate({ id: host.id, hostStatus })
                }
              />
            ))
          ) : (
            <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F7F7F7] dark:bg-[#2A2A2A]">
                <UserRound className="h-5 w-5 text-[#CCCCCC]" />
              </div>
              <p className="text-[13px] font-medium text-[#111] dark:text-white">
                No host accounts found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HostRow({
  host,
  isUpdating,
  onChangeStatus,
}: {
  host: HostAccount;
  isUpdating: boolean;
  onChangeStatus: (status: HostStatus) => void;
}) {
  const config = statusConfig[host.hostStatus];
  const StatusIcon = config.icon;

  return (
    <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(220px,1.4fr)_110px_100px_100px_220px] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        {host.avatar ? (
          <img
            src={getImageUrl(host.avatar)}
            alt={host.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-[13px] font-semibold text-white">
            {host.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#111] dark:text-white">
            {host.name}
          </p>
          <p className="truncate text-[12px] text-[#717171] dark:text-[#AAAAAA]">
            {host.email}
          </p>
        </div>
      </div>

      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
      >
        <StatusIcon className="h-3.5 w-3.5" />
        {config.label}
      </span>

      <p className="text-[13px] text-[#717171] dark:text-[#AAAAAA]">
        {host._count.listings} listings
      </p>

      <p className="text-[13px] text-[#717171] dark:text-[#AAAAAA]">
        {host._count.bookings} bookings
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <StatusButton
          disabled={isUpdating || host.hostStatus === "approved"}
          label="Approve"
          onClick={() => onChangeStatus("approved")}
        />
        <StatusButton
          disabled={isUpdating || host.hostStatus === "restricted"}
          label="Restrict"
          tone="danger"
          onClick={() => onChangeStatus("restricted")}
        />
        <StatusButton
          disabled={isUpdating || host.hostStatus === "pending"}
          label="Pending"
          tone="muted"
          onClick={() => onChangeStatus("pending")}
        />
      </div>
    </div>
  );
}

function StatusButton({
  label,
  disabled,
  tone = "default",
  onClick,
}: {
  label: string;
  disabled: boolean;
  tone?: "default" | "danger" | "muted";
  onClick: () => void;
}) {
  const classes = {
    default:
      "border-[#111] bg-[#111] text-white hover:opacity-85 dark:border-white dark:bg-white dark:text-[#111]",
    danger:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300",
    muted:
      "border-[#EBEBEB] bg-white text-[#717171] hover:bg-[#F7F7F7] dark:border-[#2A2A2A] dark:bg-[#1A1A1A] dark:text-[#AAAAAA] dark:hover:bg-[#222]",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${classes[tone]}`}
    >
      {label}
    </button>
  );
}
