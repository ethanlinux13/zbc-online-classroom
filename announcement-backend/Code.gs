const ANNOUNCEMENT_SHEET = 'Announcements';
const ANNOUNCEMENT_HEADERS = ['id','publishedAt','title','message','priority','imageUrl','facebookUrl','expiresAt','active'];
const CLASS_SHEET = 'ClassLinks';
const CLASS_HEADERS = ['day','subject','instructor','platform','classTime','link','active'];
const SCHEDULE_SHEET = 'Schedules';
const SCHEDULE_HEADERS = ['id','academicYear','program','yearLevel','day','subject','units','instructor','platform','classTime','link','active'];
const SETTINGS_SHEET = 'ScheduleSettings';
const SETTINGS_HEADERS = ['academicYear','program','yearLevel','published'];

const ADMIN_EMAIL = 'asbanben@gmail.com';

function setupPortal() {
  setupSheet_(ANNOUNCEMENT_SHEET, ANNOUNCEMENT_HEADERS);
  setupSheet_(CLASS_SHEET, CLASS_HEADERS);
  setupSheet_(SCHEDULE_SHEET, SCHEDULE_HEADERS);
  setupSheet_(SETTINGS_SHEET, SETTINGS_HEADERS);
}

function setupAnnouncements() { setupPortal(); }

function setupSheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  return sh;
}

function doGet(e) {
  setupPortal();
  if (e && e.parameter && e.parameter.admin === '1') {
    if (!isAuthorizedAdmin_()) {
      return HtmlService.createHtmlOutput('<h2>Access denied</h2><p>Please sign in using ' + ADMIN_EMAIL + ' and open the administrator deployment.</p>');
    }
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('ZBC Schedule CMS')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  const ss = SpreadsheetApp.getActive();
  const now = new Date();
  const a = ss.getSheetByName(ANNOUNCEMENT_SHEET).getDataRange().getDisplayValues();
  const announcements = [];

  for (let i = 1; i < a.length; i++) {
    const r = a[i];
    const id = String(r[0]).trim();
    const title = String(r[2]).trim();
    const message = String(r[3]).trim();
    const active = String(r[8]).trim().toLowerCase();
    if (!id || !title || !message || active === 'false') continue;
    if (r[7]) {
      const expiry = new Date(r[7]);
      if (!isNaN(expiry.getTime()) && expiry < now) continue;
    }
    announcements.push({
      id: id, publishedAt: r[1], title: title, message: message,
      priority: r[4] || 'Normal', imageUrl: r[5], facebookUrl: r[6], expiresAt: r[7]
    });
  }
  announcements.reverse();

  const classes = getPublishedClasses_();
  if (e && e.parameter && e.parameter.student) {
    const level = String(e.parameter.student).toLowerCase();
    const selected = classes.filter(function(x) { return x.yearLevel.toLowerCase() === level; });
    const academicYear = selected.length ? selected[0].academicYear : '';
    return json_({ok:true, academicYear:academicYear, classes:selected, announcements:announcements});
  }

  const legacy = ss.getSheetByName(CLASS_SHEET).getDataRange().getDisplayValues();
  const schedule = {};
  for (let i = 1; i < legacy.length; i++) {
    const r = legacy[i];
    const day = String(r[0]).trim().toLowerCase();
    const subject = String(r[1]).trim();
    if (!day || !subject || String(r[6]).trim().toLowerCase() === 'false') continue;
    if (!schedule[day]) schedule[day] = [];
    schedule[day].push({subject:subject, instructor:r[2], platform:r[3] || 'Zoom', classTime:r[4] || '6:00 PM', link:r[5]});
  }
  return json_({ok:true, announcements:announcements, schedule:schedule});
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function isAuthorizedAdmin_() {
  const email = Session.getActiveUser().getEmail();
  return String(email).toLowerCase() === ADMIN_EMAIL;
}

function requireAdmin_() {
  if (!isAuthorizedAdmin_()) throw new Error('Access denied. Sign in as ' + ADMIN_EMAIL + '.');
}

function getPublishedClasses_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SCHEDULE_SHEET);
  const settings = ss.getSheetByName(SETTINGS_SHEET).getDataRange().getDisplayValues();
  const published = {};
  for (let i = 1; i < settings.length; i++) {
    const r = settings[i];
    if (String(r[3]).toLowerCase() === 'true') {
      published[String(r[0]) + '|' + String(r[1]) + '|' + String(r[2]).toLowerCase()] = true;
    }
  }
  const rows = sh.getDataRange().getDisplayValues();
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const key = String(r[1]) + '|' + String(r[2]) + '|' + String(r[3]).toLowerCase();
    if (!published[key] || String(r[11]).toLowerCase() === 'false') continue;
    out.push({
      id:r[0], academicYear:r[1], program:r[2], yearLevel:r[3], day:r[4],
      subject:r[5], units:r[6], instructor:r[7], platform:r[8],
      classTime:r[9], link:r[10]
    });
  }
  return out;
}

