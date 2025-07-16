import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { NewsletterSubscription } from './newsletter.entity';
import { NewsletterService } from './newsletter.service';

@Resolver(() => NewsletterSubscription)
export class NewsletterResolver {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Mutation(() => NewsletterSubscription)
  async subscribeToNewsletter(
    @Args('email') email: string
  ): Promise<NewsletterSubscription> {
    return this.newsletterService.subscribe(email);
  }

  @Mutation(() => Boolean)
  async unsubscribeFromNewsletter(
    @Args('email') email: string
  ): Promise<boolean> {
    return this.newsletterService.unsubscribe(email);
  }
}