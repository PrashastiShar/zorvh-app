// src/auth/auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service'; // Import UserService
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { User } from '../user/user.entity';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs
import { JwtService } from '@nestjs/jwt'; // Import JwtService

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService, // Inject UserService
    private jwtService: JwtService,   // Inject JwtService
  ) {}

  async register(registerInput: RegisterInput): Promise<User> {
    const { email, password, firstName, lastName } = registerInput;

    // 1. Check if user already exists
    const existingUser = await this.userService.findOneByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists.');
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // 3. Create and save the new user
    const newUser = await this.userService.create({
      email,
      password: hashedPassword, // Store the hashed password
      firstName,
      lastName,
    });

    return newUser;
  }

  async login(loginInput: LoginInput): Promise<{ user: User; accessToken: string }> {
    const { email, password } = loginInput;

    // 1. Validate user credentials
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Generate JWT payload
    const payload = { email: user.email, sub: user.id };

    // 3. Return user and accessToken
    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  // Helper method for internal validation (used by login and potentially future JWT strategies)
  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userService.findOneByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; // Exclude password from the returned object
      return result as User; // Cast back to User type after excluding password
    }
    return null;
  }
}