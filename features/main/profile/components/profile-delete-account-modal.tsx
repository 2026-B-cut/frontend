import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';

import { GuardedPressable as Pressable } from '@/components/guarded-pressable';
import { LocalizedText as Text } from '@/components/localized-text';
import { ScalePressable } from '@/components/scale-pressable';

import { styles } from '../styles';

type ProfileDeleteAccountModalProps = {
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  visible: boolean;
};

const deletedDataItems = [
  '프로필 및 계정 정보',
  '촬영한 미션 인증 사진',
  '미션 수행 기록 및 매거진',
  '카카오 연동 정보(연동 로그인 시)',
];

export function ProfileDeleteAccountModal({
  isSubmitting,
  onClose,
  onConfirm,
  visible,
}: ProfileDeleteAccountModalProps) {
  const [hasAgreed, setHasAgreed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setHasAgreed(false);
    }
  }, [visible]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.deleteAccountModal}>
          <View style={styles.deleteAccountModalHeader}>
            <View style={styles.deleteAccountIcon}>
              <MaterialCommunityIcons color="#C74444" name="account-remove-outline" size={25} />
            </View>
            <Pressable
              accessibilityLabel="계정 탈퇴 안내 닫기"
              disabled={isSubmitting}
              onPress={onClose}
              style={styles.modalCloseButton}>
              <MaterialCommunityIcons color="#697277" name="close" size={23} />
            </Pressable>
          </View>

          <Text style={styles.deleteAccountModalTitle}>정말 탈퇴하시겠어요?</Text>
          <Text style={styles.deleteAccountModalDescription}>
            계정을 탈퇴하면 아래 데이터가 영구적으로 삭제되며,{"\n"}
            삭제된 데이터는 복구할 수 없습니다.
          </Text>

          <View style={styles.deletedDataCard}>
            <Text style={styles.deletedDataTitle}>삭제되는 데이터</Text>
            {deletedDataItems.map((item) => (
              <View key={item} style={styles.deletedDataItem}>
                <View style={styles.deletedDataBullet} />
                <Text style={styles.deletedDataText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.deleteAccountNotice}>
            단, 관련 법령에 따라 보존이 필요한 정보는{"\n"}
            일정 기간 보관될 수 있습니다.
          </Text>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hasAgreed, disabled: isSubmitting }}
            disabled={isSubmitting}
            onPress={() => setHasAgreed((previous) => !previous)}
            style={styles.agreementRow}>
            <MaterialCommunityIcons
              color={hasAgreed ? '#409CB7' : '#AAB5B8'}
              name={hasAgreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={23}
            />
            <Text style={styles.agreementText}>위 내용을 확인했으며, 탈퇴에 동의합니다.</Text>
          </Pressable>

          <View style={styles.deleteAccountButtonRow}>
            <ScalePressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              pressedScale={0.97}
              style={styles.cancelDeleteButton}>
              <Text style={styles.cancelDeleteButtonText}>취소</Text>
            </ScalePressable>
            <ScalePressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !hasAgreed || isSubmitting }}
              disabled={!hasAgreed || isSubmitting}
              onPress={onConfirm}
              pressedScale={0.97}
              style={[styles.confirmDeleteButton, (!hasAgreed || isSubmitting) && styles.disabledDeleteButton]}>
              <Text style={styles.confirmDeleteButtonText}>{isSubmitting ? '처리 중' : '탈퇴하기'}</Text>
            </ScalePressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
