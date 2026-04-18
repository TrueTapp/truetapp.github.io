# SnapSong Face Data Response for App Review

We updated the SnapSong Privacy Policy on April 18, 2026 to make our handling of face data explicit and to answer Apple's requested clarifications directly.

1. What face data does the app collect?

SnapSong only handles face data when a user intentionally selects or captures a photo for song generation and that photo contains visible facial features.

> "In SnapSong, “face data” means only the visible facial features that may appear in a photo you intentionally choose or capture for song generation."

2. What are all planned uses of the collected face data?

If the selected photo includes a face, SnapSong uses that photo only to analyze the visual scene and generate the derived creative inputs needed to create the song.

> "If your selected photo includes a face, SnapSong may send that photo to OpenAI only when you start song generation."
>
> "OpenAI uses the photo for visual scene analysis and to produce derived creative inputs such as a photo brief, lyrics, title, and style needed to generate the song."
>
> "SnapSong does not use face data for identity recognition, authentication, profiling, advertising, marketing, surveillance, analytics enrichment, or matching one person, user, or photo against another."

3. Is face data shared with third parties?

Yes, only with OpenAI for the visual analysis described above. SnapSong does not share the photo or face data with Suno.

> "OpenAI is the only third party that may receive a selected photo that contains face data, and it receives that photo only for the visual analysis described in this policy."
>
> "Suno does not receive the photo or face data and receives only derived song inputs such as lyrics, title, and style."

4. Where is face data stored?

The original photo is stored locally in the app sandbox on the user's device. SnapSong does not keep its own server copy of the original photo or its face data.

> "SnapSong stores the original photo locally in the app sandbox on your device and does not maintain its own server copy of that photo or its face data."

5. How long is face data retained?

The local photo stays on the device until the user deletes the related song or uninstalls the app. SnapSong does not keep a separate server-side copy after processing. OpenAI retention is disclosed in the policy using OpenAI's current official data controls. Suno does not receive face data from SnapSong.

> "That local photo remains on your device until you delete the related song or uninstall the app."
>
> "SnapSong does not keep its own server-side copy of requests sent to OpenAI and Suno after processing."
>
> "OpenAI states in its current API data controls that abuse monitoring logs may be retained for up to 30 days and that the Responses API has a 30-day application state retention period by default."
>
> "Because SnapSong does not send face data to Suno, Suno does not receive or retain face data from SnapSong."

6. In which sections of the Privacy Policy are collection, use, disclosure/sharing, storage, and retention explained?

- Collection: `Information We Collect`
- Face-data definition and use limits: `Face Data`
- Disclosure/sharing: `Face Data` and `Third-Party Services`
- Storage: `Face Data` and `Data Storage & Security`
- Retention: `Face Data` and `Data Retention`
- Face ID / biometrics clarification: `Face Data` and `Third-Party Services`

## Policy sections referenced

- Introduction
- Information We Collect
- Face Data
- How We Use Your Information
- Third-Party Services
- Data Storage & Security
- Data Retention

## Literal policy quotes

> "When you use SnapSong, you may choose a photo from your library or capture one with your device camera. Those photos may include people and visible facial features."
>
> "No photo is sent to a third party unless you intentionally start song generation."
>
> "In SnapSong, “face data” means only the visible facial features that may appear in a photo you intentionally choose or capture for song generation."
>
> "SnapSong does not create or store a faceprint, biometric template, face geometry, depth map, recognition profile, landmark map, or facial embedding from that photo."
>
> "OpenAI is the only third party that may receive a selected photo that contains face data, and it receives that photo only for the visual analysis described in this policy."
>
> "SnapSong stores the original photo locally in the app sandbox on your device and does not maintain its own server copy of that photo or its face data."
>
> "SnapSong may let you enable Face ID or Touch ID App Lock through iOS LocalAuthentication."
>
> "SnapSong does not receive, access, or store any Face ID template or other biometric template; the app only receives the authentication result and stores your local preference for whether App Lock is enabled."

## Code validation summary

- User-triggered generation: `PhotoConfirmationSheet.swift`, `GenerateSheet.swift`, and `CameraPreviewView.swift` require explicit user action before `SongGenerationCoordinator.startGeneration(...)` runs.
- OpenAI photo send path: `OpenAIService.swift` sends a JPEG image to `/v1/responses` as `input_image`.
- Suno payload shape: `SunoService.swift` sends only derived fields such as `prompt`, `title`, and `style`, with no image field.
- Local storage and deletion: `StorageManager.swift` stores original photos in the app sandbox, and `SongGenerationCoordinator.deleteSong(...)` removes the original photo and related files.
- Face ID / App Lock behavior: `AppLockModel.swift` uses `LocalAuthentication` and stores only the local enabled/disabled preference; `Info.plist` contains the `NSFaceIDUsageDescription`.
- Negative face-recognition check: repo-wide code search found no active Vision face-detection, face-tracking, landmark, embedding, or identity-matching APIs in the shipped flow.
