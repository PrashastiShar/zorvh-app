import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer'; // Needed for @Type() decorator
import { Field, InputType } from '@nestjs/graphql';

import { CreateOrderItemDto } from './create-order-item.dto';
import { ShippingAddressDto } from './shipping-address.dto';

@InputType()
export class CreateOrderDto {
  @Field(() => [CreateOrderItemDto])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto) // Important for nested DTOs
  items: CreateOrderItemDto[];

  @Field(() => ShippingAddressDto)
  @ValidateNested()
  @Type(() => ShippingAddressDto) // Important for nested DTOs
  shippingAddress: ShippingAddressDto;
}