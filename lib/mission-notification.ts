import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { getPersistentAuthItem, setPersistentAuthItem } from '@/lib/auth-storage';

type NotificationsModule = typeof import('expo-notifications');
type Notification = import('expo-notifications').Notification;

export const MISSION_NOTIFICATION_CHANNEL_ID = 'mission-invitations';
export const MAGAZINE_NOTIFICATION_CHANNEL_ID = 'magazine-reminders';
const MISSION_NOTIFICATION_ENABLED_KEY = 'notification_mission_enabled';
const MAGAZINE_NOTIFICATION_ENABLED_KEY = 'notification_magazine_enabled';
const MASTER_NOTIFICATION_ENABLED_KEY = 'notification_master_enabled';
const NIGHT_NOTIFICATION_ENABLED_KEY = 'notification_night_enabled';
const MAGAZINE_NOTIFICATION_KIND = 'magazine_reminder';
let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;
let notificationHandlerConfigured = false;

async function getNotificationsModule() {
  // Expo Go does not include the native notifications module. Avoid importing
  // it there because Metro can resolve expo-notifications to a partial module.
  if (Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient') {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications').catch(() => null);
  }

  const Notifications = await notificationsModulePromise;

  if (
    !Notifications ||
    typeof Notifications.setNotificationHandler !== 'function' ||
    typeof Notifications.getPermissionsAsync !== 'function'
  ) {
    return null;
  }

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

