import { IsString, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;
}