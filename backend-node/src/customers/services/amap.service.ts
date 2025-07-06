import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { GeocodeRequestDto, ReverseGeocodeRequestDto, GeocodeResponseDto } from '../dto/sync-customer.dto';

/**
 * 高德地图服务
 * 提供地理编码和逆地理编码功能
 */
@Injectable()
export class AmapService {
  private readonly apiKey = process.env.AMAP_API_KEY || 'your-amap-api-key'; // 需要在环境变量中配置
  private readonly baseUrl = 'https://restapi.amap.com/v3';

  /**
   * 地理编码：地址转经纬度
   * @param address 地址字符串
   * @returns 经纬度信息
   */
  async geocode(address: string): Promise<GeocodeResponseDto> {
    try {
      console.log('高德地图API调用参数:', {
        url: `${this.baseUrl}/geocode/geo`,
        key: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'undefined',
        address: address
      });

      const response = await axios.get(`${this.baseUrl}/geocode/geo`, {
        params: {
          key: this.apiKey,
          address: address,
          output: 'json'
        }
      });

      console.log('高德地图API响应:', response.data);

      if (response.data.status !== '1') {
        throw new HttpException(
          `地理编码失败: ${response.data.info}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const geocodes = response.data.geocodes;
      if (!geocodes || geocodes.length === 0) {
        throw new HttpException(
          '未找到该地址的地理位置信息',
          HttpStatus.NOT_FOUND
        );
      }

      const geocode = geocodes[0];
      const [longitude, latitude] = geocode.location.split(',').map(Number);

      return {
        address: geocode.formatted_address || address,
        longitude,
        latitude,
        province: geocode.province || '',
        city: geocode.city || '',
        district: geocode.district || ''
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '地理编码服务异常',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 逆地理编码：经纬度转地址
   * @param longitude 经度
   * @param latitude 纬度
   * @returns 地址信息
   */
  async reverseGeocode(longitude: number, latitude: number): Promise<GeocodeResponseDto> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/regeo`, {
        params: {
          key: this.apiKey,
          location: `${longitude},${latitude}`,
          output: 'json',
          extensions: 'base'
        }
      });

      if (response.data.status !== '1') {
        throw new HttpException(
          `逆地理编码失败: ${response.data.info}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const regeocode = response.data.regeocode;
      if (!regeocode) {
        throw new HttpException(
          '未找到该坐标的地址信息',
          HttpStatus.NOT_FOUND
        );
      }

      const addressComponent = regeocode.addressComponent;

      return {
        address: regeocode.formatted_address || '',
        longitude,
        latitude,
        province: addressComponent.province || '',
        city: addressComponent.city || '',
        district: addressComponent.district || ''
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '逆地理编码服务异常',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 批量地理编码
   * @param addresses 地址列表
   * @returns 经纬度信息列表
   */
  async batchGeocode(addresses: string[]): Promise<GeocodeResponseDto[]> {
    const results: GeocodeResponseDto[] = [];
    
    for (const address of addresses) {
      try {
        const result = await this.geocode(address);
        results.push(result);
      } catch (error) {
        // 单个地址编码失败时，添加空结果但不中断整个流程
        results.push({
          address,
          longitude: 0,
          latitude: 0,
          province: '',
          city: '',
          district: ''
        });
      }
    }

    return results;
  }

  /**
   * 验证地址格式是否符合省市区/城镇格式
   * @param address 地址字符串
   * @returns 是否符合格式
   */
  validateAddressFormat(address: string): boolean {
    // 放宽地址格式验证，支持更多格式
    if (!address || address.trim().length < 3) {
      return false;
    }

    const patterns = [
      /^.+省.+市.+区.*/, // 省市区格式（区后可有其他内容）
      /^.+市.+区.*/, // 市区格式（区后可有其他内容）
      /^.+省.+市.+县.*/, // 省市县格式（县后可有其他内容）
      /^.+市.+县.*/, // 市县格式（县后可有其他内容）
      /^.+自治区.+市.*/, // 自治区格式
      /^.+特别行政区.*/, // 特别行政区格式
      /^.+省.+市.*/, // 省市格式
      /^.+市.*/, // 市格式（至少包含市）
      /^北京.*|^上海.*|^天津.*|^重庆.*/ // 直辖市格式
    ];

    return patterns.some(pattern => pattern.test(address));
  }
}
