// src/product/product.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { UseGuards } from '@nestjs/common'; // <--- Import UseGuards
import { GqlAuthGuard } from '../common/guards/gql-auth.guard'; // <--- Import GqlAuthGuard
import { CurrentUser } from '../common/decorators/current-user.decorator'; // <--- IMPORT CurrentUser
import { User, UserRole } from '../user/user.entity'; // <--- IMPORT UserRole here!
import { Roles } from '../common/decorators/roles.decorator'; // <--- IMPORT Roles decorator!
import { RolesGuard } from '../common/guards/roles.guard';
@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query(() => [Product], { name: 'products' })
  findAll() {
    return this.productService.findAll();
  }

  @Query(() => Product, { name: 'product' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.productService.findOne(id);
  }

  // Add the @UseGuards decorator here to protect this mutation
  @UseGuards(GqlAuthGuard,RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => Product, { name: 'createProduct' })
  createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ): Promise<Product> {
    return this.productService.create(createProductInput);
  }
  
  @Mutation(() => Product, { name: 'updateProduct' })
  updateProduct(
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
  ): Promise<Product> {
    return this.productService.update(
      updateProductInput.id,
      updateProductInput,
    );
  }

  @Mutation(() => Boolean, { name: 'removeProduct' })
  removeProduct(@Args('id', { type: () => ID }) id: string) {
    return this.productService.remove(id);
  }
}