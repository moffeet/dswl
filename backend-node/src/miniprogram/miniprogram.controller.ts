import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiConsumes,
  ApiHeader
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RESPONSE_CODES, HTTP_STATUS_CODES, RESPONSE_MESSAGES } from '../common/constants/response-codes';
import { CustomLogger } from '../config/logger.config';
import { ChineseTime } from '../common/decorators/format-time.decorator';

// 导入服务
import { CustomersService } from '../customers/customers.service';
import { ReceiptsService } from '../receipts/receipts.service';
import { WxUsersService } from '../wx-users/wx-users.service';

import { JwtService } from '@nestjs/jwt';
import { WechatApiService } from '../wx-users/services/wechat-api.service';
import { TokenService } from '../auth/token.service';

// 导入DTO
import { UploadReceiptDto } from '../receipts/dto/upload-receipt.dto';
import { WxUpdateCustomerDto } from '../customers/dto/wx-update-customer.dto';
import { SimpleLoginDto, SimpleLoginResponseDto } from './dto/simple-login.dto';
import { RefreshTokenDto, TokenResponseDto } from '../auth/dto/token.dto';

@ApiTags('📱 小程序接口')
@Controller('miniprogram')
@UseGuards(JwtAuthGuard)
export class MiniprogramController {
  private readonly logger = new CustomLogger('MiniprogramController');

  constructor(
    private readonly customersService: CustomersService,
    private readonly receiptsService: ReceiptsService,
    private readonly wxUsersService: WxUsersService,
    private readonly jwtService: JwtService,
    private readonly wechatApiService: WechatApiService,
    private readonly tokenService: TokenService,
  ) {}

  // ==================== 登录接口 ====================

