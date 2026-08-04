/*************************************************************
 * ຕູ້ຄິດໄລ່ຫວຍ — Google Sheets Backend
 * ---------------------------------------------------------
 * ໄຟລ໌ນີ້ໃຊ້ຄູ່ກັບ index.html (ຕູ້ຄິດໄລ່ຫວຍ) ທີ່ສ້າງໄວ້ກ່ອນໜ້ານີ້.
 * ຄ່າ COL_INDEX / COL_NUMBER / COL_PRICE / START_ROW ຂ້າງລຸ່ມນີ້
 * ຕົງກັບ CONFIG ໃນ index.html (B / C / D / 18) ຫ້າມປ່ຽນຖ້າ
 * index.html ຍັງໃຊ້ຄ່າເດີມຢູ່.
 *
 * ວິທີຕິດຕັ້ງ:
 * 1. ສ້າງ Google Sheet ໃໝ່ (ຫຼືເປີດອັນທີ່ໃຊ້ຢູ່ແລ້ວ)
 * 2. Extensions > Apps Script > ວາງໂຄ້ດນີ້ທັງໝົດແທນທີ່ Code.gs ເດີມ
 * 3. ຮັນຟັງຊັນ setupSpreadsheet() ຄັ້ງດຽວ (ຈາກເມນູເທິງ toolbar ຂອງ
 *    Apps Script, ຫຼືເປີດ Sheet ແລ້ວກົດເມນູ "ຫວຍ" > "ຕັ້ງຄ່າຄັ້ງທຳອິດ")
 * 4. Deploy > New deployment > Web app > Execute as: Me,
 *    Who has access: Anyone > Deploy > ຄັດລອກ URL
 * 5. ວາງ URL ນັ້ນໃສ່ CONFIG.WEBAPP_URL ໃນ index.html
 *    (ຖ້າ Deploy ໃໝ່ URL ຈະປ່ຽນ — ຖ້າ Deploy ຊ້ຳ (New version) ຂອງ
 *    deployment ເກົ່າ URL ຈະຄືເດີມ ແລະບໍ່ຕ້ອງແກ້ index.html)
 *************************************************************/

// ==================== CONFIG (ຕ້ອງກົງກັບ index.html) ====================
var COL_INDEX   = 'B';
var COL_NUMBER  = 'C';
var COL_PRICE   = 'D';
var START_ROW   = 18;
var HEADER_ROW  = START_ROW - 1;   // ແຖວຫົວຕາຕະລາງ
var TOTAL_ROW   = HEADER_ROW;      // ຍອດລວມແຕ່ລະຊີດເກັບໄວ້ຄໍ F ແຖວ HEADER_ROW
var ROUND_PREFIX = 'No';           // ຊື່ຊີດງວດ: No1. , No2. , No3. ...

var SHARED_TOKEN   = 'bk123';      // ຕ້ອງກົງກັບ CONFIG.SHARED_TOKEN ໃນ index.html
var ADMIN_PASSWORD = '1234';

var SHEET_DASHBOARD = 'Dashboard';
var SHEET_NUMBERS   = 'ຕາຕະລາງເລກ';
var SHEET_SUMMARY   = 'ສະຫລຸບ';
var SHEET_USERS     = 'Users';
var SHEET_DAILY_LOG = 'ລາຍງານລາຍວັນ';

var PAYOUT_2DIGIT_DEFAULT = 90;
var PAYOUT_3DIGIT_DEFAULT = 900;

// ==================== ຕັ້ງຄ່າຄັ້ງທຳອິດ ====================

function onOpen(){
  SpreadsheetApp.getUi().createMenu('ຫວຍ')
    .addItem('ຕັ້ງຄ່າຄັ້ງທຳອິດ (Setup)', 'setupSpreadsheet')
    .addSeparator()
    .addItem('ຄິດໄລ່ລວມທຸກຊີດ (Refresh)', 'aggregateAll')
    .addItem('ສຳເນົາງວດໃໝ່', 'copyNewRound')
    .addItem('ລ້າງຂໍ້ມູນຊີດປັດຈຸບັນ', 'clearActiveRoundUi')
    .addSeparator()
    .addItem('ບັນທຶກ (Save + Refresh)', 'saveAndRefresh')
    .addItem('Export PDF (ຊີດປັດຈຸບັນ)', 'exportActiveSheetPdf')
    .addItem('Export Excel (ທັງໝົດ)', 'exportWholeAsExcel')
    .addItem('ສຳຮອງຂໍ້ມູນ (Backup)', 'backupSpreadsheet')
    .addToUi();
}

