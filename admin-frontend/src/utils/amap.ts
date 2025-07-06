import { AMAP_CONFIG } from '@/config/api';

// 地理编码响应接口
interface GeocodeResponse {
  status: string;
  info: string;
  infocode: string;
  count?: string;
  geocodes?: Array<{
    formatted_address: string;
    country: string;
    province: string;
    citycode: string;
    city: string;
    district: string;
    township: string;
    neighborhood: {
      name: string;
      type: string;
    };
    building: {
      name: string;
      type: string;
    };
    adcode: string;
    street: string;
    number: string;
    location: string;
    level: string;
  }>;
}

// 逆地理编码响应接口
interface ReverseGeocodeResponse {
  status: string;
  info: string;
  infocode: string;
  regeocode?: {
    formatted_address: string;
    addressComponent: {
      country: string;
      province: string;
      city: string;
      citycode: string;
      district: string;
      adcode: string;
      township: string;
      towncode: string;
      neighborhood: {
        name: string;
        type: string;
      };
      building: {
        name: string;
        type: string;
      };
      streetNumber: {
        street: string;
        number: string;
        location: string;
        direction: string;
        distance: string;
      };
    };
  };
}

// 地理编码结果接口
export interface GeocodeResult {
  address: string;
  longitude: number;
  latitude: number;
  province: string;
  city: string;
  district: string;
}

/**
 * 地理编码：地址转经纬度
 * @param address 地址字符串
 * @returns Promise<GeocodeResult>
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!address || address.trim() === '') {
    throw new Error('地址不能为空');
  }

  const url = `${AMAP_CONFIG.baseUrl}${AMAP_CONFIG.endpoints.geocode}`;
  const params = new URLSearchParams({
    key: AMAP_CONFIG.key,
    address: address.trim(),
    output: 'json'
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const data: GeocodeResponse = await response.json();

    if (data.status !== '1') {
      throw new Error(`地理编码失败: ${data.info} (${data.infocode})`);
    }

    if (!data.geocodes || data.geocodes.length === 0) {
      throw new Error('未找到匹配的地址信息');
    }

    const geocode = data.geocodes[0];
    const [longitude, latitude] = geocode.location.split(',').map(Number);

    return {
      address: geocode.formatted_address,
      longitude,
      latitude,
      province: geocode.province,
      city: geocode.city,
      district: geocode.district
    };
  } catch (error) {
    console.error('地理编码请求失败:', error);
    throw error;
  }
}

/**
 * 逆地理编码：经纬度转地址
 * @param longitude 经度
 * @param latitude 纬度
 * @returns Promise<GeocodeResult>
 */
export async function reverseGeocodeCoordinates(longitude: number, latitude: number): Promise<GeocodeResult> {
  if (!longitude || !latitude) {
    throw new Error('经纬度不能为空');
  }

  const url = `${AMAP_CONFIG.baseUrl}${AMAP_CONFIG.endpoints.reverseGeocode}`;
  const params = new URLSearchParams({
    key: AMAP_CONFIG.key,
    location: `${longitude},${latitude}`,
    output: 'json'
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const data: ReverseGeocodeResponse = await response.json();

    if (data.status !== '1') {
      throw new Error(`逆地理编码失败: ${data.info} (${data.infocode})`);
    }

    if (!data.regeocode) {
      throw new Error('未找到匹配的地址信息');
    }

    const regeocode = data.regeocode;
    const addressComponent = regeocode.addressComponent;

    return {
      address: regeocode.formatted_address,
      longitude,
      latitude,
      province: addressComponent.province,
      city: addressComponent.city,
      district: addressComponent.district
    };
  } catch (error) {
    console.error('逆地理编码请求失败:', error);
    throw error;
  }
}
