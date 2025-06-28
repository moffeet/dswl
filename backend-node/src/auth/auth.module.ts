import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import { BlacklistService } from './blacklist.service';
import { IpLimitService } from './ip-limit.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'logistics-system-jwt-secret-2024',
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRES_IN || '30d' 
      },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, CaslAbilityFactory, BlacklistService, IpLimitService],
  exports: [AuthService, CaslAbilityFactory, BlacklistService, IpLimitService],
})
export class AuthModule {} 