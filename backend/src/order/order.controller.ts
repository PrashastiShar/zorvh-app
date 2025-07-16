// src/order/order.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto'; // Assuming DTOs are in 'src/order/dto/'
import { Order, OrderStatus } from './order.entity'; // <-- CRITICAL: Import Order and OrderStatus
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Corrected path for guards
import { RolesGuard } from '../auth/guards/roles.guard';     // Corrected path for guards
import { GetUser } from '../auth/decorators/get-user.decorator'; // Corrected path for decorators
import { Roles } from '../auth/decorators/roles.decorator';   // Corrected path for decorators
import { User as UserEntity, UserRole } from '../user/user.entity'; // Corrected path & aliasing for User entity and UserRole enum

@Controller('orders') // This defines the base route for this controller, e.g., /orders
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Create a new order for the authenticated user.
   * Requires authentication.
   * @param user The authenticated user object (injected via @GetUser()).
   * @param createOrderDto DTO containing order items and shipping address.
   * @returns The created order.
   */
  @UseGuards(JwtAuthGuard) // Protect this route with JWT authentication
  @Post() // This route will handle POST requests to /orders
  async createOrder(
    @GetUser() user: UserEntity, // Get the authenticated user object
    @Body() createOrderDto: CreateOrderDto, // The request body will contain order details
  ): Promise<Order> { // Return type is Promise<Order>
    // Call the service with the user's ID and the DTO
    return this.orderService.createOrder(user.id, createOrderDto);
  }

  /**
   * Get all orders for the authenticated user.
   * Requires authentication.
   * @param user The authenticated user object (injected via @GetUser()).
   * @returns A list of orders.
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-orders') // This route will handle GET requests to /orders/my-orders
  async getMyOrders(@GetUser() user: UserEntity): Promise<Order[]> { // Return type is Promise<Order[]>
    return this.orderService.getOrdersForUser(user.id);
  }

  /**
   * Get a specific order by ID.
   * Requires authentication.
   * You might want to add a check here to ensure the user requesting
   * the order actually owns it, or is an admin.
   * @param id The ID of the order.
   * @returns The order.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id') // This route will handle GET requests to /orders/:id
  async getOrderById(@Param('id') id: string): Promise<Order> { // Return type is Promise<Order>
    // Current implementation returns order if found.
    // Consider adding authorization logic here:
    // const order = await this.orderService.getOrderById(id);
    // if (order.user.id !== user.id && !user.roles.includes(UserRole.ADMIN)) {
    //   throw new UnauthorizedException('You do not have access to this order.');
    // }
    // return order;
    return this.orderService.getOrderById(id);
  }

  /**
   * Update the status of an order. Admin-only access.
   * Requires authentication and 'ADMIN' role.
   * @param id The ID of the order.
   * @param status The new status for the order.
   * @returns The updated order.
   */
  @UseGuards(JwtAuthGuard, RolesGuard) // Protect with JWT and Roles guard
  @Roles(UserRole.ADMIN) // Only users with 'ADMIN' role can access this
  @Patch(':id/status') // This route will handle PATCH requests to /orders/:id/status
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus, // Assuming OrderStatus is imported from order.entity.ts
  ): Promise<Order> { // Return type is Promise<Order>
    if (!Object.values(OrderStatus).includes(status)) {
      throw new BadRequestException(`Invalid order status: ${status}`);
    }
    return this.orderService.updateOrderStatus(id, status);
  }
}