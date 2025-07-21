// /static/js/controllers/lesson-plan/services/lesson-api-service.js
// API SERVICE LAYER - Centralized API communication
// This module handles all API calls and data transformation

import { LessonPlanAPI } from '../lesson-plan-api.js';
import { generateCacheKey } from '../core/lesson-utils.js';
import { LESSON_PLAN_PROMPTS, SUPPLEMENTARY_PROMPTS, UNITS_DATA, REVIEWS_DATA } from '../lesson-plan-prompts.js';

/**
 * Service class for lesson plan API operations
 * Provides a clean interface for API communication with error handling and caching
 */
export class LessonAPIService {
  constructor() {
    this.api = new LessonPlanAPI();
    this.cache = new Map(); // In-memory cache for session
  }

  /* Generate a lesson plan with unified interface */
  async generateLessonPlan(lessonType, formData, streamCallback = null, options = {}) {
    try {
      // Get language from uiStateManager if not provided
      const language = options.language || 
                      (window.uiStateManager ? window.uiStateManager.getLanguage() : 'vi');
      
      // Generate cache key với language
      const cacheKey = generateCacheKey(lessonType, formData, language);
      
      // Check cache if enabled
      if (options.useCache && this.cache.has(cacheKey)) {
        console.log(`📋 Using cached lesson plan for ${lessonType}`);
        return {
          success: true,
          content: this.cache.get(cacheKey),
          cached: true
        };
      }
  
      // Build prompt với language parameter
      const prompt = this.buildPrompt(lessonType, formData, language);
      
      // Call API
      console.log(`🚀 Generating ${lessonType} lesson plan...`);
      const response = await this.api.generateLessonPlan(
        prompt,
        streamCallback,
        {
          lessonType,
          ...formData,
          ...options
        }
      );

      // Cache successful responses
      if (response.success && options.useCache) {
        this.cache.set(cacheKey, response.content);
        console.log(`💾 Cached lesson plan for ${lessonType}`);
      }

      return response;

    } catch (error) {
      console.error(`❌ API Error for ${lessonType}:`, error);
      return {
        success: false,
        error: error.message || 'API call failed',
        details: error
      };
    }
  }

  /**
   * Generate main lesson plan
   * @param {object} formData - Main lesson form data
   * @param {function} streamCallback - Optional streaming callback
   * @param {object} options - Additional options
   * @returns {Promise<object>} API response
   */
  async generateMainLesson(formData, streamCallback = null, options = {}) {
    return this.generateLessonPlan('main', formData, streamCallback, options);
  }

  /**
   * Generate supplementary lesson plan
   * @param {object} formData - Supplementary lesson form data
   * @param {function} streamCallback - Optional streaming callback
   * @param {object} options - Additional options
   * @returns {Promise<object>} API response
   */
  async generateSupplementaryLesson(formData, streamCallback = null, options = {}) {
    return this.generateLessonPlan('supplementary', formData, streamCallback, options);
  }

  /**
   * Generate review lesson plan
   * @param {object} formData - Review lesson form data
   * @param {function} streamCallback - Optional streaming callback
   * @param {object} options - Additional options
   * @returns {Promise<object>} API response
   */
  async generateReviewLesson(formData, streamCallback = null, options = {}) {
    return this.generateLessonPlan('review', formData, streamCallback, options);
  }

  /* Build prompt based on lesson type and form data */
  buildPrompt(lessonType, formData, language = 'vi') {
    switch (lessonType) {
      case 'main':
        return this.buildMainLessonPrompt(formData, language);
      case 'supplementary':
        return this.buildSupplementaryPrompt(formData, language);
      case 'review':
        return this.buildReviewPrompt(formData, language);
      default:
        throw new Error(`Unknown lesson type: ${lessonType}`);
    }
  }

  /* Build prompt for main lesson */
  buildMainLessonPrompt(formData) {
    // Get unit data for detailed information
    const unitData = UNITS_DATA[formData.unit];
    const unitName = unitData?.name || `Unit ${formData.unit}`;
    
    // Use main lesson prompt template
    let prompt = LESSON_PLAN_PROMPTS.main || LESSON_PLAN_PROMPTS.unit_lesson1_getting_started;
    
    // Replace placeholders
    prompt = prompt.replace(/\{grade\}/g, formData.grade);
    prompt = prompt.replace(/\{unitNumber\}/g, formData.unit);
    prompt = prompt.replace(/\{unitName\}/g, unitName);
    prompt = prompt.replace(/\{lessonName\}/g, formData.lesson);
    
    // Add additional context if available
    if (formData.week) {
      prompt = prompt.replace(/\{week\}/g, formData.week);
    }
    
    if (formData.specialRequirements) {
      prompt += `\n\nYêu cầu đặc biệt: ${formData.specialRequirements}`;
    }
    
    console.log('🔧 Built main lesson prompt for:', { grade: formData.grade, unit: formData.unit, lesson: formData.lesson });
    return prompt;
  }

