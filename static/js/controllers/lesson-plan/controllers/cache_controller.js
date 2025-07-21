// /static/js/controllers/lesson-plan/controllers/cache-controller.js
// EXTRACTED FROM lesson-plan-main.js - Lines 84-169 + related cache logic
// Handles all caching operations for lesson plans

/**
 * CacheController - Centralized cache management
 * EXTRACTED to reduce main.js complexity and improve maintainability
 */
export class CacheController {
  constructor() {
    this.isDevelopment = true; // Can be configured
    this.CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
    this.CACHE_PREFIX = 'bibi_';
    
    console.log('💾 CacheController initialized');
  }

  /**
   * Generate cache key for lesson data
   * EXTRACTED from lesson-plan-main.js:84-134
   */
  getCacheKey(lessonType, params, language = 'vi') {
    try {
      // In development mode, always return unique key to avoid using cache
      if (this.isDevelopment) {
        return `lesson_plan_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      }
      
      // Ensure all parameters are valid strings
      const safeType = lessonType ? String(lessonType) : 'unknown';
      const safeLang = language ? String(language) : 'vi';
      
      // Create detailed base string for key
      let cacheKey = `lesson_plan_${safeType}_${safeLang}`;
      
      // Add main parameters to key
      if (params) {
        // Grade is always present
        if (params.grade) {
          cacheKey += `_grade${String(params.grade)}`;
        }
        
        // Based on lesson type
        switch (safeType) {
          case 'main':
            if (params.unit) cacheKey += `_unit${String(params.unit)}`;
            if (params.skill_type) cacheKey += `_${String(params.skill_type)}`;
            break;
            
          case 'supplementary':
            if (params.supplementary_type) cacheKey += `_${String(params.supplementary_type)}`;
            if (params.topic) cacheKey += `_${String(params.topic)}`;
            break;
            
          case 'extracurricular':
            if (params.topic) cacheKey += `_${String(params.topic)}`;
            if (params.duration) cacheKey += `_${String(params.duration)}`;
            break;
            
          case 'review':
            if (params.reviewNumber) cacheKey += `_review${String(params.reviewNumber)}`;
            if (params.selectedSkills) cacheKey += `_skills${params.selectedSkills.join('')}`;
            break;
        }
      }
      
      return cacheKey;
    } catch (error) {
      console.error('Cache key generation error:', error);
      return `lesson_plan_${Date.now()}`;
    }
  }

  /**
   * Get content from cache
   * EXTRACTED from lesson-plan-main.js:135-150
   */
  getFromCache(key) {
    try {
      const cacheData = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cacheData) return null;
      
      // Parse JSON data
      const data = JSON.parse(cacheData);
      
      // Check cache expiry
      if (Date.now() - data.timestamp > this.CACHE_EXPIRY) {
        // Cache expired, remove and return null
        localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
        console.log(`💾 Cache expired for key: ${key}`);
        return null;
      }
      
      console.log(`💾 Cache hit for key: ${key}`);
      return data.content;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * Save content to cache
   * EXTRACTED from lesson-plan-main.js:151-169
   */
  saveToCache(key, content) {
    try {
      const cacheData = {
        content: content,
        timestamp: Date.now(),
        version: '1.0',
        size: JSON.stringify(content).length
      };
      
      localStorage.setItem(`${this.CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
      console.log(`💾 Cache saved for key: ${key} (${cacheData.size} bytes)`);
      return true;
    } catch (error) {
      console.error('Cache save error:', error);
      
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        console.warn('💾 Cache quota exceeded, clearing old entries');
        this.clearOldEntries();
        
        // Retry save after cleanup
        try {
          localStorage.setItem(`${this.CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
          return true;
        } catch (retryError) {
          console.error('Cache save failed after cleanup:', retryError);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Clear old cache entries to free up space
   * NEW: Smart cache cleanup
   */
  clearOldEntries() {
    try {
      const entriesToRemove = [];
      const now = Date.now();
      
      // Find old entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.timestamp) {
              const age = now - data.timestamp;
              
              // Remove entries older than 12 hours
              if (age > this.CACHE_EXPIRY / 2) {
                entriesToRemove.push(key);
              }
            }
          } catch (parseError) {
            // Remove invalid cache entries
            entriesToRemove.push(key);
          }
        }
      }
      
      // Remove old entries
      entriesToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`💾 Removed old cache entry: ${key}`);
      });
      
      console.log(`💾 Cleaned up ${entriesToRemove.length} old cache entries`);
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Check if key exists in cache
   * NEW: Utility method
   */
  hasCache(key) {
    try {
      const cacheData = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cacheData) return false;
      
      const data = JSON.parse(cacheData);
      const isExpired = Date.now() - data.timestamp > this.CACHE_EXPIRY;
      
      if (isExpired) {
        localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all lesson plan cache
   * NEW: Utility method
   */
  clearAllCache() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`💾 Cleared ${keysToRemove.length} cache entries`);
      
      return keysToRemove.length;
    } catch (error) {
      console.error('Clear all cache error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * NEW: Debug utility
   */
  getCacheStats() {
    try {
      let totalEntries = 0;
      let totalSize = 0;
      let expiredEntries = 0;
      const now = Date.now();
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          totalEntries++;
          
          try {
            const value = localStorage.getItem(key);
            totalSize += value.length;
            
            const data = JSON.parse(value);
            if (data && data.timestamp) {
              const age = now - data.timestamp;
              if (age > this.CACHE_EXPIRY) {
                expiredEntries++;
              }
            }
          } catch (parseError) {
            expiredEntries++;
          }
        }
      }
      
      return {
        totalEntries,
        totalSize,
        totalSizeKB: Math.round(totalSize / 1024),
        expiredEntries,
        validEntries: totalEntries - expiredEntries
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        totalSizeKB: 0,
        expiredEntries: 0,
        validEntries: 0
      };
    }
  }

  /**
   * Set development mode
   * NEW: Configuration method
   */
  setDevelopmentMode(enabled) {
    this.isDevelopment = enabled;
    console.log(`💾 Development mode ${enabled ? 'enabled' : 'disabled'}`);
    
    if (enabled) {
      console.log('💾 Cache disabled for development');
    }
  }

  /**
   * Set cache expiry time
   * NEW: Configuration method
   */
  setCacheExpiry(milliseconds) {
    this.CACHE_EXPIRY = milliseconds;
    console.log(`💾 Cache expiry set to ${milliseconds}ms (${milliseconds / 1000 / 60} minutes)`);
  }
}

// Create singleton instance
export const cacheController = new CacheController();

// Make available globally for compatibility
window.cacheController = cacheController;