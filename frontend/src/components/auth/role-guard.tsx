// // components/auth/role-guard.tsx
// export const RoleGuard = ({ children, allowedRoles, userRole }) => {
//     if (!allowedRoles.includes(userRole)) return null;
//     return <>{children}</>;
// };

// // Utilisation
// <RoleGuard allowedRoles={['SUPER_ADMIN', 'MANAGER']} userRole={currentUser.role}>
//     <DeleteOrganizationButton />
// </RoleGuard>