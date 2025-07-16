// src/category/dto/create-category.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateCategoryInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100) // Example validation
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsNotEmpty() // Can be empty string, but not null
  @MaxLength(500) // Example validation
  description?: string;
}