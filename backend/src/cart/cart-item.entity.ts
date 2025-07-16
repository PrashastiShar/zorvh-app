// src/cart/cart-item.entity.ts
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from '../product/product.entity'; // Import Product
import { Cart } from './cart.entity'; // Import Cart

@ObjectType()
@Entity('cart_items')
export class CartItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Int)
  @Column({ default: 1 })
  quantity: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Price at the time of adding to cart

  @Column({ nullable: true }) // Assuming 'size' might be optional
  size: string;

  @Field(() => Product)
  @ManyToOne(() => Product, product => product.cartItems, { eager: true, onDelete: 'CASCADE' })
  product: Product;

  @Column({ type: 'uuid' }) // Foreign key for product
  productId: string;

  @Field(() => Cart)
  // FIX THIS LINE: Change cart.cartItems to cart.items
  @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE' }) // Many-to-one with Cart
  cart: Cart;

  @Column({ type: 'uuid' }) // Foreign key for cart
  cartId: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}