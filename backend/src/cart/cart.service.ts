// src/cart/cart.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { ProductService } from '../product/product.service'; // We will use this to get product details
import { User } from '../user/user.entity'; // For user context

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private productService: ProductService, // Inject ProductService
  ) {}

  // Method to find or create a cart for a user
  async findOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } }, // Find cart by user ID
      relations: ['user', 'items', 'items.product'], // Load user, items, and item's product
    });

    if (!cart) {
      // If no cart exists, create a new one
      cart = this.cartRepository.create({
        user: { id: userId } as User, // Associate with the user
      });
      await this.cartRepository.save(cart);
    }
    return cart;
  }

  // Placeholder for adding item to cart
  async addItemToCart(userId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    const product = await this.productService.findOne(productId); // Get product details

    if (product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock for product ${product.name}. Available: ${product.stock}`);
    }

    let cartItem = cart.items.find(item => item.product.id === productId);

    if (cartItem) {
      // Update existing item quantity
      cartItem.quantity += quantity;
      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(`Cannot add more. Exceeds stock for product ${product.name}. Total required: ${cartItem.quantity}, Available: ${product.stock}`);
      }
      cartItem.price = product.price; // Update price in case it changed
    } else {
      // Add new item
      cartItem = this.cartItemRepository.create({
        cart: cart,
        product: product,
        quantity: quantity,
        price: product.price, // Store current price
      });
      cart.items.push(cartItem);
    }

    await this.cartItemRepository.save(cartItem); // Save the item first
    // Recalculate total if necessary (or update after saving items)
    // cart.total = cart.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    // await this.cartRepository.save(cart); // Save cart to update total if needed

    // Re-fetch cart to ensure relations are correctly loaded after item save
    return this.findOrCreateCart(userId);
  }

  // Placeholder for updating cart item quantity
  async updateCartItemQuantity(userId: string, cartItemId: string, quantity: number): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    const cartItem = cart.items.find(item => item.id === cartItemId);

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID "${cartItemId}" not found in your cart.`);
    }

    if (quantity <= 0) {
      return this.removeCartItem(userId, cartItemId); // Remove if quantity is 0 or less
    }

    const product = await this.productService.findOne(cartItem.product.id);
    if (product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${quantity}`);
    }

    cartItem.quantity = quantity;
    cartItem.price = product.price; // Update price in case it changed
    await this.cartItemRepository.save(cartItem);

    return this.findOrCreateCart(userId);
  }

  // Placeholder for removing item from cart
  async removeCartItem(userId: string, cartItemId: string): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    const cartItem = cart.items.find(item => item.id === cartItemId);

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID "${cartItemId}" not found in your cart.`);
    }

    await this.cartItemRepository.remove(cartItem); // Use .remove() for entity removal
    // Filter out the removed item from the cart's items array for consistency
    cart.items = cart.items.filter(item => item.id !== cartItemId);

    return this.findOrCreateCart(userId);
  }

  // Placeholder for clearing the entire cart
  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    if (cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items); // Remove all associated cart items
      cart.items = []; // Clear items array in memory
    }
    return this.findOrCreateCart(userId);
  }
}