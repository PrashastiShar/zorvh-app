// src/auth/dto/register.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

@InputType() // Marks this class as a GraphQL input type
export class RegisterInput {
  @Field()
  @IsEmail({}, { message: 'Must be a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @Field()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(50, { message: 'Password cannot exceed 50 characters.' })
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty({ message: 'First name cannot be empty if provided.' })
  firstName?: string; // Optional field

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty({ message: 'Last name cannot be empty if provided.' })
  lastName?: string; // Optional field
}