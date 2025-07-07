import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Res, HttpStatus, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CustomersService } from './customers.service';
import { CustomerSyncService } from './sync.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto, CustomerListQueryDto } from './dto/search-customer.dto';
import { BatchDeleteCustomerDto, GeocodeRequestDto, ReverseGeocodeRequestDto, ExternalCustomerDto } from './dto/sync-customer.dto';
import { Customer } from './entities/customer.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RESPONSE_CODES, RESPONSE_MESSAGES } from '../common/constants/response-codes';
import { CustomLogger } from '../config/logger.config';

@ApiTags('客户管理 - Customer Management')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  private readonly logger = new CustomLogger('CustomersController');

  constructor(
    private readonly customersService: CustomersService,
    private readonly customerSyncService: CustomerSyncService,
  ) {}

  @ApiOperation({
    summary: '获取客户列表',
    description: `获取客户列表，支持搜索、排序和分页功能。`
  })

  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '获取成功' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              customerNumber: { type: 'string', example: 'C001' },
              customerName: { type: 'string', example: '深圳科技有限公司' },
              storeAddress: { type: 'string', example: '深圳市南山区科技园南区A座' },
              warehouseAddress: { type: 'string', example: '深圳市南山区科技园南区B座' },
              updateBy: { type: 'string', example: '管理员' },
              status: { type: 'string', example: 'active', description: '仅超级管理员可见' },
              updatedAt: { type: 'string', example: '2025-06-27T08:16:28.000Z' }
            }
          }
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 }
      }
    }
  })
  @ApiResponse({ status: 500, description: '获取失败' })
  @Get()
  async findAll(@Query() query: CustomerListQueryDto, @Request() req) {
    try {
      const currentUser = req.user; // 从JWT中获取当前用户信息

      // 检查是否有搜索条件
      const hasSearchParams = query.customerNumber || query.customerName;

      if (hasSearchParams) {
        // 有搜索条件，使用搜索功能
        const searchDto: SearchCustomerDto = {
          customerNumber: query.customerNumber,
          customerName: query.customerName,
          page: query.page || 1,
          limit: query.limit || 10,
        };

        this.logger.log(`客户搜索请求 - 用户: ${currentUser?.username}, 参数: ${JSON.stringify(searchDto)}`);

        const result = await this.customersService.search(searchDto, currentUser);

        return {
          code: RESPONSE_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.SEARCH_SUCCESS,
          data: result.data,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        };
      } else {
        // 没有搜索条件，使用普通分页（默认按更新时间排序）
        const page = query.page || 1;
        const limit = query.limit || 10;

        this.logger.log(`客户列表请求 - 用户: ${currentUser?.username}, 页码: ${page}, 每页: ${limit}`);

        const result = await this.customersService.findAll(page, limit, currentUser);

        return {
          code: RESPONSE_CODES.SUCCESS,
          message: RESPONSE_MESSAGES.GET_SUCCESS,
          data: result.data,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        };
      }
    } catch (error) {
      this.logger.error(`获取客户列表失败: ${error.message}`, error.stack);
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: '获取失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: '搜索客户',
    description: '根据客户编号、名称、地址等条件搜索客户'
  })

  @ApiResponse({ 
    status: 200, 
    description: '搜索成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '搜索成功' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Customer' }
        },
        total: { type: 'number', example: 3, description: '搜索结果总数' }
      }
    }
  })
  @Get('search')
  async search(@Query() query: SearchCustomerDto) {
    try {
      const result = await this.customersService.search(query);
      
      return {
        code: RESPONSE_CODES.SUCCESS,
        message: RESPONSE_MESSAGES.SEARCH_SUCCESS,
        data: result.data,
        total: result.total,
      };
    } catch (error) {
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: '搜索失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: 'Excel导出',
    description: '导出客户数据为Excel文件，支持选择性导出或全部导出'
  })

  @ApiResponse({
    status: 200,
    description: '导出成功',
    headers: {
      'Content-Type': {
        description: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      'Content-Disposition': {
        description: 'attachment; filename="customers.xlsx"'
      }
    }
  })
  @ApiResponse({ status: 500, description: '导出失败' })
  @Get('export')
  async exportToExcel(@Query('customerIds') customerIds: string, @Res() res: Response) {
    try {
      let ids: number[] | undefined;

      this.logger.log(`Excel导出开始 - 接收到的customerIds参数: ${customerIds}`);

      if (customerIds && customerIds.trim()) {
        // 解析并验证ID
        const parsedIds = customerIds.split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id) && id > 0 && Number.isInteger(id) && Number.isFinite(id));

        this.logger.log(`控制器 - 解析后的有效IDs: ${JSON.stringify(parsedIds)}`);

        // 如果解析后没有有效的ID，则设为undefined以导出全部
        if (parsedIds.length === 0) {
          ids = undefined;
        } else {
          ids = parsedIds;
        }
      }

      const excelBuffer = await this.customersService.exportToExcel(ids);

      const filename = `customers_${new Date().toISOString().split('T')[0]}.xlsx`;
      this.logger.log(`Excel导出成功 - 文件名: ${filename}, 大小: ${excelBuffer.length} bytes`);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    } catch (error) {
      this.logger.error(`Excel导出失败: ${error.message}`, error.stack);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: RESPONSE_CODES.SERVER_ERROR,
        message: '导出失败',
        data: null,
        error: error.message,
      });
    }
  }

  @ApiOperation({
    summary: '获取最后同步时间',
    description: '获取客户数据的最后同步时间'
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        code: RESPONSE_CODES.SUCCESS,
        message: '获取成功',
        data: {
          lastSyncTime: '2025-06-27T08:16:28.000Z'
        }
      }
    }
  })
  @Get('last-sync-time')
  async getLastSyncTime() {
    try {
      const lastSyncTime = await this.customersService.getLastSyncTime();

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '获取成功',
        data: {
          lastSyncTime
        },
      };
    } catch (error) {
      this.logger.error(`获取最后同步时间失败: ${error.message}`, error.stack);
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: '获取失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '获取客户详情',
    description: '根据客户ID获取客户的详细信息'
  })
  @ApiParam({ name: 'id', description: '客户ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '获取成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1, description: '客户ID' },
            customerNumber: { type: 'string', example: 'C001', description: '客户编号' },
            customerName: { type: 'string', example: '深圳科技有限公司', description: '客户名称' },
            storeAddress: { type: 'string', example: '深圳市南山区科技园南区A座', description: '门店地址' },
            warehouseAddress: { type: 'string', example: '深圳市南山区科技园南区B座', description: '仓库地址' },
            updateBy: { type: 'string', example: '管理员', description: '更新人' },
            createTime: { type: 'string', example: '2025-06-27T06:16:28.000Z', description: '创建时间' },
            updateTime: { type: 'string', example: '2025-06-27T06:16:28.000Z', description: '更新时间' }
          }
        }
      }
    }
  })
  @Get('sync-metadata')
  @ApiOperation({
    summary: '获取同步元数据',
    description: '获取外部系统同步的元数据信息，包括最后同步时间等'
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSyncMetadata() {
    try {
      const metadata = await this.customerSyncService.getSyncMetadata();

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: RESPONSE_MESSAGES.GET_SUCCESS,
        data: metadata
      };
    } catch (error) {
      this.logger.error(`获取同步元数据失败: ${error.message}`, error.stack);
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: `获取同步元数据失败: ${error.message}`,
        data: null
      };
    }
  }

  @ApiResponse({ status: 404, description: '客户不存在' })
  @ApiResponse({ status: 500, description: '获取失败' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      this.logger.log(`获取客户详情 - ID: ${id}`);

      const customer = await this.customersService.findOne(parseInt(id));

      if (!customer) {
        this.logger.warn(`客户不存在 - ID: ${id}`);
        return res.status(HttpStatus.NOT_FOUND).json({
          code: 403,
          message: '客户不存在',
          data: null,
        });
      }

      this.logger.log(`获取客户详情成功 - ID: ${id}, 客户名称: ${customer.customerName}`);
      return res.status(HttpStatus.OK).json({
        code: RESPONSE_CODES.SUCCESS,
        message: '获取成功',
        data: customer,
      });
    } catch (error) {
      this.logger.error(`获取客户详情失败 - ID: ${id}, 错误: ${error.message}`, error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: RESPONSE_CODES.SERVER_ERROR,
        message: '获取失败',
        data: null,
        error: error.message,
      });
    }
  }

  @ApiOperation({ 
    summary: '创建客户',
    description: '创建新客户，客户编号将自动生成（格式：C001、C002...）。系统只需要提供客户名称和地址，其他字段会自动处理。'
  })
  @ApiBody({
    type: CreateCustomerDto,
    description: '客户创建信息',
    examples: {
      basic: {
        summary: '基本客户信息',
        description: '只需要提供客户名称，地址可选',
        value: {
          customerName: '新客户公司',
          storeAddress: '上海市浦东新区张江高科技园区A座',
          warehouseAddress: '上海市浦东新区张江高科技园区B座'
        }
      },
      minimal: {
        summary: '最小信息',
        description: '仅提供客户名称',
        value: {
          customerName: '测试客户'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: '创建成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '创建成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 8, description: '客户ID' },
            customerNumber: { type: 'string', example: 'C008', description: '自动生成的客户编号' },
            customerName: { type: 'string', example: '新客户公司', description: '客户名称' },
            storeAddress: { type: 'string', example: '上海市浦东新区张江高科技园区A座', description: '门店地址' },
            warehouseAddress: { type: 'string', example: '上海市浦东新区张江高科技园区B座', description: '仓库地址' },
            updateBy: { type: 'string', example: '管理员', description: '创建人' },
            createTime: { type: 'string', example: '2025-06-27T08:16:28.000Z', description: '创建时间' },
            updateTime: { type: 'string', example: '2025-06-27T08:16:28.000Z', description: '更新时间' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '请求参数错误：客户名称不能为空' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  @Post()
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    try {
      const customer = await this.customersService.create(createCustomerDto);
      
      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '创建成功',
        data: customer,
      };
    } catch (error) {
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: '创建失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: '更新客户',
    description: '根据客户ID更新客户信息，可以部分更新'
  })
  @ApiParam({ name: 'id', description: '要更新的客户ID', example: 1 })
  @ApiBody({
    type: UpdateCustomerDto,
    description: '要更新的客户信息',
    examples: {
      partial: {
        summary: '部分更新',
        description: '只更新客户名称',
        value: {
          customerName: '更新后的客户名称'
        }
      },
      full: {
        summary: '完整更新',
        description: '更新所有字段',
        value: {
          customerName: '北京新科技有限公司',
          storeAddress: '北京市海淀区中关村大街1号A座',
          warehouseAddress: '北京市海淀区中关村大街1号B座'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '更新成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '更新成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1, description: '客户ID' },
            customerNumber: { type: 'string', example: 'C001', description: '客户编号' },
            customerName: { type: 'string', example: '北京新科技有限公司', description: '更新后的客户名称' },
            storeAddress: { type: 'string', example: '北京市海淀区中关村大街1号A座', description: '更新后的门店地址' },
            warehouseAddress: { type: 'string', example: '北京市海淀区中关村大街1号B座', description: '更新后的仓库地址' },
            updateBy: { type: 'string', example: '管理员', description: '更新人' },
            createTime: { type: 'string', example: '2025-06-27T06:16:28.000Z', description: '创建时间' },
            updateTime: { type: 'string', example: '2025-06-27T08:30:28.000Z', description: '更新时间' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '客户不存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 500, description: '更新失败' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    try {
      const customer = await this.customersService.update(parseInt(id), updateCustomerDto);
      
      if (!customer) {
        return {
          code: 403,
          message: '客户不存在',
          data: null,
        };
      }
      
      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '更新成功',
        data: customer,
      };
    } catch (error) {
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: '更新失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({ 
    summary: '删除客户',
    description: '根据客户ID删除客户信息，删除后无法恢复'
  })
  @ApiParam({ name: 'id', description: '客户ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: '删除成功',
    schema: {
      example: {
        code: RESPONSE_CODES.SUCCESS,
        message: '删除成功',
        data: {
          id: 1,
          customerNumber: 'C001',
          customerName: '已删除的客户'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '客户不存在' })
  @ApiResponse({ status: 500, description: '删除失败' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const customer = await this.customersService.remove(parseInt(id));
      
      if (!customer) {
        return {
          code: 403,
          message: '客户不存在',
          data: null,
        };
      }
      
      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '删除成功',
        data: customer,
      };
    } catch (error) {
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: '删除失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '同步外部系统客户数据',
    description: '从外部系统同步客户数据，地址信息以本系统为准'
  })
  @ApiResponse({
    status: 200,
    description: '同步成功',
    schema: {
      example: {
        code: RESPONSE_CODES.SUCCESS,
        message: '同步成功',
        data: {
          message: '同步成功',
          syncedCount: 5,
          updatedCount: 3,
          newCount: 2
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: '同步失败' })
  @Post('sync-external')
  async syncExternalCustomers(@Body() externalCustomers: ExternalCustomerDto[]) {
    try {
      const result = await this.customersService.syncExternalCustomers(externalCustomers);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '同步成功',
        data: result,
      };
    } catch (error) {
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: error.message || '同步失败',
        data: null,
      };
    }
  }

  // 删除了重复的同步端点，使用下面的外部系统同步端点

  @ApiOperation({
    summary: '批量删除客户',
    description: '批量删除多个客户，支持多选删除'
  })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    schema: {
      example: {
        code: RESPONSE_CODES.SUCCESS,
        message: '批量删除成功',
        data: {
          message: '批量删除成功',
          deletedCount: 3
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '未找到要删除的客户' })
  @ApiResponse({ status: 500, description: '删除失败' })
  @Delete('batch')
  async batchDelete(@Body() batchDeleteDto: BatchDeleteCustomerDto) {
    try {
      const result = await this.customersService.batchDelete(batchDeleteDto);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '批量删除成功',
        data: result,
      };
    } catch (error) {
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: error.message || '删除失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '地理编码',
    description: '将地址转换为经纬度坐标'
  })
  @ApiResponse({
    status: 200,
    description: '编码成功',
    schema: {
      example: {
        code: RESPONSE_CODES.SUCCESS,
        message: '地理编码成功',
        data: {
          address: '深圳市南山区科技园南区',
          longitude: 113.9547,
          latitude: 22.5431,
          province: '广东省',
          city: '深圳市',
          district: '南山区'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '地址格式不正确' })
  @ApiResponse({ status: 500, description: '编码失败' })
  @Post('geocode')
  async geocodeAddress(@Body() geocodeDto: GeocodeRequestDto) {
    try {
      const result = await this.customersService.geocodeAddress(geocodeDto);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '地理编码成功',
        data: result,
      };
    } catch (error) {
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: error.message || '编码失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '逆地理编码',
    description: '将经纬度坐标转换为地址'
  })
  @ApiResponse({
    status: 200,
    description: '编码成功',
    schema: {
      example: {
        code: RESPONSE_CODES.SUCCESS,
        message: '逆地理编码成功',
        data: {
          address: '深圳市南山区科技园南区',
          longitude: 113.9547,
          latitude: 22.5431,
          province: '广东省',
          city: '深圳市',
          district: '南山区'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '坐标格式不正确' })
  @ApiResponse({ status: 500, description: '编码失败' })
  @Post('reverse-geocode')
  async reverseGeocodeLocation(@Body() reverseGeocodeDto: ReverseGeocodeRequestDto) {
    try {
      const result = await this.customersService.reverseGeocodeLocation(reverseGeocodeDto);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: '逆地理编码成功',
        data: result,
      };
    } catch (error) {
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: error.message || '编码失败',
        data: null,
        error: error.message,
      };
    }
  }

  // 同步相关接口
  @Post('sync')
  @ApiOperation({
    summary: '同步外部系统客户数据',
    description: '从外部系统同步客户数据，以客户ID为基准。新客户：同步门店地址并计算经纬度；现有客户：只更新客户名称，门店地址以当前系统为准'
  })
  @ApiResponse({
    status: 200,
    description: '同步成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '同步完成' },
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            syncedCount: { type: 'number', example: 5 },
            createdCount: { type: 'number', example: 2 },
            updatedCount: { type: 'number', example: 3 },
            skippedCount: { type: 'number', example: 0 },
            lastSyncTime: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async syncFromExternal(@Request() req: any) {
    try {
      this.logger.log('开始同步外部系统客户数据');

      const currentUser = req.user; // 从JWT中获取当前用户信息
      const updateBy = currentUser?.username || currentUser?.name || '系统管理员';

      const result = await this.customerSyncService.syncFromExternalSystem(updateBy);

      return {
        code: RESPONSE_CODES.SUCCESS,
        message: result.message,
        data: {
          message: result.message,
          syncedCount: result.syncedCount,
          createdCount: result.createdCount,
          updatedCount: result.updatedCount,
          skippedCount: result.skippedCount,
          syncTime: result.lastSyncTime
        }
      };
    } catch (error) {
      this.logger.error(`同步外部系统数据失败: ${error.message}`, error.stack);
      return {
        code: RESPONSE_CODES.SERVER_ERROR,
        message: `同步失败: ${error.message}`,
        data: null
      };
    }
  }

}