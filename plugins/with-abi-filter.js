const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Restricts the Android build to a specific set of CPU ABIs by setting
 * `reactNativeArchitectures` in android/gradle.properties.
 *
 * This is the correct knob in RN 0.71+: the React Native Gradle plugin
 * reads this property to decide which architectures to build native libs
 * (Hermes, JSI, fbjni, etc.) for. Setting `ndk.abiFilters` in build.gradle
 * is NOT enough — RN still bundles prebuilt .so files for every ABI listed
 * here, blowing up the APK to ~74 MB.
 *
 * Default: arm64-v8a only. Modern Android phones (~2019+) are all arm64;
 * limiting to one ABI cuts the APK from ~74 MB to ~20 MB.
 *
 * Trade-offs:
 * - x86_64 Android emulators cannot run the build. Add "x86_64" to abis
 *   for emulator QA, or test on a physical device.
 * - Pre-2019 32-bit-only ARM phones are excluded. Add "armeabi-v7a" if
 *   needed.
 *
 * Activates during `expo prebuild` / EAS build. No effect in Expo Go.
 */
module.exports = function withAbiFilter(config, { abis = ['arm64-v8a'] } = {}) {
  return withGradleProperties(config, (cfg) => {
    const key = 'reactNativeArchitectures';
    const value = abis.join(',');
    const existing = cfg.modResults.find(
      (item) => item.type === 'property' && item.key === key,
    );
    if (existing) {
      existing.value = value;
    } else {
      cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });
};
