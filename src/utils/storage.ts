import { UserAccount, UserSession } from '../types';

export const LOCAL_STORAGE_KEYS = {
  USERS: 'laoLotteryUsers_v2',
  SESSION: 'laoLotterySession_v2',
  BET_TEXT: 'betcalc_betInput',
  BANNED_TEXT: 'betcalc_bannedInput',
  COMMISSION_PCT: 'betcalc_pctInput',
  GLOBAL_WEBAPP_URL: 'betcalc_webappUrl',
  MASTER_SHEET_TAB: 'betcalc_sheetTab',
};

export const DEFAULT_SAMPLE_BET_TEXT = [
  '11,51,91= 20',
  '12.52.92 : 15',
  '34 44 54 = 1ລ້ານ',
  '07 47 87:20*10',
  '889-89=20 (ບົນ-ລ່າງ)',
  '39,79,38,78,339,379,538,578 ຮູ20',
  '09,49,89,009,049,089 ຮູ10',
  'ບລ',
  '',
  '37 77 03 43 83 33 73 07 47 87=20',
  'ຫລັກ 8 7 3 = 10',
  '',
  '174',
  '471',
  '147',
  '417',
  '741',
  '714',
  '=200฿',
  '',
  '14 54 94 38 78 07 47 87 21 61',
  '',
  'ຫລັກ 6=5',
  'ຫລັກ 0,1,2,4,5,7,8,9=2',
].join('\n');

export const INITIAL_USERS: UserAccount[] = [
  {
    username: 'bk',
    expiry: null,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/master-bk-sheet/edit',
    sheetTab: 'No1.',
    notes: 'Admin ຫຼັກ (ຜູ້ຈັດການລະບົບ)',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'fon',
    expiry: null,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/fon-personal-sheet/edit',
    sheetTab: 'No1.',
    notes: 'ຢູ່ເຊີ Fon - ຊີດສ່ວນຕົວ',
    createdAt: new Date().toISOString(),
  },
  {
    username: 'noy',
    expiry: null,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/noy-personal-sheet/edit',
    sheetTab: 'No1.',
    notes: 'ຢູ່ເຊີ Noy - ຊີດສ່ວນຕົວ',
    createdAt: new Date().toISOString(),
  },
];

export function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS);
    if (!raw) {
      saveUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: UserAccount[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function getSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION);
  } catch {
    // ignore
  }
}