function adminGetData() {
  requireAdmin_();
  const sh = SpreadsheetApp.getActive().getSheetByName(SCHEDULE_SHEET);
  const rows = sh.getDataRange().getDisplayValues();
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    data.push({id:r[0], academicYear:r[1], program:r[2], yearLevel:r[3], day:r[4], subject:r[5], units:r[6], instructor:r[7], platform:r[8], classTime:r[9], link:r[10], active:String(r[11]).toLowerCase() !== 'false'});
  }
  const settings = SpreadsheetApp.getActive().getSheetByName(SETTINGS_SHEET).getDataRange().getDisplayValues();
  const published = [];
  for (let i = 1; i < settings.length; i++) {
    if (String(settings[i][3]).toLowerCase() === 'true') published.push({academicYear:settings[i][0], program:settings[i][1], yearLevel:settings[i][2]});
  }
  return {email:ADMIN_EMAIL, classes:data, published:published};
}

function adminSaveClass(item) {
  requireAdmin_();
  const required = ['academicYear','program','yearLevel','day','subject','instructor','platform','classTime'];
  for (let i = 0; i < required.length; i++) {
    if (!item[required[i]]) throw new Error('Please complete ' + required[i] + '.');
  }
  const sh = SpreadsheetApp.getActive().getSheetByName(SCHEDULE_SHEET);
  const id = item.id || Utilities.getUuid();
  const row = [id,item.academicYear,item.program,item.yearLevel,item.day,item.subject,item.units || '',item.instructor,item.platform,item.classTime,item.link || '',true];
  const values = sh.getDataRange().getValues();
  let target = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) { target = i + 1; break; }
  }
  if (target > 0) sh.getRange(target,1,1,row.length).setValues([row]);
  else sh.appendRow(row);
  return adminGetData();
}

function adminDeleteClass(id) {
  requireAdmin_();
  const sh = SpreadsheetApp.getActive().getSheetByName(SCHEDULE_SHEET);
  const values = sh.getDataRange().getDisplayValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === String(id)) sh.deleteRow(i + 1);
  }
  return adminGetData();
}

function adminPublish(academicYear, program, yearLevel) {
  requireAdmin_();
  const ss = SpreadsheetApp.getActive();
  const classes = ss.getSheetByName(SCHEDULE_SHEET).getDataRange().getDisplayValues();
  let count = 0;
  for (let i = 1; i < classes.length; i++) {
    const r = classes[i];
    if (String(r[1]) === String(academicYear) && String(r[2]) === String(program) && String(r[3]).toLowerCase() === String(yearLevel).toLowerCase() && String(r[11]).toLowerCase() !== 'false') count++;
  }
  if (!count) throw new Error('There are no active classes to publish for this selection.');
  const sh = ss.getSheetByName(SETTINGS_SHEET);
  const values = sh.getDataRange().getDisplayValues();
  let found = false;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(academicYear) && String(values[i][1]) === String(program) && String(values[i][2]).toLowerCase() === String(yearLevel).toLowerCase()) {
      sh.getRange(i + 1,4).setValue(true);
      found = true;
    } else if (String(values[i][2]).toLowerCase() === String(yearLevel).toLowerCase()) {
      sh.getRange(i + 1,4).setValue(false);
    }
  }
  if (!found) sh.appendRow([academicYear,program,yearLevel,true]);
  return {ok:true, count:count, academicYear:academicYear, program:program, yearLevel:yearLevel};
}

function adminUnpublish(academicYear, program, yearLevel) {
  requireAdmin_();
  const sh = SpreadsheetApp.getActive().getSheetByName(SETTINGS_SHEET);
  const values = sh.getDataRange().getDisplayValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(academicYear) && String(values[i][1]) === String(program) && String(values[i][2]).toLowerCase() === String(yearLevel).toLowerCase()) sh.getRange(i + 1,4).setValue(false);
  }
  return {ok:true};
}
