// src/product/dto/update-product.input.ts
import { InputType, Field, PartialType, ID }  from '@nestjs/graphql';
import { CreateProductInput } from './create-product.input';
import { IsUUID, IsOptional } from 'class-validator';

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => ID, { nullable: true }) // Make categoryId optional for updates
  @IsOptional()
  @IsUUID()
  categoryId?: string; // <--- Ensure this is here and correctly typed
}