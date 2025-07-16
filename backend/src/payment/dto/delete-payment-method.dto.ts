import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

// Defines the DTO for deleting a payment method
export class DeletePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  userId: string; // The Firebase User ID (UID) of the user deleting the method

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string; // The ID of the payment method document to delete from Firestore (which is also the Razorpay-provided ID)

  @IsString()
  @IsOptional() // This field is optional
  razorpayCustomerId?: string; // The Razorpay Customer ID associated with the user (useful for gateway operations)
}
