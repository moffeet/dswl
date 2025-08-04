import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';
import { Receipt } from './entities/receipt.entity';
import { WxUser } from '../wx-users/entities/wx-user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { ImageCompressionService } from '../common/services/image-compression.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receipt, WxUser, Customer])
  ],
  controllers: [ReceiptsController],
  providers: [ReceiptsService, ImageCompressionService],
  exports: [ReceiptsService]
})
export class ReceiptsModule {}
