import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/user.entity'; // Adjust path if needed for your UserRole enum

export const ROLES_KEY = 'roles'; // This is the metadata key

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);