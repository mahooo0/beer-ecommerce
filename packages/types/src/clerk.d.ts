export type Roles = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
export type CustomerTypes = 'RETAIL' | 'WHOLESALE';

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
      customerType?: CustomerTypes;
    };
  }
}

export {};