function setupSpreadsheet(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  buildDashboard_(ss);
  buildNumbersTable_(ss);
  buildSummary_(ss);
  buildUsers_(ss);
  var first = getOrCreateRoundSheet_(ss, ROUND_PREFIX + '1.');
  buildRoundSheetLayout_(first);
  refreshRoundList_(ss);
  aggregateAll();
  SpreadsheetApp.getUi().alert('ຕັ້ງຄ່າສຳເລັດ! ໄປທີ່ຊີດ Dashboard ເພື່ອເລີ່ມໃຊ້ງານ.');
}

function buildDashboard_(ss){
  var sh = ss.getSheetByName(SHEET_DASHBOARD) || ss.insertSheet(SHEET_DASHBOARD, 0);
  sh.clear();
  sh.getRange('A1:D1').merge().setValue('ຕູ້ຄິດໄລ່ຫວຍ — Dashboard')
    .setFontSize(16).setFontWeight('bold').setBackground('#1a2e22').setFontColor('#e9c65b');

  var labels = [
    ['A3','ວັນທີ:'], ['A4','ຮອບ:'], ['A5','% ທີ່ໄດ້ (ຄອມມິຊັນ):'],
    ['A6','ຊີດງວດປັດຈຸບັນ:'],
    ['A8','ຍອດລວມ (ບໍ່ລວມເລກຫ້າມ):'],
    ['A9','ຄ່າເປີເຊັນ:'],
    ['A10','ຍອດສຸດທິ (ສົ່ງຂຶ້ນ):'],
    ['A12','ເລກທີ່ອອກ 2 ໂຕ:'], ['A13','ເລກທີ່ອອກ 3 ໂຕ:'],
    ['A14','ອັດຕາຈ່າຍ 2 ໂຕ:'], ['A15','ອັດຕາຈ່າຍ 3 ໂຕ:'],
    ['A16','ຍອດຈ່າຍ (ຕາມເລກອອກ):'],
    ['A17','ກຳໄລ / ຂາດທຶນ:']
  ];
  labels.forEach(function(l){ sh.getRange(l[0]).setValue(l[1]).setFontWeight('bold'); });

  sh.getRange('B3').setFormula('=TODAY()').setNumberFormat('dd/mm/yyyy');
  var roundRule = SpreadsheetApp.newDataValidation().requireValueInList(['ເຊົ້າ','ແລງ'], true).build();
  sh.getRange('B4').setDataValidation(roundRule).setValue('ເຊົ້າ');
  sh.getRange('B5').setValue(20).setNumberFormat('0.0"%"');

  // B6: dropdown of round sheets — source list is refreshed by refreshRoundList_()
  sh.getRange('B6').setValue(ROUND_PREFIX + '1.');

  sh.getRange('B8').setFormula('=IFERROR(INDIRECT("\'"&B6&"\'!F' + TOTAL_ROW + '"),0)').setNumberFormat('#,##0');
  sh.getRange('B9').setFormula('=B8*B5/100').setNumberFormat('#,##0');
  sh.getRange('B10').setFormula('=B8-B9').setNumberFormat('#,##0');

  sh.getRange('B12').setValue('').setNumberFormat('00');
  sh.getRange('B13').setValue('').setNumberFormat('000');
  sh.getRange('B14').setValue(PAYOUT_2DIGIT_DEFAULT);
  sh.getRange('B15').setValue(PAYOUT_3DIGIT_DEFAULT);

  sh.getRange('B16').setFormula(
    '=IFERROR(IF(B12="",0,VLOOKUP(B12,\'' + SHEET_NUMBERS + '\'!A:C,3,FALSE)*B14),0)' +
    '+IFERROR(IF(B13="",0,VLOOKUP(B13,\'' + SHEET_NUMBERS + '\'!A:D,4,FALSE)*B15),0)'
  ).setNumberFormat('#,##0');

  sh.getRange('B17').setFormula('=B10-B16').setNumberFormat('#,##0');

  // ສີກຳໄລ/ຂາດທຶນ ອັດຕະໂນມັດ
  var rule1 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(0).setBackground('#c8f7d4').setFontColor('#0a6b2b')
    .setRanges([sh.getRange('B17')]).build();
  var rule2 = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0).setBackground('#f9d0cb').setFontColor('#a3271b')
    .setRanges([sh.getRange('B17')]).build();
  sh.setConditionalFormatRules([rule1, rule2]);

  sh.setColumnWidth(1, 210);
  sh.setColumnWidth(2, 150);
  sh.getRange('A1:D20').setFontFamily('Noto Sans Lao');
}

