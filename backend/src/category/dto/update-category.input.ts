// src/category/dto/update-category.input.ts
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { CreateCategoryInput } from './create-category.input';
import { IsUUID, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateCategoryInput extends PartialType(CreateCategoryInput) {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  id: string;
  // All fields from CreateCategoryInput are made optional by PartialType
}