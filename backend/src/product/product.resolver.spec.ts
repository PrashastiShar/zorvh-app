// src/product/product.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import { CreateProductInput } from './dto/create-product.input';
import { NotFoundException } from '@nestjs/common'; // Import NotFoundException

@Resolver(() => Product)
export class ProductResolver {
  constructor(private productService: ProductService) {}

  @Query(() => [Product], { name: 'products' })
  async getProducts(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Query(() => Product, { name: 'product' })
  async getProduct(@Args('id', { type: () => ID }) id: string): Promise<Product> {
    const product = await this.productService.findOneById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }
    return product;
  }

  @Mutation(() => Product)
  async createProduct(@Args('createProductInput') createProductInput: CreateProductInput): Promise<Product> {
    return this.productService.create(createProductInput);
  }

  // You would add updateProduct and deleteProduct mutations here later
}