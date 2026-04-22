/**
 * Courier profile — wire DTO.
 *
 * Aligned to the real SQL contract. Phone/email live on `users`; display
 * name lives on `profiles` (same as the donor profile pattern).
 */

export interface CourierProfileDto {
  courier: {
    id: string;
    organizationId: string;
    branchId: string | null;
    userId: string;
    courierCode: string;
    status: string;
    vehicleTypeRefId: string | null;
    maxDailyTasks: number;
    isActiveForAssignment: boolean;
    employmentTypeRefId: string | null;
    notes: string | null;
  };
  user: {
    id: string;
    authUserId: string;
    primaryPhone: string | null;
    primaryEmail: string | null;
  };
  profile: {
    fullName: string | null;
    displayName: string | null;
    avatarFilePath: string | null;
    preferredLanguage: string;
  } | null;
}
