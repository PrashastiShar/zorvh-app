import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity'; // Make sure path is correct
import { OrderItem } from './order-item.entity';     // Make sure path is correct
import { User } from '../user/user.entity';           // Make sure path is correct
import { Cart } from '../cart/cart.entity';           // Make sure path is correct
import { CartItem } from '../cart/cart-item.entity';  // Make sure path is correct
import { ProductService } from '../product/product.service'; // Make sure path is correct

// Import the new DTOs
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from '../order/dto/create-order-item.dto'; // Used internally for order items
import { ShippingAddressDto } from '../order/dto/shipping-address.dto'; // Used internally for shipping address

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private productService: ProductService,
  ) {}

  // Changed input to use CreateOrderDto and explicit user entity
  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    // You would typically fetch the User entity here based on userId if not passed directly
    // const user = await this.userRepository.findOne({ where: { id: userId } });
    // if (!user) throw new NotFoundException('User not found');

    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order cannot be created with no items.');
    }

    let total = 0;
    const orderItems = await Promise.all(createOrderDto.items.map(async (itemDto) => {
      // Security: Fetch product details on the backend to prevent price/stock manipulation
      const product = await this.productService.findOne(itemDto.productId);
      if (!product) {
        throw new NotFoundException(`Product with ID "${itemDto.productId}" not found.`);
      }

      if (product.stock < itemDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${itemDto.quantity}`
        );
      }

      const itemPrice = product.price; // Use the current backend price, not frontend price
      const itemSubTotal = itemPrice * itemDto.quantity;
      total += itemSubTotal;

      // --- CRITICAL FIX: Populate 'name' and 'subTotal' for OrderItem ---
      return this.orderItemRepository.create({
        product,
        productId: product.id, // Explicitly set foreign key
        name: product.name,    // Store product name at time of purchase
        quantity: itemDto.quantity,
        price: itemPrice,      // Store product price at time of purchase
        subTotal: itemSubTotal, // Store calculated sub-total for the item
        size: itemDto.size,    // Assuming size comes from CreateOrderItemDto
      });
    }));

    // --- CRITICAL FIX: Ensure shippingAddress is an object ---
    const order = this.orderRepository.create({
      userId: userId, // Set the foreign key
      items: orderItems,
      total: total, // Total calculated on backend
      shippingAddress: createOrderDto.shippingAddress, // This is now the correct structured object
      status: OrderStatus.PENDING,
      // shippingCost and taxAmount will be added later
    });

    const savedOrder = await this.orderRepository.save(order);

    // Update product stock (move to a separate transaction for atomicity if possible)
    await Promise.all(orderItems.map(item =>
      this.productService.decreaseStock(item.product.id, item.quantity)
    ));

    return savedOrder;
  }

  // You might want to keep a version that uses Cart directly for internal use,
  // but for API endpoint, using DTO is generally better.
  // Example of creating order from a loaded Cart (if needed elsewhere)
  async createOrderFromCart(user: User, cart: Cart, shippingAddress: ShippingAddressDto): Promise<Order> {
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let total = 0;
    const orderItems = await Promise.all(cart.items.map(async (cartItem) => {
      const product = await this.productService.findOne(cartItem.productId); // Assuming cartItem has productId
      if (!product) {
        throw new NotFoundException(`Product with ID "${cartItem.productId}" not found.`);
      }

      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`
        );
      }

      const itemPrice = product.price; // Use product's current price
      const itemSubTotal = itemPrice * cartItem.quantity;
      total += itemSubTotal;

      return this.orderItemRepository.create({
        product,
        productId: product.id,
        name: product.name,
        quantity: cartItem.quantity,
        price: itemPrice,
        subTotal: itemSubTotal,
        size: cartItem.size, // Assuming cartItem has size
      });
    }));

    const order = this.orderRepository.create({
      user,
      userId: user.id, // Explicitly set userId
      items: orderItems,
      total,
      shippingAddress, // Now a structured object
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    await Promise.all(orderItems.map(item =>
      this.productService.decreaseStock(item.productId, item.quantity) // Use item.productId
    ));

    return savedOrder;
  }


  async getOrdersForUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId: userId }, // Query by userId column directly
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.getOrderById(id);
    order.status = status;
    return this.orderRepository.save(order);
  }

  // Method to find order by payment ID (useful for webhooks, as discussed)
  async findOrderByPaymentId(paymentId: string): Promise<string | null> {
    const order = await this.orderRepository.findOne({ where: { paymentIntentId: paymentId } });
    return order ? order.id : null;
  }
}