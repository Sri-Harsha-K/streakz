const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Bumps the @react-native-async-storage/async-storage SQLite cap on Android.
 * Default is 6 MB; we set 10 MB to give multi-year completion history headroom.
 *
 * Activates during `expo prebuild` / EAS build. Has no effect in Expo Go,
 * which uses its own bundled AsyncStorage with its own limit.
 */
module.exports = function withAsyncStorageSize(config, { sizeInMB = 10 } = {}) {
  return withGradleProperties(config, (cfg) => {
    const key = 'AsyncStorage_db_size_in_MB';
    const existing = cfg.modResults.find(
      (item) => item.type === 'property' && item.key === key,
    );
    if (existing) {
      existing.value = String(sizeInMB);
    } else {
      cfg.modResults.push({ type: 'property', key, value: String(sizeInMB) });
    }
    return cfg;
  });
};
