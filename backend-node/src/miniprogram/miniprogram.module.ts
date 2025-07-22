import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MiniprogramController } from './miniprogram.controller';

// 导入需要的模块
import { CustomersModule } from '../customers/customers.module';
import { ReceiptsModule } from '../receipts/receipts.module';

import { AuthModule } from '../auth/auth.module';
import { WxUsersModule } from '../wx-users/wx-users.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    CustomersModule,
    ReceiptsModule,
    AuthModule,
    WxUsersModule
  ],
  controllers: [MiniprogramController],
  providers: [],
  exports: []
})
export class MiniprogramModule {}
