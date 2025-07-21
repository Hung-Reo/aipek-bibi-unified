// /static/js/controllers/lesson-plan/lesson-plan-cache.js
// Module quản lý cache cho tính năng Soạn giáo án

export class LessonPlanCache {
    static CACHE_KEY_PREFIX = 'bibi_lesson_plan_cache_';
    static CACHE_INDEX_KEY = 'bibi_lesson_plan_cache_index';
    static CACHE_ENABLED = false; // Tắt cache trong giai đoạn phát triển
  
    /**
     * Lưu dữ liệu vào cache
     * @param {string} key - Khóa cache
     * @param {any} data - Dữ liệu cần lưu
     * @param {number} ttl - Thời gian sống (giây), mặc định 1 ngày
     * @returns {boolean} - Kết quả lưu cache
     */
    static setCache(key, data, ttl = 86400) {
      if (!this.CACHE_ENABLED) return false;
      
      try {
        const cacheKey = this.CACHE_KEY_PREFIX + key;
        const cacheData = {
          data: data,
          expiry: Date.now() + (ttl * 1000),
          created: Date.now()
        };
        
        // Lưu dữ liệu cache
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        
        // Cập nhật index cache
        this.updateCacheIndex(cacheKey);
        
        return true;
      } catch (error) {
        console.error('Error setting cache:', error);
        return false;
      }
    }
  
    /**
     * Lấy dữ liệu từ cache
     * @param {string} key - Khóa cache
     * @returns {any|null} - Dữ liệu cache hoặc null nếu không tìm thấy/hết hạn
     */
    static getCache(key) {
      if (!this.CACHE_ENABLED) return null;
      
      try {
        const cacheKey = this.CACHE_KEY_PREFIX + key;
        const cached = localStorage.getItem(cacheKey);
        
        if (!cached) return null;
        
        const cacheData = JSON.parse(cached);
        
        // Kiểm tra hết hạn
        if (cacheData.expiry < Date.now()) {
          // Cache đã hết hạn, xóa
          this.removeCache(key);
          return null;
        }
        
        return cacheData.data;
      } catch (error) {
        console.error('Error getting cache:', error);
        return null;
      }
    }
  
    /**
     * Xóa một mục cache
     * @param {string} key - Khóa cache
     * @returns {boolean} - Kết quả xóa cache
     */
    static removeCache(key) {
      try {
        const cacheKey = this.CACHE_KEY_PREFIX + key;
        localStorage.removeItem(cacheKey);
        
        // Cập nhật index cache
        this.removeFromCacheIndex(cacheKey);
        
        return true;
      } catch (error) {
        console.error('Error removing cache:', error);
        return false;
      }
    }
  
    /**
     * Xóa tất cả cache
     * @returns {number} - Số lượng mục đã xóa
     */
    static clearAllCache() {
      try {
        // Lấy danh sách cache từ index
        const cacheIndex = this.getCacheIndex();
        const count = cacheIndex.length;
        
        // Xóa tất cả các mục trong index
        cacheIndex.forEach(cacheKey => {
          localStorage.removeItem(cacheKey);
        });
        
        // Reset index
        localStorage.removeItem(this.CACHE_INDEX_KEY);
        
        return count;
      } catch (error) {
        console.error('Error clearing cache:', error);
        return 0;
      }
    }
  
    /**
     * Lấy danh sách cache từ index
     * @returns {Array} - Danh sách các khóa cache
     */
    static getCacheIndex() {
      try {
        const index = localStorage.getItem(this.CACHE_INDEX_KEY);
        return index ? JSON.parse(index) : [];
      } catch (error) {
        console.error('Error getting cache index:', error);
        return [];
      }
    }
  
    /**
     * Cập nhật index cache
     * @param {string} cacheKey - Khóa cache cần thêm vào index
     */
    static updateCacheIndex(cacheKey) {
      try {
        const index = this.getCacheIndex();
        
        // Kiểm tra xem cache key đã tồn tại chưa
        if (!index.includes(cacheKey)) {
          index.push(cacheKey);
          localStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(index));
        }
      } catch (error) {
        console.error('Error updating cache index:', error);
      }
    }
  
    /**
     * Xóa khóa cache khỏi index
     * @param {string} cacheKey - Khóa cache cần xóa khỏi index
     */
    static removeFromCacheIndex(cacheKey) {
      try {
        const index = this.getCacheIndex();
        const newIndex = index.filter(key => key !== cacheKey);
        localStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(newIndex));
      } catch (error) {
        console.error('Error removing from cache index:', error);
      }
    }
    
    /**
     * Tạo khóa cache cho giáo án
     * @param {string} lessonType - Loại giáo án (main, supplementary, extracurricular)
     * @param {string} topic - Chủ đề giáo án
     * @param {string} language - Ngôn ngữ (vi, en, both)
     * @returns {string} - Khóa cache
     */
    static getCacheKey(lessonType, topic, language = 'vi') {
      return `${lessonType}_${topic.toLowerCase().replace(/\s+/g, '_')}_${language}`;
    }
  }