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
import { RequireSignature } from '../auth/decorators/require-signature.decorator';
import { SignatureGuard } from '../auth/guards/signature.guard';
import { RESPONSE_CODES, HTTP_STATUS_CODES } from '../common/constants/response-codes';
import { CustomLogger } from '../config/logger.config';

// 导入服务
import { CustomersService } from '../customers/customers.service';
import { ReceiptsService } from '../receipts/receipts.service';
import { WxUsersService } from '../wx-users/wx-users.service';
import { SignatureService } from '../auth/signature.service';

// 导入DTO
import { UploadReceiptDto } from '../receipts/dto/upload-receipt.dto';
import { WxUpdateCustomerDto } from '../customers/dto/wx-update-customer.dto';

@ApiTags('📱 小程序接口')
@Controller('miniprogram')
@UseGuards(SignatureGuard)
export class MiniprogramController {
  private readonly logger = new CustomLogger('MiniprogramController');

  constructor(
    private readonly customersService: CustomersService,
    private readonly receiptsService: ReceiptsService,
    private readonly wxUsersService: WxUsersService,
    private readonly signatureService: SignatureService,
  ) {}



  // ==================== 司机页面 ====================

  @Get('customers/search')
  @RequireSignature()
  @ApiOperation({
    summary: '司机查询客户信息',
    description: `
🔍 **司机查询客户信息接口**

## 📋 功能说明
- 司机通过客户编号查询客户信息
- 返回客户名、编号、地址、经纬度等信息
- 需要应用级签名校验

## 🔒 签名机制
- 使用小程序内置的应用密钥生成签名
- 签名参数：userId + customerNumber + timestamp + nonce
- 签名算法：HMAC-SHA256

## 📝 签名生成示例
\`\`\`javascript
const params = {
  userId: 1,
  customerNumber: "C001",
  timestamp: Date.now().toString(),
  nonce: generateNonce()
};
const signature = HMAC_SHA256(sortedParams, APP_SECRET);
\`\`\`
    `
  })
  @ApiQuery({
    name: 'customerNumber',
    required: true,
    description: '客户编号',
    example: 'C001'
  })
  @ApiQuery({
    name: 'wxUserId',
    required: true,
    description: '小程序用户ID',
    example: 1
  })
  @ApiQuery({
    name: 'timestamp',
    required: true,
    description: '时间戳（毫秒）',
    example: '1704387123456'
  })
  @ApiQuery({
    name: 'nonce',
    required: true,
    description: '随机数（防重放攻击）',
    example: 'abc123def456'
  })
  @ApiQuery({
    name: 'signature',
    required: true,
    description: '签名值（使用应用密钥生成的HMAC-SHA256）',
    example: 'a1b2c3d4e5f6...'
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
  async searchCustomer(@Query('customerNumber') customerNumber: string) {
    try {
      this.logger.log(`小程序司机查询客户 - 客户编号: ${customerNumber}`);

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
  @RequireSignature()
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return callback(new BadRequestException('只支持图片格式：jpg, jpeg, png, gif'), false);
      }
      callback(null, true);
    },
  }))
  @ApiOperation({
    summary: '上传签收单',
    description: '小程序用户上传签收单图片和相关信息。需要签名校验。'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '上传签收单数据',
    type: UploadReceiptDto
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
      this.logger.log(`开始上传签收单 - 用户: ${uploadDto.wxUserName}, 文件大小: ${file?.size || 0} bytes`);

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
  @RequireSignature()
  @ApiOperation({
    summary: '修改客户地址',
    description: '通过客户编号修改客户的门店地址和仓库地址，系统自动获取经纬度信息。需要签名校验。'
  })
  @ApiBody({
    description: '客户地址更新数据',
    type: WxUpdateCustomerDto
  })
  @ApiResponse({
    status: HTTP_STATUS_CODES.OK,
    description: '更新成功'
  })
  @ApiResponse({ status: HTTP_STATUS_CODES.NOT_FOUND, description: '客户不存在' })
  @ApiResponse({ status: HTTP_STATUS_CODES.BAD_REQUEST, description: '参数错误' })
  async updateCustomer(@Body() updateDto: WxUpdateCustomerDto) {
    try {
      this.logger.log(`小程序修改客户 - 操作人: ${updateDto.operatorName}, 客户编号: ${updateDto.customerNumber}`);

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
