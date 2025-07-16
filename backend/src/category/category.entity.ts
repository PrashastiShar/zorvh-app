// src/category/category.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Product } from '../product/product.entity'; // Will be used later for relationship

@Entity('categories') // Specifies the database table name
@ObjectType() // Marks this class as a GraphQL Object Type
export class Category {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true }) // Description is optional
  @Column({ nullable: true })
  description?: string; // Optional field

  @Field(() => [Product], { nullable: true }) // A category can have many products
  @OneToMany(() => Product, product => product.category) // Define the one-to-many relationship
  products: Product[]; // This will hold an array of products associated with this category

  @Field()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}