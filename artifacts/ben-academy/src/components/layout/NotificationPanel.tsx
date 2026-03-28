import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Info, AlertCircle, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getAuthHeaders } from "@/lib/utils";
import {
  useListNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  getListNotificationsQueryKey
} from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";

export function NotificationPanel() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Poll every 30 seconds
  const { data: notifications = [] } = useListNotifications({
    request: { headers: getAuthHeaders() },
    query: { refetchInterval: 30000 }
  });

  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead({
    request: { headers: getAuthHeaders() },
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    }
  });

  const { mutate: markRead } = useMarkNotificationRead({
    request: { headers: getAuthHeaders() },
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    }
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAll = () => {
    markAllRead();
  };

  const handleNotificationClick = (id: number, isRead: boolean) => {
    if (!isRead) {
      markRead({ id });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "booking": return <Calendar className="w-4 h-4 text-primary" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-white">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/50" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h4 className="font-semibold text-white">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              disabled={isMarkingAll}
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-white"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <Bell className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                  className={`flex items-start gap-3 p-4 text-left transition-colors hover:bg-white/5 border-b border-white/5 last:border-0 ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm leading-snug ${!notification.isRead ? "text-white font-medium" : "text-muted-foreground"}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
