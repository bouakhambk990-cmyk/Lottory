export interface BetRow {
  number: string;
  lineNo: number;
  raw: string;
  unitValue: number;
  occurrences: number;
  subtotal: number;
  banned: boolean;
}

export interface SummaryGroup {
  number: string;
  occurrences: number;
  subtotal: number;
  banned: boolean;
}

export interface ParseResult {
  rows: BetRow[];
  warnings: string[];
}

export interface UserAccount {
  username: string;
  expiry?: string | null;
  sheetUrl?: string; // Custom Google Sheet URL or Apps Script URL for this specific user
  sheetTab?: string; // Target tab name, default 'No1.'
  notes?: string;
  createdAt?: string;
}

export interface UserSession {
  username: string;
  expiry?: string | null;
  sheetUrl?: string;
  sheetTab?: string;
  checkedAt: number;
}

export interface GoogleSheetSendPayload {
  action: 'addEntries';
  token: string;
  username: string;
  sheetUrl?: string;
  sheetTab?: string;
  startRow?: number;
  colIndex?: string;
  colNumber?: string;
  colPrice?: string;
  entries: Array<{ number: string; price: number }>;
}
