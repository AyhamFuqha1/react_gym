export const coachSessionsKeys = {
  all: ["coachSessions"] as const,
  admin: () => [...coachSessionsKeys.all, "admin"] as const,
  adminList: () => [...coachSessionsKeys.admin(), "list"] as const,
  adminDetails: () => [...coachSessionsKeys.admin(), "details"] as const,
  adminDetail: (sessionId: number) =>
    [...coachSessionsKeys.adminDetails(), sessionId] as const,
  coach: () => [...coachSessionsKeys.all, "coach"] as const,
  coachList: (coachId: number | null) =>
    [...coachSessionsKeys.coach(), "list", coachId ?? "missing"] as const,
  coachDetails: () => [...coachSessionsKeys.coach(), "details"] as const,
  coachDetail: (sessionId: number) =>
    [...coachSessionsKeys.coachDetails(), sessionId] as const,
};
