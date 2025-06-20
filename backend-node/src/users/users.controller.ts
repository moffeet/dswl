import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User, UserType } from './entities/user.entity';

@ApiTags('用户管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, description: '用户创建成功', type: User })
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: '分页获取用户列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认为1' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量，默认为10' })
  @ApiQuery({ name: 'username', required: false, description: '用户名搜索' })
  @ApiQuery({ name: 'realName', required: false, description: '真实姓名搜索' })
  @ApiQuery({ name: 'phone', required: false, description: '手机号搜索' })
  @ApiQuery({ name: 'userType', required: false, enum: UserType, description: '用户类型筛选' })
  @Get()
  async findAllWithPagination(@Query() query: SearchUserDto) {
    return this.usersService.findAllWithPagination(query);
  }

  @ApiOperation({ summary: '获取所有用户列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [User] })
  @Get('all')
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: '获取司机列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [User] })
  @Get('drivers')
  async findDrivers(): Promise<User[]> {
    return this.usersService.findDrivers();
  }

  @ApiOperation({ summary: '获取角色列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Get('roles')
  async getRoles() {
    return this.usersService.getRoles();
  }

  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: User })
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<User> {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: '更新用户' })
  @ApiResponse({ status: 200, description: '更新成功', type: User })
  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: '批量删除用户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Delete('batch')
  async batchRemove(@Body() body: { ids: number[] }): Promise<{ message: string }> {
    await this.usersService.batchRemove(body.ids);
    return { message: '用户批量删除成功' };
  }

  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: '用户删除成功' };
  }
} 