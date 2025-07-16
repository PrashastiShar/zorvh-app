// src/product/dto/create-product.input.ts
import { InputType, Field, Float, Int, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsNumber, IsUrl, IsArray, IsOptional, IsUUID, Min, MaxLength } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @Field(() => Int)
  @IsNumber()
  @Min(0)
  stock: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  brand: string;

  @Field(() => ID) // Change type to ID for categoryId
  @IsUUID() // Validate it's a UUID
  @IsNotEmpty()
  categoryId: string; // <--- CHANGED FROM 'category: string' to 'categoryId: string'
}