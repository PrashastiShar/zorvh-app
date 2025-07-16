// src/product/product.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { Category } from '../category/category.entity';
import { CartItem } from '../cart/cart-item.entity';

@ObjectType()
@Entity('products')
export class Product {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true }) // Changed to 'text' for potentially longer descriptions
  description?: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Field(() => Int)
  @Column({ default: 0 })
  stock: number;

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, nullable: true }) // Stores an array of image URLs
  imageUrls: string[];

  @Field(() => [String])
  @Column('text', { array: true, default: '{}' }) // Stores an array of available sizes (e.g., ['S', 'M', 'L'])
  sizes: string[];

  @Field(() => [String])
  @Column('text', { array: true, default: '{}' }) // Stores an array of available colors (e.g., ['Red', 'Blue'])
  colors: string[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  brand: string;

  // Add Many-to-One relationship with Category
  @Field(() => Category)
  @ManyToOne(() => Category, category => category.products, { eager: true })
  category: Category;

  @Column() // Store the category ID directly in the product table
  categoryId: string;

  // Add One-to-Many relationship with CartItem
  @Field(() => [CartItem], { nullable: true })
  @OneToMany(() => CartItem, cartItem => cartItem.product)
  cartItems: CartItem[];

  @Field()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}