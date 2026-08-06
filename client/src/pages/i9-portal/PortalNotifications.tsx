import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { i9Api, type I9Notification } from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, useUnauthRedirect, NAVY } from "./_shared";

const EVENT_LABELS: Record<string, string> = {
  new_hire_request_submitted: "New-Hire Request Submitted",
  deficiency_requires_client_action: "Action Required",
  case_result_available: "Case Result Available",
  mismatch_notice_review_pending: "Mismatch Notice — Review Pending",
  client_activated: "Account Status Update",
};
function eventLabel(event: string): string {
  return EVENT_LABELS[event] ?? event.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function NotificationsList() {
  const onUnauth = useUnauthRedirect();
  const [notifications, setNotifications] = useState<I9Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    i9Api<{ notifications: I9Notification[] }>("/api/i9/notifications")
      .then((r) => active && setNotifications(r.notifications))
      .catch((err) => active && onUnauth(err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [onUnauth]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    try {
      await i9Api(`/api/i9/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      // Non-critical — a failed read-marking doesn't need to roll back the UI.
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading notifications...</p>;

  return (
    <PortalCard title={`Notifications${notifications.filter((n) => !n.readAt).length > 0 ? ` (${notifications.filter((n) => !n.readAt).length} unread)` : ""}`}>
      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet. Notifications never contain employee or case-sensitive data — they'll always point you back here to log in and view details securely.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {notifications.map((n) => (
            <li key={n.id} className={`py-3 flex items-start gap-3 ${!n.readAt ? "bg-blue-50/50" : ""}`}>
              <Bell className={`w-4 h-4 mt-0.5 shrink-0 ${!n.readAt ? "text-[#FF6A00]" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: NAVY }}>{eventLabel(n.event)}</p>
                <p className="text-sm text-foreground">{n.inPortalMessage}</p>
                {n.createdAt && <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>}
              </div>
              {!n.readAt && (
                <button onClick={() => markRead(n.id)} className="text-xs font-medium hover:underline shrink-0" style={{ color: NAVY }}>
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </PortalCard>
  );
}

export default function PortalNotifications() {
  return (
    <PortalGuard>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Notifications">
          <NotificationsList />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
