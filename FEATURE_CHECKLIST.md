# V84 incorporation checklist

| Requirement | Implementation and executed check |
|---|---|
| Reusable session name, PIN, confirmation | Original IDs and numeric rule retained; visible during offline, slow connection or missing component; mode and pageshow checked. |
| Create/reopen with PIN | Existing create_fit_session_pin/join_fit_session_pin contracts; wrong PIN rejected; correct PIN restores scoped edits; duplicate/cancel races checked. |
| Recent sessions | Existing fitPhotoRecentSessionsV62 values displayed before network; backend refresh preserves cached tokens; no data reset. |
| Edited Photos per session | Existing V83 library preserved; switching and reopening checked again. |
| Legacy saved photos | Existing Earlier unassigned photos and copy-to-current behaviour retained and regression-tested. |
| Combine editing parity | Crop, rotate, brightness/contrast, reset, selection/sheet targets, editable save/reopen, undo and annotations regression-tested. |
| Non-iPhone capture entry | Separate capture.html retained; phone-sized Chromium native chooser and offline entry tested; physical phone acceptance pending. |
| Download failures/retries | Real original bytes and generated PNG/JPG/ZIP checked; explicit ready-file actions retained; system delivery remains device-controlled. |
| Photo upload/sync | Phone XHR -> mocked shared HTTP service -> desktop first-party REST/polling -> editor/archive integration passed. |
| No missing old controls | All V83 desktop UI control IDs retained; editor/library/sort modules unchanged except version labels. |
| Complete ZIP | Local assets, runtime hashes, build badges and JS syntax checked. |

The checklist records implemented behaviour and the actual software tests, not an assurance that every corporate/device/network condition has been reproduced.
