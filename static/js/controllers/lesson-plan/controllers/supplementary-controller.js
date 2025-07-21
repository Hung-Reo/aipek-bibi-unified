// /static/js/controllers/lesson-plan/controllers/supplementary-controller.js
// COMPLETE REWRITE - Based on main-lesson-controller.js structure
// This module handles supplementary lesson generation with proper UI integration

// Import dependencies
import { LessonPlanAPI } from '../lesson-plan-api.js';
// ✅ NEW IMPORT: Access to UNITS_DATA for unit name lookup
import { UNITS_DATA } from '../lesson-plan-prompts.js';
import { ContentFormatter } from '../modules/content-formatter.js';
import { validateSupplementaryForm } from '../core/validation.js';
import { lessonAPIService } from '../services/lesson-api-service.js';
import { uiStateManager } from '../ui/ui-state-manager.js';

/**
 * SupplementaryController - Handles supplementary lesson generation
 * REWRITTEN to match main-lesson-controller.js structure
 */
export class SupplementaryController {
  constructor(parentController, api, ui) {
    this.parent = parentController; // Reference to main LessonPlanController
    this.api = api || new LessonPlanAPI();
    this.ui = ui;
    this.formatter = new ContentFormatter();
    
    console.log('🎯 SupplementaryController initialized with proper UI integration');
  }

