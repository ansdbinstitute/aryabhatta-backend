const MAIN_BRANCH_NAMES = [
  'ARYABHATTA NATIONAL SKILL DEVELOPMENT BOARD',
  'ANSDB'
];
const MAIN_BRANCH_ADDRESS = 'BOLPUR';

export interface UserWithBranch {
  id: number;
  roleType: string;
  branch?: {
    id: number;
    name: string;
    address?: string;
  };
  canViewAllBranches?: boolean;
}

export async function getUserWithBranch(userId: number): Promise<UserWithBranch | null> {
  try {
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
      populate: ['branch']
    });
    return user as UserWithBranch;
  } catch (error) {
    strapi.log.error('Error fetching user with branch:', error);
    return null;
  }
}

export function isMainBranch(branch: { name?: string; address?: string } | null | undefined): boolean {
  if (!branch) return false;
  
  const name = (branch.name || '').toUpperCase().trim();
  const address = (branch.address || '').toUpperCase().trim();
  
  const isMainName = MAIN_BRANCH_NAMES.some(mainName => 
    name.includes(mainName) || mainName.includes(name)
  );
  
  const isMainAddress = address.includes(MAIN_BRANCH_ADDRESS);
  
  return isMainName || isMainAddress;
}

export async function canAccessAllBranches(userId: number): Promise<boolean> {
  const user = await getUserWithBranch(userId);

  if (!user) {
    strapi.log.warn(`User not found: ${userId}`);
    return false;
  }

  // Full system-level access belongs only to institute admins.
  return user.roleType === 'institute_admin';
}

export async function canViewAllBranchData(userId: number): Promise<boolean> {
  const user = await getUserWithBranch(userId);

  if (!user) {
    strapi.log.warn(`User not found: ${userId}`);
    return false;
  }

  if (user.roleType === 'institute_admin') {
    return true;
  }

  // Only main-branch teachers explicitly approved by institute admin
  // can see data across all branches. Visibility does not imply admin power.
  if (user.roleType !== 'teacher') {
    return false;
  }

  const userIsFromMainBranch = isMainBranch(user.branch);
  const hasPermissionFlag = user.canViewAllBranches === true;

  return userIsFromMainBranch && hasPermissionFlag;
}

export async function getUserBranchId(userId: number): Promise<number | null> {
  const user = await getUserWithBranch(userId);
  return user?.branch?.id || null;
}
