import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { Checkin } from './entities/checkin.entity';
import { WxUser } from '../wx-users/entities/wx-user.entity';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Checkin, WxUser, Customer])
  ],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService]
})
export class CheckinsModule {}
