import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { User } from '../user/user.entity'; // Adjust path if needed
import { OrderItem } from './order-item.entity'; // Adjust path if needed

// --- ENHANCED OrderStatus Enum ---
export enum OrderStatus {
  PENDING = 'PENDING',            // Initial state after order creation
  PAID = 'PAID',                  // Payment successfully processed
  PAYMENT_FAILED = 'PAYMENT_FAILED', // Payment attempt failed
  PROCESSING = 'PROCESSING',      // Order is being prepared for shipment
  SHIPPED = 'SHIPPED',            // Order has been shipped
  DELIVERED = 'DELIVERED',        // Order has been delivered
  CANCELLED = 'CANCELLED',        // Order cancelled by user or admin
  REFUNDED = 'REFUNDED',          // Order fully refunded
  FAILED = 'FAILED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED', // If you support partial refunds
}

// Register the enum with GraphQL
registerEnumType(OrderStatus, {
  name: 'OrderStatus', // This name will be used in the GraphQL schema
});


@ObjectType()
@Entity('orders')
export class Order {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key for User (best practice to also include the plain column for relations)
  @Column()
  userId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @Field(() => [OrderItem])
  @OneToMany(() => OrderItem, (item) => item.order, { eager: true, cascade: true })
  items: OrderItem[];

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  total: number; // This should be the final total including shipping and tax

  // --- ENHANCED status field ---
  @Field(() => OrderStatus) // Specify the GraphQL enum type
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  // --- NEW: Shipping Address as JSONB object ---
  @Field(() => String) // GraphQL Field type can be String or a custom GraphQL InputType if you define it
  @Column({ type: 'jsonb', nullable: false }) // Use jsonb for structured data
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    [key: string]: any; // Allow for extra fields if needed
  };

  // --- NEW: Payment Related Fields ---
  @Field({ nullable: true })
  @Column({ nullable: true })
  paymentIntentId?: string; // ID from the payment gateway (e.g., Stripe PI ID, Razorpay Order ID)

  @Field({ nullable: true })
  @Column({ nullable: true })
  paymentMethod?: string; // e.g., 'card', 'upi', 'netbanking'

  @Field(() => String, { nullable: true }) // GraphQL might need a scalar for JSONB, or use JSON scalar library
  @Column({ type: 'jsonb', nullable: true }) // Store additional payment gateway response data
  paymentDetails?: object;

  // --- NEW: Shipping Cost and Tax Amount ---
  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
  shippingCost?: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
  taxAmount?: number;

  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // --- NEW: updatedAt Column ---
  @Field(() => Date)
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}