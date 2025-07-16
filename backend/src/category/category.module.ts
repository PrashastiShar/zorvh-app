// src/category/category.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { CategoryService } from './category.service';
import { CategoryResolver } from './category.resolver';
import { Category } from './category.entity'; // Import Category entity

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]), // Register the Category entity with TypeORM
  ],
  providers: [CategoryResolver, CategoryService],
  exports: [CategoryService], // Export CategoryService if other modules might need it (e.g., ProductModule later)
})
export class CategoryModule {}
