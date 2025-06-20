export declare class AmapUtil {
    static generateNavigationUrl(fromLng: number, fromLat: number, toLng: number, toLat: number, destination?: string): string;
    static calculateDistance(lng1: number, lat1: number, lng2: number, lat2: number): number;
    private static toRadians;
    static isValidCoordinate(lng: number, lat: number): boolean;
    static formatDistance(distance: number): string;
}