function buildNumbersTable_(ss){
  var sh = ss.getSheetByName(SHEET_NUMBERS) || ss.insertSheet(SHEET_NUMBERS, 1);
  sh.clear();
  sh.getRange('A1:E1').setValues([['ເລກ','ຍອດຂາຍ','ຊື້ 2 ໂຕ','ຊື້ 3 ໂຕ','ລວມອັດຕະໂນມັດ']])
    .setFontWeight('bold').setBackground('#1a2e22').setFontColor('#e9c65b');
  var rows = [];
  for(var i=0;i<100;i++){
    var num = (i<10?'0':'') + i;
    rows.push([num, '', '', '', '']);
  }
  sh.getRange(2,1,100,5).setValues(rows);
  // ຄ 3: ຍອດຊື້ 2 ໂຕ, ຄ 4: ຍອດຊື້ 3 ໂຕ, ຄ 5: ລວມ — ຄິດໄລ່ໂດຍ aggregateAll()
  // (ຄ່າຖືກຂຽນເປັນ static value ຈາກ script ບໍ່ແມ່ນ live formula ເພາະຕ້ອງລວມ
  //  ຫລາຍຊີດງວດພ້ອມກັນ ຊຶ່ງ Sheets formula ລວມຊື່ຊີດແບບ dynamic ບໍ່ໄດ້)
  sh.getRange(2,2,100,1).setNumberFormat('#,##0');
  sh.getRange(2,3,100,3).setNumberFormat('#,##0');
  sh.setFrozenRows(1);
  sh.setColumnWidths(1,5,110);
}

function buildSummary_(ss){
  var sh = ss.getSheetByName(SHEET_SUMMARY) || ss.insertSheet(SHEET_SUMMARY, 2);
  sh.clear();
  sh.getRange('A1:D1').merge().setValue('ສະຫລຸບ').setFontWeight('bold')
    .setBackground('#1a2e22').setFontColor('#e9c65b');
  sh.getRange('A3').setValue('ຍອດຂາຍທັງໝົດ:').setFontWeight('bold');
  sh.getRange('A4').setValue('ຍອດຈ່າຍ:').setFontWeight('bold');
  sh.getRange('A5').setValue('ກຳໄລ:').setFontWeight('bold');
  sh.getRange('B3').setFormula('=' + SHEET_DASHBOARD + '!B8').setNumberFormat('#,##0');
  sh.getRange('B4').setFormula('=' + SHEET_DASHBOARD + '!B16').setNumberFormat('#,##0');
  sh.getRange('B5').setFormula('=B3-B4').setNumberFormat('#,##0');

  var daily = ss.getSheetByName(SHEET_DAILY_LOG) || ss.insertSheet(SHEET_DAILY_LOG, 3);
  daily.clear();
  daily.getRange('A1:F1').setValues([['ວັນທີ','ຮອບ','ຊີດ','ຍອດລວມ','ຍອດຈ່າຍ','ກຳໄລ']])
    .setFontWeight('bold').setBackground('#1a2e22').setFontColor('#e9c65b');
  daily.setFrozenRows(1);
  daily.setColumnWidths(1,6,110);

  sh.setColumnWidth(1, 160);
}

