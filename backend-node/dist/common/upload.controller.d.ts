export declare class UploadController {
    uploadImage(file: Express.Multer.File): Promise<{
        message: string;
        filename: string;
        originalname: string;
        size: number;
        url: string;
    }>;
    uploadImages(files: Express.Multer.File[]): Promise<{
        message: string;
        count: number;
        files: {
            filename: string;
            originalname: string;
            size: number;
            url: string;
        }[];
    }>;
}
