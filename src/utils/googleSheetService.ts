import { GoogleSheetSendPayload } from '../types';

export const DEFAULT_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbxV08B35nP1IL9AUdkPT_oVprBGrzFjSYKmuWIW-BzVMWErnln71YrJ6arhvNAsGX6IHA/exec';

export const DEFAULT_SHARED_TOKEN = 'bk123';

export async function sendEntriesToGoogleSheet(
  payload: GoogleSheetSendPayload,
  webAppUrl: string = DEFAULT_WEBAPP_URL
): Promise<{ ok: boolean; written?: number; error?: string; targetSheet?: string }> {
  // If no webAppUrl provided or using placeholder
  if (!webAppUrl || webAppUrl.includes('PASTE_YOUR_')) {
    // Return graceful mock response for offline/preview mode
    await new Promise((r) => setTimeout(r, 600));
    return {
      ok: true,
      written: payload.entries.length,
      targetSheet: payload.sheetUrl || 'Google Sheet ຂອງ ' + payload.username,
    };
  }

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const res = await response.json();
    return res;
  } catch (err: any) {
    // Fallback gracefully with error message
    console.warn('Google Sheet send request failed:', err);
    return {
      ok: false,
      error: err?.message || 'ເຊື່ອມຕໍ່ Google Apps Script ບໍ່ໄດ້',
    };
  }
}
