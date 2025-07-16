// backend/src/user/user.resolver.ts
import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Context,  } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport'; // For JWT authentication
import { User } from './user.entity'; // Your User entity
import { UserService } from './user.service'; // Your UserService

@Resolver(() => User) // Specifies that this resolver is for the User type
export class UserResolver {
  constructor(private userService: UserService) {}

  // This is your protected 'me' query
  @Query(() => User, { name: 'me', description: 'Returns the currently authenticated user' })
  @UseGuards(AuthGuard('jwt')) // Protects this query with JWT authentication
  async me(@Context() context): Promise<User> {
    // The JwtStrategy (jwt.strategy.ts) attaches the validated user object
    // to context.req.user after successful authentication.
    if (!context.req.user) {
      // This should ideally not happen if AuthGuard('jwt') is working,
      // as UnauthorizedException would be thrown earlier.
      throw new Error('User not found in context.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = context.req.user; // Exclude password for security
    return result as User;
  }

  // You can add other user-related queries or mutations here, e.g.,
  // @Query(() => [User])
  // @UseGuards(AuthGuard('jwt'))
  // async users(): Promise<User[]> {
  //   return this.userService.findAll();
  // }
}