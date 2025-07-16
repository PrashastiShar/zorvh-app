// src/auth/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // This guard extends the default AuthGuard from @nestjs/passport.
  // It automatically applies the 'jwt' strategy defined in your application.
  // You might add custom logic here, e.g., for error handling or throwing specific exceptions.
}