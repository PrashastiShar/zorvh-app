import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { ConfigModule } from '@nestjs/config';
import { OrderModule } from '../order/order.module'; // Ensure this path is correct

@Module({
  imports: [ConfigModule, OrderModule],
  providers: [PaymentService], // PaymentService is provided here
  controllers: [PaymentController],
  exports: [PaymentService], // PaymentService is exported here for other modules to use
})
export class PaymentModule {}
