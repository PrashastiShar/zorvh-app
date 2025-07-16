import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

/**
 * DTO for the response returned after a successful refund operation.
 * This ensures a consistent structure for API responses related to refunds.
 */
export class RefundResponseDto {
  @IsString()
  @IsNotEmpty()
  id: string; // The ID of the refund from Razorpay

  @IsNumber()
  @IsNotEmpty()
  amount: number; // The refunded amount in your application's base currency unit

  @IsString()
  @IsNotEmpty()
  status: string; // The status of the refund (e.g., 'processed', 'pending')

  @IsString()
  @IsNotEmpty()
  payment_id: string; // The ID of the original payment that was refunded
}
