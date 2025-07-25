import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AdminGuard } from './guards/admin.guard';
import { UsersModule } from '../users/users.module';
import { WxUsersModule } from '../wx-users/wx-users.module';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import { BlacklistService } from './blacklist.service';
import { IpLimitService } from './ip-limit.service';
import { TokenService } from './token.service';
import { PermissionCheckService } from './permission-check.service';
import { CaptchaService } from './captcha.service';
import { SignatureService } from './signature.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'logistics-system-jwt-secret-2024',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d'
      },
    }),
    TypeOrmModule.forFeature([User, Role, Permission]),
    forwardRef(() => UsersModule),
    WxUsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AdminGuard, CaslAbilityFactory, BlacklistService, IpLimitService, PermissionCheckService, CaptchaService, SignatureService, TokenService],
  exports: [AuthService, AdminGuard, CaslAbilityFactory, BlacklistService, IpLimitService, PermissionCheckService, CaptchaService, SignatureService, TokenService],
})
export class AuthModule {} 