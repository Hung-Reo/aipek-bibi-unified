// Module quản lý cache
export class GrammarCache {
  // Biến kiểm soát việc sử dụng cache
  static skipCache = true; // Mặc định tắt cache trong quá trình phát triển
  
  // Tạo khóa cache dựa trên các tham số
  static getCacheKey(promptType, topic, language) {
    return `bibi_${promptType}_${topic.toLowerCase().replace(/\s+/g, '_')}_${language}`;
  }

  // Lưu kết quả vào cache
  static saveToCache(key, data, expirationHours = 24) {
    // Kiểm tra nếu đã tắt cache thì không lưu
    if (this.skipCache) {
      console.log(`Không lưu cache vì đang ở chế độ bỏ qua cache`);
      return;
    }
    
    try {
      const cacheData = {
        timestamp: Date.now(),
        expiration: Date.now() + (expirationHours * 60 * 60 * 1000),
        data: data
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      console.log(`Đã lưu cache: ${key}`);
    } catch (error) {
      console.error(`Lỗi khi lưu cache: ${error.message}`);
    }
  }

  // Kiểm tra và lấy dữ liệu từ cache
  static getFromCache(key, options = {}) {
    // Kiểm tra nếu đang ở chế độ bỏ qua cache
    if (this.skipCache) {
      console.log(`Bỏ qua cache: ${key} (Chế độ bỏ qua cache đang bật)`);
      return null;
    }
    
    try {
      const cachedData = localStorage.getItem(key);
      if (!cachedData) {
        console.log(`Không tìm thấy cache: ${key}`);
        return null;
      }
      
      // Phân tích dữ liệu cached
      const parsedData = JSON.parse(cachedData);
      
      // Kiểm tra thời hạn
      if (Date.now() > parsedData.expiration) {
        localStorage.removeItem(key);
        console.log(`Cache đã hết hạn: ${key}`);
        return null;
      }
      
      console.log(`Đọc từ cache: ${key}`);
      return parsedData.data;
    } catch (error) {
      console.error(`Lỗi khi đọc cache: ${error.message}`);
      this.clearCache(key); // Xóa cache lỗi
      return null;
    }
  }

  // Xóa cache cụ thể
  static clearCache(key) {
    try {
      localStorage.removeItem(key);
      console.log(`Đã xóa cache: ${key}`);
    } catch (error) {
      console.error(`Lỗi khi xóa cache: ${error.message}`);
    }
  }

  // Xóa tất cả cache liên quan đến BiBi
  static clearAllCache() {
    try {
      let cacheCount = 0;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('bibi_')) {
          localStorage.removeItem(key);
          cacheCount++;
        }
      });
      console.log(`Đã xóa ${cacheCount} mục cache BiBi`);
    } catch (error) {
      console.error(`Lỗi khi xóa tất cả cache: ${error.message}`);
    }
  }
  
  // Bật/tắt cache
  static setSkipCache(skip) {
    this.skipCache = skip;
    console.log(`Đã ${skip ? 'TẮT' : 'BẬT'} chức năng cache`);
  }
  
  // Kiểm tra trạng thái cache
  static isSkipCache() {
    return this.skipCache;
  }
}