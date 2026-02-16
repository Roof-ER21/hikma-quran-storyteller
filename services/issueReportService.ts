import { Capacitor } from '@capacitor/core';

const DEFAULT_SUPPORT_EMAIL = 'ahmed.mahmoud@theroofdocs.com';

interface IssueReportOptions {
  source?: string;
  category?: string;
  summary?: string;
}

interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

function getSupportEmail(): string {
  return import.meta.env.VITE_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;
}

function getNetworkInfo(): NetworkInfo | null {
  const nav = navigator as Navigator & { connection?: NetworkInfo };
  return nav.connection || null;
}

function getLocalStorageValue(key: string): string {
  try {
    return localStorage.getItem(key) || 'not_set';
  } catch {
    return 'unavailable';
  }
}

export function buildIssueReportBody(options: IssueReportOptions = {}): string {
  const { source = 'manual', category = 'general', summary } = options;
  const network = getNetworkInfo();
  const timestamp = new Date().toISOString();
  const viewport = `${window.innerWidth}x${window.innerHeight}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
  const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown';
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown';

  return [
    'Assalamu Alaikum,',
    '',
    'I would like to report an issue in Alaya & Soad\'s Gift.',
    '',
    summary ? `Issue summary: ${summary}` : 'Issue summary: [Please describe what happened]',
    '',
    'Steps to reproduce:',
    '1) [Step 1]',
    '2) [Step 2]',
    '3) [What you expected vs what happened]',
    '',
    '--- Diagnostics ---',
    `Timestamp (UTC): ${timestamp}`,
    `Source: ${source}`,
    `Category: ${category}`,
    `App Version: ${appVersion}`,
    `Build Time: ${buildTime}`,
    `Platform: ${Capacitor.getPlatform()}`,
    `Native Platform: ${String(Capacitor.isNativePlatform())}`,
    `Online: ${String(navigator.onLine)}`,
    `Language: ${navigator.language || 'unknown'}`,
    `Timezone: ${timezone}`,
    `Viewport: ${viewport}`,
    `Device Memory (GB): ${String((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 'unknown')}`,
    `CPU Cores: ${String(navigator.hardwareConcurrency ?? 'unknown')}`,
    `Network: ${network ? `${network.effectiveType || 'unknown'} (downlink=${network.downlink ?? 'n/a'}, rtt=${network.rtt ?? 'n/a'}, saveData=${String(network.saveData ?? false)})` : 'unknown'}`,
    `Last Cloud Sync: ${getLocalStorageValue('alayasoad_last_sync_at')}`,
    `Cloud Sync Enabled: ${getLocalStorageValue('alayasoad_sync_enabled')}`,
    `AI Tutor Enabled: ${getLocalStorageValue('alayasoad_ai_tutor_enabled')}`,
    `Current URL: ${window.location.href}`,
    `User Agent: ${navigator.userAgent}`,
  ].join('\n');
}

export function buildIssueReportEmailLink(options: IssueReportOptions = {}): string {
  const supportEmail = getSupportEmail();
  const subject = encodeURIComponent(`Alaya & Soad's Gift - Issue Report (${options.category || 'general'})`);
  const body = encodeURIComponent(buildIssueReportBody(options));
  return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
}

export function openIssueReporter(options: IssueReportOptions = {}): void {
  const mailtoLink = buildIssueReportEmailLink(options);
  window.location.href = mailtoLink;
}

