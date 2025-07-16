// src/category/category.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryInput: CreateCategoryInput): Promise<Category> {
    const { name } = createCategoryInput;

    // Check if a category with the same name already exists
    const existingCategory = await this.categoryRepository.findOne({ where: { name } });
    if (existingCategory) {
      throw new ConflictException(`Category with name "${name}" already exists.`);
    }

    const newCategory = this.categoryRepository.create(createCategoryInput);
    return this.categoryRepository.save(newCategory);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }
    return category;
  }

  async update(id: string, updateCategoryInput: UpdateCategoryInput): Promise<Category> {
    const category = await this.findOne(id); // Use findOne to ensure category exists

    // If updating the name, check for conflict with other categories
    if (updateCategoryInput.name && updateCategoryInput.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryInput.name }
      });
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(`Category with name "${updateCategoryInput.name}" already exists.`);
      }
    }

    // Merge changes and save
    Object.assign(category, updateCategoryInput); // Merge the updates
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }
    return true; // Indicate successful deletion
  }
}