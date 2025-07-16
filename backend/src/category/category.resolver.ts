// src/category/category.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { CategoryService } from './category.service';
import { Category } from './category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { UseGuards } from '@nestjs/common'; // Import UseGuards
import { GqlAuthGuard } from '../common/guards/gql-auth.guard'; // Import GqlAuthGuard
import { RolesGuard } from '../common/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../common/decorators/roles.decorator'; // Import Roles decorator
import { UserRole } from '../user/user.entity'; // Import UserRole enum

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  // --- Queries (Read Operations) ---

  @Query(() => [Category], { name: 'categories' })
  findAllCategories(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Query(() => Category, { name: 'category' })
  findOneCategory(@Args('id', { type: () => ID }) id: string): Promise<Category> {
    return this.categoryService.findOne(id);
  }

  // --- Mutations (Create, Update, Delete Operations) ---

  @UseGuards(GqlAuthGuard, RolesGuard) // Authenticate then Authorize
  @Roles(UserRole.ADMIN) // Only ADMINs can create categories
  @Mutation(() => Category, { name: 'createCategory' })
  createCategory(
    @Args('createCategoryInput') createCategoryInput: CreateCategoryInput,
  ): Promise<Category> {
    return this.categoryService.create(createCategoryInput);
  }

  @UseGuards(GqlAuthGuard, RolesGuard) // Authenticate then Authorize
  @Roles(UserRole.ADMIN) // Only ADMINs can update categories
  @Mutation(() => Category, { name: 'updateCategory' })
  updateCategory(
    @Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput,
  ): Promise<Category> {
    return this.categoryService.update(
      updateCategoryInput.id,
      updateCategoryInput,
    );
  }

  @UseGuards(GqlAuthGuard, RolesGuard) // Authenticate then Authorize
  @Roles(UserRole.ADMIN) // Only ADMINs can remove categories
  @Mutation(() => Boolean, { name: 'removeCategory' })
  removeCategory(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.categoryService.remove(id);
  }
}
