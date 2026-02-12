import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Initialize notification system and request permissions
 */
export async function initNotifications(): Promise<void> {
  try {
    // Request permissions
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display !== 'granted') {
      console.warn('Notification permissions not granted');
      return;
    }

    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    throw error;
  }
}

/**
 * Schedule daily streak reminder at 6 PM
 * @param currentStreak - Current learning streak count
 */
export async function scheduleStreakReminder(currentStreak: number): Promise<void> {
  try {
    // Cancel existing streak notification
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

    // Create reminder for 6 PM today (or tomorrow if past 6 PM)
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(18, 0, 0, 0);

    // If it's past 6 PM, schedule for tomorrow
    if (now.getTime() > scheduledTime.getTime()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Customize message based on streak
    let message = '';
    if (currentStreak === 0) {
      message = 'Start your Quran learning journey today!';
    } else if (currentStreak < 7) {
      message = `Keep it going! You're on a ${currentStreak} day streak.`;
    } else if (currentStreak < 30) {
      message = `Amazing! ${currentStreak} days strong. Don't break the chain!`;
    } else {
      message = `Mashallah! ${currentStreak} day streak. Keep up the excellent work!`;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: 'Maintain Your Streak',
          body: message,
          schedule: {
            at: scheduledTime,
            allowWhileIdle: true
          },
          sound: 'beep.wav',
          smallIcon: 'ic_stat_icon_config_sample'
        }
      ]
    });

    console.log(`Streak reminder scheduled for ${scheduledTime.toLocaleString()}`);
  } catch (error) {
    console.error('Failed to schedule streak reminder:', error);
  }
}

/**
 * Schedule notification 5 minutes before prayer time
 * @param prayerName - Name of the prayer (Fajr, Dhuhr, Asr, Maghrib, Isha)
 * @param prayerTime - Scheduled prayer time
 */
export async function schedulePrayerReminder(
  prayerName: string,
  prayerTime: Date
): Promise<void> {
  try {
    // Map prayer names to IDs (1000-1005)
    const prayerIds: { [key: string]: number } = {
      'Fajr': 1000,
      'Dhuhr': 1001,
      'Asr': 1002,
      'Maghrib': 1003,
      'Isha': 1004
    };

    const notificationId = prayerIds[prayerName];
    if (!notificationId) {
      console.warn(`Unknown prayer name: ${prayerName}`);
      return;
    }

    // Schedule 5 minutes before prayer time
    const reminderTime = new Date(prayerTime.getTime() - 5 * 60 * 1000);

    // Don't schedule if time has already passed
    if (reminderTime.getTime() <= Date.now()) {
      console.log(`Prayer time for ${prayerName} has passed, skipping`);
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `${prayerName} Prayer Time Soon`,
          body: `${prayerName} prayer is in 5 minutes. Prepare for prayer.`,
          schedule: {
            at: reminderTime,
            allowWhileIdle: true
          },
          sound: 'beep.wav',
          smallIcon: 'ic_stat_icon_config_sample'
        }
      ]
    });

    console.log(`${prayerName} reminder scheduled for ${reminderTime.toLocaleString()}`);
  } catch (error) {
    console.error(`Failed to schedule ${prayerName} prayer reminder:`, error);
  }
}

/**
 * Schedule daily review reminder at 10 AM if there are due cards
 * @param dueCount - Number of cards due for review
 */
export async function scheduleReviewReminder(dueCount: number): Promise<void> {
  try {
    // Cancel existing review notification
    await LocalNotifications.cancel({ notifications: [{ id: 2000 }] });

    // Only schedule if there are due cards
    if (dueCount === 0) {
      console.log('No due cards, skipping review reminder');
      return;
    }

    // Create reminder for 10 AM today (or tomorrow if past 10 AM)
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(10, 0, 0, 0);

    // If it's past 10 AM, schedule for tomorrow
    if (now.getTime() > scheduledTime.getTime()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    let message = '';
    if (dueCount === 1) {
      message = 'You have 1 card due for review.';
    } else if (dueCount < 10) {
      message = `You have ${dueCount} cards due for review.`;
    } else {
      message = `You have ${dueCount} cards waiting for review. Let's keep your knowledge fresh!`;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 2000,
          title: 'Time to Review',
          body: message,
          schedule: {
            at: scheduledTime,
            allowWhileIdle: true
          },
          sound: 'beep.wav',
          smallIcon: 'ic_stat_icon_config_sample'
        }
      ]
    });

    console.log(`Review reminder scheduled for ${scheduledTime.toLocaleString()}`);
  } catch (error) {
    console.error('Failed to schedule review reminder:', error);
  }
}

/**
 * Cancel all pending notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await LocalNotifications.cancel({ notifications: [] });
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Failed to cancel all notifications:', error);
  }
}

/**
 * Cancel only prayer notifications (IDs 1000-1005)
 */
export async function cancelPrayerNotifications(): Promise<void> {
  try {
    const prayerIds = [1000, 1001, 1002, 1003, 1004];
    const notifications = prayerIds.map(id => ({ id }));

    await LocalNotifications.cancel({ notifications });
    console.log('Prayer notifications cancelled');
  } catch (error) {
    console.error('Failed to cancel prayer notifications:', error);
  }
}
