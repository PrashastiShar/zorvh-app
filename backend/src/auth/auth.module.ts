// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport'; // For authentication strategies
import { JwtModule } from '@nestjs/jwt'; // For JWT handling
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module'; // Import UserModule to use UserService
import { ConfigModule, ConfigService } from '@nestjs/config'; // For accessing environment variables
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UserModule, // AuthModule depends on UserService from UserModule
    PassportModule, // Essential for authentication strategies (we'll add later)
    JwtModule.registerAsync({ // Asynchronously register JwtModule using ConfigService
      imports: [ConfigModule], // Make sure ConfigModule is imported here
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Get secret from .env
        signOptions: { expiresIn: '1h' }, // Token expiration time
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService,AuthResolver,JwtStrategy], // Register AuthService as a provider
  exports: [AuthService], // Export AuthService so other modules can use it
})
export class AuthModule {}