# Fit Photo Studio V84 - Complete deployment package

Build: **V84-20260908-R1**. Based on the delivered V83 ZIP, not a rollback to V81.

## Deploy

1. Save/export any unsaved work and back up the existing deployment.
2. Publish this ZIP's contents into the SAME website and application directory. `index.html`, `capture.html` and the ENTIRE `assets/` folder belong together at the same level. Do not deploy only index.html or an extra enclosing folder. No build step, new key or SQL migration is required.
3. Refresh the desktop page and check V84-20260908-R1. Preserve the same browser profile and website origin; **do not clear site data**. Clearing it can remove local edits, recent-session links and the anonymous owner's credentials.
4. Check Reusable / Protected Session. The Session name, PIN / password and Confirm PIN / password fields must appear immediately, including when the network is unavailable. The button must read Create Protected Session. Enter the original 4-6 numeric PIN and confirmation. Actual creation/reopening still requires the existing backend connection and successful server verification.
5. Create or reopen the intended session. Scan its newly generated QR. The phone must open capture.html and also show V84-20260908-R1. Check a photo arrives in the intended desktop session and verify a real file appears in the phone's Files/Downloads.

Keep `assets/sync-client.v84.js` in the uploaded folder. The desktop now loads a first-party, packaged REST transport from the same site instead of downloading its support code from external CDNs. Missing assets show a retryable deployment error without hiding the form. The app still needs authorised network access to the SAME existing Supabase service. Backend outages, RLS restrictions and sign-in restrictions are not bypassed.

## Corrected workflow

- Name/PIN/confirmation display and button wording are bound before connection starts and restored on pageshow.
- Local recent-session names and reopen buttons render without waiting for the server.
- Reopen opens the PIN dialog immediately; activation happens only after the existing server-side PIN RPC succeeds. Wrong PINs are not accepted. Cancelling a pending check cannot switch sessions later.
- Failed creation retains entered values, the existing active session and its QR. Retry Connection is separate from input validation.
- The existing anonymous-owner auth storage key is preserved. Network errors do not clear it or silently create a replacement desktop owner.
- Desktop originals refresh automatically using the existing 1.5-second polling path. The local REST transport does not implement realtime WebSocket subscriptions; no realtime-ready status is falsely displayed. An externally supplied compatible SDK remains supported but is not required.

## Previous updates retained

Session-scoped Edited Photos, original/edited order and archive downloads; legacy unassigned records; single-photo editing; full Combine adjustments for Selected photo or Entire sheet; editable save/reopen; explicit ready-file Download / Preview / Share; local QR and independent phone capture all remain in this build. No desktop UI control was removed. The editor and library modules are unchanged apart from version labels.

Edited projects are local to the current browser, not cloud-synchronised. Protected/reusable session reopen depends on the original browser credentials and stored private token. This update cannot recreate credentials already deleted before installation. End Session makes the existing session inactive; this is not a delete-all command for local edited records.

Phone queue contents are temporary page memory, not durable offline storage. Save Original before refreshing, closing, changing browsers or removing an unsent photo. Camera and download permissions remain controlled by the device/browser. Images uploaded to desktop remain optimised JPEG up to 1800 pixels on the long side; Save Original retains the original bytes. Unsupported HEIC decoding is reported, not silently converted.

## Hosting and caching

Use the existing HTTPS hosting environment. The included _headers file applies only on hosts that support that format; other hosts need equivalent cache/referrer settings. No service worker or data-clearing migration is installed. Verify both build badges after a complete publish; an already-open old tab must be refreshed. A local file/attachment URL is not a phone-accessible deployment. Do not rewrite capture.html or JS assets to a catch-all index page. Keep phone path/query/fragment handling intact.

The private token is in the QR phone link. QR generation is local; no external QR-generation service receives the link. Treat the full link as private.

## Package map

- index.html: desktop editor, local library, session controls and sync integration.
- capture.html: standalone phone page.
- assets/desktop-boot.v84.js: same-origin support loader, QR/link controls.
- assets/sync-client.v84.js: limited first-party REST transport for the existing auth/RPC/table/storage contracts. This is not the official Supabase SDK.
- assets/capture.v84.js: retained phone capture/upload/retry/original-saving logic.
- assets/qr.v84.js: unchanged bundled QR encoder.
- build.json: release identity and runtime SHA-256 checksums.
- docs/: executed test report, results, source audit, feature checklist and test screenshots.
- THIRD_PARTY_NOTICES.txt: retained QR dependency licence notices.

See docs/TEST_REPORT.md for test scope and limitations. No production deployment or physical-phone certification is claimed.
