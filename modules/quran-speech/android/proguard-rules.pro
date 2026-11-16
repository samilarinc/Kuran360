# ONNX Runtime's JNI code finds its Java classes, constructors and fields by name
# (e.g. ai/onnxruntime/TensorInfo, OnnxTensor(long, long, TensorInfo), OrtException(int, String)).
# The AAR's own consumer rules only cover telemetry, so R8 renames these classes and strips the
# constructors only native code calls, and the first inference aborts the app in release builds.
-keep class ai.onnxruntime.** { *; }
