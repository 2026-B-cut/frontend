// 로그인 정보와 활동 정보를 보여주는 계정 관리 화면의 본문입니다.
import { ActivityIndicator, View } from 'react-native';

import { LocalizedText as Text } from '@/components/localized-text';

import { styles } from '../styles';

type ProfileAccountSummaryProps = {
  completedMissionCount: number;
  contentMaxWidth: number;
  createdAt: string;
  createdMagazineCount: number;
  email: string;
  horizontalPadding: number;
  isLoading: boolean;
  nickname: string;
  provider: string;
};

function formatJoinDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  return match ? `${match[1]}.${match[2]}.${match[3]}` : '-';
}

export function ProfileAccountSummary({
  completedMissionCount,
  contentMaxWidth,
  createdAt,
  createdMagazineCount,
  email,
  horizontalPadding,
  isLoading,
  nickname,
  provider,
}: ProfileAccountSummaryProps) {
  const isKakao = provider.toLowerCase().includes('kakao');
  const loginType = isKakao ? '카카오' : '이메일';
  const account = email || (isKakao ? '카카오 계정으로 연결됨' : '이메일 정보 없음');

  return (
    <View style={[styles.accountSummarySection, { paddingHorizontal: horizontalPadding }]}>
      {isLoading ? (
        <View style={styles.accountLoadingState}>
          <ActivityIndicator color="#6EA4BF" />
          <Text style={styles.accountLoadingText}>계정 정보를 불러오는 중이에요.</Text>
        </View>
      ) : null}
      {!isLoading ? (
        <>
          <View style={[styles.accountSection, { maxWidth: contentMaxWidth }]}>
            <Text style={styles.accountSectionTitle}>로그인 정보</Text>
            <View style={styles.accountCard}>
              <View style={styles.accountDetailRow}>
                <Text style={styles.accountRowLabel}>로그인 방식</Text>
                <Text style={styles.accountRowValue}>{loginType}</Text>
              </View>
              <View style={styles.accountDetailRow}>
                <Text style={styles.accountRowLabel}>{isKakao ? '카카오 메일' : '이메일'}</Text>
                <Text numberOfLines={1} style={styles.accountRowValue}>{account}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.accountSection, { maxWidth: contentMaxWidth }]}>
            <Text style={styles.accountSectionTitle}>계정 정보</Text>
            <View style={styles.accountCard}>
              <View style={styles.accountDetailRow}>
                <Text style={styles.accountRowLabel}>닉네임</Text>
                <Text numberOfLines={1} style={styles.accountRowValue}>{nickname}</Text>
              </View>
              <View style={styles.accountDetailRow}>
                <Text style={styles.accountRowLabel}>가입일</Text>
                <Text style={styles.accountRowValue}>{formatJoinDate(createdAt)}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.accountSection, { maxWidth: contentMaxWidth }]}>
            <Text style={styles.accountSectionTitle}>내 활동</Text>
            <View style={styles.accountCard}>
              <View style={styles.accountDetailRow}>
                <Text style={styles.accountRowLabel}>완료 미션</Text>
                <Text style={styles.accountRowValue}>{completedMissionCount}개</Text>
              </View>
              <View style={styles.accountDetailRow}>
                <Text style={styles.accountRowLabel}>만든 매거진</Text>
                <Text style={styles.accountRowValue}>{createdMagazineCount}개</Text>
              </View>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}
