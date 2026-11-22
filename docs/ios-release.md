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

## Not on iOS yet

Prayer time notifications, home screen widgets, Verse Shazam, memorization check and topic search
(native modules are Android only); their entries are hidden on iOS.
Reports sent from hatims land in the Firestore `contentReports` collection; the report message
promises a review within 24 hours.
