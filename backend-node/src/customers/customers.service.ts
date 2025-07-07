import { Injectable, NotFoundException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { SearchCustomerDto, CustomerSearchResultDto } from './dto/search-customer.dto';
import { SyncCustomerDto, BatchDeleteCustomerDto, GeocodeRequestDto, ReverseGeocodeRequestDto, ExternalCustomerDto } from './dto/sync-customer.dto';
import { AmapService } from './services/amap.service';
import * as XLSX from 'xlsx';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private amapService: AmapService,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // 生成客户编号 - 获取最后一个客户的ID
    const lastCustomer = await this.customerRepository
      .createQueryBuilder('customer')
      .orderBy('customer.id', 'DESC')
      .getOne();
    
    const nextNumber = lastCustomer ? lastCustomer.id + 1 : 1;
    const customerNumber = `C${String(nextNumber).padStart(3, '0')}`;

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      customerNumber,
      updateBy: '管理员', // 设置更新人
    });

    return await this.customerRepository.save(customer);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.customerRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async search(searchDto: SearchCustomerDto) {
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    if (searchDto.customerNumber) {
      queryBuilder.andWhere('customer.customerNumber LIKE :customerNumber', {
        customerNumber: `%${searchDto.customerNumber}%`,
      });
    }

    if (searchDto.customerName) {
      queryBuilder.andWhere('customer.customerName LIKE :customerName', {
        customerName: `%${searchDto.customerName}%`,
      });
    }

    if (searchDto.storeAddress) {
      queryBuilder.andWhere('customer.storeAddress LIKE :storeAddress', {
        storeAddress: `%${searchDto.storeAddress}%`,
      });
    }

    if (searchDto.warehouseAddress) {
      queryBuilder.andWhere('customer.warehouseAddress LIKE :warehouseAddress', {
        warehouseAddress: `%${searchDto.warehouseAddress}%`,
      });
    }

    // 添加分页支持
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 10;
    
    queryBuilder
      .orderBy('customer.createTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
    };
  }

  async findOne(id: number): Promise<Customer> {
    return await this.customerRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    await this.customerRepository.update(id, updateCustomerDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<Customer> {
    const customer = await this.findOne(id);
    if (customer) {
      await this.customerRepository.delete(id);
    }
    return customer;
  }

  async getCustomerDetail(id: number): Promise<Customer> {
    return await this.findOne(id);
  }

  async generateNavigationUrl(customerIds: number[]): Promise<string> {
    const customers = await this.customerRepository.find({
      where: { id: In(customerIds) }
    });

    if (customers.length === 0) {
      throw new NotFoundException('未找到有效的客户地址');
    }

    // 使用门店地址
    const addresses = customers.map(customer =>
      customer.storeAddress
    ).filter(Boolean);

    if (addresses.length === 0) {
      throw new NotFoundException('未找到有效的客户地址信息');
    }

    // 返回地址列表，前端可以用于地图导航
    return addresses.join(' -> ');
  }

  /**
   * 同步客户数据
   * @param syncDto 同步参数
   * @returns 同步结果
   */
  async syncCustomers(syncDto: SyncCustomerDto): Promise<{ message: string; syncTime: Date; count: number }> {
    const syncTime = new Date();
    let customers: Customer[];

    if (syncDto.customerIds && syncDto.customerIds.length > 0) {
      // 同步指定客户
      customers = await this.customerRepository.find({
        where: { id: In(syncDto.customerIds) }
      });
    } else {
      // 同步所有客户
      customers = await this.customerRepository.find();
    }

    // 更新同步时间
    await this.customerRepository.update(
      syncDto.customerIds ? { id: In(syncDto.customerIds) } : {},
      { lastSyncTime: syncTime }
    );

    return {
      message: '客户数据同步成功',
      syncTime,
      count: customers.length
    };
  }

  /**
   * 批量删除客户
   * @param batchDeleteDto 批量删除参数
   * @returns 删除结果
   */
  async batchDelete(batchDeleteDto: BatchDeleteCustomerDto): Promise<{ message: string; deletedCount: number }> {
    const customers = await this.customerRepository.find({
      where: { id: In(batchDeleteDto.customerIds) }
    });

    if (customers.length === 0) {
      throw new NotFoundException('未找到要删除的客户');
    }

    await this.customerRepository.delete({ id: In(batchDeleteDto.customerIds) });

    return {
      message: '批量删除成功',
      deletedCount: customers.length
    };
  }

  /**
   * 地理编码：地址转经纬度
   * @param geocodeDto 地理编码参数
   * @returns 经纬度信息
   */
  async geocodeAddress(geocodeDto: GeocodeRequestDto) {
    return await this.amapService.geocode(geocodeDto.address);
  }

  /**
   * 逆地理编码：经纬度转地址
   * @param reverseGeocodeDto 逆地理编码参数
   * @returns 地址信息
   */
  async reverseGeocodeLocation(reverseGeocodeDto: ReverseGeocodeRequestDto) {
    return await this.amapService.reverseGeocode(
      reverseGeocodeDto.longitude,
      reverseGeocodeDto.latitude
    );
  }

  /**
   * 导出客户数据为Excel
   * @param customerIds 要导出的客户ID列表，如果为空则导出全部
   * @returns Excel文件Buffer
   */
  async exportToExcel(customerIds?: number[]): Promise<Buffer> {
    let customers: Customer[];

    console.log('导出Excel - 接收到的customerIds:', customerIds);

    if (customerIds && customerIds.length > 0) {
      // 验证所有ID都是有效的数字
      const validIds = customerIds.filter(id =>
        !isNaN(id) &&
        id > 0 &&
        Number.isInteger(id) &&
        Number.isFinite(id)
      );
      console.log('导出Excel - 有效的customerIds:', validIds);

      if (validIds.length > 0) {
        customers = await this.customerRepository.find({
          where: { id: In(validIds) }
        });
      } else {
        // 如果没有有效ID，导出全部
        customers = await this.customerRepository.find();
      }
    } else {
      // 导出全部客户
      customers = await this.customerRepository.find();
    }

    // 准备Excel数据
    const excelData = customers.map(customer => ({
      '客户编号': customer.customerNumber,
      '客户名称': customer.customerName,
      '门店地址': customer.storeAddress || '',
      '仓库地址': customer.warehouseAddress || '',
      '门店经度': customer.storeLongitude || '',
      '门店纬度': customer.storeLatitude || '',
      '仓库经度': customer.warehouseLongitude || '',
      '仓库纬度': customer.warehouseLatitude || '',
      '状态': customer.status === 'active' ? '启用' : '禁用',
      '更新人': customer.updateBy || '',
      '创建时间': customer.createdAt ? customer.createdAt.toLocaleString('zh-CN') : '',
      '更新时间': customer.updatedAt ? customer.updatedAt.toLocaleString('zh-CN') : '',
      '同步时间': customer.lastSyncTime ? customer.lastSyncTime.toLocaleString('zh-CN') : ''
    }));

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 设置列宽
    const colWidths = [
      { wch: 12 }, // 客户编号
      { wch: 20 }, // 客户名称
      { wch: 30 }, // 客户地址
      { wch: 30 }, // 门店地址
      { wch: 30 }, // 仓库地址
      { wch: 12 }, // 门店经度
      { wch: 12 }, // 门店纬度
      { wch: 12 }, // 仓库经度
      { wch: 12 }, // 仓库纬度
      { wch: 8 },  // 状态
      { wch: 12 }, // 更新人
      { wch: 20 }, // 创建时间
      { wch: 20 }, // 更新时间
      { wch: 20 }  // 同步时间
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, '客户数据');

    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
  }

  /**
   * 获取最后同步时间
   * @returns 最后同步时间
   */
  async getLastSyncTime(): Promise<Date | null> {
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .select('MAX(customer.lastSyncTime)', 'lastSyncTime')
      .getRawOne();

    return customer.lastSyncTime || null;
  }

  async syncExternalCustomers(externalCustomers: ExternalCustomerDto[]) {
    let syncedCount = 0;
    let updatedCount = 0;
    let newCount = 0;

    for (const externalCustomer of externalCustomers) {
      try {
        // 根据客户编号查找现有客户
        let existingCustomer = await this.customerRepository.findOne({
          where: { customerNumber: externalCustomer.customerNumber }
        });

        if (existingCustomer) {
          // 客户已存在，只更新客户名称，地址信息以本系统为准
          existingCustomer.customerName = externalCustomer.customerName;
          existingCustomer.lastSyncTime = new Date();
          await this.customerRepository.save(existingCustomer);
          updatedCount++;
        } else {
          // 新客户，创建记录
          const newCustomer = this.customerRepository.create({
            customerNumber: externalCustomer.customerNumber,
            customerName: externalCustomer.customerName,
            storeAddress: null, // 地址信息需要后续手动维护
            lastSyncTime: new Date(),
            status: 'active',
            updateBy: '系统同步'
          });
          await this.customerRepository.save(newCustomer);
          newCount++;
        }
        syncedCount++;
      } catch (error) {
        console.error(`同步客户 ${externalCustomer.customerNumber} 失败:`, error);
        // 继续处理下一个客户
      }
    }

    return {
      message: '外部系统数据同步完成',
      syncedCount,
      updatedCount,
      newCount,
      syncTime: new Date()
    };
  }
}