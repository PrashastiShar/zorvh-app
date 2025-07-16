// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigService
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MailerModule } from '@nestjs-modules/mailer'; // NEW: Import MailerModule

import { ProductModule } from './product/product.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { ContactModule } from './contact/contact.module'; // NEW: Import ContactModule

import { Cart } from './cart/cart.entity';
import { CartItem } from './cart/cart-item.entity';
import { User } from './user/user.entity';
import { Product } from './product/product.entity';
import { Category } from './category/category.entity';
import { Order } from './order/order.entity';
import { OrderItem } from './order/order-item.entity';
import { NewsletterSubscription } from './newsletter/newsletter.entity';

import { AppController } from './app.controller';
import { AppService } from './app.service';


@Module({
  imports: [
    // Ensure ConfigModule is loaded first and is global for .env access
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // MailerModule configuration for sending emails
    MailerModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule to access ConfigService
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // Use 'true' for SSL (port 465), 'false' for TLS (port 587)
          auth: {
            user: configService.get<string>('EMAIL_USER'), // Gmail address from .env
            pass: configService.get<string>('EMAIL_PASS'), // Gmail App Password from .env
          },
        },
        defaults: {
          from: `"${configService.get<string>('EMAIL_FROM_NAME') || 'ZORVH Support'}" <${configService.get<string>('EMAIL_USER')}>`, // Default sender for outgoing emails
        },
        // Optional: If you use email templates (e.g., MJML, Handlebars, EJS), configure the template adapter here.
        // If you are using MJML via @nestjs-modules/mailer, ensure you have the correct adapter installed
        // (e.g., `npm install @nestjs-modules/mailer-mjml` and configure it here).
        // For simple HTML emails, no template adapter is needed.
        // template: {
        //   dir: process.cwd() + '/templates/', // Path to your email templates
        //   adapter: new SomeEmailTemplateAdapter(), // e.g., new HandlebarsAdapter()
        //   options: {
        //     strict: true,
        //   },
        // },
      }),
      inject: [ConfigService], // Inject ConfigService into the factory
    }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as any,
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_DATABASE!,
      entities: [User, Product, Category, Cart, CartItem, Order, OrderItem, NewsletterSubscription],
      autoLoadEntities: true,
      synchronize: true, // For development only! REMOVE IN PRODUCTION
      logging: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'src/schema.gql',
      sortSchema: true,
    }),
    ProductModule,
    UserModule,
    AuthModule, // Only one instance needed
    CategoryModule,
    CartModule,
    OrderModule,
    PaymentModule,
    ContactModule, // NEW: Add ContactModule here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}