  /**
   * Build prompt for supplementary lesson
   * @param {object} formData - Supplementary lesson form data
   * @returns {string} Generated prompt
   */
  buildSupplementaryPrompt(formData) {
    // Get unit data for context
    const unitData = UNITS_DATA[formData.unit];
    const unitName = unitData?.name || `Unit ${formData.unit}`;
    
    // Map skills to Vietnamese names
    const skillsMapping = {
      vocabulary: 'Từ vựng (Vocabulary)',
      pronunciation: 'Phát âm (Pronunciation)',
      grammar: 'Ngữ pháp (Grammar)',
      reading: 'Đọc hiểu (Reading)',
      writing: 'Viết (Writing)',
      listening: 'Nghe (Listening)',
      speaking: 'Nói (Speaking)'
    };
    
    const skillsText = formData.selectedSkills?.map(skill => 
      skillsMapping[skill] || skill
    ).join(', ') || 'Kỹ năng tổng hợp';
    
    // Use supplementary prompt template
    let prompt = SUPPLEMENTARY_PROMPTS?.TEMPLATE || 
                 LESSON_PLAN_PROMPTS.supplementary ||
                 `Tạo giáo án tăng tiết tiếng Anh chi tiết cho lớp {grade}, Unit {unitNumber}: {unitName}`;
    
    // Replace placeholders
    prompt = prompt.replace(/\{grade\}/g, formData.grade);
    prompt = prompt.replace(/\{unitNumber\}/g, formData.unit);
    prompt = prompt.replace(/\{unitName\}/g, unitName);
    prompt = prompt.replace(/\{selectedSkills\}/g, skillsText);
    prompt = prompt.replace(/\{skills\}/g, skillsText);
    
    // Add additional instructions if provided
    if (formData.additionalInstructions) {
      prompt += `\n\nYêu cầu đặc biệt: ${formData.additionalInstructions}`;
    }
    
    console.log('🔧 Built supplementary prompt for:', { grade: formData.grade, unit: formData.unit, skills: skillsText });
    return prompt;
  }

  /* Build prompt for review lesson */
  buildReviewPrompt(formData, language = 'vi') {
    // Find review data
    const key = `grade_${formData.grade}_semester_${formData.semester}`;
    const reviews = REVIEWS_DATA[key] || [];
    const selectedReview = reviews.find(r => r.id === formData.reviewType);
    
    // Map skills - giữ nguyên logic
    const skillsMapping = {
      vocabulary: 'Vocabulary',
      pronunciation: 'Pronunciation', 
      grammar: 'Grammar',
      reading: 'Reading',
      writing: 'Writing',
      listening: 'Listening',
      speaking: 'Speaking'
    };
    
    const selectedSkills = formData.selectedSkills?.map(skill => 
      skillsMapping[skill] || skill
    ) || ['Vocabulary', 'Grammar'];
    
    // Build reviewInfo object
    const reviewInfo = {
      name: selectedReview?.name || `Review ${formData.reviewType}`,
      units: selectedReview?.units || [1, 2, 3],
      grade: formData.grade
    };
    
    // Use getReviewPrompt with language parameter
    try {
      const { getReviewPrompt } = require('../review-prompts.js');
      const prompt = getReviewPrompt(
        reviewInfo, 
        selectedSkills, 
        formData.additionalInstructions || '', 
        '',
        language
      );
      
      console.log('🔧 Built review prompt using getReviewPrompt for:', { 
        grade: formData.grade, 
        semester: formData.semester, 
        reviewType: reviewInfo.name,
        skills: selectedSkills.join(', '),
        language: language
      });
      
      return prompt;
    } catch (error) {
      console.error('Error using getReviewPrompt, falling back to simple template');
      return `Create detailed English Review lesson plan for grade ${formData.grade}, ${reviewInfo.name}`;
    }
  }

  /**
   * Check RAG service status
   * @returns {Promise<object>} RAG status
   */
  async checkRAGStatus() {
    try {
      // Use existing API instance to check RAG status
      if (this.api && typeof this.api.checkRAGStatus === 'function') {
        const status = await this.api.checkRAGStatus();
        return {
          connected: status.connected || status.status === 'connected',
          message: status.message || 'RAG service checked via API',
          details: status
        };
      }
      
      // Fallback: Check if window.ragService is available
      if (window.ragService) {
        return {
          connected: true,
          message: 'RAG service available globally'
        };
      }
      
      // Default response
      return {
        connected: false,
        message: 'RAG service status unknown'
      };
      
    } catch (error) {
      console.error('❌ RAG Status Check Error:', error);
      return {
        connected: false,
        message: 'RAG service unavailable',
        error: error.message
      };
    }
  }

  /**
   * Clear API cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ API cache cleared');
  }

  /**
   * Get cache size
   * @returns {number} Number of cached items
   */
  getCacheSize() {
    return this.cache.size;
  }

  /**
   * Get cached item by key
   * @param {string} key - Cache key
   * @returns {any} Cached item or null
   */
  getCachedItem(key) {
    return this.cache.get(key) || null;
  }

  /**
   * Set custom cache item
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  setCachedItem(key, value) {
    this.cache.set(key, value);
  }

  /**
   * Remove cached item
   * @param {string} key - Cache key
   * @returns {boolean} True if item was removed
   */
  removeCachedItem(key) {
    return this.cache.delete(key);
  }
}

// Create singleton instance
export const lessonAPIService = new LessonAPIService();

// Make available globally for compatibility
window.lessonAPIService = lessonAPIService;