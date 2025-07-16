// src/contact/contact.controller.ts
import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ContactService, ContactFormDto } from './contact.service'; // Import ContactFormDto
import { Response } from 'express'; // Import Response from express for explicit response handling

@Controller('contact') // The base path for this controller will be /contact
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('send') // This makes the full endpoint POST /contact/send
  async sendContact(@Body() formData: ContactFormDto, @Res() res: Response) {
    try {
      const result = await this.contactService.sendContactEmail(formData);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) { // Catch any error (including those thrown from service)
      console.error('Controller error sending contact email:', error.message);
      // Return appropriate HTTP status and message to the frontend
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to send email due to an internal server error.'
      });
    }
  }
}