  @Public()
  @Post('login')
  @ApiOperation({
    summary: '小程序用户登录',
    description: `
🔐 **小程序双token登录接口（支持设备绑定）**

## 📋 功能说明
- 只需要手机号授权code，无需微信登录code
- 通过手机号查找用户并生成双token（Access Token + Refresh Token）
- Access Token有效期2小时，Refresh Token有效期7天
- 支持设备唯一标识绑定，提高账号安全性
- 无需签名验证，公开接口

## 🔒 安全机制
- 使用双token机制提高安全性
- Access Token短期有效（2小时），降低泄露风险
- Refresh Token长期有效（7天），支持自动续期
- 手机号授权确保用户身份真实性
- **设备绑定验证**：首次登录自动绑定设备，后续登录验证设备标识

## 📱 设备标识说明
- **deviceId（可选）**：设备唯一标识，可以是MAC地址、设备ID等
- **首次登录**：如果用户没有绑定设备，会自动绑定当前设备
- **后续登录**：验证设备标识是否匹配，不匹配则拒绝登录
- **安全提示**：建议前端始终传递设备标识以提高安全性

## 📝 前端调用示例

### 基础登录（明文设备标识）
\`\`\`javascript
// 1. 获取设备标识
const deviceId = wx.getSystemInfoSync().deviceId ||
                 wx.getStorageSync('deviceId') ||
                 'device_' + Date.now();

// 2. 获取手机号授权并登录
wx.getPhoneNumber({
  success: function(res) {
    wx.request({
      url: '/api/miniprogram/login',
      method: 'POST',
      data: {
        code: res.code,
        deviceId: deviceId  // 明文设备标识
      },
      success: (loginRes) => {
        if (loginRes.data.code === 200) {
          wx.setStorageSync('accessToken', loginRes.data.data.accessToken);
          wx.setStorageSync('refreshToken', loginRes.data.data.refreshToken);
          wx.setStorageSync('deviceId', deviceId);
        }
      }
    });
  }
});
\`\`\`

### 安全登录（加密设备标识）
\`\`\`javascript
// 1. 引入加密工具
import { createSecureMiniprogramLoginData } from '@/utils/crypto';

// 2. 获取设备标识
const deviceId = wx.getSystemInfoSync().deviceId ||
                 wx.getStorageSync('deviceId') ||
                 'device_' + Date.now();

// 3. 获取手机号授权并登录
wx.getPhoneNumber({
  success: function(res) {
    // 创建加密登录数据
    const secureLoginData = createSecureMiniprogramLoginData(res.code, deviceId);

    wx.request({
      url: '/api/miniprogram/login',
      method: 'POST',
      data: secureLoginData, // 包含加密的设备标识
      success: (loginRes) => {
        if (loginRes.data.code === 200) {
          wx.setStorageSync('accessToken', loginRes.data.data.accessToken);
          wx.setStorageSync('refreshToken', loginRes.data.data.refreshToken);
          wx.setStorageSync('deviceId', deviceId);
        }
      }
    });
  }
});
\`\`\`
    `
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '登录成功',
    type: SimpleLoginResponseDto
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '登录失败' })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '用户不存在' })
  async login(@Body() loginDto: SimpleLoginDto) {
    this.logger.log(`🔐 小程序用户登录请求 - code: ${loginDto.code}, deviceId: ${loginDto.deviceId ? '已提供' : '未提供'}`);

    try {
      // 1. 通过code获取手机号
      this.logger.log(`📞 获取微信手机号 - code: ${loginDto.code}`);
      const phoneNumber = await this.wechatApiService.getPhoneNumber(loginDto.code);
      this.logger.log(`✅ 获取手机号成功 - 手机号: ${phoneNumber?.substring(0, 3)}****${phoneNumber?.substring(7)}`);

      // 2. 根据手机号查找用户
      this.logger.log(`👤 查找手机号用户 - 手机号: ${phoneNumber}`);
      const user = await this.wxUsersService.findByPhone(phoneNumber);

      if (!user) {
        this.logger.warn(`❌ 用户不存在 - 手机号: ${phoneNumber?.substring(0, 3)}****${phoneNumber?.substring(7)}`);
        return {
          code: RESPONSE_CODES.USER_NOT_FOUND,
          message: RESPONSE_MESSAGES.USER_NOT_FOUND,
          data: null
        };
      }

      this.logger.log(`✅ 找到用户 - ID: ${user.id}, 姓名: ${user.name}, 角色: ${user.role}`);

      // 3. 解密和验证设备标识（如果提供了deviceId）
      let actualDeviceId: string | undefined;
      if (loginDto.deviceId) {
        this.logger.log(`🔓 开始处理设备标识 - 用户ID: ${user.id}`);

        // 尝试解密设备标识
        try {
          // 检测是否为加密数据（Base64编码的长字符串）
          const isEncrypted = loginDto.deviceId.length > 50 && /^[A-Za-z0-9+/=]+$/.test(loginDto.deviceId);

          if (isEncrypted) {
            this.logger.log(`🔐 检测到加密设备标识，开始解密`);
            const { decryptPassword } = await import('../auth/utils/crypto.util');
            const decryptedData = decryptPassword(loginDto.deviceId);
            actualDeviceId = decryptedData.password; // 在设备标识加密中，password字段存储的是设备ID
            this.logger.log(`✅ 设备标识解密成功 - 设备ID: ${actualDeviceId}`);
          } else {
            // 明文设备标识（向后兼容）
            actualDeviceId = loginDto.deviceId;
            this.logger.log(`📝 使用明文设备标识 - 设备ID: ${actualDeviceId}`);
          }
        } catch (error) {
          this.logger.error(`❌ 设备标识解密失败 - 用户ID: ${user.id}, 错误: ${error.message}`);
          return {
            code: HTTP_STATUS_CODES.BAD_REQUEST,
            message: '设备标识格式错误，请重新登录',
            data: null
          };
        }

        // 验证设备标识
        this.logger.log(`🔒 验证设备标识 - 用户ID: ${user.id}, 设备ID: ${actualDeviceId}`);
        const isDeviceValid = await this.wxUsersService.validateDeviceId(user.id, actualDeviceId);

        if (!isDeviceValid) {
          this.logger.error(`❌ 设备验证失败 - 用户ID: ${user.id}, 设备ID: ${actualDeviceId}`);
          return {
            code: HTTP_STATUS_CODES.FORBIDDEN,
            message: '设备验证失败，该账号已绑定其他设备，请联系管理员',
            data: null
          };
        }

        this.logger.log(`✅ 设备验证通过 - 用户ID: ${user.id}`);
      } else {
        this.logger.warn(`⚠️ 未提供设备标识 - 用户ID: ${user.id}, 建议前端传递设备标识以提高安全性`);
      }

      // 4. 生成双token（在token中包含设备信息）
      this.logger.log(`🎫 生成双token - 用户ID: ${user.id}, 姓名: ${user.name}`);
      const tokenPayload = {
        sub: user.id,
        username: user.name,
        phone: user.phone,
        role: user.role,
        userType: 'wx-user' as const,
        deviceId: actualDeviceId // 将解密后的设备ID包含在token中
      };

      const tokens = this.tokenService.generateTokens(tokenPayload);
      this.logger.log(`✅ 双token生成成功 - 用户ID: ${user.id}`);

      this.logger.log(`🎉 登录成功 - 用户ID: ${user.id}, 姓名: ${user.name}, 手机号: ${phoneNumber?.substring(0, 3)}****${phoneNumber?.substring(7)}, 角色: ${user.role}, 设备: ${actualDeviceId || '未提供'}`);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '登录成功',
        data: {
          ...tokens,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role
          }
        }
      };

    } catch (error) {
      this.logger.error(`💥 登录异常 - code: ${loginDto.code}, 错误: ${error.message}`, error.stack);
      return {
        code: HTTP_STATUS_CODES.BAD_REQUEST,
        message: error.message || '登录失败',
        data: null
      };
    }
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({
    summary: '刷新Access Token',
    description: `
🔄 **刷新Access Token接口**

## 📋 功能说明
- 使用Refresh Token获取新的Access Token
- 旧的Refresh Token会被撤销，返回新的token对
- 无需重新登录即可延长会话

## 🔒 安全机制
- Refresh Token一次性使用，用后即废
- 新的token对包含新的过期时间
- 自动维护token的安全性

## 📝 前端调用示例
\`\`\`javascript
wx.request({
  url: '/api/miniprogram/refresh-token',
  method: 'POST',
  data: {
    refreshToken: 'your_refresh_token_here'
  }
});
\`\`\`
    `
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '刷新成功',
    type: TokenResponseDto
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.UNAUTHORIZED, description: 'Refresh Token无效或已过期' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      this.logger.log(`🔄 刷新token请求`);

      const tokens = await this.tokenService.refreshAccessToken(refreshTokenDto.refreshToken);

      this.logger.log(`✅ token刷新成功`);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: 'Token刷新成功',
        data: tokens
      };
    } catch (error) {
      this.logger.error(`💥 token刷新失败: ${error.message}`, error.stack);
      return {
        code: HTTP_STATUS_CODES.UNAUTHORIZED,
        message: error.message || 'Token刷新失败',
        data: null
      };
    }
  }

  // ==================== 司机页面 ====================

  @Get('customers/search')
  @ChineseTime() // 小程序客户查询时间格式化
  @ApiOperation({
    summary: '司机查询客户信息',
    description: `
🔍 **司机查询客户信息接口（需要设备验证）**

## 📋 功能说明
- 司机通过客户编号查询客户信息
- 返回客户名、编号、地址、经纬度等信息
- 需要JWT Token认证和设备标识验证

## 🔒 认证机制
- **Token认证**：使用小程序登录后获得的accessToken
- **设备验证**：必须在请求头中提供设备标识
- 设备标识必须与登录时绑定的设备一致

## 📱 请求头要求
- **Authorization**: Bearer <accessToken>
- **X-Device-Id**: <设备唯一标识>

## 📝 前端调用示例
\`\`\`javascript
const deviceId = wx.getStorageSync('deviceId'); // 登录时保存的设备ID

wx.request({
  url: '/api/miniprogram/customers/search',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + accessToken,
    'X-Device-Id': deviceId  // 必须提供设备标识
  },
  data: {
    customerNumber: 'C001'
  }
});
\`\`\`

## ⚠️ 安全提示
- 如果设备标识不匹配，接口将返回401错误
- 请确保设备标识与登录时使用的一致
- 设备标识丢失时需要重新登录
    `
  })
  @ApiQuery({
    name: 'customerNumber',
    required: true,
    description: '客户编号',
    example: 'C001'
  })
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'JWT Token认证头',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @ApiHeader({
    name: 'X-Device-Id',
    required: true,
    description: '设备唯一标识，必须与登录时绑定的设备一致',
    example: 'device_12345678'
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '查询成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '查询成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            customerNumber: { type: 'string', example: 'C001' },
            customerName: { type: 'string', example: '深圳科技有限公司' },
            storeAddress: { type: 'string', example: '深圳市南山区科技园南区A座' },
            warehouseAddress: { type: 'string', example: '深圳市南山区科技园南区B座' },
            storeLongitude: { type: 'number', example: 113.9547 },
            storeLatitude: { type: 'number', example: 22.5431 },
            warehouseLongitude: { type: 'number', example: 113.9557 },
            warehouseLatitude: { type: 'number', example: 22.5441 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '客户不存在' })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '参数错误' })
  async searchCustomer(
    @Query('customerNumber') customerNumber: string,
    @Req() req: Request
  ) {
    try {
      // 从JWT认证中获取用户信息
      const user = req['user'] as any;
      this.logger.log(`小程序司机查询客户 - 用户ID: ${user?.id}, 客户编号: ${customerNumber}`);

      if (!customerNumber) {
        return {
          code: RESPONSE_CODES.PARAM_ERROR,
          message: '客户编号不能为空',
          data: null
        };
      }

      const customer = await this.customersService.findByCustomerNumber(customerNumber);

      if (!customer) {
        return {
          code: 404,
          message: '客户不存在',
          data: null
        };
      }

      // 返回司机需要的客户信息
      const customerInfo = {
        id: customer.id,
        customerNumber: customer.customerNumber,
        customerName: customer.customerName,
        storeAddress: customer.storeAddress,
        warehouseAddress: customer.warehouseAddress,
        storeLongitude: customer.storeLongitude,
        storeLatitude: customer.storeLatitude,
        warehouseLongitude: customer.warehouseLongitude,
        warehouseLatitude: customer.warehouseLatitude
      };

      this.logger.log(`小程序司机查询客户成功 - 客户: ${customer.customerName}`);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '查询成功',
        data: customerInfo
      };
    } catch (error) {
      this.logger.error(`小程序司机查询客户失败: ${error.message}`, error.stack);
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }

  // ==================== 打卡/签收单上传 ====================

  @Post('receipts/upload')
  @ChineseTime() // 小程序上传签收单时间格式化
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
    fileFilter: (_, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return callback(new BadRequestException('只支持图片格式：jpg, jpeg, png, gif'), false);
      }
      callback(null, true);
    },
  }))
  @ApiOperation({
    summary: '上传签收单',
    description: `
📤 **上传签收单接口（需要设备验证）**

## 📋 功能说明
- 小程序用户上传签收单图片和相关信息
- 需要JWT Token认证和设备标识验证
- 支持图片格式：jpg, jpeg, png, gif
- 文件大小限制：10MB

## 🔒 认证机制
- **Token认证**：使用小程序登录后获得的accessToken
- **设备验证**：必须在请求头中提供设备标识
- 设备标识必须与登录时绑定的设备一致

## 📱 请求头要求
- **Authorization**: Bearer <accessToken>
- **X-Device-Id**: <设备唯一标识>

## 📝 前端调用示例
\`\`\`javascript
const deviceId = wx.getStorageSync('deviceId'); // 登录时保存的设备ID

wx.uploadFile({
  url: '/api/miniprogram/receipts/upload',
  filePath: tempFilePath,
  name: 'file',
  header: {
    'Authorization': 'Bearer ' + accessToken,
    'X-Device-Id': deviceId  // 必须提供设备标识
  },
  formData: {
    customerNumber: 'C001',
    operatorName: '张三',
    // ... 其他参数
  }
});
\`\`\`

## ⚠️ 安全提示
- 如果设备标识不匹配，接口将返回401错误
- 请确保设备标识与登录时使用的一致
    `
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '上传签收单数据',
    type: UploadReceiptDto
  })
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'JWT Token认证头',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @ApiHeader({
    name: 'X-Device-Id',
    required: true,
    description: '设备唯一标识，必须与登录时绑定的设备一致',
    example: 'device_12345678'
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '上传成功'
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '参数错误' })
  async uploadReceipt(
    @Body() uploadDto: UploadReceiptDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request
  ) {
    const startTime = Date.now();
    try {
      // 从JWT认证中获取用户信息
      const user = req['user'] as any;
      this.logger.log(`开始上传签收单 - JWT用户ID: ${user?.id}, 操作用户: ${uploadDto.wxUserName}, 文件大小: ${file?.size || 0} bytes`);

      if (!file) {
        throw new BadRequestException('请上传签收单图片');
      }

      // 检查文件大小
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('文件大小不能超过10MB');
      }

      // 构建基础URL
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;

      this.logger.log(`开始处理文件 - 文件名: ${file.originalname}, 大小: ${file.size}`);
      
      const receipt = await this.receiptsService.uploadReceipt(uploadDto, file, baseUrl);

      const duration = Date.now() - startTime;
      this.logger.log(`签收单上传成功 - 耗时: ${duration}ms, ID: ${receipt.id}`);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '签收单上传成功',
        data: {
          id: receipt.id,
          imageUrl: receipt.imageUrl,
          uploadTime: receipt.uploadTime,
          wxUserName: receipt.wxUserName,
          customerName: receipt.customerName
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`上传签收单失败 - 耗时: ${duration}ms, 错误: ${error.message}`, error.stack);
      
      // 检查是否是网络连接问题
      if (error.message.includes('aborted') || error.code === 'ECONNRESET') {
        this.logger.error('检测到网络连接中断，可能是客户端提前关闭连接');
        return {
          code: RESPONSE_CODES.SERVER_ERROR,
          message: '网络连接中断，请重试',
          data: null
        };
      }
      
      return {
        code: error.status === 400 ? RESPONSE_CODES.PARAM_ERROR :
              RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }



  // ==================== 销售页面 ====================

  @Patch('customers/update')
  @ChineseTime() // 小程序更新客户信息时间格式化
  @ApiOperation({
    summary: '修改客户地址',
    description: `
🔍 **修改客户地址接口**

## 📋 功能说明
- 通过客户编号修改客户的门店地址和仓库地址
- 系统自动获取经纬度信息
- 需要JWT Token认证

## 🔒 认证机制
- 使用小程序登录后获得的accessToken
- 在请求头中添加：Authorization: Bearer <accessToken>
- 无需签名验证，只需Token认证

## 📝 前端调用示例
\`\`\`javascript
wx.request({
  url: '/api/miniprogram/customers/update',
  method: 'PATCH',
  header: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  },
  data: {
    customerNumber: 'C001',
    operatorName: '张三',
    storeAddress: '新的门店地址',
    warehouseAddress: '新的仓库地址'
  }
});
\`\`\`
    `
  })
  @ApiBody({
    description: '客户地址更新数据',
    type: WxUpdateCustomerDto
  })
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'JWT Token认证头',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '更新成功'
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '客户不存在' })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '参数错误' })
  async updateCustomer(
    @Body() updateDto: WxUpdateCustomerDto,
    @Req() req: Request
  ) {
    try {
      // 从JWT认证中获取用户信息
      const user = req['user'] as any;
      this.logger.log(`小程序修改客户 - JWT用户ID: ${user?.id}, 操作人: ${updateDto.operatorName}, 客户编号: ${updateDto.customerNumber}`);

      // 更新客户地址
      const updatedCustomer = await this.customersService.wxUpdateCustomerAddress(
        updateDto.operatorName,
        updateDto.customerNumber,
        {
          storeAddress: updateDto.storeAddress,
          warehouseAddress: updateDto.warehouseAddress
        }
      );

      // 返回更新后的客户信息
      const customerInfo = {
        id: updatedCustomer.id,
        customerNumber: updatedCustomer.customerNumber,
        customerName: updatedCustomer.customerName,
        storeAddress: updatedCustomer.storeAddress,
        warehouseAddress: updatedCustomer.warehouseAddress,
        storeLongitude: updatedCustomer.storeLongitude,
        storeLatitude: updatedCustomer.storeLatitude,
        warehouseLongitude: updatedCustomer.warehouseLongitude,
        warehouseLatitude: updatedCustomer.warehouseLatitude,
        updateBy: updatedCustomer.updateBy,
        updatedAt: updatedCustomer.updatedAt
      };

      this.logger.log(`小程序修改客户成功 - 客户: ${updatedCustomer.customerName}`);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '客户信息更新成功',
        data: customerInfo
      };
    } catch (error) {
      this.logger.error(`小程序修改客户失败: ${error.message}`, error.stack);
      return {
        code: error.status === 404 ? 404 :
              error.status === 400 ? RESPONSE_CODES.PARAM_ERROR :
              RESPONSE_CODES.SERVER_ERROR,
        message: error.message,
        data: null
      };
    }
  }
}
