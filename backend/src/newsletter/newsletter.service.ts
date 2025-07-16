import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscription } from './newsletter.entity';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscription)
    private newsletterRepository: Repository<NewsletterSubscription>,
  ) {}

  async subscribe(email: string): Promise<NewsletterSubscription> {
    const existing = await this.newsletterRepository.findOneBy({ email });
    
    if (existing) {
      throw new ConflictException('Email already subscribed');
    }

    const subscription = this.newsletterRepository.create({ email });
    return this.newsletterRepository.save(subscription);
  }

  async unsubscribe(email: string): Promise<boolean> {
    const result = await this.newsletterRepository.delete({ email });
    
    // Fix: Handle possible null/undefined value
    return (result.affected ?? 0) > 0;
  }
}