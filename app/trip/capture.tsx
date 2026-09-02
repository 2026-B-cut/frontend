import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MissionCaptureCameraView } from '@/features/trip/capture/components/mission-capture-camera-view';
import { MissionCapturePermissionState } from '@/features/trip/capture/components/mission-capture-permission-state';
import { MissionCaptureReview } from '@/features/trip/capture/components/mission-capture-review';
import { getMissionDeadline } from '@/features/trip/capture/mission-capture-data';
import { useMissionCaptureCamera } from '@/features/trip/capture/hooks/use-mission-capture-camera';
import { useMissionCaptureSession } from '@/features/trip/capture/hooks/use-mission-capture-session';
import { useMissionCaptureUpload } from '@/features/trip/capture/hooks/use-mission-capture-upload';
import { getParamValue, getRemainingMs } from '@/features/trip/trip-data';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { getAuthItem } from '@/lib/auth-storage';
import { isWithinMissionRadius } from '@/lib/mission-location';
import { sanitizeMissionPhoto } from '@/lib/mission-photo';
import type { MissionSession } from '@/lib/mission-session-api';
import type { TripScheduleMission } from '@/lib/trip-schedule-api';

// 미션 촬영 라우트와 권한·촬영·결과 화면을 조합합니다.
export default function MissionCaptureScreen() {
  const params = useLocalSearchParams<{ scheduleId?: string | string[]; scheduleMissionId?: string | string[]; sessionId?: string | string[] }>();
  const scheduleId = getParamValue(params.scheduleId);
  const scheduleMissionId = getParamValue(params.scheduleMissionId);
  const sessionId = getParamValue(params.sessionId);
  const { bottomSafeInset, height, horizontalPadding, topSafeInset } = useResponsiveLayout();
  const hasNavigatedAway = useRef(false);
  const timeoutRefreshKey = useRef<string | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [session, setSession] = useState<MissionSession | null>(null);
  const [mission, setMission] = useState<TripScheduleMission | null>(null);
  const [isMissionLoading, setIsMissionLoading] = useState(false);
  const [missionError, setMissionError] = useState('');
  const [isLocationChecking, setIsLocationChecking] = useState(false);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const missionDeadline = getMissionDeadline(session?.shootingEndsAt, session?.photoUploadEndsAt);
  const missionRemainingMs = getRemainingMs(missionDeadline, now);
  const shootingRemainingMs = missionRemainingMs;
  const uploadRemainingMs = missionRemainingMs;
  const isShootingExpired = shootingRemainingMs !== null && shootingRemainingMs <= 0;
  const isUploadExpired = uploadRemainingMs !== null && uploadRemainingMs <= 0;
  const myMember = session?.members.find((member) => member.userId === getAuthItem('user_id'));
  const isNonParticipant = Boolean(session && (!myMember || myMember.participationStatus === 'SKIPPED' || myMember.participationStatus === 'LOCKED_OUT'));

  const {
    handleComplete,
    handleRetake,
    isMissionComplete,
    isTransitioningToResult,
    isUploading,
    isWaitingForJudgement,
    isWaitingForReview,
    judgeReason,
    judgementDotCount,
    needsRetakeAfterJudgement,
    returnCountdown,
    setIsMissionComplete,
    setJudgeReason,
    setJudgeStatus,
    setSubmittedSubmissionId,
    uploadMessage,
  } = useMissionCaptureUpload({
    capturedPhotoUri,
    hasNavigatedAwayRef: hasNavigatedAway,
    isUploadExpired,
    scheduleId,
    scheduleMissionId,
    sessionId,
    setCapturedPhotoUri,
    setSession,
  });

  useMissionCaptureSession({
    capturedPhotoUri,
    hasNavigatedAwayRef: hasNavigatedAway,
    isShootingExpired,
    isUploadExpired,
    scheduleId,
    scheduleMissionId,
    session,
    sessionId,
    setMission,
    setMissionError,
    setIsMissionLoading,
    setSession,
    timeoutRefreshKeyRef: timeoutRefreshKey,
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const locationTarget = useMemo(() => session?.locationTarget ?? mission?.locationTarget ?? null, [mission?.locationTarget, session?.locationTarget]);
  const requiresLocalLocation = (session?.verificationType ?? mission?.verificationType)?.toUpperCase() === 'GPS_PHOTO';
  const hasMissionData = Boolean(session || mission);
  const canCaptureByLocation = !requiresLocalLocation || isLocationVerified;

  const checkMissionLocation = useCallback(async () => {
    if (!requiresLocalLocation) {
      setIsLocationVerified(true);
      setLocationError('');
      return;
    }

    if (!locationTarget) {
      setIsLocationVerified(false);
      setLocationError('미션 장소 정보를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
      return;
    }

    setIsLocationChecking(true);
    try {
      const isInside = await isWithinMissionRadius(locationTarget);
      setIsLocationVerified(isInside);
      setLocationError(isInside ? '' : '미션 장소 근처에서만 사진을 촬영할 수 있어요.');
    } catch (error) {
      setIsLocationVerified(false);
      setLocationError(error instanceof Error ? error.message : '현재 위치를 확인하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsLocationChecking(false);
    }
  }, [locationTarget, requiresLocalLocation]);

  useEffect(() => {
    if (!hasMissionData) {
      return;
    }

    void checkMissionLocation();
    if (!requiresLocalLocation) {
      return;
    }

    const timer = setInterval(() => {
      void checkMissionLocation();
    }, 10000);

    return () => clearInterval(timer);
  }, [checkMissionLocation, hasMissionData, requiresLocalLocation]);

  useEffect(() => {
    if (!isNonParticipant || isTransitioningToResult || hasNavigatedAway.current) {
      return;
    }

    hasNavigatedAway.current = true;
    router.replace({
      pathname: '/trip/active',
      ...(scheduleId ? { params: { scheduleId } } : {}),
    });
  }, [isNonParticipant, isTransitioningToResult, scheduleId]);

  const handlePhotoCaptured = useCallback(async (uri: string) => {
    try {
      const sanitizedUri = await sanitizeMissionPhoto(uri);
      setCapturedPhotoUri(sanitizedUri);
    } catch {
      setLocationError('사진을 안전하게 처리하지 못했어요. 다시 촬영해 주세요.');
      return;
    }

    setIsMissionComplete(false);
    setJudgeReason(null);
    setJudgeStatus(null);
    setSubmittedSubmissionId(null);
  }, [setIsMissionComplete, setJudgeReason, setJudgeStatus, setSubmittedSubmissionId]);
  const camera = useMissionCaptureCamera({ bottomSafeInset, height, isLocationChecking, isLocationVerified: canCaptureByLocation, isShootingExpired, onPhotoCaptured: handlePhotoCaptured });

  if (!camera.permission) {
    return <MissionCapturePermissionState bottomSafeInset={bottomSafeInset} onClose={() => router.back()} topSafeInset={topSafeInset} variant="loading" />;
  }

  if (!camera.permission.granted) {
    return <MissionCapturePermissionState bottomSafeInset={bottomSafeInset} onClose={() => router.back()} onRequestPermission={camera.requestPermission} topSafeInset={topSafeInset} variant="denied" />;
  }

  if (isNonParticipant) {
    return null;
  }

  if (capturedPhotoUri) {
    return (
      <MissionCaptureReview
        bottomSafeInset={bottomSafeInset}
        capturedPhotoUri={capturedPhotoUri}
        handleComplete={handleComplete}
        handleRetake={handleRetake}
        horizontalPadding={horizontalPadding}
        isMissionComplete={isMissionComplete}
        isUploadExpired={isUploadExpired}
        isUploading={isUploading}
        isWaitingForJudgement={isWaitingForJudgement}
        isWaitingForReview={isWaitingForReview}
        judgeReason={judgeReason}
        judgementDotCount={judgementDotCount}
        missionDescription={mission?.description}
        needsRetakeAfterJudgement={needsRetakeAfterJudgement}
        returnCountdown={returnCountdown}
        sessionId={sessionId}
        topSafeInset={topSafeInset}
        uploadMessage={uploadMessage}
        uploadRemainingMs={uploadRemainingMs}
      />
    );
  }

  return (
    <MissionCaptureCameraView
      backdropOpacity={camera.backdropOpacity}
      bottomSafeInset={bottomSafeInset}
      cameraRef={camera.cameraRef}
      facing={camera.facing}
      flash={camera.flash}
      handleCapture={camera.handleCapture}
      isLocationChecking={isLocationChecking}
      isLocationVerified={canCaptureByLocation}
      isCapturing={camera.isCapturing}
      isMissionLoading={isMissionLoading}
      isShootingExpired={isShootingExpired}
      mission={mission}
      missionCardCollapsedBottom={camera.missionCardCollapsedBottom}
      missionCardPanResponder={camera.missionCardPanResponder}
      missionCardTranslateY={camera.missionCardTranslateY}
      missionError={locationError || missionError}
      onClose={() => router.back()}
      session={session}
      shootingRemainingMs={shootingRemainingMs}
      toggleFacing={camera.toggleFacing}
      toggleFlash={camera.toggleFlash}
      topSafeInset={topSafeInset}
    />
  );
}
