const ANNOUNCEMENT_SHEET = 'Announcements';
const ANNOUNCEMENT_HEADERS = ['id','publishedAt','title','message','priority','imageUrl','facebookUrl','expiresAt','active'];
const CLASS_SHEET = 'ClassLinks';
const CLASS_HEADERS = ['day','subject','instructor','platform','classTime','link','active'];

function setupPortal() {
  setupSheet_(ANNOUNCEMENT_SHEET, ANNOUNCEMENT_HEADERS);
  setupSheet_(CLASS_SHEET, CLASS_HEADERS);
}

function setupAnnouncements() {
  setupPortal();
}

function setupSheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
  }
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
}

function doGet(e) {
  setupPortal();

  const ss = SpreadsheetApp.getActive();
  const now = new Date();

  const a = ss.getSheetByName(ANNOUNCEMENT_SHEET).getDataRange().getDisplayValues();
  const announcements = a.slice(1)
    .filter(function(r) {
      return String(r[0]).trim() !== '' &&
             String(r[2]).trim() !== '' &&
             String(r[3]).trim() !== '' &&
             String(r[8]).trim().toLowerCase() !== 'false';
    })
    .map(function(r) {
      return {
        id: String(r[0]).trim(),
        publishedAt: r[1],
        title: String(r[2]).trim(),
        message: String(r[3]).trim(),
        priority: r[4] || 'Normal',
        imageUrl: r[5],
        facebookUrl: r[6],
        expiresAt: r[7]
      };
    })
    .filter(function(x) {
      if (!x.expiresAt) {
        return true;
      }
      const expiry = new Date(x.expiresAt);
      return !isNaN(expiry.getTime()) && expiry >= now;
    })
    .reverse();

  const s = ss.getSheetByName(CLASS_SHEET).getDataRange().getDisplayValues();
  const schedule = {};

  s.slice(1)
    .filter(function(r) {
      return r[0] &&
             r[1] &&
             String(r[6]).trim().toLowerCase() !== 'false';
    })
    .forEach(function(r) {
      const d = String(r[0]).trim().toLowerCase();

      if (!schedule[d]) {
        schedule[d] = [];
      }

      schedule[d].push({
        subject: r[1],
        instructor: r[2],
        platform: r[3] || 'Zoom',
        classTime: r[4] || '6:00 PM',
        link: r[5]
      });
    });

  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      announcements: announcements,
      schedule: schedule
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
