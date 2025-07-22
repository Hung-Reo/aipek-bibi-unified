// /static/js/controllers/lesson-plan/modules/test-manager.js
// Controller tạo đề kiểm tra - ✅ UPDATED với Dynamic Listening Distribution
// Xử lý tạo đề kiểm tra với phân bổ câu hỏi listening theo thời gian test

import { LessonPlanAPI } from '../lesson-plan-api.js';
import { UNITS_DATA } from '../lesson-plan-prompts.js';
import { getTestPrompt } from './test-prompts.js';

export class TestManager {
  constructor(parentController, api, ui) {
    this.parent = parentController;
    this.api = api || new LessonPlanAPI();
    this.ui = ui;
    this.isGenerating = false; // Ngăn chặn gọi đồng thời
    
    // ✅ Setup test tab listener on initialization
    setTimeout(() => {
      this.setupTestTabListener();
    }, 1000); // Delay to ensure DOM is ready
    
    console.log('🧪 TestManager initialized');
  }

  /**
   * ✅ SIMPLIFIED: Initialize test tab
   */
  initTestTab() {
    console.log('🧪 Test tab initialized');
  }

  // ✅ REMOVED: TTS event listeners - using UI.displayAudioPlayers() instead

  /**
   * ✅ NEW: Setup test tab initialization
   */
  setupTestTabListener() {
    const testTabButton = document.getElementById('test-tab');
    if (testTabButton) {
      testTabButton.addEventListener('click', () => {
        // Delay to ensure tab switch completes
        setTimeout(() => {
          this.initTestTab();
        }, 300);
      });
      console.log('✅ Test tab listener setup complete');
    } else {
      console.warn('⚠️ Test tab button not found');
    }
  }

  /**
   * ✅ MỚI: Tính toán phân bổ câu hỏi listening theo thời gian test
   * Logic: 15 phút = chỉ Part 1, các thời gian khác = Part 1 + Part 2
   */
  calculateListeningSplit(distribution) {
    const totalListening = distribution.listening;
    const duration = parseInt(document.getElementById('test-duration')?.value) || 60;
    
    console.log(`📊 Calculating listening split for ${duration} minutes, total: ${totalListening} questions`);
    
    if (duration === 15) {
      // 15 phút: Dồn tất cả vào Part 1 (conversations), không có Part 2
      return {
        part1Count: totalListening, // 3 conversations
        part2Count: 0              // Không có passage
      };
    } else if (duration === 30) {
      // 30 phút: 3 conversations + 2 passage questions
      return {
        part1Count: 3,
        part2Count: 2
      };
    } else if (duration === 45) {
      // 45 phút: 4 conversations + 3 passage questions  
      return {
        part1Count: 4,
        part2Count: 3
      };
    } else {
      // 60 phút: 5 conversations + 5 passage questions (original)
      return {
        part1Count: 5,
        part2Count: 5
      };
    }
  }

  /**
   * Lấy tên unit từ UNITS_DATA - Copy từ supplementary-controller.js
   */
  getUnitName(unitNumber) {
    try {
      const unitsData = window.UNITS_DATA || UNITS_DATA;
      
      if (unitsData && unitsData[unitNumber]) {
        return unitsData[unitNumber].name;
      }
      
      // Tên unit dự phòng
      const fallbackUnits = {
        1: "MY NEW SCHOOL",
        2: "MY HOUSE", 
        3: "MY FRIENDS",
        4: "MY NEIGHBOURHOOD",
        5: "NATURAL WONDERS OF VIET NAM",
        6: "OUR TET HOLIDAY",
        7: "TELEVISION",
        8: "SPORTS AND GAMES", 
        9: "CITIES OF THE WORLD",
        10: "OUR HOUSES IN THE FUTURE",
        11: "OUR GREENER WORLD",
        12: "ROBOTS"
      };
      
      return fallbackUnits[unitNumber] || "";
    } catch (error) {
      console.warn(`⚠️ Error getting unit name for Unit ${unitNumber}:`, error);
      return "";
    }
  }

