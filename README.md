https://reactnative.dev/docs/environment-setup


Open android studio =>　AVD manager => tablet

As admin:
D:
cd .\alex\reactnative\HKOTime\

1. npx react-native start
2. npx react-native run-android

build aab:
cd android
./gradlew bundleRelease

output: android/app/build/outputs/bundle/release/app-release.aab

build apk:
cd android
./gradlew assembleRelease

output: android/app/build/outputs/apk/release/app-release.apk


npx react-native run-android --variant=release

https://reactnative.dev/docs/signed-apk-android

