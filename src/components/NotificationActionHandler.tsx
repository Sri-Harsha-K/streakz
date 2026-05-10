import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAppData } from '../state/AppDataContext';
import { ACTION_MARK_DONE } from '../utils/reminders';
import { presentMarkDoneConfirmation } from '../utils/notificationTask';

/**
 * Listens for notification taps and action-button presses. When the user
 * taps "✓ Mark done" on a habit reminder, marks the task complete without
 * opening the app to the task detail screen.
 *
 * Mounted inside AppDataProvider so it can call `markComplete` from context.
 */
export function NotificationActionHandler() {
  const { markComplete, allTasks } = useAppData();

  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | { taskId?: string; kind?: string }
        | undefined;
      const taskId = data?.taskId;
      if (!taskId) return;
      // Only mark if the task still exists and isn't archived.
      const task = allTasks.find((t) => t.id === taskId);
      if (!task || task.archived) return;
      if (response.actionIdentifier === ACTION_MARK_DONE) {
        markComplete(taskId);
        void presentMarkDoneConfirmation(
          task.title,
          taskId,
          response.notification.request.identifier,
        );
      }
      // Default tap (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER)
      // just opens the app; no auto-mark on plain tap, lets user review the heatmap first.
    };

    const sub = Notifications.addNotificationResponseReceivedListener(handle);

    // Handle the case where the app was launched cold by tapping the action.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handle(response);
    });

    return () => sub.remove();
  }, [markComplete, allTasks]);

  return null;
}
