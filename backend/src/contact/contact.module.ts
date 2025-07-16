// src/contact/contact.module.ts
import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { MailerModule } from '@nestjs-modules/mailer'; // Import MailerModule if not already here

@Module({
  imports: [
    // MailerModule is configured globally in AppModule.ts, so just importing it here
    // makes MailerService injectable in this module's providers.
    MailerModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}