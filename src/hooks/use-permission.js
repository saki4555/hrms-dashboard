// src/hooks/use-permission.js
import { useAuth } from "@/features/authentication/use-auth";

// Check a single permission
export const usePermission = (permissionCode) => {
  const { user } = useAuth();
  return user?.permissions?.includes(permissionCode) ?? false;
};

// Check multiple — returns true if user has ALL
export const usePermissions = (permissionCodes = []) => {
  const { user } = useAuth();
  const perms = user?.permissions ?? [];
  return permissionCodes.every((code) => perms.includes(code));
};

// Check multiple — returns true if user has ANY one
export const useAnyPermission = (permissionCodes = []) => {
  const { user } = useAuth();
  const perms = user?.permissions ?? [];
  return permissionCodes.some((code) => perms.includes(code));
};