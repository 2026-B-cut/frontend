import * as ImageManipulator from 'expo-image-manipulator';

// 미션 사진을 새 JPEG로 저장해 원본 파일의 EXIF 위치정보가 업로드되지 않도록 합니다.
export async function sanitizeMissionPhoto(uri: string) {
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
}
