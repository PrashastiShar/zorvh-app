import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { RefundResponseDto } from './dto/refund-response.dto';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            createOrder: jest.fn(),
            verifyWebhookSignature: jest.fn(),
            handleWebhook: jest.fn(),
            refundPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    it('should call paymentService.createOrder with the correct DTO', async () => {
      const createOrderDto: CreateOrderDto = {
        orderId: 'test_order_123',
        amount: 1000,
        currency: 'INR',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
      };
      (paymentService.createOrder as jest.Mock).mockResolvedValueOnce({
        id: 'order_razorpay_id',
        amount: 100000,
        currency: 'INR',
        key: 'rzp_key',
        name: 'Brand',
        description: 'Purchase',
        order_id: 'test_order_123',
        prefill: { name: 'Test User', email: 'test@example.com' },
        theme: { color: '#F37254' },
      });

      const result = await controller.createOrder(createOrderDto);

      expect(paymentService.createOrder).toHaveBeenCalledWith(createOrderDto);
      expect(result).toBeDefined();
    });
  });

  describe('handleWebhook', () => {
    const mockSignature = 'mock_signature';
    const mockBody = { event: 'payment.captured', payload: {} };
    const mockRawBody = Buffer.from(JSON.stringify(mockBody));

    // Define a minimal mock object and cast it to 'unknown' first, then to 'Request'.
    // This directly addresses the TypeScript error by explicitly opting out of strict type checking for the cast.
    const mockRequest = {
        rawBody: mockRawBody,
        // You can add other properties here if your controller
        // implicitly uses them (e.g., headers, get method, etc.).
        // For example, if you access req.headers['x-razorpay-signature']:
        // headers: { 'x-razorpay-signature': mockSignature },
        // If req.get('header-name') is used:
        // get: jest.fn((name: string) => {
        //   if (name === 'x-razorpay-signature') return mockSignature;
        //   return undefined;
        // }),
    } as unknown as Request; // Cast to unknown first as suggested by the error

    it('should verify signature and handle webhook if valid', async () => {
      (paymentService.verifyWebhookSignature as jest.Mock).mockResolvedValueOnce(true);
      (paymentService.handleWebhook as jest.Mock).mockResolvedValueOnce(undefined);

      // Call handleWebhook with parameters in the correct order: req, body, signature
      const result = await controller.handleWebhook(mockRequest, mockBody, mockSignature);

      expect(paymentService.verifyWebhookSignature).toHaveBeenCalledWith(
        mockSignature,
        mockBody,
        mockRawBody
      );
      expect(paymentService.handleWebhook).toHaveBeenCalledWith(mockBody);
      expect(result).toEqual({ status: 'success' });
    });

    it('should throw BadRequestException if signature is missing', async () => {
      // Create a request object without a signature for this test case
      const reqWithoutSignature = { rawBody: mockRawBody } as unknown as Request;
      await expect(controller.handleWebhook(reqWithoutSignature, mockBody, undefined))
        .rejects
        .toThrow(BadRequestException);
      await expect(controller.handleWebhook(reqWithoutSignature, mockBody, undefined))
        .rejects
        .toThrow('Missing webhook signature or raw body');
      expect(paymentService.verifyWebhookSignature).not.toHaveBeenCalled();
      expect(paymentService.handleWebhook).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if rawBody is missing', async () => {
      const reqWithoutRawBody = {} as unknown as Request; // Simulate missing rawBody
      await expect(controller.handleWebhook(reqWithoutRawBody, mockBody, mockSignature))
        .rejects
        .toThrow(BadRequestException);
      await expect(controller.handleWebhook(reqWithoutRawBody, mockBody, mockSignature))
        .rejects
        .toThrow('Missing webhook signature or raw body');
      expect(paymentService.verifyWebhookSignature).not.toHaveBeenCalled();
      expect(paymentService.handleWebhook).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if signature is invalid', async () => {
      (paymentService.verifyWebhookSignature as jest.Mock).mockResolvedValueOnce(false);

      await expect(controller.handleWebhook(mockRequest, mockBody, mockSignature))
        .rejects
        .toThrow(BadRequestException);
      await expect(controller.handleWebhook(mockRequest, mockBody, mockSignature))
        .rejects
        .toThrow('Invalid webhook signature');
      expect(paymentService.verifyWebhookSignature).toHaveBeenCalledTimes(1);
      expect(paymentService.handleWebhook).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if handleWebhook fails', async () => {
      (paymentService.verifyWebhookSignature as jest.Mock).mockResolvedValueOnce(true);
      (paymentService.handleWebhook as jest.Mock).mockRejectedValueOnce(new Error('Webhook internal error'));

      await expect(controller.handleWebhook(mockRequest, mockBody, mockSignature))
        .rejects
        .toThrow(BadRequestException);
      expect(paymentService.verifyWebhookSignature).toHaveBeenCalledTimes(1);
      expect(paymentService.handleWebhook).toHaveBeenCalledTimes(1);
    });
  });

  describe('refundPayment', () => {
    it('should call paymentService.refundPayment with the correct DTO values', async () => {
      const refundDto: RefundPaymentDto = {
        paymentId: 'pay_refund_xyz',
        amount: 50,
      };
      const mockRefundResponse: RefundResponseDto = {
        id: 'refund_id_mock',
        amount: 50,
        status: 'processed',
        payment_id: 'pay_refund_xyz',
      };
      (paymentService.refundPayment as jest.Mock).mockResolvedValueOnce(mockRefundResponse);

      const result = await controller.refundPayment(refundDto);

      expect(paymentService.refundPayment).toHaveBeenCalledWith(
        refundDto.paymentId,
        refundDto.amount
      );
      expect(result).toEqual(mockRefundResponse);
    });
  });
});
