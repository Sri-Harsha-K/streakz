const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Restricts the Android APK to a specific set of CPU ABIs.
 *
 * Default: arm64-v8a only. Modern Android phones (~2019+) are all arm64;
 * limiting to one ABI cuts the universal APK from ~74 MB to ~20 MB by
 * dropping unused native libraries for armeabi-v7a, x86, and x86_64.
 *
 * Trade-offs:
 * - x86_64 Android emulators cannot install the APK. Add "x86_64" to abis
 *   for QA on emulators, or test on a physical device.
 * - Pre-2019 32-bit-only phones (very rare) are excluded. Add "armeabi-v7a"
 *   if you need to support them.
 *
 * Activates during `expo prebuild` / EAS build. No effect in Expo Go.
 */
module.exports = function withAbiFilter(config, { abis = ['arm64-v8a'] } = {}) {
  return withAppBuildGradle(config, (cfg) => {
    const filters = abis.map((a) => `"${a}"`).join(', ');
    const ndkBlock = `ndk { abiFilters ${filters} }`;

    if (cfg.modResults.contents.includes('abiFilters')) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /ndk\s*{[^}]*abiFilters[^}]*}/,
        ndkBlock,
      );
    } else {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /defaultConfig\s*{/,
        `defaultConfig {\n        ${ndkBlock}`,
      );
    }
    return cfg;
  });
};
