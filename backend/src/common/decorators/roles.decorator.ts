// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/user.entity'; // Import the UserRole enum

export const ROLES_KEY = 'roles'; // A unique key to identify our roles metadata

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);