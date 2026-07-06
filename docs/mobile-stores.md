# Smith-Heffa Paygate Mobile Store Release

This repository now includes Capacitor wrappers for the hosted app at `https://smith-heffa-paygate.ca`.

## What was added

- Capacitor iOS dependencies
- Capacitor Android dependencies
- shared config in [`capacitor.config.ts`](/Users/user/Desktop/Smith-Heffa-Paygate/capacitor.config.ts)
- iOS native shell under [`ios/App`](/Users/user/Desktop/Smith-Heffa-Paygate/ios/App)
- Android native shell under [`android/app`](/Users/user/Desktop/Smith-Heffa-Paygate/android/app)
- fallback web entrypoint under [`capacitor-web/index.html`](/Users/user/Desktop/Smith-Heffa-Paygate/capacitor-web/index.html)
- Codemagic pipelines in [`codemagic.yaml`](/Users/user/Desktop/Smith-Heffa-Paygate/codemagic.yaml)

## App identity

- App name: `Smith-Heffa Paygate`
- iOS bundle ID: `ca.smithheffa.paygate`
- Android application ID: `ca.smithheffa.paygate`
- Runtime URL: `https://smith-heffa-paygate.ca`

## Local wrapper commands

```bash
npm install
npm run cap:sync
npm run cap:sync:ios
npm run cap:sync:android
npm run cap:open:ios
npm run cap:open:android
```

## App Store Connect setup

1. Sign in to App Store Connect.
2. Create `Smith-Heffa Paygate` in `My Apps`.
3. Use bundle identifier `ca.smithheffa.paygate`.
4. Ensure the Apple Developer account has a matching App ID and signing enabled.
5. In Codemagic, connect the Apple Developer and App Store Connect integration.
6. Add `APP_STORE_CONNECT_TEAM_ID` in Codemagic environment variables.

## TestFlight flow

1. Run the `ios-release` workflow.
2. Wait for Apple processing in App Store Connect.
3. Open `TestFlight`.
4. Add internal testers first.
5. Validate app launch, login, dashboard, payment screens, and mobile navigation.

## Google Play Console setup

1. Create the app `Smith-Heffa Paygate` in Google Play Console.
2. Use package name `ca.smithheffa.paygate`.
3. Create a Google Cloud service account with Play Console access.
4. Export the service account JSON and store it in Codemagic as `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`.
5. Add Android signing materials in Codemagic if you switch from debug to signed production keystores.

## Google Play internal testing flow

1. Run the `android-release` workflow.
2. Retrieve the generated `.aab` artifact from Codemagic.
3. Publish to the `internal` track in Google Play Console, or let Codemagic publish automatically once credentials are complete.
4. Validate install, login, dashboard load, and hosted payment flows on a real Android device.

## Build outputs

- iOS workflow exports `.ipa`
- Android workflow exports `.aab`

## Important operational note

These wrappers do not alter the existing web deployment. The web app remains the source of truth. Both mobile shells load the live hosted dashboard, so release readiness depends on `smith-heffa-paygate.ca` being healthy over HTTPS.
