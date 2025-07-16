// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../user/user.entity'; // Import your User entity

// This decorator can take an optional data key (e.g., @CurrentUser('id'))
// or return the whole user object (@CurrentUser())
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req; // Get the raw request object

    // The user object is attached to request.user by Passport
    const user = request.user;

    // If a specific data key is requested (e.g., @CurrentUser('id'))
    if (data) {
      return user ? user[data] : undefined;
    }

    // Otherwise, return the entire user object
    return user;
  },
);