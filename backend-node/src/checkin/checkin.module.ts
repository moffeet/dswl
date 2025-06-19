import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { CheckinRecord } from './entities/checkin-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckinRecord])],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {} 