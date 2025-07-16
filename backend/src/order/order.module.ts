import { Module, forwardRef } from '@nestjs/common'; // Added forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module'; // <-- Added AuthModule import
import { CartModule } from '../cart/cart.module'; // <-- Potentially add CartModule if CartService is used

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    ProductModule,
    UserModule,
    // Import AuthModule because OrderController uses JwtAuthGuard and RolesGuard
    // Use forwardRef if AuthModule also imports OrderModule to prevent circular dependencies
    AuthModule,
    // If OrderService or OrderController directly uses CartService (e.g., to clear cart after order),
    // you would import CartModule here. Otherwise, it might not be strictly necessary if Cart logic
    // is handled differently (e.g., via User entity relations).
    // forwardRef(() => CartModule),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService] // Export OrderService if needed by other modules
})
export class OrderModule {}