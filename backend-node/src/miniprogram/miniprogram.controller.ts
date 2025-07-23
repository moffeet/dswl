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
import { RESPONSE_CODES, HTTP_STATUS_CODES } from '../common/constants/response-codes';
import { CustomLogger } from '../config/logger.config';
import { ChineseTime } from '../common/decorators/format-time.decorator';

// 导入服务
import { CustomersService } from '../customers/customers.service';
import { ReceiptsService } from '../receipts/receipts.service';
import { WxUsersService } from '../wx-users/wx-users.service';

import { JwtService } from '@nestjs/jwt';
import { WechatApiService } from '../wx-users/services/wechat-api.service';

// 导入DTO
import { UploadReceiptDto } from '../receipts/dto/upload-receipt.dto';
import { WxUpdateCustomerDto } from '../customers/dto/wx-update-customer.dto';
import { SimpleLoginDto, SimpleLoginResponseDto } from './dto/simple-login.dto';

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
  ) {}

  // ==================== 登录接口 ====================

  @Public()
  @Post('login')
  @ApiOperation({
    summary: '小程序用户登录',
    description: `
🔐 **超简化小程序登录接口**

## 📋 功能说明
- 只需要手机号授权code，无需微信登录code
- 通过手机号查找用户并生成JWT Token
- 无需签名验证，公开接口

## 📝 前端调用示例
\`\`\`javascript
// 1. 获取手机号授权
wx.getPhoneNumber({
  success: function(res) {
    // 2. 直接登录
    wx.request({
      url: '/api/miniprogram/login',
      method: 'POST',
      data: {
        code: res.code  // 只需要这一个参数！
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
    this.logger.log(`🔐 小程序用户登录请求 - code: ${loginDto.code}`);

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
          code: HTTP_STATUS_CODES.NOT_FOUND,
          message: '用户不存在，请联系管理员创建账户',
          data: null
        };
      }

      this.logger.log(`✅ 找到用户 - ID: ${user.id}, 姓名: ${user.name}, 角色: ${user.role}`);

      // 3. 生成JWT token
      this.logger.log(`🎫 生成JWT token - 用户ID: ${user.id}, 姓名: ${user.name}`);
      const payload = {
        sub: user.id,
        username: user.name,
        phone: user.phone,
        role: user.role,
        userType: 'wx-user'
      };

      const accessToken = this.jwtService.sign(payload);
      this.logger.log(`✅ JWT token生成成功 - 用户ID: ${user.id}`);

      this.logger.log(`🎉 登录成功 - 用户ID: ${user.id}, 姓名: ${user.name}, 手机号: ${phoneNumber?.substring(0, 3)}****${phoneNumber?.substring(7)}, 角色: ${user.role}`);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '登录成功',
        data: {
          accessToken,
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

  // ==================== 司机页面 ====================

  @Get('customers/search')
  @ChineseTime() // 小程序客户查询时间格式化
  @ApiOperation({
    summary: '司机查询客户信息',
    description: `
🔍 **司机查询客户信息接口**

## 📋 功能说明
- 司机通过客户编号查询客户信息
- 返回客户名、编号、地址、经纬度等信息
- 需要JWT Token认证

## 🔒 认证机制
- 使用小程序登录后获得的accessToken
- 在请求头中添加：Authorization: Bearer <accessToken>
- 无需签名验证，只需Token认证

## 📝 前端调用示例
\`\`\`javascript
wx.request({
  url: '/api/miniprogram/customers/search',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + accessToken
  },
  data: {
    customerNumber: 'C001'
  }
});
\`\`\`
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
🔍 **上传签收单接口**

## 📋 功能说明
- 小程序用户上传签收单图片和相关信息
- 需要JWT Token认证

## 🔒 认证机制
- 使用小程序登录后获得的accessToken
- 在请求头中添加：Authorization: Bearer <accessToken>
- 无需签名验证，只需Token认证

## 📝 前端调用示例
\`\`\`javascript
wx.uploadFile({
  url: '/api/miniprogram/receipts/upload',
  filePath: tempFilePath,
  name: 'file',
  header: {
    'Authorization': 'Bearer ' + accessToken
  },
  formData: {
    customerNumber: 'C001',
    operatorName: '张三',
    // ... 其他参数
  }
});
\`\`\`
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
