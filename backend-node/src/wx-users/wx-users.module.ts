import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WxUsersService } from './wx-users.service';
import { WxUsersController } from './wx-users.controller';
import { WxUser } from './entities/wx-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WxUser])],
  controllers: [WxUsersController],
  providers: [WxUsersService],
  exports: [WxUsersService],
})
export class WxUsersModule {}
