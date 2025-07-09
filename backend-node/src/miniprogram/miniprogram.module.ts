import { Module } from '@nestjs/common';
import { MiniprogramController } from './miniprogram.controller';

// 导入需要的模块
import { CustomersModule } from '../customers/customers.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { CheckinsModule } from '../checkins/checkins.module';
import { AuthModule } from '../auth/auth.module';
import { WxUsersModule } from '../wx-users/wx-users.module';

@Module({
  imports: [
    CustomersModule,
    ReceiptsModule,
    CheckinsModule,
    AuthModule,
    WxUsersModule
  ],
  controllers: [MiniprogramController],
  providers: [],
  exports: []
})
export class MiniprogramModule {}
