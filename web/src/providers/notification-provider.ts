import type { NotificationProvider } from "@refinedev/core";
import { toast } from "sonner";

/**
 * Refine's view of notifications: a successful mutation is confirmed briefly, and a
 * failed one is reported with the reason the API gave.
 *
 * This is what makes a mutation failure surface as a toast rather than being
 * swallowed. Errors are announced assertively and successes politely, which is what
 * a screen reader should hear for each.
 */
export const notificationProvider: NotificationProvider = {
  open: ({ key, message, description, type }) => {
    const options = { id: key, description };

    if (type === "error") {
      toast.error(message, { ...options, duration: 8000 });
      return;
    }

    toast.success(message, options);
  },
  close: (key) => {
    toast.dismiss(key);
  },
};
