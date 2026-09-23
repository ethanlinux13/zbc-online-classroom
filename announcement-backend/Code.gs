const ANNOUNCEMENT_SHEET = 'Announcements';
const ANNOUNCEMENT_HEADERS = ['id','publishedAt','title','message','priority','imageUrl','facebookUrl','expiresAt','active'];
const CLASS_SHEET = 'ClassLinks';
const CLASS_HEADERS = ['day','subject','instructor','platform','classTime','link','active'];

function setupPortal() {
  setupSheet_(ANNOUNCEMENT_SHEET, ANNOUNCEMENT_HEADERS);
  setupSheet_(CLASS_SHEET, CLASS_HEADERS);
}

function setupAnnouncements() { setupPortal(); }

function setupSheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,headers.length).setFontWeight('bold');
}

function doGet(e) {
  setupPortal();
  const ss = SpreadsheetApp.getActive();
  const now = new Date();

  const a = ss.getSheetByName(ANNOUNCEMENT_SHEET).getDataRange().getDisplayValues();
  const announcements = a.slice(1)
    .filter(r => String(r[8]).toLowerCase() !== 'false')
    .map(r => ({id:r[0],publishedAt:r[1],title:r[2],message:r[3],priority:r[4]||'Normal',imageUrl:r[5],facebookUrl:r[6],expiresAt:r[7]}))
    .filter(x => !x.expiresAt || !isNaN(new Date(x.expiresAt)) && new Date(x.expiresAt) >= now)
    .reverse();

  const s = ss.getSheetByName(CLASS_SHEET).getDataRange().getDisplayValues();
  const schedule = {};
  s.slice(1)
    .filter(r => r[0] && r[1] && String(r[6]).toLowerCase() !== 'false')
    .forEach(r => {
      const d = String(r[0]).trim().toLowerCase();
      (schedule[d] ||= []).push({subject:r[1],instructor:r[2],platform:r[3]||'Zoom',classTime:r[4]||'6:00 PM',link:r[5]});
    });

  return ContentService.createTextOutput(JSON.stringify({ok:true,announcements,schedule}))
    .setMimeType(ContentService.MimeType.JSON);
}
