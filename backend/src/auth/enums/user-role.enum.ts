// src/auth/enums/user-role.enum.ts
import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

// Register the enum with GraphQL for schema generation
registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Possible roles for a user.',
});