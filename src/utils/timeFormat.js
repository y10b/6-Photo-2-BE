export const formatNotificationTime = (createdAt) => {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffMs / 7);
  const diffMonths = Math.floor(diffMs / 30);
  const diffYears = Math.floor(diffMs / 365);

  if (diffMinutes < 1) return "방금 전";
  if (diffHours < 1) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays) return `${diffDays}일 전`;
  if (diffWeeks) return `${diffWeeks}주일 전`;
  if (diffMonths) return `${diffMonths}개월 전`;
  return `${diffYears}년 전`;
};
