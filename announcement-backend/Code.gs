const ANNOUNCEMENT_SHEET = 'Announcements';
const ANNOUNCEMENT_HEADERS = ['id','publishedAt','title','message','priority','imageUrl','facebookUrl','expiresAt','active'];
const CLASS_SHEET = 'ClassLinks';
const CLASS_HEADERS = ['day','subject','instructor','platform','classTime','link','active'];

const DEFAULT_CLASSES = [
  ['Monday','Homiletics I','Rev. Rhey Requiez','Zoom','6:00 PM','https://us02web.zoom.us/launch/jc/84765408220',true],
  ['Monday','Methods of Bible Study','Rev. Andy Basilio','Zoom','6:30 PM','https://zoom.us/j/95021216760?pwd=YC47Nn9jJRvU7hhmYFtqK1996iCgMp.1',true],
  ['Tuesday','Synoptic Gospels','Rev. Jerry Gura','Zoom','6:00 PM','https://zoom.us/j/96587285955?pwd=FEJyfL1feZ4Ui2o5iViJJ268tJYG01.1',true],
  ['Tuesday','Pentateuch & Historical Books','Rev. Angelo Atienza','Zoom','6:00 PM','https://us06web.zoom.us/j/84639234123?pwd=YmTqG6AZ6Syf9nutaFvpzNHSDPG0fl.1',true],
  ['Wednesday','Psycho-Spiritual Development','Ptr. Nervin Lusung','Discord','6:00 PM','https://discord.com/channels/1437746844041089056/1516686341562302534',true],
  ['Wednesday','Leadership Development','Rev. Nora Catipon','Zoom','6:00 PM','https://us02web.zoom.us/j/2524917226?pwd=WmZSeThtSEFGeVNheEZrUXgzWk94UT09&fbclid=IwY2xjawSfUA5leHRuA2FlbQIxMABicmlkETFZTlJrOENpb2hTTVB1TVg2c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHnfOrNtbl19wZleSEjnFb3SHzjIQIULHv-95-tLvUlVw8uoKixX1Clxe1fOA_aem_pjgPpUBYfXUr8UwKqYwFUw',true],
  ['Thursday','Intro To The Bible','Rev. Jomar Peter De Guzman','Discord','6:00 PM','https://discord.com/channels/1437746844041089056/1517012665166467093',true],
  ['Thursday','Theology 2','Rev. Danny Romero','Zoom','6:00 PM','https://zoom.us/j/91571589147?pwd=jGpkKw3KY91X7jIM3Y9CMgdiM0b8O2.1#success',true]
];

function setupPortal() {
  setupSheet_(ANNOUNCEMENT_SHEET, ANNOUNCEMENT_HEADERS);
  const classSheet = setupSheet_(CLASS_SHEET, CLASS_HEADERS);

  // Populate the current ZBC schedule only when ClassLinks has no data rows.
  if (classSheet.getLastRow() === 1) {
    classSheet.getRange(2, 1, DEFAULT_CLASSES.length, CLASS_HEADERS.length).setValues(DEFAULT_CLASSES);
  }
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
  return sh;
}

function doGet(e) {
  setupPortal();

  const ss = SpreadsheetApp.getActive();
  const now = new Date();

  const announcementData = ss.getSheetByName(ANNOUNCEMENT_SHEET).getDataRange().getDisplayValues();
  const announcements = [];

  for (let i = 1; i < announcementData.length; i++) {
    const r = announcementData[i];
    const id = String(r[0]).trim();
    const title = String(r[2]).trim();
    const message = String(r[3]).trim();
    const active = String(r[8]).trim().toLowerCase();

    if (!id || !title || !message || active === 'false') {
      continue;
    }

    const expiresAt = r[7];
    if (expiresAt) {
      const expiry = new Date(expiresAt);
      if (!isNaN(expiry.getTime()) && expiry < now) {
        continue;
      }
    }

    announcements.push({
      id: id,
      publishedAt: r[1],
      title: title,
      message: message,
      priority: r[4] || 'Normal',
      imageUrl: r[5],
      facebookUrl: r[6],
      expiresAt: expiresAt
    });
  }

  announcements.reverse();

  const classData = ss.getSheetByName(CLASS_SHEET).getDataRange().getDisplayValues();
  const schedule = {};

  for (let i = 1; i < classData.length; i++) {
    const r = classData[i];
    const day = String(r[0]).trim().toLowerCase();
    const subject = String(r[1]).trim();
    const active = String(r[6]).trim().toLowerCase();

    if (!day || !subject || active === 'false') {
      continue;
    }

    if (!schedule[day]) {
      schedule[day] = [];
    }

    schedule[day].push({
      subject: subject,
      instructor: r[2],
      platform: r[3] || 'Zoom',
      classTime: r[4] || '6:00 PM',
      link: r[5]
    });
  }

  const response = {
    ok: true,
    announcements: announcements,
    schedule: schedule
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
