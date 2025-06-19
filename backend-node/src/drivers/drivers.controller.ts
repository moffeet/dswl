import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Driver, DriverStatus } from './entities/driver.entity';

@ApiTags('司机管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @ApiOperation({ summary: '创建司机' })
  @ApiResponse({ status: 201, description: '司机创建成功', type: Driver })
  @Post()
  async create(@Body() createDriverDto: CreateDriverDto): Promise<Driver> {
    return this.driversService.create(createDriverDto);
  }

  @ApiOperation({ summary: '获取司机列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Driver] })
  @Get()
  async findAll(): Promise<Driver[]> {
    return this.driversService.findAll();
  }

  @ApiOperation({ summary: '获取活跃司机列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [Driver] })
  @Get('active')
  async findActiveDrivers(): Promise<Driver[]> {
    return this.driversService.findActiveDrivers();
  }

  @ApiOperation({ summary: '获取当前用户的司机信息' })
  @ApiResponse({ status: 200, description: '获取成功', type: Driver })
  @Get('me')
  async getMyDriverInfo(@Request() req): Promise<Driver> {
    return this.driversService.getDriverInfo(req.user.id);
  }

  @ApiOperation({ summary: '更新司机位置' })
  @ApiResponse({ status: 200, description: '位置更新成功', type: Driver })
  @Patch('location')
  async updateLocation(
    @Body() updateLocationDto: UpdateLocationDto,
    @Request() req
  ): Promise<Driver> {
    return this.driversService.updateLocation(req.user.id, updateLocationDto);
  }

  @ApiOperation({ summary: '更新司机状态' })
  @ApiResponse({ status: 200, description: '状态更新成功', type: Driver })
  @Patch('status')
  async updateStatus(
    @Body('status') status: DriverStatus,
    @Request() req
  ): Promise<Driver> {
    return this.driversService.updateStatus(req.user.id, status);
  }

  @ApiOperation({ summary: '获取司机详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: Driver })
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Driver> {
    return this.driversService.findById(id);
  }

  @ApiOperation({ summary: '更新司机' })
  @ApiResponse({ status: 200, description: '更新成功', type: Driver })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateDriverDto: UpdateDriverDto
  ): Promise<Driver> {
    return this.driversService.update(id, updateDriverDto);
  }

  @ApiOperation({ summary: '删除司机' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.driversService.remove(id);
    return { message: '司机删除成功' };
  }
} 