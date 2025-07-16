import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Product } from '../product/product.entity'; // Adjust path if needed
import { Order } from './order.entity'; // Adjust path if needed

@ObjectType()
@Entity('order_items')
export class OrderItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() // <-- CRITICAL: This line defines the foreign key column in the DB
  productId: string;

  @Field(() => Product)
  @ManyToOne(() => Product)
  product: Product;

  @Column()
  orderId: string;

  @Field(() => Order)
  @ManyToOne(() => Order, (order) => order.items)
  order: Order;

  @Field()
  @Column()
  name: string;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Field(() => Int)
  @Column('int')
  quantity: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  subTotal: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  size?: string;
}