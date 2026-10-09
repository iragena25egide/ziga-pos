export interface UserPermissions {
  can_view_pos: boolean;
  can_create_sales: boolean;
  can_edit_sales: boolean;
  can_delete_sales: boolean;
  can_view_products: boolean;
  can_create_products: boolean;
  can_edit_products: boolean;
  can_delete_products: boolean;
  can_view_customers: boolean;
  can_manage_customers: boolean;
  can_view_reports: boolean;
  can_manage_team: boolean;
}

export const CASHIER_PERMISSIONS: UserPermissions = {
  can_view_pos: true,
  can_create_sales: true,
  can_edit_sales: false,
  can_delete_sales: false,
  can_view_products: true,
  can_create_products: false,
  can_edit_products: false,
  can_delete_products: false,
  can_view_customers: true,
  can_manage_customers: false,
  can_view_reports: false,
  can_manage_team: false,
};

export const SALES_ONLY_PERMISSIONS: UserPermissions = {
  can_view_pos: true,
  can_create_sales: true,
  can_edit_sales: false,
  can_delete_sales: false,
  can_view_products: true,
  can_create_products: false,
  can_edit_products: false,
  can_delete_products: false,
  can_view_customers: true,
  can_manage_customers: false,
  can_view_reports: false,
  can_manage_team: false,
};

export const MANAGER_PERMISSIONS: UserPermissions = {
  can_view_pos: true,
  can_create_sales: true,
  can_edit_sales: true,
  can_delete_sales: true,
  can_view_products: true,
  can_create_products: true,
  can_edit_products: true,
  can_delete_products: true,
  can_view_customers: true,
  can_manage_customers: true,
  can_view_reports: true,
  can_manage_team: true,
};

export const ADMIN_PERMISSIONS: UserPermissions = {
  can_view_pos: true,
  can_create_sales: true,
  can_edit_sales: true,
  can_delete_sales: true,
  can_view_products: true,
  can_create_products: true,
  can_edit_products: true,
  can_delete_products: true,
  can_view_customers: true,
  can_manage_customers: true,
  can_view_reports: true,
  can_manage_team: true,
};

export function getUserPermissions(user: any): UserPermissions {
  if (!user) return CASHIER_PERMISSIONS;

  // Super Admin and Company Admin / Owner have full permissions by default
  const isOwnerOrAdmin =
    Boolean(user.is_superuser) ||
    user.role === "super_admin" ||
    user.role === "company_admin" ||
    user.role === "owner" ||
    user.role === "admin";

  if (isOwnerOrAdmin) {
    return ADMIN_PERMISSIONS;
  }

  // Check stored custom permissions
  if (typeof window !== "undefined" && user.id) {
    try {
      const stored = localStorage.getItem(`ziga_permissions_${user.id}`);
      if (stored) {
        return { ...CASHIER_PERMISSIONS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
  }

  // Check user object permissions if provided by backend
  if (user.permissions && typeof user.permissions === "object") {
    return { ...CASHIER_PERMISSIONS, ...user.permissions };
  }

  // Fallback to role presets
  const role = (user.role || "").toLowerCase();
  if (role.includes("manager")) {
    return MANAGER_PERMISSIONS;
  }
  if (role.includes("sales")) {
    return SALES_ONLY_PERMISSIONS;
  }

  return CASHIER_PERMISSIONS;
}

export function saveUserPermissions(userId: number | string, perms: UserPermissions) {
  if (typeof window !== "undefined" && userId) {
    localStorage.setItem(`ziga_permissions_${userId}`, JSON.stringify(perms));
  }
}