  /**
   * ✅ NEW METHOD: Get unit name from UNITS_DATA
   */
  getUnitName(unitNumber) {
    try {
      // First try to get from window.UNITS_DATA (global)
      const unitsData = window.UNITS_DATA || UNITS_DATA;
      
      if (unitsData && unitsData[unitNumber]) {
        return unitsData[unitNumber].name;
      }
      
      // Fallback unit names if UNITS_DATA not available
      const fallbackUnits = {
        1: "MY NEW SCHOOL",
        2: "MY HOUSE", 
        3: "MY FRIENDS",
        4: "MY NEIGHBOURHOOD", // ← KEY FIX for Unit 4
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
   * Initialize supplementary events
   */
  initSupplementaryEvents() {
    console.log('🔧 SupplementaryController: Initializing events...');
    
    // Event listener cho nút tạo Supplementary
    const generateSupplementaryBtn = document.getElementById('generate-supplementary-btn-top');
    if (generateSupplementaryBtn) {
      generateSupplementaryBtn.addEventListener('click', () => {
        this.handleGenerateSupplementary();
      });
      console.log('✅ Event listener added for generate-supplementary-btn');
    }

    // Event listener cho Unit selection
    const supplementaryUnitSelect = document.getElementById('supplementary-unit-select');
    if (supplementaryUnitSelect) {
      supplementaryUnitSelect.addEventListener('change', () => {
        if (supplementaryUnitSelect.value) {
          console.log(`✅ User đã chọn Unit ${supplementaryUnitSelect.value} cho Supplementary`);
        }
      });
      console.log('✅ Event listener added for supplementary-unit-select');
    }
  }

  /**
   * Main supplementary generation handler - COPIED from main-lesson-controller.js
   */
  async handleGenerateSupplementary() {
    try {
      console.log("🎯 SupplementaryController: Bắt đầu tạo giáo án tăng tiết...");

      // Step 1: Get form parameters
      const params = this.getSupplementaryFormParams();
      if (!params) {
        console.error("DEBUG: getSupplementaryFormParams() trả về null");
        alert('Vui lòng điền đầy đủ thông tin để tạo giáo án tăng tiết.');
        return;
      }

      // Step 2: Validate form data
      const validation = this.validateSupplementaryForm(params);
      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
      }

      // Step 3: Build title và prepare data
      const title = this.buildSupplementaryTitle(params);
      this.parent.currentLessonType = 'supplementary';
      
      // Step 4: Check cache trước khi generate
      const cacheKey = this.buildCacheKey('supplementary', params);
      const cachedContent = await this.checkCache(cacheKey);
      
      if (cachedContent) {
        console.log('📦 Sử dụng nội dung từ cache');
        this.displayResult(title, cachedContent, 'supplementary');
        return;
      }
      
      // Step 5: Show loading state
      this.ui.showLoading();
      
      // Step 6: Prepare prompt và messages
      const prompt = this.buildSupplementaryPrompt(params);
      const messages = this.buildMessages(prompt, params);
      
      // Step 7: Build RAG query - 🔥 OPTIMIZED: Copy Main success pattern
      const ragQuery = this.buildRAGQuery(params);
      console.log("🔍 Supplementary RAG Query:", ragQuery);
      
      // Step 8: Khởi tạo streaming UI - PROPER UI METHOD
      const streamingElement = this.ui.initStreamingUI(title, 'supplementary');
      
      // Step 9: Gọi API với streaming - ENHANCED với supplementary-specific logic
      const response = await this.api.generateLessonPlan(
        messages,
        (chunk, fullContent, ragInfo) => {
          // Update UI realtime khi nhận data - PROPER FORMATTING
          this.ui.updateStreamingContent(streamingElement, chunk, fullContent, ragInfo);
        },
        {
          useRAG: true,
          lessonType: 'supplementary',
          ragQuery: ragQuery,
          maxTokens: 22000,
          temperature: 0.9,
          requireDetailedContent: true,
          // ✅ ADD: Force supplementary-specific content expansion
          isSupplementaryLesson: true,
          supplementarySkills: params.selectedSkills,
          personalizationLevel: this.detectPersonalizationLevel(params.additionalInstructions)
        }
      );
      
      // Step 10: Xử lý response - PROPER FINALIZATION
      if (response && response.content) {
        const fullContent = response.content;
        const ragInfo = response.ragInfo;
        
        // Finalize UI with proper formatting and feedback
        this.ui.finalizeStreamingContent(streamingElement, fullContent, ragInfo);
        
        // Save to cache
        await this.saveToCache(cacheKey, fullContent);
        
        console.log("✅ Đã hoàn thành tạo giáo án tăng tiết");
      } else {
        throw new Error('Không nhận được nội dung từ API');
      }
      
    } catch (error) {
      console.error('❌ Lỗi trong SupplementaryController.handleGenerateSupplementary:', error);
      this.handleError(error);
    } finally {
      // Always hide loading
      this.ui.hideLoading();
    }
  }

  /**
   * Get supplementary form parameters - IMPROVED
   */
  getSupplementaryFormParams() {
    // Try multiple possible field IDs for flexibility
    const grade = document.getElementById('supplementary-grade-select')?.value ||
                  document.getElementById('grade-select-supp')?.value ||
                  document.getElementById('grade-select')?.value ||
                  '6';
                  
    const unit = document.getElementById('supplementary-unit-select')?.value ||
                 document.getElementById('unit-select-supp')?.value ||
                 document.getElementById('unit-select')?.value;

    // Get selected skills with multiple fallback selectors
    let selectedSkills = [];
    const skillSelectors = [
        'input[name="supplementary-skill"]:checked',
        'input[name="skill"]:checked', 
        'input[type="checkbox"]:checked'
    ];
    
    for (const selector of skillSelectors) {
        const checkboxes = document.querySelectorAll(selector);
        if (checkboxes.length > 0) {
            selectedSkills = Array.from(checkboxes).map(cb => cb.value);
            break;
        }
    }

    const additionalInstructions = document.getElementById('supplementary-additional-instructions')?.value ||
                                  document.getElementById('additional-instructions-supp')?.value ||
                                  document.getElementById('additional-instructions')?.value ||
                                  '';

    const week = document.getElementById('supplementary-week-input')?.value ||
                 document.getElementById('week-input')?.value ||
                 '';

    return { 
      grade, 
      unit, 
      selectedSkills, 
      additionalInstructions,
      week,
      lessonType: 'supplementary'
    };
  }

  /* Build supplementary title - COPIED pattern from main lesson */
  buildSupplementaryTitle(params) {
    const skillNames = {
        'vocabulary': 'Từ vựng',
        'pronunciation': 'Phát âm', 
        'grammar': 'Ngữ pháp',
        'reading': 'Đọc hiểu',
        'writing': 'Viết',
        'listening': 'Nghe hiểu',
        'speaking': 'Nói'
    };
    
    const skillsText = params.selectedSkills
        ?.map(skill => skillNames[skill] || skill)
        ?.join(', ') || 'Tăng tiết';

    // ✅ ENHANCED: Include unit name in title
    let unitContext = `Unit ${params.unit}`;
    if (params.unit) {
        const unitName = this.getUnitName(parseInt(params.unit));
        if (unitName) {
            unitContext += `: ${unitName}`;
        }
    }

    return `Giáo án tăng tiết ${skillsText} - ${unitContext} - Lớp ${params.grade}`;
  }

  /**
   * Validate supplementary form - PROPER VALIDATION
   */
  validateSupplementaryForm(params) {
    try {
      // Try using validation module first
      const result = validateSupplementaryForm(params);
      if (result && typeof result === 'object') {
        return result;
      }
    } catch (error) {
      console.warn('Fallback to legacy validation:', error);
    }
    
    // Fallback validation
    const errors = [];
    if (!params.grade) errors.push('Vui lòng chọn lớp');
    if (!params.unit) errors.push('Vui lòng chọn Unit');
    if (!params.selectedSkills || params.selectedSkills.length === 0) {
      errors.push('Vui lòng chọn ít nhất một kỹ năng');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Detect personalization level for API optimization
   */
  detectPersonalizationLevel(additionalInstructions) {
    if (!additionalInstructions) return 'standard';
    
    const instruction = additionalInstructions.toLowerCase();
    if (instruction.includes('giỏi') || instruction.includes('nâng cao') || instruction.includes('khó')) {
      return 'advanced';
    } else if (instruction.includes('trung bình') || instruction.includes('cơ bản') || instruction.includes('yếu')) {
      return 'basic';
    } else if (instruction.includes('khá') || instruction.includes('vừa') || instruction.includes('tb')) {
      return 'intermediate';
    }
    return 'custom';
  }

  /**
   * Build supplementary prompt - ENHANCED với force 15k+ logic
   */
  buildSupplementaryPrompt(params) {
    const skillNames = {
        'vocabulary': 'Từ vựng',
        'pronunciation': 'Phát âm', 
        'grammar': 'Ngữ pháp',
        'reading': 'Đọc hiểu',
        'writing': 'Viết',
        'listening': 'Nghe hiểu',
        'speaking': 'Nói'
    };
    
    const skillsText = params.selectedSkills
        .map(skill => skillNames[skill] || skill)
        .join(', ');

    let prompt = `Soạn giáo án tăng tiết chi tiết cho lớp ${params.grade}, Unit ${params.unit}.

Kỹ năng rèn luyện: ${skillsText}

⚠️⚠️⚠️ YÊU CẦU BẮT BUỘC - GIÁO ÁN TĂNG TIẾT ĐẦY ĐỦ 45 PHÚT ⚠️⚠️⚠️:
- TUYỆT ĐỐI PHẢI ĐẠT ÍT NHẤT 15.000 KÝ TỰ (đây là yêu cầu nghiêm ngặt)
- Giáo án tăng tiết phải CHI TIẾT HƠN giáo án chính vì là bài bổ sung chuyên sâu
- Mỗi hoạt động mô tả cực kỳ chi tiết 15-20 câu với script đầy đủ
- Bao gồm: Mục tiêu chi tiết, Chuẩn bị đầy đủ, Tiến trình dạy học cực chi tiết, Board Plan, Anticipated Difficulties
- Ít nhất 15 từ vựng/cấu trúc trong phần "Phân tích ngôn ngữ" với phân tích đầy đủ
- Ít nhất 10 khó khăn dự đoán và giải pháp chi tiết tương ứng
- Board Plan cực kỳ chi tiết với layout đầy đủ
- Ít nhất 20 bài tập cụ thể với hướng dẫn từng bước chi tiết
- Script đầy đủ những gì giáo viên sẽ nói cho mỗi hoạt động
- Câu hỏi và câu trả lời mẫu chi tiết cho mỗi Task

🎯 ĐẶC BIỆT QUAN TRỌNG: Đây là GIÁO ÁN TĂNG TIẾT nên phải có:
- Độ sâu kiến thức cao hơn giáo án chính
- Nhiều bài tập thực hành hơn (ít nhất 20 bài tập)
- Hoạt động đa dạng và phong phú hơn
- Chi tiết hướng dẫn từng bước cho mọi hoạt động`;

    // ✅ ENHANCED PERSONALIZATION - Focus vào "Yêu cầu đặc biệt"
    if (params.additionalInstructions) {
        const instruction = params.additionalInstructions.toLowerCase();
        
        if (instruction.includes('giỏi') || instruction.includes('nâng cao') || instruction.includes('khó')) {
            prompt += `\n\n🎯 CÁ NHÂN HÓA CHO HỌC SINH GIỎI - TĂNG TIẾT CHUYÊN SÂU:
- Tạo ít nhất 25 bài tập NÂNG CAO với độ khó cực cao
- Thêm hoạt động PHÂN TÍCH SÂU và TƯ DUY PHẢN BIỆN chi tiết
- Bài tập đòi hỏi KỸ NĂNG TỔNG HỢP từ nhiều Unit với hướng dẫn chi tiết
- Thêm THÁCH THỨC NGÔN NGỮ như: wordplay, idioms, advanced structures (ít nhất 15 examples)
- Hoạt động nhóm với vai trò LEADER và PRESENTER (ít nhất 5 activities)
- Bài tập SÁNG TẠO: viết câu chuyện, thuyết trình, debate với rubric đầy đủ
- Critical thinking exercises với step-by-step analysis
- Yêu cầu đặc biệt: ${params.additionalInstructions}

⚡ QUAN TRỌNG: Mỗi bài tập nâng cao phải có hướng dẫn chi tiết 10-15 câu`;
            
        } else if (instruction.includes('trung bình') || instruction.includes('cơ bản') || instruction.includes('yếu')) {
            prompt += `\n\n🎯 CÁ NHÂN HÓA CHO HỌC SINH TRUNG BÌNH - TĂNG TIẾT HỖ TRỢ:
- Tạo ít nhất 30 bài tập CƠ BẢN với hướng dẫn chi tiết từng bước cực kỳ rõ ràng
- Thêm nhiều VÍ DỤ MINH HỌA và THỰC HÀNH GUIDED (ít nhất 20 examples)
- Bài tập LẶP LẠI để củng cố kiến thức cơ bản với variations
- Hoạt động PAIR-WORK với hỗ trợ lẫn nhau (ít nhất 8 activities)
- Sử dụng VISUAL AIDS và GAMES để tăng hứng thú (ít nhất 10 games)
- Bài tập ĐIỀN VÀO CHỖ TRỐNG và MATCHING đơn giản với answer keys
- Scaffolding activities với step-by-step support
- Confidence-building exercises với positive reinforcement
- Yêu cầu đặc biệt: ${params.additionalInstructions}

⚡ QUAN TRỌNG: Mỗi bài tập cơ bản phải có hướng dẫn chi tiết 12-18 câu`;
            
        } else if (instruction.includes('khá') || instruction.includes('vừa') || instruction.includes('tb')) {
            prompt += `\n\n🎯 CÁ NHÂN HÓA CHO HỌC SINH KHÁ - TĂNG TIẾT CÂN BẰNG:
- Tạo ít nhất 25 bài tập MỨC ĐỘ VỪA với thách thức phù hợp
- Kết hợp bài tập CƠ BẢN (40%) và NÂNG CAO (60%) một cách hài hòa
- Hoạt động THỰC HÀNH có hướng dẫn nhưng khuyến khích TỰ LẬP
- Bài tập ÁP DỤNG kiến thức vào tình huống THỰC TẾ (ít nhất 15 situations)
- Hoạt động nhóm với PHÂN CÔNG NHIỆM VỤ rõ ràng (ít nhất 6 group activities)
- Thêm bài tập TỰ ĐÁNH GIÁ và PEER ASSESSMENT với criteria
- Problem-solving activities với guided discovery
- Extension activities cho học sinh hoàn thành sớm
- Yêu cầu đặc biệt: ${params.additionalInstructions}

⚡ QUAN TRỌNG: Mỗi bài tập phải có hướng dẫn chi tiết 8-12 câu`;
            
        } else {
            // Generic special requirements
            prompt += `\n\n🎯 YÊU CẦU ĐẶC BIỆT CHO GIÁO ÁN TĂNG TIẾT:
${params.additionalInstructions}

- Tạo ít nhất 25 bài tập đa dạng phù hợp với yêu cầu
- Mỗi bài tập có hướng dẫn chi tiết 10-15 câu
- Điều chỉnh nội dung và độ khó phù hợp với yêu cầu trên`;
        }
    } else {
        // Default cho học sinh trung bình khi không có yêu cầu đặc biệt
        prompt += `\n\n🎯 MỨC ĐỘ CHUẨN CHO HỌC SINH TRUNG BÌNH - TĂNG TIẾT:
- Tạo ít nhất 25 bài tập kết hợp hoạt động cơ bản và nâng cao
- Hướng dẫn chi tiết cho mỗi bước (10-15 câu mỗi bài tập)
- Bài tập đa dạng: cá nhân, cặp đôi, nhóm với instructions đầy đủ`;
    }

    prompt += `\n\n⚠️⚠️⚠️ LƯU Ý CỰC KỲ QUAN TRỌNG ⚠️⚠️⚠️: 
1. Đây là GIÁO ÁN TĂNG TIẾT nên phải có độ sâu và chi tiết GẤP ĐÔI giáo án chính thức
2. TUYỆT ĐỐI PHẢI đạt ít nhất 15.000 ký tự - đây là yêu cầu BẮT BUỘC
3. Nếu nội dung chưa đủ dài, hãy thêm:
   - Thêm bài tập practice chi tiết hơn
   - Mở rộng phần Anticipated Difficulties
   - Chi tiết hóa script giáo viên cho mỗi activity
   - Thêm assessment criteria và rubrics
   - Bổ sung homework assignments cụ thể
4. Mỗi phần trong giáo án phải được mô tả CỰC KỲ CHI TIẾT
5. Tạo giáo án phong phú, đầy đủ để đạt CHÍNH XÁC ít nhất 15.000 ký tự`;
    
    return prompt;
  }

  /**
   * 🔥 BUILD RAG QUERY - OPTIMIZED: Copy Main success pattern
   * OLD: "Unit 2 lớp 6 reading writing listening speaking tiết tăng cường bài tập" (12+ từ)
   * NEW: Copy Main pattern but adapt for supplementary (5-7 từ)
   */
  buildRAGQuery(params) {
    // 🎯 PRIORITY SKILLS: vocabulary > grammar > pronunciation > others (theo yêu cầu user)
    const skillPriority = {
      'vocabulary': 1,
      'grammar': 2, 
      'pronunciation': 3,
      'reading': 4,
      'writing': 5,
      'listening': 6,
      'speaking': 7
    };
    
    // Sort skills theo priority và lấy top 2
    const prioritizedSkills = params.selectedSkills
      ?.sort((a, b) => (skillPriority[a] || 10) - (skillPriority[b] || 10))
      ?.slice(0, 2) || ['vocabulary'];
    
    const skillMap = {
      'vocabulary': 'từ vựng',
      'grammar': 'ngữ pháp', 
      'pronunciation': 'phát âm',
      'reading': 'đọc',
      'writing': 'viết',
      'listening': 'nghe',
      'speaking': 'nói'
    };
    
    const skillText = prioritizedSkills
      .map(skill => skillMap[skill] || skill)
      .join(' ');
    
    // ✅ ENHANCED: Include unit name in RAG query for better context
    let unitContext = `Unit ${params.unit}`;
    if (params.unit) {
        const unitName = this.getUnitName(parseInt(params.unit));
        if (unitName) {
            unitContext += ` ${unitName}`;
        }
    }
    
    // 🎯 ENHANCED Query: Include unit name for better AI context
    const enhancedQuery = `${unitContext} lớp ${params.grade} ${skillText} tăng tiết`;
    console.log(`✅ Enhanced supplementary RAG query: ${enhancedQuery}`);
    
    return enhancedQuery;
  }

  /**
   * Build messages for API - COPIED from main lesson
   */
  buildMessages(prompt, params) {
    const languageInstruction = this.getLanguageInstruction();
    
    return [
      {
        role: "system",
        content: `${prompt}\n\n${languageInstruction}`
      },
      {
        role: "user", 
        content: `Hãy soạn giáo án tăng tiết chi tiết cho các kỹ năng đã chọn với thông tin đã cung cấp.`
      }
    ];
  }

  /**
   * Get language instruction - COPIED from main lesson
   */
  getLanguageInstruction() {
    const lang = this.parent.selectedLanguage || 'vi';
    
    switch (lang) {
      case 'vi':
        return "Trả lời hoàn toàn bằng tiếng Việt.";
      case 'en':
        return "Respond completely in English.";
      case 'both':
        return "Trả lời song ngữ: mỗi phần có cả tiếng Việt và tiếng Anh (tiếng Anh trong ngoặc).";
      default:
        return "Trả lời hoàn toàn bằng tiếng Việt.";
    }
  }

  /**
   * Display result using proper UI method - REPLACED manual HTML
   */
  displayResult(title, content, lessonType) {
    this.ui.showResult(title, content, lessonType);
  }

  /**
   * Handle errors - COPIED from main lesson
   */
  handleError(error) {
    console.error('❌ Error in supplementary generation:', error);
    alert('Có lỗi xảy ra khi tạo giáo án tăng tiết. Vui lòng thử lại.');
    
    // Set UI state
    if (uiStateManager) {
      uiStateManager.setLoadingState('supplementary', false);
      uiStateManager.setError('supplementaryForm', 'Có lỗi xảy ra khi tạo giáo án tăng tiết');
    }
  }

  /**
   * Build cache key - ENHANCED with personalization
   */
  buildCacheKey(lessonType, params) {
    const lang = this.parent.selectedLanguage || 'vi';
    const skillsKey = params.selectedSkills?.join('_') || 'general';
    
    // ✅ ADD PERSONALIZATION to cache key
    let personalizationKey = 'standard';
    if (params.additionalInstructions) {
      const instruction = params.additionalInstructions.toLowerCase();
      if (instruction.includes('giỏi') || instruction.includes('nâng cao') || instruction.includes('khó')) {
        personalizationKey = 'advanced';
      } else if (instruction.includes('trung bình') || instruction.includes('cơ bản') || instruction.includes('yếu')) {
        personalizationKey = 'basic';
      } else if (instruction.includes('khá') || instruction.includes('vừa') || instruction.includes('tb')) {
        personalizationKey = 'intermediate';
      } else {
        // Use hash of custom instructions for unique cache
        personalizationKey = `custom_${this.hashString(params.additionalInstructions)}`;
      }
    }
    
    return `lesson_${lessonType}_${lang}_unit${params.unit}_${skillsKey}_${personalizationKey}`;
  }

  /**
   * Simple hash function for custom instructions
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  /**
   * Check cache - COPIED from main lesson
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
   * Save to cache - COPIED from main lesson
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
   * Export supplementary to Word - PLACEHOLDER for future implementation
   */
  exportSupplementary() {
    const content = document.querySelector('#supplementary-output .lesson-content');
    if (!content) {
      alert('Không tìm thấy nội dung để xuất');
      return;
    }

    console.log('📄 Exporting Supplementary to Word...');
    // TODO: Implement Word export using parent's export functionality
    if (this.parent && this.parent.exportSupplementary) {
      this.parent.exportSupplementary();
    }
  }
}

// Export for use in main controller
export default SupplementaryController;