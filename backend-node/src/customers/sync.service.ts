import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { AmapService } from './services/amap.service';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

/**
 * 客户数据同步服务
 * 负责从外部系统同步客户数据
 * 同步规则：
 * - 以客户ID为基准进行匹配
 * - 新客户：同步门店地址并通过高德API计算经纬度
 * - 现有客户：只更新客户名称，门店地址以当前系统为准
 */
@Injectable()
export class CustomerSyncService {
  private readonly logger = new Logger(CustomerSyncService.name);

  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private readonly amapService: AmapService,
  ) {}

  /**
   * 从外部系统同步客户数据
   */
  async syncFromExternalSystem(updateBy: string = '系统管理员'): Promise<{
    success: boolean;
    message: string;
    syncedCount: number;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    lastSyncTime: Date;
  }> {
    this.logger.log('开始从外部系统同步客户数据...');
    
    try {
      // 优先从真实外部系统拉取
      const externalCustomers = await this.fetchExternalCustomersFromApi();
      
      let syncedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      
      const syncTime = new Date();

      for (const externalCustomer of externalCustomers) {
        try {
          // 根据客户编号查找现有客户
          const existingCustomer = await this.customerRepository.findOne({
            where: { customerNumber: externalCustomer.customerNumber }
          });

          if (existingCustomer) {
            // 更新现有客户（保留地址信息）
            const updatedCustomer = await this.updateCustomerFromExternal(
              existingCustomer,
              externalCustomer,
              syncTime,
              updateBy
            );
            
            if (updatedCustomer) {
              updatedCount++;
              this.logger.log(`更新客户: ${externalCustomer.customerName} (编号: ${externalCustomer.customerNumber})`);
            } else {
              skippedCount++;
              this.logger.log(`跳过客户: ${externalCustomer.customerName} (编号: ${externalCustomer.customerNumber}) - 无需更新`);
            }
          } else {
            // 创建新客户
            await this.createCustomerFromExternal(externalCustomer, syncTime, updateBy);
            createdCount++;
            this.logger.log(`创建新客户: ${externalCustomer.customerName} (编号: ${externalCustomer.customerNumber})`);
          }
          
          syncedCount++;
        } catch (error) {
          this.logger.error(`同步客户失败 (编号: ${externalCustomer.customerNumber}): ${error.message}`);
          skippedCount++;
        }
      }

      const result = {
        success: true,
        message: `同步完成：处理 ${syncedCount} 个客户，创建 ${createdCount} 个，更新 ${updatedCount} 个，跳过 ${skippedCount} 个`,
        syncedCount,
        createdCount,
        updatedCount,
        skippedCount,
        lastSyncTime: syncTime
      };

      this.logger.log(result.message);
      return result;

    } catch (error) {
      this.logger.error(`同步失败: ${error.message}`, error.stack);
      return {
        success: false,
        message: `同步失败: ${error.message}`,
        syncedCount: 0,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        lastSyncTime: new Date()
      };
    }
  }

  /**
   * 从真实外部接口获取客户数据，并转换为内部统一结构
   * 外部接口：http://nhstl123.gicp.net:84/api/values/?bmc=kh&id=0&database=gzds
   * 返回结构：{"Table":[{"bh":"客户编号(10位)","mc":"客户名称"}, ...]}
   */
  private async fetchExternalCustomersFromApi(): Promise<Array<{ customerNumber: string; customerName: string; storeAddress?: string }>> {
    const BASE_URL = 'http://nhstl123.gicp.net:84/api/values/';
    const COMMON_PARAMS = { bmc: 'kh', database: 'gzds' } as const;

    // 并发请求 id=0..9（10位可选前缀），合并去重
    const requests = Array.from({ length: 10 }, (_, n) => n).map(async (digit) => {
      const url = `${BASE_URL}`;
      const params = { ...COMMON_PARAMS, id: String(digit) } as any;
      try {
        const res = await axios.get(url, { params, timeout: 15000 });
        const raw = typeof res.data === 'string' ? this.safeJsonParse(res.data) : res.data;
        const table = raw?.Table;
        if (!Array.isArray(table)) {
          this.logger.warn(`外部接口返回结构异常（非数组Table），digit=${digit}`);
          return [] as any[];
        }
        return table as Array<{ bh?: string; mc?: string; [k: string]: any }>;
      } catch (err: any) {
        this.logger.error(`请求外部客户接口失败 digit=${digit}: ${err?.message || err}`);
        return [] as any[];
      }
    });

    const tables = await Promise.all(requests);
    const mergedMap = new Map<string, { bh: string; mc: string }>();
    for (const list of tables) {
      for (const row of list) {
        const number = (row?.bh || '').trim();
        const name = (row?.mc || '').trim();
        if (!number || !name) continue;
        if (!mergedMap.has(number)) {
          mergedMap.set(number, { bh: number, mc: name });
        }
      }
    }

    // 转换为内部统一结构
    const customers = Array.from(mergedMap.values()).map((row) => ({
      customerNumber: row.bh,
      customerName: row.mc,
      // 外部接口未提供地址信息，保留为空
      storeAddress: undefined,
    }));

    this.logger.log(`外部接口拉取客户完成，共 ${customers.length} 条`);
    return customers;
  }

  private safeJsonParse(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      // 某些服务可能返回已反转义的结构，再尝试一次解码
      try {
        const unescaped = text.replace(/^"|"$/g, '').replace(/\\"/g, '"');
        return JSON.parse(unescaped);
      } catch {
        return null;
      }
    }
  }

  /**
   * 加载外部系统模拟数据
   */
  private loadExternalSystemData(): any {
    try {
      // 在生产环境中，使用相对于项目根目录的路径
      let dataPath: string;

      // 检查是否在编译后的 dist 目录中运行
      if (__dirname.includes('/dist/')) {
        // 生产环境：从 dist 目录指向源码目录
        dataPath = path.join(process.cwd(), 'src/mock/external-system-data.json');
      } else {
        // 开发环境：使用相对路径
        dataPath = path.join(__dirname, '../mock/external-system-data.json');
      }

      this.logger.log(`尝试读取外部系统数据文件: ${dataPath}`);

      if (!fs.existsSync(dataPath)) {
        this.logger.error(`外部系统数据文件不存在: ${dataPath}`);
        throw new Error(`外部系统数据文件不存在: ${dataPath}`);
      }

      const rawData = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(rawData);

      this.logger.log(`成功读取外部系统数据，客户数量: ${data.customers?.length || 0}`);
      return data;
    } catch (error) {
      this.logger.error(`读取外部系统数据失败: ${error.message}`);
      throw new Error('无法读取外部系统数据');
    }
  }

  /**
   * 从外部数据创建新客户
   */
  private async createCustomerFromExternal(externalCustomer: any, syncTime: Date, updateBy: string): Promise<Customer> {
    const customer = new Customer();

    // 设置基本信息（来自外部系统）
    customer.customerNumber = externalCustomer.customerNumber;
    customer.customerName = externalCustomer.customerName;
    customer.storeAddress = externalCustomer.storeAddress;


    // 通过高德API获取门店地址的经纬度
    if (externalCustomer.storeAddress) {
      try {
        this.logger.log(`正在获取门店地址经纬度: ${externalCustomer.storeAddress}`);
        const geocodeResult = await this.amapService.geocode(externalCustomer.storeAddress);

        if (geocodeResult && geocodeResult.longitude && geocodeResult.latitude) {
          customer.storeLongitude = geocodeResult.longitude;
          customer.storeLatitude = geocodeResult.latitude;
          this.logger.log(`门店地址经纬度获取成功: ${geocodeResult.longitude}, ${geocodeResult.latitude}`);
        } else {
          this.logger.warn(`门店地址经纬度获取失败: ${externalCustomer.storeAddress}`);
        }
      } catch (error) {
        this.logger.error(`获取门店地址经纬度时出错: ${error.message}`);
      }
    }

    // 设置同步信息
    customer.lastSyncTime = syncTime;
    customer.updateBy = updateBy;

    // 仓库地址暂时为空，等待后续手动设置
    customer.warehouseAddress = null;
    customer.warehouseLongitude = null;
    customer.warehouseLatitude = null;

    return await this.customerRepository.save(customer);
  }

  /**
   * 从外部数据更新现有客户
   */
  private async updateCustomerFromExternal(
    existingCustomer: Customer,
    externalCustomer: any,
    syncTime: Date,
    updateBy: string
  ): Promise<Customer | null> {
    let hasChanges = false;

    // 只检查并更新客户名称（门店地址以当前系统为准，不同步）
    if (existingCustomer.customerName !== externalCustomer.customerName) {
      existingCustomer.customerName = externalCustomer.customerName;
      hasChanges = true;
      this.logger.log(`更新客户名称: ${existingCustomer.customerNumber} - ${externalCustomer.customerName}`);
    }

    if (hasChanges) {
      existingCustomer.lastSyncTime = syncTime;
      existingCustomer.updateBy = updateBy;
      return await this.customerRepository.save(existingCustomer);
    }

    return null; // 无需更新
  }



  /**
   * 获取同步元数据
   */
  async getSyncMetadata(): Promise<any> {
    try {
      // 获取外部系统数据（真实接口）
      const externalCustomers = await this.fetchExternalCustomersFromApi();

      // 获取当前系统客户数量
      const currentCustomerCount = await this.customerRepository.count();

      // 获取最后同步时间（查找最近一次同步的客户）
      const lastSyncCustomer = await this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.lastSyncTime IS NOT NULL')
        .orderBy('customer.lastSyncTime', 'DESC')
        .getOne();

      return {
        dataSource: '外部ERP系统',
        currentCustomerCount: currentCustomerCount,
        externalCustomerCount: externalCustomers.length || 0,
        lastSyncTime: lastSyncCustomer?.lastSyncTime || null,
        syncVersion: 'v2.0.0'
      };
    } catch (error) {
      this.logger.error(`获取同步元数据失败: ${error.message}`);
      return {
        dataSource: '外部ERP系统',
        currentCustomerCount: 0,
        externalCustomerCount: 0,
        lastSyncTime: null,
        syncVersion: 'v2.0.0'
      };
    }
  }
}
