// Must match isAdmin() in firestore.rules. Not a secret: the rules check the verified ID token, not this value.
export const ADMIN_UID = 'gxQzSuAVefQzDlIGMiKUKiSa6Xk1';

export const isAdminUid = (uid?: string | null) => uid === ADMIN_UID;
