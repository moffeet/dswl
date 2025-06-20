"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmapUtil = void 0;
class AmapUtil {
    static generateNavigationUrl(fromLng, fromLat, toLng, toLat, destination) {
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
    static calculateDistance(lng1, lat1, lng2, lat2) {
        const R = 6371000;
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
    }
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    static isValidCoordinate(lng, lat) {
        return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
    }
    static formatDistance(distance) {
        if (distance < 1000) {
            return `${distance}米`;
        }
        else {
            return `${(distance / 1000).toFixed(1)}公里`;
        }
    }
}
exports.AmapUtil = AmapUtil;
//# sourceMappingURL=amap.util.js.map