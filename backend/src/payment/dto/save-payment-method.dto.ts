import { IsString, IsNotEmpty } from 'class-validator'; // Removed IsObject, ValidateNested, Type

// Defines the main DTO for saving a payment method
export class SavePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  userId: string; // The Firebase User ID (UID) of the user saving the method

  @IsString()
  @IsNotEmpty()
  razorpayPaymentMethodId: string; // The ID provided by Razorpay for the tokenized/saved payment instrument (e.g., payment_id)

  // Removed cardDetails: CardDetailsDto; as backend now fetches it
}