  /**
   * Xử lý tạo đề kiểm tra chính - Copy pattern từ supplementary-controller.js
   */
  async generateTest() {
    if (this.isGenerating) {
      console.log('⚠️ Test generation already in progress, skipping');
      return;
    }
    
    this.isGenerating = true;
    console.log('🧪 TestManager: Bắt đầu tạo đề kiểm tra...');

    try {
      // Bước 1: Lấy tham số form
      const params = this.getTestFormData();
      if (!params) {
        console.error('❌ getTestFormData() trả về null');
        alert('Vui lòng điền đầy đủ thông tin để tạo đề kiểm tra.');
        return;
      }

      // Bước 2: Kiểm tra dữ liệu form
      const validation = this.validateTestForm(params);
      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
      }

      // Bước 3: Tạo tiêu đề
      const title = this.buildTestTitle(params);
      
      // Bước 4: Kiểm tra cache
      const cacheKey = this.buildCacheKey('test', params);
      const cachedContent = await this.checkCache(cacheKey);
      
      if (cachedContent) {
        console.log('📦 Sử dụng nội dung test từ cache');
        this.displayResult(title, cachedContent, 'test');
        return;
      }
      
      // Bước 5: Hiển thị loading
      this.ui.showLoading();
      
      // Bước 6: Tạo prompt và messages
      const prompt = this.buildTestPrompt(params);
      const messages = this.buildMessages(prompt, params);
      
      // Bước 7: Tạo RAG query - Tối ưu như supplementary
      const ragQuery = this.buildRAGQuery(params);
      console.log('🔍 Test RAG Query:', ragQuery);
      
      // Bước 8: Khởi tạo streaming UI
      const streamingElement = this.ui.initStreamingUI(title, 'test');
      
      // Bước 9: Gọi API với streaming
      const response = await this.api.generateLessonPlan(
        messages,
        (chunk, fullContent, ragInfo) => {
          this.ui.updateStreamingContent(streamingElement, chunk, fullContent, ragInfo);
        },
        {
          useRAG: true,
          lessonType: 'test',
          ragQuery: ragQuery,
          maxTokens: 22000,
          temperature: 0.7,
          requireDetailedContent: true,
          testScope: params.testScope,
          testDuration: params.duration,
          difficulty: params.difficulty
        }
      );

      // Bước 10: Hoàn thiện response
      if (response && response.content) {
        const fullContent = response.content;
        const ragInfo = response.ragInfo;
        
        // Hoàn thiện UI
        this.ui.finalizeStreamingContent(streamingElement, fullContent, ragInfo);
        
        // Bước 11: Audio generation với dynamic split - ✅ UPDATED
        if (this.shouldGenerateAudio()) {
          console.log('🎧 Starting audio generation với dynamic listening split...');
          this.ui.showAudioGeneration();
          
          try {
            const audioResults = await this.generateAudioFiles(fullContent);
            
            if (audioResults.success) {
              // ✅ FIXED: Use working displayAudioPlayers from UI
              this.ui.displayAudioPlayers(streamingElement, audioResults);
              console.log('✅ Audio generation complete');
            } else {
              console.warn('⚠️ Audio generation failed, continuing with text-only');
              alert(`Audio generation failed: ${audioResults.error || 'Unknown error'}`);
            }
          } catch (error) {
            console.error('❌ Audio generation error:', error);
            alert(`Audio generation error: ${error.message}`);
          } finally {
            this.ui.hideAudioGeneration();
          }
        }
        
        // Lưu vào cache
        await this.saveToCache(cacheKey, fullContent);
        
        console.log('✅ Đã hoàn thành tạo đề kiểm tra');
      } else {
        throw new Error('Không nhận được nội dung từ API');
      }
      
    } catch (error) {
      console.error('❌ Lỗi trong TestManager.generateTest:', error);
      this.handleError(error);
    } finally {
      this.ui.hideLoading();
      this.isGenerating = false;
    }
  }

  /**
   * Lấy dữ liệu form test từ sidebar - Copy pattern từ supplementary-controller.js
   */
  getTestFormData() {
    // Lấy phạm vi test
    const testScope = document.querySelector('input[name="test-scope"]:checked')?.value || 'mid-hk1';
    
    // Lấy thời gian
    const duration = parseInt(document.getElementById('test-duration')?.value) || 60;
    
    // Lấy độ khó
    const difficulty = document.getElementById('test-difficulty')?.value || 'medium';
    
    // Lấy yêu cầu đặc biệt
    const specialRequirements = document.getElementById('test-special-requirements')?.value || '';

    // Ánh xạ phạm vi sang units
    const scopeMapping = {
      'mid-hk1': { units: [1,2,3], semester: 1, name: 'Giữa HK1 (Units 1-3)' },
      'final-hk1': { units: [1,2,3,4,5,6], semester: 1, name: 'Cuối HK1 (Units 1-6)' },
      'mid-hk2': { units: [7,8,9], semester: 2, name: 'Giữa HK2 (Units 7-9)' },
      'final-hk2': { units: [7,8,9,10,11,12], semester: 2, name: 'Cuối HK2 (Units 7-12)' }
    };
    
    const scopeInfo = scopeMapping[testScope];
    
    // Phân bổ câu hỏi theo thời gian
    const distributions = {
      60: {listening: 10, language: 10, reading: 10, writing: 5, total: 35},
      45: {listening: 7, language: 8, reading: 6, writing: 2, total: 23},
      30: {listening: 5, language: 5, reading: 4, writing: 1, total: 15},
      15: {listening: 3, language: 3, reading: 2, writing: 0, total: 8}
    };
    
    const distribution = distributions[duration];

    return {
      testScope,
      scopeInfo,
      duration,
      difficulty,
      specialRequirements,
      distribution,
      lessonType: 'test'
    };
  }

  /**
   * Validate test form - Copy pattern từ supplementary-controller.js
   */
  validateTestForm(params) {
    const errors = [];
    
    if (!params.testScope) errors.push('Vui lòng chọn phạm vi kiểm tra');
    if (!params.duration) errors.push('Vui lòng chọn thời gian kiểm tra');
    if (!params.difficulty) errors.push('Vui lòng chọn độ khó');
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Build test title
   */
  buildTestTitle(params) {
    const difficultyMap = {
      'easy': 'Dễ',
      'medium': 'Trung bình', 
      'hard': 'Khó'
    };
    
    const difficultyText = difficultyMap[params.difficulty] || 'Trung bình';
    
    return `Đề kiểm tra ${params.scopeInfo.name} - ${params.duration} phút - Độ khó: ${difficultyText}`;
  }

  /**
   * Build test prompt với personalization từ test-prompts.js
   */
  buildTestPrompt(params) {
    return getTestPrompt(params);
  }

  /**
   * Build RAG query - Optimized như supplementary (5-7 words)
   */
  buildRAGQuery(params) {
    const unitsText = params.scopeInfo.units.length <= 3 
      ? params.scopeInfo.units.join(' ') 
      : `Units ${params.scopeInfo.units[0]}-${params.scopeInfo.units[params.scopeInfo.units.length-1]}`;
    
    return `${unitsText} lớp 6 kiểm tra test`;
  }

  /**
   * Build messages for API - Copy từ supplementary-controller.js
   */
  buildMessages(prompt, params) {
    const languageInstruction = "Trả lời hoàn toàn bằng tiếng Việt.";
    
    return [
      {
        role: "system",
        content: `${prompt}\n\n${languageInstruction}`
      },
      {
        role: "user", 
        content: `Hãy tạo đề kiểm tra chi tiết theo format mã đề ___ với thông tin đã cung cấp.`
      }
    ];
  }

  /**
   * Display result - Copy từ supplementary-controller.js
   */
  displayResult(title, content, lessonType) {
    this.ui.showResult(title, content, lessonType);
  }

  /**
   * Handle errors - Copy từ supplementary-controller.js
   */
  handleError(error) {
    console.error('❌ Error in test generation:', error);
    alert('Có lỗi xảy ra khi tạo đề kiểm tra. Vui lòng thử lại.');
  }

  /**
   * Build cache key với personalization
   */
  buildCacheKey(lessonType, params) {
    const difficultyKey = params.difficulty || 'medium';
    let personalizationKey = 'standard';
    
    if (params.specialRequirements) {
      const instruction = params.specialRequirements.toLowerCase();
      if (instruction.includes('khó') || instruction.includes('nâng cao')) {
        personalizationKey = 'advanced';
      } else if (instruction.includes('dễ') || instruction.includes('cơ bản')) {
        personalizationKey = 'basic';
      } else {
        personalizationKey = `custom_${this.hashString(params.specialRequirements)}`;
      }
    }
    
    return `lesson_${lessonType}_${params.testScope}_${params.duration}min_${difficultyKey}_${personalizationKey}`;
  }

  /**
   * Hash function cho custom requirements
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  /**
   * Check cache - Copy từ supplementary-controller.js
   */
  async checkCache(cacheKey) {
    try {
      const cached = localStorage.getItem(`bibi_cache_${cacheKey}`);
      if (cached) {
        const data = JSON.parse(cached);
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 giờ
        
        if (Date.now() - data.timestamp < CACHE_DURATION) {
          return data.content;
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    return null;
  }

  /**
   * Save to cache - Copy từ supplementary-controller.js
   */
  async saveToCache(cacheKey, content) {
    try {
      const cacheData = {
        content: content,
        timestamp: Date.now()
      };
      localStorage.setItem(`bibi_cache_${cacheKey}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache save error:', error);
    }
  }

  /**
   * Kiểm tra có tạo audio không
   */
  shouldGenerateAudio() {
    const audioCheckbox = document.getElementById('generate-audio');
    return audioCheckbox && audioCheckbox.checked;
  }

  // ✅ REMOVED: addTTSControls() - using UI.displayAudioPlayers() instead

  // ✅ REMOVED: addTTSStyles() - using UI.displayAudioPlayers() instead

  // ✅ REMOVED: displayAudioFiles() - using UI.displayAudioPlayers() instead

  // ✅ REMOVED: All helper audio functions - using UI.displayAudioPlayers() instead

  /**
   * ✅ UPDATED: Gọi TTS API để tạo audio files với dynamic listening split
   * Truyền thông tin phân bổ câu hỏi listening xuống backend để generate đúng số lượng
   */
  async generateAudioFiles(testContent) {
    try {
      const voice = document.getElementById('tts-voice')?.value || 'echo';
      const speed = parseFloat(document.getElementById('tts-speed')?.value || '1.0');
      
      // ✅ MỚI: Lấy distribution info và tính toán split
      const params = this.getTestFormData();
      const listeningSplit = this.calculateListeningSplit(params.distribution);
      
      console.log(`🎙️ Calling TTS API with voice: ${voice}, speed: ${speed}`);
      console.log(`📊 Listening split được truyền: Part 1=${listeningSplit.part1Count}, Part 2=${listeningSplit.part2Count}`);
      
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testContent: testContent,
          voice: voice,
          speed: speed,
          listeningSplit: listeningSplit // ✅ MỚI: Truyền split info xuống backend
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ TTS API success: ${result.audioFiles.length} files generated (${listeningSplit.part1Count} conversations + ${listeningSplit.part2Count} passages)`);
      
      return result;
    } catch (error) {
      console.error('❌ TTS API error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in main controller
export default TestManager;