/**
 * ວາງໂຄ້ດນີ້ໃສ່ Google Apps Script (script.google.com ຫຼື Extensions > Apps Script)
 * ຈາກນັ້ນ Deploy > New deployment > Web app
 *   Execute as: Me   /   Who has access: Anyone
 * ເອົາ URL ທີ່ໄດ້ໄປໃສ່ CONFIG.WEBAPP_URL ຢູ່ຫົວໄຟລ໌ index.html
 *
 * ໝາຍເຫດ: ລາຍຊື່ຜູ້ໃຊ້ + ສິດເຂົ້າໃຊ້ (username/expiry/sheetUrl) ຖືກຈັດການຢູ່ໃນ
 * ໂຕເວັບແອັບເອງແລ້ວ (localStorage) — script ນີ້ບໍ່ຕ້ອງມີແຖບ "Users" ອີກຕໍ່ໄປ,
 * ໜ້າທີ່ດຽວຂອງມັນຄື ຮັບຄຳຂໍ "sendTotal" ຈາກເວັບແອັບ ແລ້ວຂຽນລົງຊີດປາຍທາງທີ່
 * ເວັບແອັບສົ່ງ sheetUrl ມາໃຫ້ໂດຍກົງ (ບັນຊີ Google ທີ່ deploy script ນີ້ ຕ້ອງມີ
 * ສິດແກ້ໄຂຊີດຂອງທຸກຜູ້ໃຊ້ນັ້ນໆ).
 */
var SHARED_TOKEN = "bk123"; // ຕ້ອງກົງກັບ CONFIG.SHARED_TOKEN ໃນ index.html
var DEFAULT_SHEET_TAB = "No1."; // ຕ້ອງກົງກັບ CONFIG.SHEET_TAB ໃນ index.html

function doPost(e){
  try{
    var body = JSON.parse(e.postData.contents);
    if(body.token !== SHARED_TOKEN) return json_({ ok:false, error:"bad token" });
    if(body.action === "sendTotal") return json_(sendTotal_(body));
    if(body.action === "issueBill") return json_(issueBill_(body));
    if(body.action === "searchBills") return json_(searchBills_(body));
    if(body.action === "saveWinResult") return json_(saveWinResult_(body));
    if(body.action === "getWinResult") return json_(getWinResult_(body));
    if(body.action === "dailySummary") return json_(dailySummary_(body));
    if(body.action === "getBoard") return json_(getUserBoard_(body));
    if(body.action === "saveBoard") return json_(setUserBoard_(body));
    if(body.action === "getUsers") return json_(getUsers_(body));
    if(body.action === "saveUsers") return json_(saveUsers_(body));
    if(body.action === "getAdminPassword") return json_(getAdminPassword_(body));
    if(body.action === "setAdminPassword") return json_(setAdminPassword_(body));
    if(body.action === "getBrandText") return json_(getBrandText_(body));
    if(body.action === "setBrandText") return json_(setBrandText_(body));
    return json_({ ok:false, error:"unknown action" });
  }catch(err){
    // ຄືນ JSON ສະເໝີ — ຖ້າປ່ອຍໃຫ້ exception ຫລຸດອອກໄປ Google ຈະສົ່ງໜ້າ HTML error ກັບຄືນ
    // ແທນ ເຮັດໃຫ້ຝັ່ງເວັບແອັບ (index.html) parse JSON ບໍ່ໄດ້ ແລະ ຂຶ້ນວ່າ "ສົ່ງບໍ່ໄດ້"
    return json_({ ok:false, error: String(err && err.message ? err.message : err) });
  }
}

// ດຶງ Spreadsheet ID ອອກຈາກ URL ຫຼືຮັບ ID ຊື່ໆເລີຍກໍໄດ້
function extractSheetId_(urlOrId){
  var m = String(urlOrId).match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : String(urlOrId).trim();
}

