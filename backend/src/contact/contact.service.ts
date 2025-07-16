// src/contact/contact.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common'; // Import InternalServerErrorException
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

// Define the DTO (Data Transfer Object) for the incoming contact form data
export class ContactFormDto {
  name: string;
  email: string; // Sender's email
  subject: string;
  message: string;
}

@Injectable()
export class ContactService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService, // Inject ConfigService to read .env variables
  ) {}

  async sendContactEmail(formData: ContactFormDto): Promise<{ success: boolean; message: string }> {
    // Get recipient email from environment variables (your Gmail address)
    const recipientEmail = this.configService.get<string>('CONTACT_EMAIL_RECIPIENT');
    const senderEmail = this.configService.get<string>('EMAIL_USER'); // Your Gmail sending address
    const defaultSenderName = this.configService.get<string>('EMAIL_FROM_NAME') || 'ZORVH Contact Form';


    if (!recipientEmail) {
      throw new InternalServerErrorException('CONTACT_EMAIL_RECIPIENT is not configured on the server.');
    }
    if (!senderEmail) {
        throw new InternalServerErrorException('EMAIL_USER (sender email) is not configured on the server.');
    }

    try {
      await this.mailerService.sendMail({
        to: recipientEmail, // The email address where you want to receive the contact messages
        from: `"${defaultSenderName}" <${senderEmail}>`, // The email address configured in Nodemailer transport
        replyTo: formData.email, // This sets the reply-to header to the sender's email
        subject: `New Message: ${formData.subject}`, // Subject of the email you receive
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Subject:</strong> ${formData.subject}</p>
            <p><strong>Message:</strong></p>
            <p style="border: 1px solid #eee; padding: 10px; border-radius: 5px; background-color: #f9f9f9;">${formData.message}</p>
            <p>---</p>
            <p>This email was sent from the contact form on your website.</p>
          </div>
        `,
        // Optionally, you can also send a plain text version
        text: `New Contact Form Submission:\nName: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\nMessage: ${formData.message}`,
      });
      console.log('Contact email sent successfully to:', recipientEmail);
      return { success: true, message: 'Your message has been sent successfully!' };
    } catch (error) {
      console.error('Error sending contact email:', error.message, error.stack);
      // Depending on the type of error, you might want to return a different message
      throw new InternalServerErrorException('Failed to send email. Please try again later.');
    }
  }
}