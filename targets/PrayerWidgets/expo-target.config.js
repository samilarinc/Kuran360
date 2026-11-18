/**
 * The home screen widgets (prayer countdown, times, verse, times and verse) as a WidgetKit extension,
 * added to the Xcode project by @bacons/apple-targets on `expo prebuild`. They read the times and verses
 * the app writes to the App Group (PrayerWidgetStore in modules/prayer-notification/ios).
 * PrayerCore.swift is a symlink to the module's copy, so both parse the data the same way.
 * iOS 17+: the verse widget's "new verse" tap is an interactive widget button (AppIntent).
 * It also draws the countdown Live Activity (PrayerLiveActivityWidget.swift; PrayerActivityAttributes.swift
 * is a symlink to the module's copy, which the app starts and updates).
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = () => ({
    type: 'widget',
    name: 'PrayerWidgets',
    bundleIdentifier: '.widgets',
    deploymentTarget: '17.0',
    frameworks: ['SwiftUI', 'WidgetKit', 'AppIntents', 'ActivityKit'],
    entitlements: {
        'com.apple.security.application-groups': ['group.com.kuran360'],
    },
});