export async function configureMissionNotifications() {
  if (Platform.OS !== 'android') {
    return;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  await Notifications.setNotificationChannelAsync(MISSION_NOTIFICATION_CHANNEL_ID, {
    name: '미션 알림',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#64ABBF',
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function configureMagazineNotifications() {
  if (Platform.OS !== 'android') {
    return;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  await Notifications.setNotificationChannelAsync(MAGAZINE_NOTIFICATION_CHANNEL_ID, {
    name: '매거진 알림',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#64ABBF',
  });
}

export async function requestMissionNotificationPermission() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  await configureMissionNotifications();
  const currentPermission = await Notifications.getPermissionsAsync();

  if (currentPermission.granted) {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();
  return requestedPermission.granted;
}

export async function hasMissionNotificationPermission() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  await configureMissionNotifications();
  const permission = await Notifications.getPermissionsAsync();
  return permission.granted;
}

function readBoolean(value: string | null, fallback: boolean) {
  return value === null ? fallback : value === 'true';
}

function isNightTime(date = new Date()) {
  return date.getHours() >= 21 || date.getHours() < 8;
}

function getNextMorningAtEight(date = new Date()) {
  const nextMorning = new Date(date);

  if (nextMorning.getHours() >= 21) {
    nextMorning.setDate(nextMorning.getDate() + 1);
  }

  nextMorning.setHours(8, 0, 0, 0);
  return nextMorning;
}

export async function getMissionNotificationPreferences() {
  const [masterEnabled, missionEnabled, magazineEnabled, nightEnabled] = await Promise.all([
    getPersistentAuthItem(MASTER_NOTIFICATION_ENABLED_KEY),
    getPersistentAuthItem(MISSION_NOTIFICATION_ENABLED_KEY),
    getPersistentAuthItem(MAGAZINE_NOTIFICATION_ENABLED_KEY),
    getPersistentAuthItem(NIGHT_NOTIFICATION_ENABLED_KEY),
  ]);

  return {
    magazineEnabled: readBoolean(magazineEnabled, true),
    masterEnabled: readBoolean(masterEnabled, true),
    missionEnabled: readBoolean(missionEnabled, true),
    nightEnabled: readBoolean(nightEnabled, false),
  };
}

export async function setMasterNotificationEnabled(enabled: boolean) {
  await setPersistentAuthItem(MASTER_NOTIFICATION_ENABLED_KEY, String(enabled));
}

export async function setMissionNotificationEnabled(enabled: boolean) {
  await setPersistentAuthItem(MISSION_NOTIFICATION_ENABLED_KEY, String(enabled));
}

export async function setMagazineNotificationEnabled(enabled: boolean) {
  await setPersistentAuthItem(MAGAZINE_NOTIFICATION_ENABLED_KEY, String(enabled));
}

export async function setNightNotificationEnabled(enabled: boolean) {
  await setPersistentAuthItem(NIGHT_NOTIFICATION_ENABLED_KEY, String(enabled));
}

type MissionNotificationInput = {
  missionTitle: string;
  scheduleId: string;
  scheduleMissionId: string;
  sessionId: string;
};

export async function showMissionNotification({ missionTitle, scheduleId, scheduleMissionId, sessionId }: MissionNotificationInput) {
  const preferences = await getMissionNotificationPreferences();

  if (!preferences.masterEnabled || !preferences.missionEnabled || !(await hasMissionNotificationPermission())) {
    return false;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  const url = `/trip/participation?scheduleId=${encodeURIComponent(scheduleId)}&scheduleMissionId=${encodeURIComponent(scheduleMissionId)}&sessionId=${encodeURIComponent(sessionId)}`;
  const missionNotificationDate = !preferences.nightEnabled && isNightTime() ? getNextMorningAtEight() : null;

  await Notifications.scheduleNotificationAsync({
    content: {
      body: `${missionTitle} 미션에 참여해주세요.`,
      color: '#64ABBF',
      data: { url },
      sound: 'default',
      title: '새 미션이 시작됐어요',
    },
    trigger: missionNotificationDate
      ? {
          channelId: Platform.OS === 'android' ? MISSION_NOTIFICATION_CHANNEL_ID : undefined,
          date: missionNotificationDate,
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        }
      : Platform.OS === 'android'
        ? { channelId: MISSION_NOTIFICATION_CHANNEL_ID, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 }
        : null,
  });

  return true;
}

type MagazineNotificationInput = {
  endDate: string;
  scheduleId: string;
  scheduleName: string;
};

function getMagazineNotificationDate(dateValue: string, nightEnabled: boolean) {
  const match = dateValue.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);

  if (!match) {
    return null;
  }

  const notificationDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1);

  if (!nightEnabled) {
    notificationDate.setHours(8, 0, 0, 0);
  }

  return Number.isNaN(notificationDate.getTime()) ? null : notificationDate;
}

async function getScheduledMagazineNotifications(Notifications: NotificationsModule) {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  return scheduledNotifications.filter((request) => request.content.data?.type === MAGAZINE_NOTIFICATION_KIND);
}

type MagazineNotificationData = {
  endDate?: unknown;
  nightEnabled?: unknown;
  scheduleId?: unknown;
  scheduleName?: unknown;
  type?: unknown;
  url?: unknown;
};

function getMagazineNotificationData(request: { content: { data: Record<string, unknown> } }) {
  return request.content.data as MagazineNotificationData;
}

async function scheduleMagazineRequest(
  Notifications: NotificationsModule,
  { endDate, nightEnabled, scheduleId, scheduleName }: MagazineNotificationInput & { nightEnabled: boolean },
  notificationDate: Date,
) {
  const url = `/magazine/detail?scheduleId=${encodeURIComponent(scheduleId)}`;

  await Notifications.scheduleNotificationAsync({
    content: {
      body: `${scheduleName} 매거진을 만들어보세요.`,
      color: '#64ABBF',
      data: { endDate, nightEnabled, scheduleId, scheduleName, type: MAGAZINE_NOTIFICATION_KIND, url },
      sound: 'default',
      title: '여행 매거진을 만들어보세요',
    },
    trigger: {
      channelId: Platform.OS === 'android' ? MAGAZINE_NOTIFICATION_CHANNEL_ID : undefined,
      date: notificationDate,
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    },
  });
}

export async function scheduleMagazineNotification({ endDate, scheduleId, scheduleName }: MagazineNotificationInput) {
  const preferences = await getMissionNotificationPreferences();

  if (!preferences.masterEnabled || !preferences.magazineEnabled || !(await hasMissionNotificationPermission())) {
    return false;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  const triggerDate = getMagazineNotificationDate(endDate, preferences.nightEnabled);
  if (!triggerDate || triggerDate.getTime() <= Date.now()) {
    return false;
  }

  await configureMagazineNotifications();

  const matchingNotifications = (await getScheduledMagazineNotifications(Notifications)).filter(
    (request) => getMagazineNotificationData(request).scheduleId === scheduleId,
  );
  const existingNotification = matchingNotifications.find(
    (request) => getMagazineNotificationData(request).nightEnabled === preferences.nightEnabled,
  );

  if (existingNotification) {
    return true;
  }

  await Promise.all(matchingNotifications.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
  await scheduleMagazineRequest(Notifications, { endDate, nightEnabled: preferences.nightEnabled, scheduleId, scheduleName }, triggerDate);

  return true;
}

export async function rescheduleMagazineNotifications(nightEnabled: boolean) {
  const preferences = await getMissionNotificationPreferences();
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return;
  }

  const scheduledNotifications = await getScheduledMagazineNotifications(Notifications);

  if (!preferences.masterEnabled || !preferences.magazineEnabled) {
    await Promise.all(scheduledNotifications.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
    return;
  }

  await configureMagazineNotifications();

  await Promise.all(scheduledNotifications.map(async (request) => {
    const data = getMagazineNotificationData(request);

    if (typeof data.scheduleId !== 'string' || typeof data.endDate !== 'string' || typeof data.scheduleName !== 'string') {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
      return;
    }

    const notificationDate = getMagazineNotificationDate(data.endDate, nightEnabled);

    if (!notificationDate || notificationDate.getTime() <= Date.now()) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
      return;
    }

    if (data.nightEnabled === nightEnabled) {
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(request.identifier);
    await scheduleMagazineRequest(Notifications, {
      endDate: data.endDate,
      nightEnabled,
      scheduleId: data.scheduleId,
      scheduleName: data.scheduleName,
    }, notificationDate);
  }));
}

export async function cancelMagazineNotification(scheduleId: string) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  const matchingNotifications = (await getScheduledMagazineNotifications(Notifications)).filter(
    (request) => request.content.data?.scheduleId === scheduleId,
  );

  await Promise.all(matchingNotifications.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

export async function cancelAllMagazineNotifications() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  const matchingNotifications = await getScheduledMagazineNotifications(Notifications);
  await Promise.all(matchingNotifications.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

export async function subscribeToMissionNotificationResponses(onUrl: (url: string) => void) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return () => undefined;
  }

  const redirectFromNotification = (notification: Notification) => {
    const url = notification.request.content.data?.url;

    if (typeof url === 'string') {
      onUrl(url);
    }
  };

  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse?.notification) {
    redirectFromNotification(lastResponse.notification);
  }

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    redirectFromNotification(response.notification);
  });

  return () => subscription.remove();
}
