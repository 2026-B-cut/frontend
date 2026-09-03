const { withProjectBuildGradle } = require('@expo/config-plugins');

const KAKAO_SDK_VERSION = '2.24.0';
const GRADLE_PROPERTY = `rootProject.ext.KakaoShareLink_kakaoSdkVersion = '${KAKAO_SDK_VERSION}'`;

module.exports = function withKakaoShareSdk(config) {
  return withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(GRADLE_PROPERTY)) {
      config.modResults.contents += `\n\n// Keep Kakao Login and Share on the same SDK version.\n${GRADLE_PROPERTY}\n`;
    }

    return config;
  });
};
