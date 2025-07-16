// src/auth/decorators/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { GqlExecutionContext } from '@nestjs/graphql'; // Uncomment if you are also using GraphQL

export const GetUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    // For REST API (HTTP)
    const request = context.switchToHttp().getRequest();
    if (request.user) {
      return request.user; // Assuming Passport/JWT strategy adds 'user' to request (e.g., req.user.id)
    }

    // For GraphQL (if you uncommented the import above)
    /*
    const ctx = GqlExecutionContext.create(context);
    const gqlRequest = ctx.getContext().req;
    if (gqlRequest && gqlRequest.user) {
      return gqlRequest.user;
    }
    */

    // If user is not found (shouldn't happen if JwtAuthGuard is active)
    return null; // Or throw an UnauthorizedException
  },
);