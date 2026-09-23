# ZBC Portal Google Sheets Backend

This Apps Script supplies both announcements and editable Zoom/Discord classroom links to the ZBC Online Classroom.

## One-time update

1. Open the existing **ZBC Announcements** Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Replace the old Code.gs with the current Code.gs from this folder.
4. Save, then run **setupPortal** once.
5. A new sheet tab named **ClassLinks** will be created.
6. Because this is an existing web app, go to **Deploy → Manage deployments → Edit**, choose **New version**, then **Deploy**. Keep the same Web App URL.

## ClassLinks sheet

Columns:

day | subject | instructor | platform | classTime | link | active

Use Monday, Tuesday, Wednesday, or Thursday. Platform should be Zoom or Discord. Set active to TRUE.

You can edit the link, instructor, platform, or class time at any time. The student portal reads the current sheet data when it loads. If the Sheet/API is unavailable, the original schedule in config.js remains as a fallback.

## Announcements

Columns:

id | publishedAt | title | message | priority | imageUrl | facebookUrl | expiresAt | active

Priority can be Normal, Important, or Urgent. Set active to TRUE. expiresAt is optional and should be blank when unused. Google Drive sharing links are supported for announcement images when the Drive file is shared as Anyone with the link / Viewer.
