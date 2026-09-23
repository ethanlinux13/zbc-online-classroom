# ZBC Announcement System

This folder contains the Google Apps Script backend for the ZBC Online Classroom announcement feed.

## One-time setup

1. Create a Google Sheet named **ZBC Announcements**.
2. Open **Extensions → Apps Script**.
3. Paste the contents of `Code.gs` into the editor and save.
4. Run `setupAnnouncements` once and authorize it.
5. Choose **Deploy → New deployment → Web app**.
6. Execute as: **Me**. Who has access: **Anyone**.
7. Deploy and copy the Web App URL ending in `/exec`.
8. In the GitHub repository, open `config.js` and replace `PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.

## Posting an announcement

Add one row to the **Announcements** sheet. Columns are created automatically:

id | publishedAt | title | message | priority | imageUrl | facebookUrl | expiresAt | active

Use **Normal**, **Important**, or **Urgent** for priority. Set active to TRUE. Optional expiry dates automatically remove old notices from the student portal.

For a Facebook announcement, paste the public Facebook post/share URL into facebookUrl. For a poster, imageUrl must be a publicly accessible direct image URL.
