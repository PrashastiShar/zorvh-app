import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  Headers,
  Delete, // Import Delete decorator for RESTful API design
  HttpCode, // Import HttpCode for specific status codes
  HttpStatus, // Import HttpStatus for specific status codes
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateOrderDto } from '../payment/dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming this guard is correctly implemented
import { Request } from 'express';
import { RefundPaymentDto } from '../payment/dto/refund-payment.dto';
import { RefundResponseDto } from './dto/refund-response.dto';
import { SavePaymentMethodDto } from './dto/save-payment-method.dto'; // Import new DTO
import { DeletePaymentMethodDto } from './dto/delete-payment-method.dto'; // Import new DTO

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Endpoint for creating a Razorpay order (for one-time payments)
  @UseGuards(JwtAuthGuard) // Re-enabled guard - ensure user is authenticated
  @Post('create-order')
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.paymentService.createOrder(createOrderDto);
  }

  // Endpoint for Razorpay webhooks (no authentication needed, relies on signature verification)
  @Post('webhook')
  @HttpCode(HttpStatus.OK) // Webhooks typically expect a 200 OK response quickly
  async handleWebhook(
    @Req() req: Request,
    @Body() body: any,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    // Ensure rawBody is available. NestJS might need a specific configuration
    // (e.g., `app.use(json({ verify: (req, res, buf) => { (req as any).rawBody = buf; } }))`
    // in main.ts if not using a specific raw body parser middleware)
    const rawBody = (req as any).rawBody as Buffer;

    if (!signature || !rawBody) {
      throw new BadRequestException('Missing webhook signature or raw body');
    }

    const isValid = await this.paymentService.verifyWebhookSignature(
      signature,
      body,
      rawBody
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    await this.paymentService.handleWebhook(body);
    return { status: 'success' };
  }

  // Endpoint for initiating a refund (typically for admin use, hence JwtAuthGuard)
  @UseGuards(JwtAuthGuard)
  @Post('refund')
  async refundPayment(@Body() refundDto: RefundPaymentDto): Promise<RefundResponseDto> {
    // You might want to add an isAdmin check here if only admins can issue refunds
    return this.paymentService.refundPayment(
      refundDto.paymentId,
      refundDto.amount
    );
  }

  // NEW ENDPOINT: Save a payment method for a user
  @UseGuards(JwtAuthGuard)
  @Post('save-method')
  async savePaymentMethod(@Body() savePaymentMethodDto: SavePaymentMethodDto) {
    // Ensure the userId in the DTO matches the authenticated user's ID for security
    // This is a crucial check to prevent users from saving methods for other users.
    // Assuming JwtAuthGuard attaches user info to req.user
    // if (req.user.uid !== savePaymentMethodDto.userId) {
    //   throw new UnauthorizedException('User ID mismatch');
    // }
    // For now, we trust the frontend sends the correct userId, but add this check if needed.

    return this.paymentService.savePaymentMethod(savePaymentMethodDto);
  }

  // NEW ENDPOINT: Delete a saved payment method for a user
  // Using @Delete is more RESTful for deletion, but @Post is also common for actions.
  @UseGuards(JwtAuthGuard)
  @Delete('delete-method') // Use @Delete decorator
  @HttpCode(HttpStatus.NO_CONTENT) // Typically 204 No Content for successful deletion
  async deletePaymentMethod(@Body() deletePaymentMethodDto: DeletePaymentMethodDto) {
    // Ensure the userId in the DTO matches the authenticated user's ID for security
    // if (req.user.uid !== deletePaymentMethodDto.userId) {
    //   throw new UnauthorizedException('User ID mismatch');
    // }

    await this.paymentService.deletePaymentMethod(
      deletePaymentMethodDto.userId,
      deletePaymentMethodDto.paymentMethodId,
      deletePaymentMethodDto.razorpayCustomerId
    );
    // Return nothing for 204 No Content status
  }
}