function buildUsers_(ss){
  var sh = ss.getSheetByName(SHEET_USERS) || ss.insertSheet(SHEET_USERS);
  sh.clear();
  sh.getRange('A1:B1').setValues([['username','expiry']]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.hideSheet();
}

function getOrCreateRoundSheet_(ss, name){
  var sh = ss.getSheetByName(name);
  if(!sh) sh = ss.insertSheet(name);
  return sh;
}

function buildRoundSheetLayout_(sh){
  sh.clear();
  sh.getRange('A1:D1').merge().setValue('ໃບບັນທຶກເລກ — ' + sh.getName())
    .setFontWeight('bold').setBackground('#1a2e22').setFontColor('#e9c65b');
  sh.getRange('A3').setValue('ວັນທີ:').setFontWeight('bold');
  sh.getRange('B3').setFormula('=' + SHEET_DASHBOARD + '!B3');
  sh.getRange('A4').setValue('ຮອບ:').setFontWeight('bold');
  sh.getRange('B4').setFormula('=' + SHEET_DASHBOARD + '!B4');

  sh.getRange('E' + HEADER_ROW).setValue('ລວມ (ບໍ່ລວມເລກຫ້າມ):').setFontWeight('bold');
  sh.getRange('F' + TOTAL_ROW).setFormula(
    '=SUM(' + COL_PRICE + START_ROW + ':' + COL_PRICE + '10000)'
  ).setNumberFormat('#,##0');

  var headerRow = [COL_INDEX + HEADER_ROW, COL_NUMBER + HEADER_ROW, COL_PRICE + HEADER_ROW];
  sh.getRange(COL_INDEX + HEADER_ROW).setValue('ລຳດັບ').setFontWeight('bold');
  sh.getRange(COL_NUMBER + HEADER_ROW).setValue('ເລກ').setFontWeight('bold');
  sh.getRange(COL_PRICE + HEADER_ROW).setValue('ລາຄາ (ກີບ)').setFontWeight('bold');
  sh.getRange(COL_INDEX + HEADER_ROW + ':' + COL_PRICE + HEADER_ROW)
    .setBackground('#233a2c').setFontColor('#e9c65b');
  sh.setColumnWidths(2,4,100);
}

// ==================== ຮອບ / ຊີດໃໝ່ ====================

function copyNewRound(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var n = 1;
  while(ss.getSheetByName(ROUND_PREFIX + n + '.')) n++;
  var newName = ROUND_PREFIX + n + '.';
  var sh = ss.insertSheet(newName);
  buildRoundSheetLayout_(sh);
  ss.getSheetByName(SHEET_DASHBOARD).getRange('B6').setValue(newName);
  refreshRoundList_(ss);
  aggregateAll();
  SpreadsheetApp.getUi().alert('ສ້າງຊີດງວດໃໝ່ແລ້ວ: ' + newName);
}

function refreshRoundList_(ss){
  var names = ss.getSheets()
    .map(function(s){ return s.getName(); })
    .filter(function(n){ return n.indexOf(ROUND_PREFIX) === 0; });
  if(names.length === 0) return;
  var dash = ss.getSheetByName(SHEET_DASHBOARD);
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(names, true).build();
  dash.getRange('B6').setDataValidation(rule);
}

function clearActiveRoundUi(){
  var sh = SpreadsheetApp.getActiveSheet();
  if(sh.getName().indexOf(ROUND_PREFIX) !== 0){
    SpreadsheetApp.getUi().alert('ກະລຸນາເປີດຊີດງວດ (No1. , No2. ...) ກ່ອນລ້າງຂໍ້ມູນ');
    return;
  }
  var ui = SpreadsheetApp.getUi();
  var res = ui.alert('ລ້າງຂໍ້ມູນຊີດ "' + sh.getName() + '"?', 'ຂໍ້ມູນທຸກແຖວຈະຖືກລຶບ (ບໍ່ສາມາດກູ້ຄືນໄດ້)', ui.ButtonSet.YES_NO);
  if(res !== ui.Button.YES) return;
  clearRoundData_(sh);
  aggregateAll();
}

function clearRoundData_(sh){
  var lastRow = sh.getLastRow();
  if(lastRow >= START_ROW){
    sh.getRange(START_ROW, 2, lastRow - START_ROW + 1, 3).clearContent();
  }
}

// ==================== ລວມຍອດ (ຕາຕະລາງເລກ + Dashboard) ====================

function aggregateAll(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var roundName = ss.getSheetByName(SHEET_DASHBOARD).getRange('B6').getValue();
  var sh = ss.getSheetByName(roundName);
  var numSh = ss.getSheetByName(SHEET_NUMBERS);
  if(!sh || !numSh) return;

  var totals2 = {}, totals3 = {};
  for(var i=0;i<100;i++){ var k=(i<10?'0':'')+i; totals2[k]=0; totals3[k]=0; }

  var lastRow = sh.getLastRow();
  if(lastRow >= START_ROW){
    var data = sh.getRange(START_ROW, 3, lastRow - START_ROW + 1, 2).getValues(); // C=number, D=price
    data.forEach(function(row){
      var num = String(row[0]).trim();
      var price = Number(row[1]) || 0;
      if(!num) return;
      if(num.length === 2 && totals2.hasOwnProperty(num)) totals2[num] += price;
      else if(num.length === 3){
        var last2 = num.slice(-2);
        if(totals3.hasOwnProperty(last2)) totals3[last2] += price;
      }
    });
  }

  var out = [];
  for(var j=0;j<100;j++){
    var k2 = (j<10?'0':'')+j;
    var t2 = totals2[k2], t3 = totals3[k2];
    out.push([t2 + t3, t2, t3, t2 + t3]);
  }
  numSh.getRange(2, 2, 100, 4).setValues(out);

  SpreadsheetApp.flush();
}

// ==================== ບັນທຶກ / Export / Backup ====================

function saveAndRefresh(){
  aggregateAll();
  logDailySnapshot_();
  SpreadsheetApp.getActiveSpreadsheet().toast('ບັນທຶກ ແລະ ຄິດໄລ່ລວມສຳເລັດ', 'ຫວຍ', 4);
}

function logDailySnapshot_(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dash = ss.getSheetByName(SHEET_DASHBOARD);
  var daily = ss.getSheetByName(SHEET_DAILY_LOG);
  if(!dash || !daily) return;
  daily.appendRow([
    dash.getRange('B3').getDisplayValue(),
    dash.getRange('B4').getValue(),
    dash.getRange('B6').getValue(),
    dash.getRange('B8').getValue(),
    dash.getRange('B16').getValue(),
    dash.getRange('B17').getValue()
  ]);
}

function exportActiveSheetPdf(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=pdf&gid=' + sh.getSheetId()
    + '&portrait=false&fitw=true&gridlines=true';
  var token = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  var folder = getOrCreateBackupFolder_();
  var file = folder.createFile(response.getBlob().setName(sh.getName() + '_' + nowStamp_() + '.pdf'));
  SpreadsheetApp.getUi().alert('Export PDF ສຳເລັດ: ' + file.getUrl());
}

function exportWholeAsExcel(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx';
  var token = ScriptApp.getOAuthToken();
  var response = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  var folder = getOrCreateBackupFolder_();
  var file = folder.createFile(response.getBlob().setName(ss.getName() + '_' + nowStamp_() + '.xlsx'));
  SpreadsheetApp.getUi().alert('Export Excel ສຳເລັດ: ' + file.getUrl());
}

function backupSpreadsheet(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var file = DriveApp.getFileById(ss.getId());
  var folder = getOrCreateBackupFolder_();
  var copy = file.makeCopy(ss.getName() + ' - ສຳຮອງ ' + nowStamp_(), folder);
  SpreadsheetApp.getUi().alert('ສຳຮອງຂໍ້ມູນສຳເລັດ: ' + copy.getUrl());
}

function getOrCreateBackupFolder_(){
  var name = 'ຫວຍ - ສຳຮອງ/Export';
  var it = DriveApp.getFoldersByName(name);
  if(it.hasNext()) return it.next();
  return DriveApp.createFolder(name);
}

function nowStamp_(){
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Vientiane', 'yyyyMMdd_HHmmss');
}

// ==================== WEB APP (ໃຊ້ຮ່ວມກັບ index.html) ====================
// action ທີ່ຮອງຮັບ: checkUser, listUsers, addUser, deleteUser, addEntries
// ຮູບແບບ request ດຽວກັນກັບທີ່ index.html (gsGet / gsPost) ສົ່ງມາ

function doGet(e){
  var p = e.parameter;
  try{
    if(p.action === 'checkUser') return jsonOut_(checkUser_(p.username));
    if(p.action === 'listUsers'){
      if(p.token !== SHARED_TOKEN) return jsonOut_({ ok:false, error:'token ຜິດ' });
      return jsonOut_({ ok:true, users: listUsers_() });
    }
    return jsonOut_({ ok:false, error:'action ບໍ່ຮູ້ຈັກ' });
  }catch(err){
    return jsonOut_({ ok:false, error: String(err) });
  }
}

function doPost(e){
  try{
    var body = JSON.parse(e.postData.contents);
    if(body.action === 'addUser'){
      if(body.token !== SHARED_TOKEN) return jsonOut_({ ok:false, error:'token ຜິດ' });
      addUser_(body.username, body.expiry);
      return jsonOut_({ ok:true });
    }
    if(body.action === 'deleteUser'){
      if(body.token !== SHARED_TOKEN) return jsonOut_({ ok:false, error:'token ຜິດ' });
      deleteUser_(body.username);
      return jsonOut_({ ok:true });
    }
    if(body.action === 'addEntries'){
      if(body.token !== SHARED_TOKEN) return jsonOut_({ ok:false, error:'token ຜິດ' });
      var written = addEntries_(body.sheetTab, body.entries || []);
      return jsonOut_({ ok:true, written: written });
    }
    return jsonOut_({ ok:false, error:'action ບໍ່ຮູ້ຈັກ' });
  }catch(err){
    return jsonOut_({ ok:false, error: String(err) });
  }
}

function jsonOut_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function checkUser_(username){
  var users = listUsers_();
  var u = users.filter(function(x){ return x.username === username; })[0];
  if(!u) return { valid:false, reason:'notfound' };
  if(u.expiry && new Date(u.expiry).getTime() < Date.now()) return { valid:false, reason:'expired' };
  return { valid:true, expiry: u.expiry || null };
}

function listUsers_(){
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  if(!sh) return [];
  var last = sh.getLastRow();
  if(last < 2) return [];
  var data = sh.getRange(2,1,last-1,2).getValues();
  return data.filter(function(r){ return r[0]; }).map(function(r){
    return { username: String(r[0]), expiry: r[1] ? new Date(r[1]).toISOString() : null };
  });
}

function addUser_(username, expiryIso){
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  var last = sh.getLastRow();
  var rowIdx = -1;
  if(last >= 2){
    var names = sh.getRange(2,1,last-1,1).getValues();
    for(var i=0;i<names.length;i++){ if(names[i][0] === username){ rowIdx = i+2; break; } }
  }
  var expiryVal = expiryIso ? new Date(expiryIso) : '';
  if(rowIdx === -1){
    sh.appendRow([username, expiryVal]);
  } else {
    sh.getRange(rowIdx,2).setValue(expiryVal);
  }
}

function deleteUser_(username){
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  var last = sh.getLastRow();
  if(last < 2) return;
  var names = sh.getRange(2,1,last-1,1).getValues();
  for(var i=0;i<names.length;i++){
    if(names[i][0] === username){ sh.deleteRow(i+2); return; }
  }
}

// entries: [{number, price}, ...] — ຂຽນຕໍ່ທ້າຍຊີດງວດທີ່ລະບຸ (ຫຼືຊີດປັດຈຸບັນຂອງ Dashboard)
function addEntries_(sheetTab, entries){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tab = sheetTab || ss.getSheetByName(SHEET_DASHBOARD).getRange('B6').getValue();
  var sh = getOrCreateRoundSheet_(ss, tab);
  if(sh.getLastRow() < HEADER_ROW) buildRoundSheetLayout_(sh);

  var lastRow = Math.max(sh.getLastRow(), START_ROW - 1);
  var nextIdx = 1;
  if(lastRow >= START_ROW){
    var existingIdx = sh.getRange(START_ROW, 2, lastRow - START_ROW + 1, 1).getValues();
    for(var i=existingIdx.length-1;i>=0;i--){
      if(existingIdx[i][0] !== ''){ nextIdx = Number(existingIdx[i][0]) + 1; break; }
    }
  }

  var rows = entries.map(function(en, idx){
    return [nextIdx + idx, String(en.number), Number(en.price) || 0];
  });
  if(rows.length > 0){
    sh.getRange(lastRow + 1, 2, rows.length, 3).setValues(rows);
  }

  aggregateAll();
  return rows.length;
}
