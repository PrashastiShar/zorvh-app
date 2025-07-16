// src/user/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Cart } from '../cart/cart.entity';
import { Order } from '../order/order.entity';

// Define the UserRole Enum
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

// Register the Enum with GraphQL so it's available in the schema
registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'The role of the user within the application.',
});

@Entity('users') // Optional: specifies table name
@ObjectType()
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column() // Password should not be exposed via GraphQL Field()
  password: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName: string;

  // Add the new role field
  @Field(() => UserRole) // Expose role in GraphQL
  @Column({
    type: 'enum', // Use PostgreSQL enum type
    enum: UserRole, // Refer to the UserRole enum
    default: UserRole.CUSTOMER, // Default role for new users
  })
  role: UserRole;

  @Field(() => Cart, { nullable: true }) 
  @OneToOne(() => Cart, cart => cart.user, { cascade: true })
cart: Cart;

  @Field()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[]; // Add this property
}