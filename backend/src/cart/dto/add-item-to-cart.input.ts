// src/cart/dto/add-item-to-cart.input.ts
import { InputType, Field, Int, ID } from '@nestjs/graphql';
import { Min } from 'class-validator';

@InputType()
export class AddItemToCartInput {
  @Field(() => ID)
  productId: string;

  @Field(() => Int)
  @Min(1) // Ensure quantity is at least 1
  quantity: number;
}