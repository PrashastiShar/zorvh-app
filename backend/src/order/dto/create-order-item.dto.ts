import { IsString, IsNumber, IsNotEmpty, IsPositive } from 'class-validator';
import { Field, InputType, Float, Int } from '@nestjs/graphql';

@InputType()
export class CreateOrderItemDto {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  productId: string;

  // You might not send name/price/subTotal from frontend directly if you fetch them on backend
  // But if you do, they should be validated.
  // For this example, we will calculate them on the backend for security.

  @Field(() => Int)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @Field({ nullable: true }) // Assuming size is optional
  @IsString()
  size?: string;
}