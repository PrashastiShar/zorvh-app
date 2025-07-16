import { Injectable, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import { OrderService } from '../order/order.service';
import { OrderStatus } from '../order/order.entity';
import { RefundResponseDto } from './dto/refund-response.dto';

// Firebase Admin SDK imports
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

/**
 * Interface for the data required to create an order with Razorpay.
 */
interface CreateRazorpayOrderData {
  amount: number;
  currency: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
}

/**
 * Interface for the data required to save a payment method.
 * This will come from the frontend after Razorpay client-side tokenization.
 */
interface SavePaymentMethodData {
  userId: string;
  razorpayPaymentMethodId: string; // This is the ID Razorpay provides for a saved card/token (e.g., payment_id)
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private razorpay: Razorpay;
  private readonly razorpayWebhookSecret: string;
  private readonly razorpayKeyId: string;
  private firestoreDb: Firestore;
  private readonly firebaseAppId: string; // To construct Firestore paths

  constructor(
    private readonly configService: ConfigService,
    private readonly orderService: OrderService // Assuming OrderService is correctly injected
  ) {
    this.razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET')!;
    this.razorpayWebhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET')!;
    this.firebaseAppId = this.configService.get<string>('FIREBASE_APP_ID')!;

    if (!this.razorpayKeyId || !razorpayKeySecret || !this.razorpayWebhookSecret || !this.firebaseAppId) {
      this.logger.error('Missing one or more required environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, WEBHOOK_SECRET, FIREBASE_APP_ID). Please check your configuration.');
      throw new InternalServerErrorException('Payment service configuration error: Missing required API keys or app ID.');
    }

    // Initialize Razorpay with validated key ID and secret
    this.razorpay = new Razorpay({
      key_id: this.razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID')!,
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL')!,
          privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n'), // Handle newlines
        }),
      });
      this.logger.log('Firebase Admin SDK initialized.');
    }
    this.firestoreDb = admin.firestore();
  }

  /**
   * Helper to get the path to a user's profile document.
   */
  private getUserProfileDocRef(userId: string) {
    return this.firestoreDb.collection(`artifacts/${this.firebaseAppId}/users/${userId}/user_data`).doc('profile');
  }

  /**
   * Helper to get the path to a user's payment methods collection.
   */
  private getUserPaymentMethodsCollectionRef(userId: string) {
    return this.firestoreDb.collection(`artifacts/${this.firebaseAppId}/users/${userId}/paymentMethods`);
  }

  /**
   * Creates a Razorpay order for a given amount and customer details.
   * @param orderData - Object containing amount, currency, orderId, customerName, and customerEmail.
   * @returns An object with Razorpay order details and payment gateway options for frontend.
   * @throws BadRequestException if order creation fails.
   */
  async createOrder(orderData: CreateRazorpayOrderData) {
    try {
      const options = {
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency,
        receipt: `rcpt_${Date.now()}`, // <--- Changed to a shorter, unique receipt
        notes: {
          orderId: orderData.orderId, // Full orderId still available in notes
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
        },
        payment_capture: 1,
      };

      this.logger.log(`Attempting to create Razorpay order for order ID: ${orderData.orderId}, amount: ${orderData.amount}`);
      const razorpayOrder = await this.razorpay.orders.create(options);
      this.logger.log(`Razorpay order created successfully: ${razorpayOrder.id}`);

      return {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: this.razorpayKeyId,
        name: "Your Clothing Brand",
        description: "Fashion Purchase",
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
        },
        theme: {
          color: "#F37254",
        },
      };
    } catch (error: any) { // Catch as 'any' to access error.response or other properties
      this.logger.error(`Razorpay order creation failed for order ID ${orderData.orderId}: ${error.message}`, error.stack);
      // Log the full error object from Razorpay for detailed debugging
      if (error.response) {
        this.logger.error(`Razorpay API Error Response: ${JSON.stringify(error.response.data)}`);
      } else if (error.error) { // Some Razorpay errors might be nested differently
        this.logger.error(`Razorpay SDK Error: ${JSON.stringify(error.error)}`);
      }
      throw new BadRequestException('Failed to create payment order. Please try again.');
    }
  }

  /**
   * Saves a payment method for a user.
   * This involves creating/getting a Razorpay customer and associating the payment method with them,
   * then storing non-sensitive details in Firestore.
   * @param data - Contains userId and Razorpay payment method ID (payment_id from frontend).
   */
  async savePaymentMethod(data: SavePaymentMethodData) {
    const { userId, razorpayPaymentMethodId } = data; // Removed cardDetails from destructuring
    this.logger.log(`Attempting to save payment method for user ${userId} with Razorpay Payment ID: ${razorpayPaymentMethodId}`);

    try {
      // 1. Fetch payment details from Razorpay using the payment_id
      const payment = await this.razorpay.payments.fetch(razorpayPaymentMethodId);
      if (!payment || !payment.card) {
        this.logger.error(`Could not fetch payment details or card information for payment ID: ${razorpayPaymentMethodId}`);
        throw new BadRequestException('Failed to retrieve payment method details from Razorpay.');
      }

      const cardDetails = {
        brand: payment.card.network || 'Unknown',
        last4: payment.card.last4 || '****',
        expMonth: payment.card.expiry_month || 0,
        expYear: payment.card.expiry_year || 0,
        type: 'card', // Assuming it's a card for now. Expand if other types are saved.
      };
      this.logger.log(`Fetched card details for ${razorpayPaymentMethodId}: ${cardDetails.brand} ****${cardDetails.last4}`);


      const userProfileRef = this.getUserProfileDocRef(userId);
      const userProfileSnap = await userProfileRef.get();
      let razorpayCustomerId: string | undefined = userProfileSnap.data()?.razorpayCustomerId;

      // 2. Ensure Razorpay Customer exists
      if (!razorpayCustomerId) {
        this.logger.log(`No Razorpay customer found for user ${userId}. Creating a new one.`);
        const customer = await this.razorpay.customers.create({
          name: userProfileSnap.data()?.name || `User ${userId}`, // Use user's name if available
          email: userProfileSnap.data()?.email || '', // Use user's email if available
          // contact: userProfileSnap.data()?.phone || '', // Add if you store phone
        });
        razorpayCustomerId = customer.id;
        // Save the new Razorpay Customer ID to the user's profile in Firestore
        await userProfileRef.set({ razorpayCustomerId: razorpayCustomerId }, { merge: true });
        this.logger.log(`Created new Razorpay customer ${razorpayCustomerId} for user ${userId}.`);
      } else {
        this.logger.log(`Existing Razorpay customer ${razorpayCustomerId} found for user ${userId}.`);
      }

      // 3. Store non-sensitive payment method details in Firestore
      // We'll use the payment.card.id (if available) or the payment_id itself as the Firestore doc ID
      // to ensure uniqueness and link to Razorpay's internal card ID if possible.
      // Razorpay's payment object often contains payment.card.id for saved cards.
      const paymentMethodFirestoreId = payment.card.id || razorpayPaymentMethodId; // Prefer card.id if available

      const paymentMethodDocRef = this.getUserPaymentMethodsCollectionRef(userId).doc(paymentMethodFirestoreId);

      // Check if this is the first payment method, make it default
      const existingMethodsSnap = await this.getUserPaymentMethodsCollectionRef(userId).limit(1).get();
      const isDefault = existingMethodsSnap.empty;

      await paymentMethodDocRef.set({
        id: paymentMethodFirestoreId, // Store the Razorpay-provided ID (card.id or payment_id)
        brand: cardDetails.brand,
        last4: cardDetails.last4,
        expMonth: cardDetails.expMonth,
        expYear: cardDetails.expYear,
        type: cardDetails.type,
        isDefault: isDefault,
        razorpayCustomerId: razorpayCustomerId, // Link to the Razorpay customer
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      this.logger.log(`Payment method ${paymentMethodFirestoreId} saved for user ${userId}.`);
      return { success: true, message: 'Payment method saved successfully.' };

    } catch (error) {
      this.logger.error(`Failed to save payment method for user ${userId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to save payment method. Please try again.');
    }
  }

  /**
   * Deletes a saved payment method for a user.
   * This involves detaching it from Razorpay (if applicable) and deleting from Firestore.
   * @param userId - The ID of the user.
   * @param paymentMethodId - The ID of the payment method to delete (Razorpay-provided ID).
   * @param razorpayCustomerId - The Razorpay Customer ID associated with the user.
   */
  async deletePaymentMethod(userId: string, paymentMethodId: string, razorpayCustomerId?: string) {
    this.logger.log(`Attempting to delete payment method ${paymentMethodId} for user ${userId}.`);

    try {
      // 1. (Optional but recommended): Detach/Delete from Razorpay if their API supports it for saved cards.
      // Razorpay typically manages saved cards under a customer.
      // As of Razorpay's current API, direct deletion of a 'card' entity by its ID isn't common.
      // Instead, if you're using customer tokens, you might manage them differently.
      // If `paymentMethodId` refers to a specific card linked to a customer,
      // you might need to use a specific Razorpay API for this, or rely on the Firestore deletion.
      // For now, we'll log a note, as direct 'delete card by id' is less common than with Stripe.
      // If Razorpay introduces a direct API for detaching a saved card from a customer,
      // you would implement it here.
      if (razorpayCustomerId) {
        this.logger.warn(`Razorpay does not typically expose a direct API to delete a saved card by its ID (${paymentMethodId}) from a customer.
                          If this is a token, ensure it's invalidated if necessary. Proceeding with Firestore deletion.`);
        // Example if Razorpay had such an API:
        // await this.razorpay.customers.deleteCard(razorpayCustomerId, paymentMethodId);
      }

      // 2. Delete the non-sensitive reference from Firestore
      const paymentMethodDocRef = this.getUserPaymentMethodsCollectionRef(userId).doc(paymentMethodId);
      await paymentMethodDocRef.delete();

      this.logger.log(`Payment method ${paymentMethodId} deleted from Firestore for user ${userId}.`);
      return { success: true, message: 'Payment method deleted successfully.' };

    } catch (error) {
      this.logger.error(`Failed to delete payment method ${paymentMethodId} for user ${userId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete payment method. Please try again.');
    }
  }

  /**
   * Verifies the integrity and authenticity of a Razorpay webhook signature.
   * @param signature - The 'x-razorpay-signature' header.
   * @param body - The parsed JSON body.
   * @param rawBody - The raw buffer body.
   * @returns True if the signature is valid, false otherwise.
   */
  async verifyWebhookSignature(signature: string, body: any, rawBody: Buffer): Promise<boolean> {
    const expectedSignature = createHmac('sha256', this.razorpayWebhookSecret)
      .update(rawBody.toString('utf8'))
      .digest('hex');

    const isValid = expectedSignature === signature;
    if (!isValid) {
      this.logger.warn(`Invalid webhook signature received. Expected: ${expectedSignature}, Received: ${signature}`);
    }
    return isValid;
  }

  /**
   * Handles incoming Razorpay webhook events to update order statuses.
   * @param body - The parsed JSON body of the webhook event.
   * @throws BadRequestException if webhook processing fails.
   */
  async handleWebhook(body: any) {
    const event = body.event;
    const payment = body.payload.payment?.entity;
    const order = body.payload.order?.entity;

    const orderId = payment?.notes?.orderId || order?.receipt;

    if (!orderId) {
      this.logger.warn('Webhook received but Order ID could not be extracted from payload.');
      return;
    }

    this.logger.log(`Processing webhook event: ${event} for order ID: ${orderId}`);

    try {
      switch (event) {
        case 'payment.captured':
          await this.orderService.updateOrderStatus(orderId, OrderStatus.PAID);
          this.logger.log(`Order ${orderId} payment captured successfully.`);
          break;

        case 'payment.failed':
          await this.orderService.updateOrderStatus(orderId, OrderStatus.FAILED);
          this.logger.log(`Order ${orderId} payment failed.`);
          break;

        case 'order.paid':
          await this.orderService.updateOrderStatus(orderId, OrderStatus.PAID);
          this.logger.log(`Razorpay Order ${orderId} marked as paid.`);
          break;

        default:
          this.logger.log(`Unhandled webhook event type: ${event} for order ID: ${orderId}`);
      }
    } catch (error) {
      this.logger.error(`Webhook processing error for order ID ${orderId}, event ${event}: ${error.message}`, error.stack);
      throw new BadRequestException('Webhook processing failed due to an internal error.');
    }
  }

  /**
   * Initiates a refund for a given payment ID.
   * @param paymentId - The ID of the payment to be refunded.
   * @param amount - The amount to be refunded (in your application's base currency unit).
   * @returns A RefundResponseDto object on success.
   * @throws BadRequestException if the refund process fails.
   */
  async refundPayment(paymentId: string, amount: number): Promise<RefundResponseDto> {
    try {
      this.logger.log(`Attempting to refund payment ${paymentId} with amount ${amount}`);
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: amount * 100,
      });

      this.logger.log(`Refund processed successfully for payment ${paymentId}. Refund ID: ${refund.id}`);

      return {
        id: refund.id!,
        amount: refund.amount! / 100,
        status: refund.status!,
        payment_id: refund.payment_id!,
      };
    } catch (error) {
      this.logger.error(`Refund failed for payment ${paymentId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to process refund. Please check payment ID and amount.');
    }
  }
}
