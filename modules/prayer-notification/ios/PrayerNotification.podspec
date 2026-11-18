Pod::Spec.new do |s|
  s.name           = 'PrayerNotification'
  s.version        = '1.0.0'
  s.summary        = 'Prayer time alerts, kaza tracking and home screen widget data'
  s.description    = 'Prayer time alerts as scheduled local notifications, kaza tracking and the data the home screen widgets read'
  s.author         = 'Kuran360'
  s.homepage       = 'https://kuran360.com'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'UserNotifications', 'WidgetKit', 'AVFoundation'
  # Live Activities are iOS 16.1+; weak, so the app still launches on iOS 15
  s.weak_frameworks = 'ActivityKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
