// src/cart/dto/update-cart-item.input.ts
import { InputType, Field, Int, ID } from '@nestjs/graphql';
import { Min } from 'class-validator';

@InputType()
export class UpdateCartItemInput {
  @Field(() => ID)
  cartItemId: string;

  @Field(() => Int)
  @Min(0) // Quantity can be 0 to remove item
  quantity: number;
}