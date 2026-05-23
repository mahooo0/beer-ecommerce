export type Roles = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
    };
  }
}

export {};
