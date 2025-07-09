import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { Checkin } from './entities/checkin.entity';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Checkin, Customer])
  ],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService]
})
export class CheckinsModule {}
