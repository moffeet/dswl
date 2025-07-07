import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { AmapService } from './services/amap.service';
import { CustomerSyncService } from './sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController],
  providers: [CustomersService, AmapService, CustomerSyncService],
  exports: [CustomersService, AmapService, CustomerSyncService],
})
export class CustomersModule {}