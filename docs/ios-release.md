# iOS / App Store release

## Before the Mac (once, from any machine)

1. **Firebase console → Authentication → Sign-in method → Apple**: enable it. For account deletion to revoke
   Apple tokens, fill in the *OAuth code flow* section (Apple Team ID, Key ID and a Sign in with Apple
   private key `.p8` from developer.apple.com → Keys).
2. **Deploy the Firestore rules** (adds `contentReports`): `firebase deploy --only firestore:rules`
3. **App Store Connect → My Apps → +**: new app, bundle ID `com.kuran360`, primary language Turkish, SKU `kuran360`.
   (Register the bundle ID with the *Sign in with Apple* capability under developer.apple.com → Identifiers
   if EAS doesn't do it for you.)
4. Publish a **privacy policy URL** and a **support URL** (e.g. kuran360.com/privacy, kuran360.com/support).

## On the Mac

Needs Xcode (latest, with an iOS platform installed), Node 18+, CocoaPods and fastlane
(`brew install cocoapods fastlane`).

```bash
git clone --recurse-submodules <repo> && cd Kuran360   # or git pull && git submodule update --init
npm ci && (cd msarinc-common && npm ci)
# copy .env from the Linux machine (gitignored; holds the Firebase and Google client IDs, incl. the iOS ones)
npx eas-cli login          # project owner: msarinc
npm run build:ipa          # first run is interactive: Apple ID login, creates certificate + profile
npx eas-cli submit --platform ios --path builds/app-release.ipa
```

Fallback without EAS: `npx expo prebuild -p ios --clean`, open `ios/Kuran360.xcworkspace`,
set the team under Signing & Capabilities, Product → Archive → Distribute App → App Store Connect.

## App Store Connect form

- **Screenshots**: 6.9" iPhone (1320×2868) is required; iPad not needed (`supportsTablet: false`).
- **App Privacy**: Contact info → email address and name (linked to the user, app functionality — only
  when signed in); User content → other user content (hatims, dua requests); Location → coarse/precise
  location is used on device only for prayer times and qibla, not collected; Diagnostics → bug reports
  the user sends (crash data/other diagnostics, linked to the user when signed in). No tracking.
- **Age rating**: 4+ (questionnaire: user-generated content → yes, with moderation).
- **Sign-in info for review**: Sign in with Apple works for the reviewer; mention in the notes that
  sign-in is optional and that account deletion is under Profile → Delete Account.
- **Export compliance**: answered by `ITSAppUsesNonExemptEncryption: false` in app.config.js.

## Native modules on iOS

`modules/prayer-notification` and `modules/quran-speech` have Swift versions in their `ios/` folders, and the
home screen widgets are a WidgetKit extension in `targets/PrayerWidgets`, added by `@bacons/apple-targets`
on prebuild. None of this could be compiled on Linux, so build and test it on the Mac first.

Before the first build:

1. developer.apple.com → Identifiers → App Groups: register **`group.com.kuran360`** if EAS doesn't create
   it. Enable *App Groups* (with that group) and *Time Sensitive Notifications* on `com.kuran360`, and
   *App Groups* on the widget's `com.kuran360.widgets`. EAS normally syncs these capabilities and asks to
   create a provisioning profile for the widget extension as well; if it doesn't, set
   `ios.appleTeamId` in app.config.js and run again.
2. `npx expo prebuild -p ios --clean`, then check that `ios/` has a *PrayerWidgets* target, and that
   `pod install` pulls `onnxruntime-objc` 1.30.0.
3. Build on a device from Xcode (`ios/Kuran360.xcworkspace`), so Swift compile errors show up with their
   location. Fix them, then use `npm run build:ipa`.

Then test on a real iPhone (notifications, the microphone and widgets need a device):

- **Prayer alerts**: turn on an alert for the next prayer and a reminder a few minutes before it; both
  arrive on time, also with the app closed, and during a Focus mode (Time Sensitive). Check the custom
  sound, *Silent* and *Vibrate* (a silent sound that should only vibrate). Add an mp3 longer than 30
  seconds: the preview plays only its first 30 seconds, and so does the alert.
- **Kaza**: with kaza tracking on, a prayer alert has *Kıldım* / *Kılmadım* buttons (long-press or pull
  down the banner). *Kılmadım* puts the prayer on the kaza list in the app, and the next day's alert
  for the same prayer has *Kaza kıldım*. Also try the buttons with the app fully closed.
- **Top-up**: iOS keeps 64 pending notifications at most. Leave the app unopened for a few days with
  many alerts on and check that alerts keep coming until the scheduled ones run out, and that opening
  the app schedules the next ones.
- **Widgets** (iOS 17+): add all four (countdown small, times medium, verse medium/large, times + verse
  large). The countdown ticks and moves to the next prayer on time; the verse changes at each prayer
  time in *each prayer time* mode; in *on tap* mode, tapping the verse shows a new one without opening
  the app, and the reference opens the verse; light and dark mode are both readable.
- **Speech**: Verse Shazam with the microphone and with an audio or video file, the memorization check,
  topic search and dhikr voice input. Compare a few transcripts and topic search results with Android
  for the same audio and query: the preprocessing is a line-by-line port, but the microphone path
  (AVAudioConverter instead of Android's resampler) can differ slightly.

Not on iOS: the ongoing countdown notification (its settings are hidden; the widgets show the countdown).

Reports sent from hatims land in the Firestore `contentReports` collection; the report message
promises a review within 24 hours.
