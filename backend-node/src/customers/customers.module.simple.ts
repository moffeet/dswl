import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller.simple';

@Module({
  controllers: [CustomersController],
})
export class CustomersModule {} 