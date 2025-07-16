// src/product/product.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { ProductService } from './product.service';
import { ProductResolver } from './product.resolver';
import { Product } from './product.entity'; // Import Product entity
import { Category } from '../category/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category]), // Register the Product entity for this module
  ],
  providers: [ProductService, ProductResolver],
  exports: [ProductService], // Export ProductService if other modules need to use it
})
export class ProductModule {}
