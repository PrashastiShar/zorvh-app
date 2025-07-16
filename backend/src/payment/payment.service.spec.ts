import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderService } from '../order/order.service'; // Corrected import path for OrderService
import { OrderStatus } from '../order/order.entity'; // Assuming OrderStatus enum exists and is exported from here
import { createHmac } from 'crypto'; // Directly import createHmac

// 1. Mock the 'razorpay' module globally at the top of the file
const mockRazorpayOrders = {
  create: jest.fn(),
};

const mockRazorpayPayments = {
  refund: jest.fn(),
};

const mockRazorpay = jest.fn(() => ({
  orders: mockRazorpayOrders,
  payments: mockRazorpayPayments,
}));

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => mockRazorpay());
});


describe('PaymentService', () => {
  let service: PaymentService;
  let orderService: OrderService;
  let configService: ConfigService;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockRazorpay.mockClear();
    mockRazorpayOrders.create.mockClear();
    mockRazorpayPayments.refund.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: OrderService,
          useValue: {
            updateOrderStatus: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              // Provide concrete string values to avoid 'undefined' issues in tests
              if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_mock_id';
              if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_test_mock_secret';
              if (key === 'RAZORPAY_WEBHOOK_SECRET') return 'whsec_mock_razorpay_secret';
              return null; // Fallback, though tests should ensure these are provided
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    orderService = module.get<OrderService>(OrderService);
    configService = module.get<ConfigService>(ConfigService);

    loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    loggerLogSpy = jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    loggerWarnSpy = jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
    loggerLogSpy.mockRestore();
    loggerWarnSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw InternalServerErrorException if config is missing', async () => {
    // Temporarily override the configService mock to return undefined for a key
    (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'RAZORPAY_KEY_ID') return undefined; // Simulate missing key
        if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_test_mock_secret';
        if (key === 'RAZORPAY_WEBHOOK_SECRET') return 'whsec_mock_razorpay_secret';
        return null;
    });

    // Re-create the module to trigger the constructor with missing config
    const module: TestingModule = await Test.createTestingModule({
        providers: [
            PaymentService,
            { provide: OrderService, useValue: { updateOrderStatus: jest.fn() } },
            { provide: ConfigService, useValue: configService }, // Use the modified mock
        ],
    }).compile();

    await expect(async () => {
        module.get<PaymentService>(PaymentService);
    }).rejects.toThrow(InternalServerErrorException);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Missing one or more Razorpay environment variables (KEY_ID, KEY_SECRET, WEBHOOK_SECRET). Please check your configuration.'
    );
  });


  describe('createOrder', () => {
    const mockOrderData = {
      amount: 500,
      currency: 'INR',
      orderId: 'test_order_123',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
    };

    it('should create a Razorpay order successfully', async () => {
      const mockRazorpayResponse = {
        id: 'order_mock_id',
        amount: 50000,
        currency: 'INR',
        receipt: 'order_test_order_123',
        status: 'created',
      };
      mockRazorpayOrders.create.mockResolvedValueOnce(mockRazorpayResponse);

      const result = await service.createOrder(mockOrderData);

      expect(mockRazorpayOrders.create).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'INR',
        receipt: 'order_test_order_123',
        notes: {
          orderId: 'test_order_123',
          customerName: 'John Doe',
          customerEmail: 'john.doe@example.com',
        },
        payment_capture: 1,
      });

      expect(result).toEqual({
        id: 'order_mock_id',
        amount: 50000,
        currency: 'INR',
        key: 'rzp_test_mock_id',
        name: 'Your Clothing Brand',
        description: 'Fashion Purchase',
        order_id: 'test_order_123',
        prefill: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        theme: {
          color: '#F37254',
        },
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(
        `Attempting to create Razorpay order for order ID: ${mockOrderData.orderId}, amount: ${mockOrderData.amount}`
      );
      expect(loggerLogSpy).toHaveBeenCalledWith(`Razorpay order created successfully: order_mock_id`);
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('should log error and throw BadRequestException on order creation failure', async () => {
      const errorMessage = 'Invalid amount error from Razorpay';
      mockRazorpayOrders.create.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.createOrder(mockOrderData))
        .rejects
        .toThrow(BadRequestException);
      await expect(service.createOrder(mockOrderData))
        .rejects
        .toThrow('Failed to create payment order. Please try again.');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Razorpay order creation failed for order ID ${mockOrderData.orderId}: ${errorMessage}`,
        expect.any(String)
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    const webhookSecret = 'whsec_mock_razorpay_secret';
    const rawBody = Buffer.from('{"event":"payment.captured","payload":{"payment":{"entity":{"notes":{"orderId":"order123"}}}}}');

    it('should return true for a valid signature', async () => {
      const validSignature = createHmac('sha256', webhookSecret)
        .update(rawBody.toString('utf8'))
        .digest('hex');

      const isValid = await service.verifyWebhookSignature(validSignature, {}, rawBody);
      expect(isValid).toBe(true);
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should return false and log a warning for an invalid signature', async () => {
      const invalidSignature = 'invalid_signature_abcd';
      const isValid = await service.verifyWebhookSignature(invalidSignature, {}, rawBody);
      expect(isValid).toBe(false);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid webhook signature received.')
      );
    });
  });

  describe('handleWebhook', () => {
    it('should update order status to PAID for "payment.captured" event', async () => {
      const mockPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_captured',
              notes: { orderId: 'order_cap_123' },
              status: 'captured'
            }
          }
        }
      };

      await service.handleWebhook(mockPayload);

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order_cap_123', OrderStatus.PAID);
      expect(loggerLogSpy).toHaveBeenCalledWith(`Processing webhook event: payment.captured for order ID: order_cap_123`);
      expect(loggerLogSpy).toHaveBeenCalledWith(`Order order_cap_123 payment captured successfully.`);
      expect(loggerErrorSpy).not.toHaveBeenCalled();
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should update order status to FAILED for "payment.failed" event', async () => {
      const mockPayload = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_failed',
              notes: { orderId: 'order_fail_456' },
              status: 'failed'
            }
          }
        }
      };

      await service.handleWebhook(mockPayload);

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order_fail_456', OrderStatus.FAILED);
      expect(loggerLogSpy).toHaveBeenCalledWith(`Processing webhook event: payment.failed for order ID: order_fail_456`);
      expect(loggerLogSpy).toHaveBeenCalledWith(`Order order_fail_456 payment failed.`);
      expect(loggerErrorSpy).not.toHaveBeenCalled();
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should update order status to PAID for "order.paid" event', async () => {
      const mockPayload = {
        event: 'order.paid',
        payload: {
          order: {
            entity: {
              id: 'order_paid_789',
              receipt: 'order_paid_789'
            }
          }
        }
      };

      await service.handleWebhook(mockPayload);

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order_paid_789', OrderStatus.PAID);
      expect(loggerLogSpy).toHaveBeenCalledWith(`Processing webhook event: order.paid for order ID: order_paid_789`);
      expect(loggerLogSpy).toHaveBeenCalledWith(`Razorpay Order order_paid_789 marked as paid.`);
      expect(loggerErrorSpy).not.toHaveBeenCalled();
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should log a warning for an unhandled webhook event type', async () => {
      const mockPayload = {
        event: 'customer.created',
        payload: {
          payment: {
            entity: {
              notes: { orderId: 'order_unhandled_000' }
            }
          }
        }
      };

      await service.handleWebhook(mockPayload);

      expect(orderService.updateOrderStatus).not.toHaveBeenCalled();
      expect(loggerLogSpy).toHaveBeenCalledWith(`Processing webhook event: customer.created for order ID: order_unhandled_000`);
      expect(loggerLogSpy).toHaveBeenCalledWith(`Unhandled webhook event type: customer.created for order ID: order_unhandled_000`);
      expect(loggerErrorSpy).not.toHaveBeenCalled();
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should log a warning if order ID is not found in webhook payload', async () => {
      const mockPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_no_order_id',
              notes: {}
            }
          }
        }
      };

      await service.handleWebhook(mockPayload);

      expect(orderService.updateOrderStatus).not.toHaveBeenCalled();
      expect(loggerWarnSpy).toHaveBeenCalledWith('Webhook received but Order ID could not be extracted from payload.');
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('should log error and throw BadRequestException on webhook processing error', async () => {
      const mockPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_error_123',
              notes: { orderId: 'order_error_999' }
            }
          }
        }
      };
      const errorMessage = 'Database error updating order';
      (orderService.updateOrderStatus as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.handleWebhook(mockPayload))
        .rejects
        .toThrow(BadRequestException);
      await expect(service.handleWebhook(mockPayload))
        .rejects
        .toThrow('Webhook processing failed due to an internal error.');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Webhook processing error for order ID order_error_999, event payment.captured: ${errorMessage}`,
        expect.any(String)
      );
    });
  });

  describe('refundPayment', () => {
    const paymentId = 'pay_refund_123';
    const amount = 100;

    it('should refund a payment successfully', async () => {
      const mockRefundResponse = {
        id: 'r_mock_id',
        entity: 'refund',
        amount: 10000,
        status: 'processed',
        payment_id: paymentId,
      };
      mockRazorpayPayments.refund.mockResolvedValueOnce(mockRefundResponse);

      const result = await service.refundPayment(paymentId, amount);

      expect(mockRazorpayPayments.refund).toHaveBeenCalledWith(paymentId, {
        amount: 10000,
      });
      expect(result).toEqual({
        id: 'r_mock_id',
        amount: 100,
        status: 'processed',
        payment_id: paymentId,
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(`Attempting to refund payment ${paymentId} with amount ${amount}`);
      expect(loggerLogSpy).toHaveBeenCalledWith(`Refund processed successfully for payment ${paymentId}. Refund ID: r_mock_id`);
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('should log error and throw BadRequestException on refund failure', async () => {
      const errorMessage = 'Insufficient funds for refund';
      mockRazorpayPayments.refund.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.refundPayment(paymentId, amount))
        .rejects
        .toThrow(BadRequestException);
      await expect(service.refundPayment(paymentId, amount))
        .rejects
        .toThrow('Failed to process refund. Please check payment ID and amount.');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Refund failed for payment ${paymentId}: ${errorMessage}`,
        expect.any(String)
      );
    });
  });
});