// src/cart/cart.resolver.ts
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { Cart } from './cart.entity';
import { AddItemToCartInput } from './dto/add-item-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { RemoveItemFromCartInput } from './dto/remove-item-from-cart.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard'; // Assume you have this guard
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // Assume you have this decorator
import { User } from '../user/user.entity';

@Resolver(() => Cart)
@UseGuards(GqlAuthGuard) // Protect all cart operations
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query(() => Cart, { name: 'myCart' })
  async getMyCart(@CurrentUser() user: User): Promise<Cart> {
    // Assuming CurrentUser decorator extracts user from JWT/session and provides it
    return this.cartService.findOrCreateCart(user.id);
  }

  @Mutation(() => Cart)
  async addItemToCart(
    @CurrentUser() user: User,
    @Args('input') input: AddItemToCartInput,
  ): Promise<Cart> {
    return this.cartService.addItemToCart(user.id, input.productId, input.quantity);
  }

  @Mutation(() => Cart)
  async updateCartItemQuantity(
    @CurrentUser() user: User,
    @Args('input') input: UpdateCartItemInput,
  ): Promise<Cart> {
    return this.cartService.updateCartItemQuantity(user.id, input.cartItemId, input.quantity);
  }

  @Mutation(() => Cart)
  async removeItemFromCart(
    @CurrentUser() user: User,
    @Args('input') input: RemoveItemFromCartInput,
  ): Promise<Cart> {
    return this.cartService.removeCartItem(user.id, input.cartItemId);
  }

  @Mutation(() => Cart)
  async clearMyCart(@CurrentUser() user: User): Promise<Cart> {
    return this.cartService.clearCart(user.id);
  }
}