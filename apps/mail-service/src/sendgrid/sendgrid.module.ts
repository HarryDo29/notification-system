import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendGridService } from './sendgrid.service';
import { MAIL_PROVIDER } from '../providers/mail-provider.interface';

/**
 * SendGridModule — provides SendGridService under the MAIL_PROVIDER token.
 *
 * Marked @Global() so any module can inject MAIL_PROVIDER without
 * needing to import this module explicitly.
 *
 * To swap to another provider (e.g. AWS SES):
 *  1. Create SesModule with a SesService that implements IMailProvider.
 *  2. Replace `SendGridModule` with `SesModule` in AppModule.
 *  3. No changes needed anywhere else.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_PROVIDER,
      useClass: SendGridService,
    },
    // Expose the concrete class too, for direct injection if needed in tests.
    SendGridService,
  ],
  exports: [MAIL_PROVIDER, SendGridService],
})
export class SendGridModule {}
