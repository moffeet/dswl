import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto } from './dto/search-customer.dto';
import { SyncCustomerDto, BatchDeleteCustomerDto, GeocodeRequestDto, ReverseGeocodeRequestDto, ExternalCustomerDto } from './dto/sync-customer.dto';
import { Customer } from './entities/customer.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomLogger } from '../config/logger.config';

@ApiTags('客户管理 - Customer Management')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  private readonly logger = new CustomLogger('CustomersController');

  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ 
    summary: '获取客户列表',
    description: '分页获取客户列表，支持页码和每页数量控制。数据来源：t_customers表'
  })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认为1', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量，默认为10', example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 0 },
        message: { type: 'string', example: '获取成功' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1, description: '客户ID' },
              customerNumber: { type: 'string', example: 'C001', description: '客户编号，自动生成' },
              customerName: { type: 'string', example: '深圳科技有限公司', description: '客户名称' },
              storeAddress: { type: 'string', example: '深圳市南山区科技园南区A座', description: '门店地址' },
              warehouseAddress: { type: 'string', example: '深圳市南山区科技园南区B座', description: '仓库地址' },
              updateBy: { type: 'string', example: '管理员', description: '更新人' },
              createTime: { type: 'string', example: '2025-06-27T06:16:28.000Z', description: '创建时间' },
              updateTime: { type: 'string', example: '2025-06-27T06:16:28.000Z', description: '更新时间' }
            }
          }
        },
        total: { type: 'number', example: 7, description: '总记录数' },
        page: { type: 'number', example: 1, description: '当前页码' },
        limit: { type: 'number', example: 10, description: '每页数量' }
      }
    }
  })
  @Get()
  async findAll(@Query() query: any) {
    try {
      // 检查是否有搜索条件
      const hasSearchParams = query.customerNumber || query.customerName || query.storeAddress || query.warehouseAddress;
      
      if (hasSearchParams) {
        // 有搜索条件，使用搜索功能
        const searchDto: SearchCustomerDto = {
          customerNumber: query.customerNumber,
          customerName: query.customerName,
          storeAddress: query.storeAddress,
          warehouseAddress: query.warehouseAddress,
          status: query.status,
          page: parseInt(query.page) || 1,
          limit: parseInt(query.limit || query.pageSize) || 10,
        };
        
        const result = await this.customersService.search(searchDto);
        
        return {
          code: 0,
          message: '搜索成功',
          data: result.data,
          total: result.total,
          page: searchDto.page,
          limit: searchDto.limit,
        };
      } else {
        // 没有搜索条件，使用普通分页
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit || query.pageSize) || 10;
        
        const result = await this.customersService.findAll(page, limit);
        
        return {
          code: 0,
          message: '获取成功',
          data: result.data,
          total: result.total,
          page: result.page,
          limit: result.limit,
        };
      }
    } catch (error) {
      return {
        code: 500,
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
  @ApiQuery({ name: 'customerNumber', required: false, description: '客户编号（模糊匹配）', example: 'C001' })
  @ApiQuery({ name: 'customerName', required: false, description: '客户名称（模糊匹配）', example: '科技' })
  @ApiQuery({ name: 'storeAddress', required: false, description: '门店地址（模糊匹配）', example: '科技园' })
  @ApiQuery({ name: 'warehouseAddress', required: false, description: '仓库地址（模糊匹配）', example: '物流园' })
  @ApiResponse({ 
    status: 200, 
    description: '搜索成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 0 },
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
        code: 0,
        message: '搜索成功',
        data: result.data,
        total: result.total,
      };
    } catch (error) {
      return {
        code: 500,
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
  @ApiQuery({
    name: 'customerIds',
    description: '要导出的客户ID列表，用逗号分隔，不提供则导出全部',
    required: false,
    example: '1,2,3'
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
        code: 500,
        message: '导出失败',
        data: null,
        error: error.message,
      });
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
        code: { type: 'number', example: 0 },
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
          code: 404,
          message: '客户不存在',
          data: null,
        });
      }

      this.logger.log(`获取客户详情成功 - ID: ${id}, 客户名称: ${customer.customerName}`);
      return res.status(HttpStatus.OK).json({
        code: 0,
        message: '获取成功',
        data: customer,
      });
    } catch (error) {
      this.logger.error(`获取客户详情失败 - ID: ${id}, 错误: ${error.message}`, error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: 500,
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
        code: { type: 'number', example: 0 },
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
        code: 0,
        message: '创建成功',
        data: customer,
      };
    } catch (error) {
      return {
        code: 500,
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
        code: { type: 'number', example: 0 },
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
          code: 404,
          message: '客户不存在',
          data: null,
        };
      }
      
      return {
        code: 0,
        message: '更新成功',
        data: customer,
      };
    } catch (error) {
      return {
        code: 500,
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
        code: 0,
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
          code: 404,
          message: '客户不存在',
          data: null,
        };
      }
      
      return {
        code: 0,
        message: '删除成功',
        data: customer,
      };
    } catch (error) {
      return {
        code: 500,
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
        code: 0,
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
        code: 0,
        message: '同步成功',
        data: result,
      };
    } catch (error) {
      return {
        code: error.status || 500,
        message: error.message || '同步失败',
        data: null,
      };
    }
  }

  @ApiOperation({
    summary: '同步客户数据',
    description: '与另一个系统同步客户数据，地址信息以当前系统为准'
  })
  @ApiResponse({
    status: 200,
    description: '同步成功',
    schema: {
      example: {
        code: 0,
        message: '客户数据同步成功',
        data: {
          message: '客户数据同步成功',
          syncTime: '2025-06-27T08:16:28.000Z',
          count: 5
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: '同步失败' })
  @Post('sync')
  async syncCustomers(@Body() syncCustomerDto: SyncCustomerDto) {
    try {
      const result = await this.customersService.syncCustomers(syncCustomerDto);

      return {
        code: 0,
        message: '同步成功',
        data: result,
      };
    } catch (error) {
      return {
        code: 500,
        message: '同步失败',
        data: null,
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: '批量删除客户',
    description: '批量删除多个客户，支持多选删除'
  })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    schema: {
      example: {
        code: 0,
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
        code: 0,
        message: '批量删除成功',
        data: result,
      };
    } catch (error) {
      return {
        code: error.status || 500,
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
        code: 0,
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
        code: 0,
        message: '地理编码成功',
        data: result,
      };
    } catch (error) {
      return {
        code: error.status || 500,
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
        code: 0,
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
        code: 0,
        message: '逆地理编码成功',
        data: result,
      };
    } catch (error) {
      return {
        code: error.status || 500,
        message: error.message || '编码失败',
        data: null,
        error: error.message,
      };
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
        code: 0,
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
        code: 0,
        message: '获取成功',
        data: {
          lastSyncTime
        },
      };
    } catch (error) {
      return {
        code: 500,
        message: '获取失败',
        data: null,
        error: error.message,
      };
    }
  }
}