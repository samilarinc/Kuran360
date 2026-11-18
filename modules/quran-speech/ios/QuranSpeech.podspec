Pod::Spec.new do |s|
  s.name           = 'QuranSpeech'
  s.version        = '1.0.0'
  s.summary        = 'Speech recognition and topic search models on ONNX Runtime'
  s.description    = 'Microphone recording, audio decoding, the FastConformer Quran model and the E5 embedding model on ONNX Runtime'
  s.author         = 'Kuran360'
  s.homepage       = 'https://kuran360.com'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation', 'CoreMedia'
  # Same version as onnxruntime-android in android/build.gradle and onnxruntime-web in public/workers
  s.dependency 'onnxruntime-objc', '1.30.0'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
