# Fit Photo Studio V84 - Executed verification

**Build: V84-20260908-R1**  
**Based on: the delivered V83 deployment ZIP.**  
**Final result: 369 / 369 software assertions passed.**

These are executed code/browser checks, not a production-site or physical-phone certification. They do not reuse the prior release's 414 count.

## Reproduced defect

With the delivered V83 desktop support component unavailable, the sync module returned before installing the protected-session toggle handler or rendering cached recent sessions. Checking Reusable / Protected Session left the three inputs invisible and the button on Create Quick Session. The V83 code was executed under this fault and reproduced that state; evidence is in `evidence/v83-reproduced.png` and `evidence/reproduction.json`.

V84 binds the complete session interface before starting any network work. The local form is independent of connection success, failure, delay or a missing local component. Name, PIN and confirmation use the original control IDs and 4-6 digit PIN rule. Cached recent sessions render immediately. Server-side creation and PIN verification remain required.

## Final executed suites

| Suite | Passed / assertions |
|---|---:|
| Preserved editor/library regression | 195 / 195 |
| Session form, PIN, failures and REST phone/desktop integration | 89 / 89 |
| First-party REST transport | 46 / 46 |
| Same-origin loader and retry | 7 / 7 |
| Source preservation, syntax, QR and native chooser | 32 / 32 |
| **Total** | **369 / 369** |

## New regression scenarios

The new browser tests exercised the missing fields while the service is unreachable, while a request is delayed and when a support component is absent; restored checkbox state on pageshow; quick/protected switching; local recent-session display; input retention after a failed create; reconnect and retry; invalid name, short/non-numeric and mismatched PINs; duplicate-click prevention; server-side wrong-PIN rejection and correct-PIN reopen; cancel during a pending valid PIN check; and returning to the correct session's saved edits. A failed new-session request does not replace the existing active session or QR.

The shipped first-party desktop REST transport was executed directly, not replaced by an SDK mock, for the transport tests and the phone-to-desktop integration. Tests cover the existing auth storage key/owner identity; one signup under concurrent initial reads; token refresh; 401 retry; no permission bypass on 403; retaining credentials on network/refresh failure; malformed stored auth; in-memory operation after blocked storage; exact RPC and table filters; signed URLs; incomplete responses; and timeout handling. Loader tests exercise one shared load attempt, same-origin URL resolution, failure and recovery.

The dedicated phone page was executed at 360, 393 and 412 pixels. Camera/library inputs remained enabled without a connection or complete session link. Saving an original produced byte-identical fixture contents. Actual image optimisation, upload request construction, registration, desktop polling, signed-original opening, session-scoped order, annotation saving and ZIP construction were exercised through a shared mocked HTTP backend. A simulated lost response after metadata commit was retried without a duplicate photo. A 3000x2250 fixture was actually encoded to 1800x1350 JPEG.

A generated QR PNG was independently decoded with ZBar and compared with the exact private phone URL. Real Chromium file-chooser events were observed for the phone camera and library inputs; synthetic files were then selected. This checks invocation, not the operating-system camera application.

## Prior functionality checked again

The editor regression includes single-photo annotation tools, text editing, voice/translation mocks, touch/pen events, brightness/contrast pixel values, rotate/crop/undo, saved editable versions, session scoping, legacy records, sorting, Combine drawing and image/sheet adjustments, reopen, PNG/JPG exports, ZIP CRC/image decode, download/share UI, storage/decode failures, async session-change guards and responsive layouts.

The editor engine, local edited-library module and shared sorting module were compared with V83 and are identical apart from version text. The dedicated capture logic is identical apart from build labels and the new versioned phone URL. The QR bundle is byte-identical. No desktop UI control ID was removed. JavaScript syntax and local asset references were checked. Existing local project database/store names, recent-session keys and phone auth key remain unchanged.

## What is real vs simulated

Real execution: Chromium DOM/event handling, layout, canvas/image decode/draw/filter/crop/rotate, image and ZIP bytes, file-chooser invocation; Node JavaScript transport/loader logic; Python image decoding and ZIP checks; independent QR decoding. Screenshots are actual test-browser output.

Simulated boundaries: network/service responses, the production database, browser storage (Map/IndexedDB test doubles), hardware camera frames/tracks, microphone/speech/translation services, system share and final download delivery. The managed test browser used set_content with local scripts inlined by the harness and a substituted HTTPS test address; the deployment site was not navigated or published. No browser policy was disabled to obtain access. Phone-size Chromium layouts are not Android/iOS devices or independent browser engines.

No production database or hosting account was accessed. Existing real backend policies, anonymous auth configuration, company network restrictions, actual camera permission, gallery saving and actual scanned-screen behaviour still require on-site acceptance.

## Test-harness corrections during this run

An initial undo assertion read image dimensions before the asynchronous undo had restored its editable layers. Its completion wait was corrected to require both dimensions and layers; the expected restoration was not relaxed. An initial mocked HTTP adapter incorrectly defaulted an unspecified fetch method to POST rather than GET, breaking the signed-image test; the adapter was corrected to the browser's GET default. A source audit initially counted the intentionally renamed versioned route script ID as a deleted UI control; the final preservation assertion checks UI nodes, and script syntax is checked separately. Final suites were rerun successfully after these corrections.

## Deployment acceptance still to perform

Deploy the complete ZIP on the existing HTTPS site. Save work before refreshing and do not clear site data. Confirm V84-20260908-R1. Toggle Reusable / Protected Session: name, PIN and confirmation must appear immediately, with Create Protected Session. Create a named test session, reopen it with its PIN, then scan its new QR using an approved non-iPhone browser. Verify one photo arrives at the right desktop session and that an original/export is actually saved to the device. Check that switching sessions isolates edited photos. These are acceptance steps, not actions already performed on the user's environment.
