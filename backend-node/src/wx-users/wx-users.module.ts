import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { WxUsersService } from './wx-users.service';
import { WxUsersController } from './wx-users.controller';
import { WxUser } from './entities/wx-user.entity';
import { WechatApiService } from './services/wechat-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WxUser]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [WxUsersController],
  providers: [WxUsersService, WechatApiService],
  exports: [WxUsersService, WechatApiService],
})
export class WxUsersModule {}