// ຂຽນ (1) ແຖວ "ຍອດລວມ" ໃໝ່ ຄືເດີມ (ຄໍ Index/Number/Price) ແລະ
// (2) ຄ່າສະຫລຸບ dashboard (ຍອດຂາຍ/%/ຍອດຮັບ/ຍອດສົ່ງ/ຍອດຖືກເລກ 2ໂຕ-3ໂຕ-2ໂຕລ່າງ)
// ລົງ cell ທີ່ກຳນົດ — ທັງໝົດຢູ່ໃນຊີດ (tab) ດຽວກັນ ເພື່ອໃຫ້ dashboard + No1. ຢູ່ລວມກັນ
function sendTotal_(body){
  try{
    if(!body.sheetUrl) return { ok:false, error:"ບໍ່ພົບ Google Sheet URL ຂອງຜູ້ໃຊ້ນີ້" };
    var sheetId = extractSheetId_(body.sheetUrl);
    if(!sheetId) return { ok:false, error:"ອ່ານ Google Sheet ID ຈາກ URL ບໍ່ໄດ້: " + body.sheetUrl };
    var ss;
    try{
      ss = SpreadsheetApp.openById(sheetId);
    }catch(openErr){
      return { ok:false, error:"ເປີດຊີດບໍ່ໄດ້ (ID: " + sheetId + "). ກວດວ່າໄດ້ແຊຣ໌ສິດ 'ແກ້ໄຂ' ຊີດນີ້ໃຫ້ບັນຊີ Google ທີ່ deploy script ນີ້ແລ້ວບໍ່. ລາຍລະອຽດ: " + String(openErr && openErr.message ? openErr.message : openErr) };
    }
    var tabName = body.sheetTab || DEFAULT_SHEET_TAB;
    var sh = ss.getSheetByName(tabName);
    if(!sh){
      return { ok:false, error:"ບໍ່ພົບແທັບຊື່ '" + tabName + "' ໃນຊີດນີ້ — ກວດຊື່ແທັບ (ໂຕພິມນ້ອຍ/ໃຫຍ່ ແລະ ຈຸດ . ຕ້ອງກົງກັນ) ຫຼືແກ້ CONFIG.SHEET_TAB" };
    }

    var col = function(letter){ return letter.charCodeAt(0) - 64; };
    var idxCol = col(body.colIndex), numCol = col(body.colNumber), priceCol = col(body.colPrice);
    var startRow = body.startRow || 1;
    var row = Math.max(startRow, sh.getLastRow() + 1);
    var existingIdx = sh.getRange(startRow, idxCol, Math.max(sh.getLastRow()-startRow+1,1), 1).getValues();
    var nextIdx = 1;
    for(var r=0;r<existingIdx.length;r++){ if(existingIdx[r][0]) nextIdx = Number(existingIdx[r][0]) + 1; }
    sh.getRange(row, idxCol).setValue(nextIdx);
    sh.getRange(row, numCol).setValue("");
    sh.getRange(row, priceCol).setValue(body.totalAll || 0);

    var d = body.dashboard || {};
    var cells = body.dashboardCells || {};
    Object.keys(d).forEach(function(key){
      if(cells[key]) sh.getRange(cells[key]).setValue(d[key]);
    });

    return { ok:true, written:1, row:row };
  }catch(err){
    return { ok:false, error:"ຂຽນຊີດບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

// ອອກບີນ 1 ໃບ: ຂຽນລົງແທັບ "Bills" ຂອງຊີດຜູ້ໃຊ້ນັ້ນເອງ (ບໍ່ແມ່ນ Control Sheet ກາງ) —
// ນັບເລກທີ່ບີນຈາກຈຳນວນບີນທີ່ອອກແລ້ວໃນວັນດຽວກັນ (ຄໍ "ວັນທີ") ໃນຊີດນັ້ນ
function issueBill_(body){
  try{
    if(!body.sheetUrl) return { ok:false, error:"ບໍ່ພົບ Google Sheet URL ຂອງຜູ້ໃຊ້ນີ້" };
    var sheetId = extractSheetId_(body.sheetUrl);
    if(!sheetId) return { ok:false, error:"ອ່ານ Google Sheet ID ຈາກ URL ບໍ່ໄດ້: " + body.sheetUrl };
    var ss;
    try{
      ss = SpreadsheetApp.openById(sheetId);
    }catch(openErr){
      return { ok:false, error:"ເປີດຊີດບໍ່ໄດ້ (ID: " + sheetId + "). ກວດວ່າໄດ້ແຊຣ໌ສິດແກ້ໄຂໃຫ້ບັນຊີ deploy script ນີ້ແລ້ວບໍ່. ລາຍລະອຽດ: " + String(openErr && openErr.message ? openErr.message : openErr) };
    }
    var tabName = body.billTab || "Bills";
    var sh = ss.getSheetByName(tabName);
    // ຄໍລຳແຍກຊັດເຈນ: ຊຸດເລກ "ບົນ" (ລວມເລກ 3 ໂຕ) ແລະ ຊຸດເລກ "ລ່າງ" ແຍກກັນຄົນລະຄໍລຳ ພ້ອມລາຄາ,
    // ແລ້ວລວມຍອດທັງບີນຢູ່ຄໍລຳສຸດທ້າຍ.
    var expectedHeaders = ["ວັນທີ","ເວລາ","ເລກທີ່ບີນ","ຜູ້ໃຊ້","ຊຸດເລກບົນ (ພ້ອມລາຄາ)","ຊຸດເລກລ່າງ (ພ້ອມລາຄາ)","ລວມລາຄາທັງໝົດ"];
    if(!sh){
      sh = ss.insertSheet(tabName);
      sh.getRange(1,1,1,7).setValues([expectedHeaders]);
    } else {
      // ຖ້າແທັບ Bills ນີ້ມີຢູ່ແລ້ວຈາກໂຄ້ດເກົ່າ (ຮູບແບບເກົ່າ 6 ຄໍລຳ, ຄໍລຳ E ເປັນ "ເລກທີ່ພິມ (ຊຸດ)" ລວມບົນ-ລ່າງ
      // ປົນກັນ) — ແຊກຄໍລຳໃໝ່ 1 ຄໍລຳຫລັງ E ເພື່ອຍ້າຍຄໍລຳ "ລວມລາຄາທັງໝົດ" ເກົ່າ (F) ໄປເປັນ G ອັດຕະໂນມັດ
      // (ບໍ່ລຶບແຖວຂໍ້ມູນເກົ່າ — ຂໍ້ມູນເກົ່າໃນຄໍລຳ E ຈະຄ້າງໄວ້ຄືເດີມ ແຕ່ບໍ່ໄດ້ແຍກບົນ/ລ່າງຍ້ອນເປັນຂໍ້ມູນເກົ່າ).
      var curHeaders = sh.getRange(1,1,1,Math.min(Math.max(sh.getLastColumn(),6),6)).getValues()[0];
      var isOldFormat = String(curHeaders[4]||"") === "ເລກທີ່ພິມ (ຊຸດ)";
      if(isOldFormat) sh.insertColumnAfter(5);
      var needsUpdate = false;
      var nowHeaders = sh.getRange(1,1,1,7).getValues()[0];
      for(var hi=0; hi<7; hi++){ if(nowHeaders[hi] !== expectedHeaders[hi]){ needsUpdate = true; break; } }
      if(needsUpdate) sh.getRange(1,1,1,7).setValues([expectedHeaders]);
    }
    // ບັງຄັບໃຫ້ຄໍລຳ A (ວັນທີ) ແລະ B (ເວລາ) ເປັນ "Plain text" ສະເໝີ — ບໍ່ດັ່ງນັ້ນ Google Sheets ຈະແປງຄ່າ
    // "2026-08-14" / "19:37:10" ທີ່ພິມເຂົ້າໄປໃຫ້ກາຍເປັນວັນທີ/ເວລາ (Date object) ໂດຍອັດຕະໂນມັດ,
    // ເຮັດໃຫ້ (1) ການປຽບທຽບວັນທີເພື່ອຫາເລກທີ່ບີນຫລ້າສຸດບໍ່ກົງກັນ, ແລະ (2) ເວລາທີ່ໂຊວ໌ໃນຜົນຄົ້ນຫາ
    // ກາຍເປັນຂໍ້ຄວາມແປກໆ ເຊັ່ນ "Sat Dec 30 1899 19:37:10 GMT+xxxx" ແທນທີ່ຈະເປັນ "19:37:10".
    sh.getRange(2, 1, Math.max(sh.getMaxRows()-1,1), 2).setNumberFormat("@");
    var lineGroups = body.lineGroups || [];
    if(lineGroups.length === 0) return { ok:false, error:"ບໍ່ມີລາຍການໃຫ້ອອກບີນ" };
    var lastRow = sh.getLastRow();
    // ນັບເລກທີ່ບີນ = ຄ່າສູງສຸດຂອງ "ເລກທີ່ບີນ" (ຄໍ C) ໃນວັນດຽວກັນ +1
    // ປ້ອງກັນບັນຫາຄໍລຳ A ຖືກປ່ຽນເປັນ Date object ໂດຍ Sheets (ເກີດຈາກແຖວເກົ່າກ່ອນແກ້) —
    // normDate_() ແປງທັງ Date object ແລະ String ໃຫ້ເປັນຮູບແບບ "yyyy-MM-dd" ດຽວກັນກ່ອນປຽບທຽບ.
    var billNo = 1;
    if(lastRow >= 2){
      var scanRows = sh.getRange(2,1,lastRow-1,3).getValues(); // A=ວັນທີ, C=ເລກທີ່ບີນ
      var maxNo = 0;
      for(var i=0;i<scanRows.length;i++){
        if(normDate_(scanRows[i][0]) === String(body.dateStr)){
          var n = Number(scanRows[i][2]) || 0;
          if(n > maxNo) maxNo = n;
        }
      }
      billNo = maxNo + 1;
    }
    // ແຍກຊຸດເລກ "ບົນ" ແລະ "ລ່າງ" ອອກຄົນລະຄໍລຳ (ພ້ອມລາຄາຂອງມັນເອງ) — item.top/item.bottom ຖືກສົ່ງມາຈາກ
    // ຝັ່ງລູກຄ້າແລ້ວ (ແຍກໄວ້ຕັ້ງແຕ່ຂັ້ນຕອນຄິດໄລ່ຍອດ). ເລກ 3 ໂຕ ຈະຢູ່ໃນຊິດ "ບົນ" ເທົ່ານັ້ນ (ບໍ່ມີ "ລ່າງ").
    var topParts = [];
    var bottomParts = [];
    lineGroups.forEach(function(g){
      (g.items || []).forEach(function(it){
        if(it.top) topParts.push(it.number + "=" + it.top);
        if(it.bottom) bottomParts.push(it.number + "=" + it.bottom);
      });
    });
    var topCell = topParts.join(" ");
    var bottomCell = bottomParts.join(" ");
    var newRow = [ body.dateStr || "", body.timeStr || "", billNo, body.username || "", topCell, bottomCell, body.totalAll || 0 ];
    sh.getRange(lastRow+1, 1, 1, 7).setValues([newRow]);
    return { ok:true, billNo: billNo, rowsWritten: 1 };
  }catch(err){
    return { ok:false, error:"ອອກບີນບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

function normDate_(v){
  if(Object.prototype.toString.call(v) === "[object Date]"){
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(v);
}
function normTime_(v){
  if(Object.prototype.toString.call(v) === "[object Date]"){
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "HH:mm:ss");
  }
  return String(v);
}

// ຄົ້ນຫາເລກຢູ່ໃນແທັບ Bills ຂອງຊີດຜູ້ໃຊ້ນັ້ນ — ກວດແບບກົງເປັກ (exact token), ບໍ່ແມ່ນ substring,
// ເພື່ອບໍ່ໃຫ້ຄົ້ນ "5" ແລ້ວໄປພົບ "54"/"350" ແບບຜິດໆ.
// category: "top" = ຄົ້ນສະເພາະຄໍລຳ "ຊຸດເລກບົນ" (E, ລວມເລກ 3 ໂຕ), "bottom" = ຄົ້ນສະເພາະຄໍລຳ
// "ຊຸດເລກລ່າງ" (F, ສະເພາະບີນທີ່ມີເດີມພັນ ລ່າງ ຫລື ບົນລ່າງ ແທ້ໆ), ອື່ນໆ/ບໍ່ໃສ່ = ຄົ້ນທັງ 2 ຄໍລຳ.
function searchBills_(body){
  try{
    if(!body.sheetUrl) return { ok:false, error:"ບໍ່ພົບ Google Sheet URL" };
    var query = String(body.query || "").trim();
    if(!query) return { ok:false, error:"ບໍ່ມີເລກທີ່ຄົ້ນຫາ" };
    var category = String(body.category || "any");
    var filterDate = String(body.dateStr || "").trim(); // ຫວ່າງ = ບໍ່ກອງວັນທີ (ຄົ້ນທຸກວັນທີ)
    var filterTimeFromRaw = String(body.timeFrom || "").trim(); // "ຊ່ວງເວລາຮັບ" ຝັ່ງເລີ່ມ ຫວ່າງ = ບໍ່ກອງຝັ່ງນີ້
    var filterTimeToRaw = String(body.timeTo || "").trim(); // "ຊ່ວງເວລາຮັບ" ຝັ່ງສິ້ນສຸດ ຫວ່າງ = ບໍ່ກອງຝັ່ງນີ້
    var pad2Time_ = function(t){ return t ? (t.length === 5 ? t + ":00" : t) : ""; }; // "14:30" -> "14:30:00"
    var filterTimeFrom = pad2Time_(filterTimeFromRaw);
    var filterTimeTo = pad2Time_(filterTimeToRaw);
    var sheetId = extractSheetId_(body.sheetUrl);
    if(!sheetId) return { ok:false, error:"ອ່ານ Google Sheet ID ຈາກ URL ບໍ່ໄດ້: " + body.sheetUrl };
    var ss = SpreadsheetApp.openById(sheetId);
    var sh = ss.getSheetByName(body.billTab || "Bills");
    if(!sh) return { ok:true, matches: [] };
    var lastRow = sh.getLastRow();
    if(lastRow < 2) return { ok:true, matches: [] };
    var lastCol = Math.max(sh.getLastColumn(), 7);
    var data = sh.getRange(2,1,lastRow-1,lastCol).getValues();
    var matches = [];
    var toTokens = function(cell){
      return String(cell||"").split(/\s+/).filter(function(t){ return t.length > 0; })
        .map(function(t){ return t.split("=")[0]; }); // "27=10" -> "27" ກ່ອນປຽບທຽບ
    };
    for(var i=0;i<data.length;i++){
      if(filterDate && normDate_(data[i][0]) !== filterDate) continue;
      if(filterTimeFrom && normTime_(data[i][1]) < filterTimeFrom) continue; // ຄົ້ນສະເພາະບີນທີ່ອອກຢູ່ໃນ "ຊ່ວງເວລາຮັບ" ເທົ່ານັ້ນ
      if(filterTimeTo && normTime_(data[i][1]) > filterTimeTo) continue;
      var topCell = String(data[i][4] || "");
      var bottomCell = String(data[i][5] || "");
      var totalVal = data[i][6];
      if(totalVal === undefined || totalVal === "") totalVal = data[i][5]; // ຮອງຮັບແຖວຮູບແບບເກົ່າ (6 ຄໍລຳ)
      var hit = false;
      var cellForDisplay = topCell;
      if(category === "bottom"){
        hit = toTokens(bottomCell).indexOf(query) !== -1;
        cellForDisplay = bottomCell;
      } else if(category === "top"){
        hit = toTokens(topCell).indexOf(query) !== -1;
        cellForDisplay = topCell;
      } else {
        var hitTop = toTokens(topCell).indexOf(query) !== -1;
        var hitBottom = toTokens(bottomCell).indexOf(query) !== -1;
        hit = hitTop || hitBottom;
        cellForDisplay = [topCell, bottomCell].filter(Boolean).join(" ");
      }
      if(hit){
        matches.push({
          date: normDate_(data[i][0]), time: normTime_(data[i][1]), billNo: data[i][2],
          username: String(data[i][3]||""), numbers: cellForDisplay,
          topNumbers: topCell, bottomNumbers: bottomCell, total: totalVal||0
        });
        if(matches.length >= 200) break;
      }
    }
    return { ok:true, matches: matches };
  }catch(err){
    return { ok:false, error:"ຄົ້ນຫາບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

// ຫາແຖວ (row index, 1-based ນັບຈາກ sheet ຈິງ) ທີ່ຄ່າໃນຄໍລຳທຳອິດ (ວັນທີ) ກົງກັບ dateStr ທີ່ໃຫ້ —
// ໃຊ້ຮ່ວມກັນລະຫວ່າງແທັບ "Results" ແລະ "Summary" ເພື່ອ "ອັບເດດແທນການເພີ່ມແຖວຊ້ຳ" (upsert ຕໍ່ວັນທີ).
function findRowByDate_(sh, dateStr){
  var lastRow = sh.getLastRow();
  if(lastRow < 2) return -1;
  var dates = sh.getRange(2,1,lastRow-1,1).getValues();
  for(var i=0;i<dates.length;i++){
    if(normDate_(dates[i][0]) === String(dateStr)) return i+2;
  }
  return -1;
}

// ================= ຜົນເລກ (Results) — ບັນທຶກເລກທີ່ອອກ + ອັດຕາຈ່າຍ ຕໍ່ວັນທີ ໄວ້ຢູ່ Google Sheet ກາງ =================
// ເພື່ອໃຫ້ຜົນເລກນີ້ຖືກໃຊ້ຮ່ວມກັນໄດ້ຂ້າມອຸປະກອນ (ບໍ່ຄ້າງແຕ່ໃນ localStorage ຂອງໂທລະສັບເຄື່ອງດຽວ) —
// upsert ຕໍ່ວັນທີ (ວັນດຽວກັນບັນທຶກຊ້ຳ = ອັບເດດແຖວເກົ່າ ບໍ່ແມ່ນເພີ່ມແຖວໃໝ່).
function saveWinResult_(body){
  try{
    if(!body.sheetUrl) return { ok:false, error:"ບໍ່ພົບ Google Sheet URL" };
    var dateStr = String(body.dateStr || "").trim();
    if(!dateStr) return { ok:false, error:"ບໍ່ມີວັນທີຜົນເລກ" };
    var sheetId = extractSheetId_(body.sheetUrl);
    if(!sheetId) return { ok:false, error:"ອ່ານ Google Sheet ID ຈາກ URL ບໍ່ໄດ້: " + body.sheetUrl };
    var ss;
    try{ ss = SpreadsheetApp.openById(sheetId); }
    catch(openErr){ return { ok:false, error:"ເປີດຊີດບໍ່ໄດ້ (ID: " + sheetId + "). ກວດສິດແກ້ໄຂ. ລາຍລະອຽດ: " + String(openErr && openErr.message ? openErr.message : openErr) }; }
    var sh = ss.getSheetByName("Results");
    var headers = ["ວັນທີ","ເລກ 2 ໂຕ","ອັດຕາ 2 ໂຕ","ເລກ 3 ໂຕ","ອັດຕາ 3 ໂຕ","ເລກ 2 ໂຕ ລ່າງ","ອັດຕາ 2 ໂຕ ລ່າງ","ບັນທຶກເວລາລ່າສຸດ"];
    if(!sh){
      sh = ss.insertSheet("Results");
      sh.getRange(1,1,1,headers.length).setValues([headers]);
    }
    sh.getRange(2, 1, Math.max(sh.getMaxRows()-1,1), 1).setNumberFormat("@"); // ຄໍລຳວັນທີ = Plain text ສະເໝີ
    var newRow = [ dateStr, String(body.n2||""), Number(body.r2)||0, String(body.n3||""), Number(body.r3)||0, String(body.n2b||""), Number(body.r2b)||0, new Date() ];
    var rowIdx = findRowByDate_(sh, dateStr);
    if(rowIdx > 0){
      sh.getRange(rowIdx, 1, 1, headers.length).setValues([newRow]);
    } else {
      sh.getRange(sh.getLastRow()+1, 1, 1, headers.length).setValues([newRow]);
    }
    return { ok:true, dateStr: dateStr };
  }catch(err){
    return { ok:false, error:"ບັນທຶກຜົນເລກບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

// ດຶງຜົນເລກ (ຖ້າມີ) ຂອງວັນທີໜຶ່ງກັບຄືນ — ໃຊ້ໂຫລດຜົນເລກທີ່ຄົນອື່ນ/ອຸປະກອນອື່ນເຄີຍບັນທຶກໄວ້ແລ້ວ.
function getWinResult_(body){
  try{
    if(!body.sheetUrl) return { ok:false, error:"ບໍ່ພົບ Google Sheet URL" };
    var dateStr = String(body.dateStr || "").trim();
    if(!dateStr) return { ok:false, error:"ບໍ່ມີວັນທີຜົນເລກ" };
    var sheetId = extractSheetId_(body.sheetUrl);
    if(!sheetId) return { ok:false, error:"ອ່ານ Google Sheet ID ຈາກ URL ບໍ່ໄດ້: " + body.sheetUrl };
    var ss = SpreadsheetApp.openById(sheetId);
    var sh = ss.getSheetByName("Results");
    if(!sh) return { ok:true, found:false };
    var rowIdx = findRowByDate_(sh, dateStr);
    if(rowIdx < 0) return { ok:true, found:false };
    var v = sh.getRange(rowIdx, 1, 1, 7).getValues()[0];
    return { ok:true, found:true, dateStr: normDate_(v[0]), n2: String(v[1]||""), r2: Number(v[2])||0, n3: String(v[3]||""), r3: Number(v[4])||0, n2b: String(v[5]||""), r2b: Number(v[6])||0 };
  }catch(err){
    return { ok:false, error:"ດຶງຜົນເລກບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

// ================= ຍອດຮັບ-ສົ່ງ ປະຈຳວັນ (Summary) — ອ່ານທຸກບີນຂອງວັນທີດຽວຈາກແທັບ Bills =================
// ຄິດໄລ່ ຍອດຂາຍລວມ / ຄອມມິຊັນ (ຍອດຮັບ) / ຍອດສົ່ງ ແລະ ຫັກລາງວັນທີ່ຕ້ອງຈ່າຍອອກ (ອີງໃສ່ n2/n3/n2b + ອັດຕາ
// ທີ່ສົ່ງມາ) ຈາກທຸກບີນຂອງວັນທີນັ້ນ (ບໍ່ແມ່ນສະເພາະຊຸດເລກທີ່ພິມຢູ່ໜ້າຈໍຕອນນີ້) — ແລ້ວບັນທຶກຜົນລົງແທັບ
// "Summary" (upsert ຕໍ່ວັນທີ) ເພື່ອໃຫ້ຍອດຮັບ-ສົ່ງທັງໝົດຢູ່ໃນ Google Sheet ສະເໝີ.
function dailySummary_(body){
  try{
    if(!body.sheetUrl) return { ok:false, error:"ບໍ່ພົບ Google Sheet URL" };
    var dateStr = String(body.dateStr || "").trim();
    if(!dateStr) return { ok:false, error:"ບໍ່ມີວັນທີ" };
    var sheetId = extractSheetId_(body.sheetUrl);
    if(!sheetId) return { ok:false, error:"ອ່ານ Google Sheet ID ຈາກ URL ບໍ່ໄດ້: " + body.sheetUrl };
    var ss;
    try{ ss = SpreadsheetApp.openById(sheetId); }
    catch(openErr){ return { ok:false, error:"ເປີດຊີດບໍ່ໄດ້ (ID: " + sheetId + "). ກວດສິດແກ້ໄຂ. ລາຍລະອຽດ: " + String(openErr && openErr.message ? openErr.message : openErr) }; }
    var billSh = ss.getSheetByName(body.billTab || "Bills");
    var pct = Number(body.pct) || 0;
    var n2 = String(body.n2||""), n3 = String(body.n3||""), n2b = String(body.n2b||"");
    var r2 = Number(body.r2)||0, r3 = Number(body.r3)||0, r2b = Number(body.r2b)||0;
    var totalAll = 0, billCount = 0;
    var win2Stake = 0, win3Stake = 0, win2BottomStake = 0;
    if(billSh){
      var lastRow = billSh.getLastRow();
      if(lastRow >= 2){
        var lastCol = Math.max(billSh.getLastColumn(), 7);
        var data = billSh.getRange(2,1,lastRow-1,lastCol).getValues();
        var parseTokens = function(cell){
          return String(cell||"").split(/\s+/).filter(function(t){ return t.length>0 && t.indexOf("=")!==-1; })
            .map(function(t){ var parts = t.split("="); return { num: parts[0], stake: Number(parts[1])||0 }; });
        };
        for(var i=0;i<data.length;i++){
          if(normDate_(data[i][0]) !== dateStr) continue;
          billCount++;
          var topCell = String(data[i][4] || "");
          var bottomCell = String(data[i][5] || "");
          var totalVal = data[i][6];
          if(totalVal === undefined || totalVal === "") totalVal = data[i][5]; // ຮອງຮັບແຖວຮູບແບບເກົ່າ (6 ຄໍລຳ)
          totalAll += Number(totalVal) || 0;
          parseTokens(topCell).forEach(function(tok){
            if(n2 && tok.num === n2 && tok.num.length === 2) win2Stake += tok.stake;
            if(n3 && tok.num === n3 && tok.num.length === 3) win3Stake += tok.stake;
          });
          parseTokens(bottomCell).forEach(function(tok){
            if(n2b && tok.num === n2b) win2BottomStake += tok.stake;
          });
        }
      }
    }
    // ປັດເສດຍອດຈ່າຍລາງວັນເປັນຫລັກພັນ: ເສດ 500 ຂຶ້ນໄປ ປັດຂຶ້ນເປັນ 1,000 / ຕ່ຳກວ່າ 500 ປັດລົງເປັນ 0
    // (ຄິດໄລ່ຢູ່ນີ້ຄືກັນກັບຝັ່ງ client — ຄິດລວມ stake ຂອງເລກນັ້ນທັງໝົດກ່ອນ ແລ້ວປັດເສດຄັ້ງດຽວຫລັງຄູນອັດຕາ)
    var roundTo1000_ = function(v){ var n = Math.round(v||0); var rem = ((n % 1000) + 1000) % 1000; var base = n - rem; return rem >= 500 ? base + 1000 : base; };
    var win2Amount = roundTo1000_(win2Stake * r2);
    var win3Amount = roundTo1000_(win3Stake * r3);
    var win2BottomAmount = roundTo1000_(win2BottomStake * r2b);
    var totalReceive = totalAll * (pct/100);
    var totalSendBeforeWin = totalAll - totalReceive;
    var totalWinAmount = win2Amount + win3Amount + win2BottomAmount;
    var totalSendNet = totalSendBeforeWin - totalWinAmount;
    // ທິດທາງ: ຍອດສົ່ງສຸດທິ ເປັນ + = "ສົ່ງແມ່" (ໄຮໄລສີຂຽວ), ເປັນ - = "ສົ່ງລູກ" (ໄຮໄລສີແດງ)
    var direction = (totalSendNet >= 0) ? "ສົ່ງແມ່" : "ສົ່ງລູກ";
    var directionColor = (totalSendNet >= 0) ? "#c6efce" : "#ffc7ce";
    var summarySh = ss.getSheetByName(String(body.billTab||"") === "Bills_THB" ? "Summary_THB" : "Summary");
    var sHeaders = ["ວັນທີ","ຈຳນວນບີນ","ຍອດຂາຍລວມ","% ຄອມ","ຍອດຮັບ (ຄອມ)","ຍອດສົ່ງ (ກ່ອນຫັກລາງວັນ)","ຖືກ 2 ໂຕ","ຖືກ 3 ໂຕ","ຖືກ 2 ໂຕ ລ່າງ","ລວມຈ່າຍລາງວັນ","ຍອດສົ່ງສຸດທິ","ທິດທາງ","ບັນທຶກເວລາລ່າສຸດ"];
    if(!summarySh){
      summarySh = ss.insertSheet(String(body.billTab||"") === "Bills_THB" ? "Summary_THB" : "Summary");
      summarySh.getRange(1,1,1,sHeaders.length).setValues([sHeaders]);
    } else {
      var curSHeaders = summarySh.getRange(1,1,1,Math.min(Math.max(summarySh.getLastColumn(),11),11)).getValues()[0];
      if(String(curSHeaders[10]||"") !== "ທິດທາງ") summarySh.insertColumnAfter(11); // ຍົກລະດັບ Sheet ເກົ່າ (11 ຄໍລຳ) ໃຫ້ມີ "ທິດທາງ"
      var nowSHeaders = summarySh.getRange(1,1,1,sHeaders.length).getValues()[0];
      var sNeedsUpdate = false;
      for(var shi=0; shi<sHeaders.length; shi++){ if(nowSHeaders[shi] !== sHeaders[shi]){ sNeedsUpdate = true; break; } }
      if(sNeedsUpdate) summarySh.getRange(1,1,1,sHeaders.length).setValues([sHeaders]);
    }
    summarySh.getRange(2, 1, Math.max(summarySh.getMaxRows()-1,1), 1).setNumberFormat("@");
    var newRow = [ dateStr, billCount, totalAll, pct, totalReceive, totalSendBeforeWin, win2Amount, win3Amount, win2BottomAmount, totalWinAmount, totalSendNet, direction, new Date() ];
    var rowIdx = findRowByDate_(summarySh, dateStr);
    var targetRow = (rowIdx > 0) ? rowIdx : (summarySh.getLastRow()+1);
    summarySh.getRange(targetRow, 1, 1, sHeaders.length).setValues([newRow]);
    summarySh.getRange(targetRow, 12, 1, 1).setBackground(directionColor).setFontWeight("bold"); // ໄຮໄລສີ ຄໍລຳ "ທິດທາງ"
    return {
      ok:true, dateStr: dateStr, billCount: billCount, pct: pct,
      totalAll: totalAll, totalReceive: totalReceive, totalSendBeforeWin: totalSendBeforeWin,
      win2Amount: win2Amount, win3Amount: win3Amount, win2BottomAmount: win2BottomAmount,
      totalWinAmount: totalWinAmount, totalSendNet: totalSendNet, direction: direction
    };
  }catch(err){
    return { ok:false, error:"ຄິດໄລ່ຍອດຮັບ-ສົ່ງບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

// ================= ຕາຕະລາງເລກ (Number Board) — ຊິ້ງຂໍ້ມູນຂ້າມອຸປະກອນພາຍໃນຜູ້ໃຊ້ດຽວກັນ =================
// ເກັບ boardState ທັງກ້ອນ (JSON ດຽວ) ໄວ້ໃນແທັບ "Board" ຂອງຊີດຜູ້ໃຊ້ນັ້ນເອງ (ຄືກັນກັບ Bills) —
// ດັ່ງນັ້ນຜູ້ໃຊ້ຄົນດຽວກັນ ເປີດຈາກອຸປະກອນໃດກໍ່ຕາມ (ໂທລະສັບ/ຄອມ) ຈະເຫັນຂໍ້ມູນດຽວກັນ.
function getUserBoard_(body){
  try{
    if(!body.sheetUrl) return { ok:false, error:"ບໍ່ພົບ Google Sheet URL" };
    var sheetId = extractSheetId_(body.sheetUrl);
    if(!sheetId) return { ok:false, error:"ອ່ານ Google Sheet ID ຈາກ URL ບໍ່ໄດ້: " + body.sheetUrl };
    var ss = SpreadsheetApp.openById(sheetId);
    var sh = ss.getSheetByName("Board");
    if(!sh) return { ok:true, boardJson: null };
    var lastRow = sh.getLastRow();
    if(lastRow < 2) return { ok:true, boardJson: null };
    var values = sh.getRange(2,1,lastRow-1,2).getValues();
    for(var i=0;i<values.length;i++){
      if(values[i][0] === "boardState") return { ok:true, boardJson: String(values[i][1] || "") };
    }
    return { ok:true, boardJson: null };
  }catch(err){
    return { ok:false, error:"ອ່ານຕາຕະລາງເລກບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}
function setUserBoard_(body){
  try{
    if(!body.sheetUrl) return { ok:false, error:"ບໍ່ພົບ Google Sheet URL" };
    if(typeof body.boardJson !== "string") return { ok:false, error:"ບໍ່ມີຂໍ້ມູນຕາຕະລາງເລກໃຫ້ບັນທຶກ" };
    var sheetId = extractSheetId_(body.sheetUrl);
    if(!sheetId) return { ok:false, error:"ອ່ານ Google Sheet ID ຈາກ URL ບໍ່ໄດ້: " + body.sheetUrl };
    var ss = SpreadsheetApp.openById(sheetId);
    var sh = ss.getSheetByName("Board");
    if(!sh){
      sh = ss.insertSheet("Board");
      sh.getRange(1,1,1,2).setValues([["key","value"]]);
    }
    var lastRow = sh.getLastRow();
    var foundRow = -1;
    if(lastRow >= 2){
      var values = sh.getRange(2,1,lastRow-1,1).getValues();
      for(var i=0;i<values.length;i++){
        if(values[i][0] === "boardState"){ foundRow = i+2; break; }
      }
    }
    if(foundRow > 0){
      sh.getRange(foundRow,2).setValue(body.boardJson);
    } else {
      var newRow = Math.max(lastRow+1, 2);
      sh.getRange(newRow,1,1,2).setValues([["boardState", body.boardJson]]);
    }
    return { ok:true };
  }catch(err){
    return { ok:false, error:"ບັນທຶກຕາຕະລາງເລກບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

function json_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ================= Control Sheet ກາງ (ລາຍຊື່ຜູ້ໃຊ້ + ລະຫັດ Admin) =================
// ໃຊ້ Google Sheet ດຽວ (URL ຕັ້ງໄວ້ໃນ CONFIG.CONTROL_SHEET_URL ຢູ່ index.html) ເປັນບ່ອນເກັບ
// ຂໍ້ມູນກາງ — ແທັບ "Users" (username/expiry/sheetUrl) ແລະ ແທັບ "Config" (key/value,
// ໃຊ້ເກັບ adminPassword) ຈະຖືກສ້າງອັດຕະໂນມັດຄັ້ງທຳອິດຖ້າຍັງບໍ່ມີ.
function getControlSheet_(controlSheetUrl, tabName, headers){
  var sheetId = extractSheetId_(controlSheetUrl);
  var ss = SpreadsheetApp.openById(sheetId);
  var sh = ss.getSheetByName(tabName);
  if(!sh){
    sh = ss.insertSheet(tabName);
    sh.getRange(1,1,1,headers.length).setValues([headers]);
  }
  return sh;
}

function getUsers_(body){
  try{
    if(!body.controlSheetUrl) return { ok:false, error:"ບໍ່ພົບ Control Sheet URL" };
    var sh = getControlSheet_(body.controlSheetUrl, "Users", ["username","expiry","sheetUrl"]);
    var lastRow = sh.getLastRow();
    if(lastRow < 2) return { ok:true, users:[] };
    var values = sh.getRange(2,1,lastRow-1,3).getValues();
    var users = values.filter(function(r){ return r[0]; }).map(function(r){
      return { username:String(r[0]), expiry: r[1] ? String(r[1]) : null, sheetUrl: r[2] ? String(r[2]) : "" };
    });
    return { ok:true, users:users };
  }catch(err){
    return { ok:false, error:"ອ່ານລາຍຊື່ຜູ້ໃຊ້ບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

function saveUsers_(body){
  try{
    if(!body.controlSheetUrl) return { ok:false, error:"ບໍ່ພົບ Control Sheet URL" };
    var sh = getControlSheet_(body.controlSheetUrl, "Users", ["username","expiry","sheetUrl"]);
    var users = body.users || [];
    var lastRow = sh.getLastRow();
    if(lastRow > 1) sh.getRange(2,1,lastRow-1,3).clearContent();
    if(users.length > 0){
      var rows = users.map(function(u){ return [u.username||"", u.expiry||"", u.sheetUrl||""]; });
      sh.getRange(2,1,rows.length,3).setValues(rows);
    }
    return { ok:true, count: users.length };
  }catch(err){
    return { ok:false, error:"ບັນທຶກລາຍຊື່ຜູ້ໃຊ້ບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

function getAdminPassword_(body){
  try{
    if(!body.controlSheetUrl) return { ok:false, error:"ບໍ່ພົບ Control Sheet URL" };
    var sh = getControlSheet_(body.controlSheetUrl, "Config", ["key","value"]);
    var lastRow = sh.getLastRow();
    if(lastRow >= 2){
      var values = sh.getRange(2,1,lastRow-1,2).getValues();
      for(var i=0;i<values.length;i++){
        if(values[i][0] === "adminPassword" && values[i][1]) return { ok:true, password: String(values[i][1]) };
      }
    }
    return { ok:true, password: null };
  }catch(err){
    return { ok:false, error:"ອ່ານລະຫັດ Admin ບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

function setAdminPassword_(body){
  try{
    if(!body.controlSheetUrl) return { ok:false, error:"ບໍ່ພົບ Control Sheet URL" };
    if(!body.password) return { ok:false, error:"ບໍ່ມີລະຫັດໃໝ່" };
    var sh = getControlSheet_(body.controlSheetUrl, "Config", ["key","value"]);
    var lastRow = sh.getLastRow();
    var foundRow = -1;
    if(lastRow >= 2){
      var values = sh.getRange(2,1,lastRow-1,2).getValues();
      for(var i=0;i<values.length;i++){
        if(values[i][0] === "adminPassword"){ foundRow = i+2; break; }
      }
    }
    if(foundRow > 0){
      sh.getRange(foundRow,2).setValue(body.password);
    } else {
      var newRow = Math.max(lastRow+1, 2);
      sh.getRange(newRow,1,1,2).setValues([["adminPassword", body.password]]);
    }
    return { ok:true };
  }catch(err){
    return { ok:false, error:"ບັນທຶກລະຫັດ Admin ບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}

// ອ່ານ/ບັນທຶກຄ່າ key/value ໃນແທັບ Config ແບບທົ່ວໄປ (ໃຊ້ຮ່ວມກັນລະຫວ່າງ adminPassword ແລະ brandText)
function getConfigValue_(controlSheetUrl, key){
  var sh = getControlSheet_(controlSheetUrl, "Config", ["key","value"]);
  var lastRow = sh.getLastRow();
  if(lastRow >= 2){
    var values = sh.getRange(2,1,lastRow-1,2).getValues();
    for(var i=0;i<values.length;i++){
      if(values[i][0] === key) return String(values[i][1]);
    }
  }
  return null;
}
function setConfigValue_(controlSheetUrl, key, value){
  var sh = getControlSheet_(controlSheetUrl, "Config", ["key","value"]);
  var lastRow = sh.getLastRow();
  var foundRow = -1;
  if(lastRow >= 2){
    var values = sh.getRange(2,1,lastRow-1,2).getValues();
    for(var i=0;i<values.length;i++){
      if(values[i][0] === key){ foundRow = i+2; break; }
    }
  }
  if(foundRow > 0){
    sh.getRange(foundRow,2).setValue(value);
  } else {
    var newRow = Math.max(lastRow+1, 2);
    sh.getRange(newRow,1,1,2).setValues([[key, value]]);
  }
}

function getBrandText_(body){
  try{
    if(!body.controlSheetUrl) return { ok:false, error:"ບໍ່ພົບ Control Sheet URL" };
    var v = getConfigValue_(body.controlSheetUrl, "brandText");
    return { ok:true, brandText: (v === null ? null : v) };
  }catch(err){
    return { ok:false, error:"ອ່ານຂໍ້ຄວາມລາຍເຊັນບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}
function setBrandText_(body){
  try{
    if(!body.controlSheetUrl) return { ok:false, error:"ບໍ່ພົບ Control Sheet URL" };
    setConfigValue_(body.controlSheetUrl, "brandText", body.brandText || "");
    return { ok:true };
  }catch(err){
    return { ok:false, error:"ບັນທຶກຂໍ້ຄວາມລາຍເຊັນບໍ່ສຳເລັດ: " + String(err && err.message ? err.message : err) };
  }
}