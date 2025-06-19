/**
 * 高德地图工具类
 */
export class AmapUtil {
  /**
   * 生成高德地图导航链接
   * @param fromLng 起点经度
   * @param fromLat 起点纬度
   * @param toLng 终点经度
   * @param toLat 终点纬度
   * @param destination 目的地名称
   */
  static generateNavigationUrl(
    fromLng: number,
    fromLat: number,
    toLng: number,
    toLat: number,
    destination?: string
  ): string {
    const baseUrl = 'https://uri.amap.com/navigation';
    const params = new URLSearchParams({
      from: `${fromLng},${fromLat}`,
      to: `${toLng},${toLat}`,
      mode: 'car',
      policy: '1',
      src: 'logistics-system',
      coordinate: 'gaode',
      callnative: '1',
    });

    if (destination) {
      params.append('to_name', encodeURIComponent(destination));
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * 计算两点之间的距离（米）
   * @param lng1 第一个点的经度
   * @param lat1 第一个点的纬度
   * @param lng2 第二个点的经度
   * @param lat2 第二个点的纬度
   */
  static calculateDistance(lng1: number, lat1: number, lng2: number, lat2: number): number {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * 角度转弧度
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 验证经纬度是否有效
   */
  static isValidCoordinate(lng: number, lat: number): boolean {
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  }

  /**
   * 格式化距离显示
   */
  static formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${distance}米`;
    } else {
      return `${(distance / 1000).toFixed(1)}公里`;
    }
  }
} 