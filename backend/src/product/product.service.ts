// src/product/product.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../category/category.entity'; // <--- IMPORT CATEGORY ENTITY
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category) // <--- INJECT CATEGORY REPOSITORY
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Product[]> {
    // Ensure category is loaded when finding products
    return this.productRepository.find({ relations: ['category'] });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id }, relations: ['category'] });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async create(createProductInput: CreateProductInput): Promise<Product> {
    const { categoryId, ...productDetails } = createProductInput; // Destructure categoryId

    // Find the Category entity using the provided categoryId
    const category = await this.categoryRepository.findOneBy({ id: categoryId });
    if (!category) {
      throw new NotFoundException(`Category with ID "${categoryId}" not found`);
    }

    // Create the new product, associating it with the fetched Category object
    const newProduct = this.productRepository.create({
      ...productDetails,
      category: category, // Assign the actual Category object
      categoryId: category.id, // Also explicitly set the categoryId column value
    });

    return this.productRepository.save(newProduct);
  }

  async update(id: string, updateProductInput: UpdateProductInput): Promise<Product> {
    const product = await this.findOne(id); // Find the existing product

    // If a new categoryId is provided in the update input
    if (updateProductInput.categoryId) {
      const category = await this.categoryRepository.findOneBy({ id: updateProductInput.categoryId });
      if (!category) {
        throw new NotFoundException(`Category with ID "${updateProductInput.categoryId}" not found`);
      }
      product.category = category; // Update the associated Category object
      product.categoryId = category.id; // Update the foreign key column
    }

    // Merge other updated fields from updateProductInput, excluding id and categoryId which are handled
    const { id: inputId, categoryId, ...otherUpdateDetails } = updateProductInput;
    Object.assign(product, otherUpdateDetails);


    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<string> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return id; // Return the ID of the removed product
  }

  async decreaseStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    if (product.stock < quantity) {
      // This check might already be done in OrderService, but good to have here too
      throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${quantity}`);
    }

    product.stock -= quantity;
    return this.productRepository.save(product);
  }
}