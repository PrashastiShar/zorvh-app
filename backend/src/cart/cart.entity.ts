// src/cart/cart.entity.ts
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity'; // Import User
import { CartItem } from './cart-item.entity'; // Import CartItem

@ObjectType()
@Entity('carts')
export class Cart {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @OneToOne(() => User, user => user.cart, { onDelete: 'CASCADE' }) // Cart has one user, if user deleted, cart deleted
  @JoinColumn() // Cart owns the relationship (cart table will have userId FK)
  user: User;

  @Column({ type: 'uuid' }) // Foreign key column for user
  userId: string; // This column is created by @JoinColumn, but defining it here allows direct access

  @Field(() => [CartItem]) // <--- ADD THIS FIELD AND RELATION
  @OneToMany(() => CartItem, cartItem => cartItem.cart, { cascade: true, eager: true })
  items: CartItem[];

  @Field(() => Float)
  // You might want to make this a getter that sums up item prices for real-time total
  // Or keep it as a column if you need to store it for performance/history
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}