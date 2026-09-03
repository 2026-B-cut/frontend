const { withGradleProperties, withProjectBuildGradle } = require('@expo/config-plugins');

const KAKAO_SDK_VERSION = '2.24.0';
const ROOT_EXT_ASSIGNMENT = `rootProject.ext.kakaoSdkVersion = '${KAKAO_SDK_VERSION}'`;
const GRADLE_PROPERTY_KEY = 'KakaoShareLink_kakaoSdkVersion';

module.exports = function withKakaoShareSdk(config) {
  config = withProjectBuildGradle(config, (config) => {
    const assignmentPattern = /rootProject\.ext\.kakaoSdkVersion\s*=\s*['"][^'"]+['"]/;

    if (assignmentPattern.test(config.modResults.contents)) {
      config.modResults.contents = config.modResults.contents.replace(assignmentPattern, ROOT_EXT_ASSIGNMENT);
    } else {
      config.modResults.contents += `\n\n// Keep Kakao Login and Share on the same SDK version.\n${ROOT_EXT_ASSIGNMENT}\n`;
    }

    return config;
  });

  return withGradleProperties(config, (config) => {
    const existingProperty = config.modResults.find(
      (item) => item.type === 'property' && item.key === GRADLE_PROPERTY_KEY,
    );

    if (existingProperty) {
      existingProperty.value = KAKAO_SDK_VERSION;
    } else {
      config.modResults.push({
        type: 'property',
        key: GRADLE_PROPERTY_KEY,
        value: KAKAO_SDK_VERSION,
      });
    }

    return config;
  });
};
