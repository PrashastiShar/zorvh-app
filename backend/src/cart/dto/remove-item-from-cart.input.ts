// src/cart/dto/remove-item-from-cart.input.ts
import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class RemoveItemFromCartInput {
  @Field(() => ID)
  cartItemId: string;
}