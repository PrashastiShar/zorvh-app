// src/cart/cart.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { CartService } from './cart.service';
import { CartResolver } from './cart.resolver';
import { ProductModule } from '../product/product.module'; // Import ProductModule for ProductService access
import { UserModule } from '../user/user.module'; // Import UserModule for User access

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem]), // Register Cart and CartItem entities
    ProductModule, // We will need ProductService in CartService
    UserModule, // We will need UserService or User entity in CartService (for user's cart)
  ],
  providers: [CartService, CartResolver],
  exports: [CartService, TypeOrmModule.forFeature([Cart, CartItem])], // Export CartService for other modules if needed
})
export class CartModule {}