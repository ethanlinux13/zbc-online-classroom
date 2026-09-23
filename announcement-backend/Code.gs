const SHEET_NAME = 'Announcements';
const HEADERS = ['id','publishedAt','title','message','priority','imageUrl','facebookUrl','expiresAt','active'];

function setupAnnouncements() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,HEADERS.length).setFontWeight('bold');
}

function doGet(e) {
  setupAnnouncements();
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const values = sh.getDataRange().getDisplayValues();
  const now = new Date();
  const items = values.slice(1).filter(r => String(r[8]).toLowerCase() !== 'false')
    .map(r => ({id:r[0],publishedAt:r[1],title:r[2],message:r[3],priority:r[4]||'Normal',imageUrl:r[5],facebookUrl:r[6],expiresAt:r[7]}))
    .filter(x => !x.expiresAt || new Date(x.expiresAt) >= now)
    .reverse();
  return ContentService.createTextOutput(JSON.stringify({ok:true,announcements:items}))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Add announcements by entering rows in the sheet.
   id: any unique value
   publishedAt: date/time
   priority: Normal, Important, or Urgent
   imageUrl/facebookUrl/expiresAt: optional
   active: TRUE or FALSE
*/