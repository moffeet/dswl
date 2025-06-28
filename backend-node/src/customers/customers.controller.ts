import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto } from './dto/search-customer.dto';
import { Customer } from './entities/customer.entity';

@ApiTags('客户管理 - Customer Management')
@Controller('api/customers')
export class CustomersController {
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
              customerAddress: { type: 'string', example: '深圳市南山区科技园南区', description: '客户地址' },
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
      const hasSearchParams = query.customerNumber || query.customerName || query.customerAddress;
      
      if (hasSearchParams) {
        // 有搜索条件，使用搜索功能
        const searchDto: SearchCustomerDto = {
          customerNumber: query.customerNumber,
          customerName: query.customerName,
          customerAddress: query.customerAddress,
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
  @ApiQuery({ name: 'customerAddress', required: false, description: '客户地址（模糊匹配）', example: '深圳' })
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
            customerAddress: { type: 'string', example: '深圳市南山区科技园南区', description: '客户地址' },
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
  async findOne(@Param('id') id: string) {
    try {
      const customer = await this.customersService.findOne(parseInt(id));
      
      if (!customer) {
        return {
          code: 404,
          message: '客户不存在',
          data: null,
        };
      }
      
      return {
        code: 0,
        message: '获取成功',
        data: customer,
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
          customerAddress: '上海市浦东新区张江高科技园区'
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
            customerAddress: { type: 'string', example: '上海市浦东新区张江高科技园区', description: '客户地址' },
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
          customerAddress: '北京市海淀区中关村大街1号'
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
            customerAddress: { type: 'string', example: '北京市海淀区中关村大街1号', description: '更新后的客户地址' },
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
} 