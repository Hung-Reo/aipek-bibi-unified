// /static/js/controllers/lesson-plan/controllers/main-lesson-controller.js
// EXTRACTED FROM lesson-plan-main.js (lines 2338-3505) - MainLessonController
// This module handles main lesson generation logic - ENHANCED với Personalization

// Import dependencies
import { LessonPlanAPI } from '../lesson-plan-api.js';
import { validateMainLessonForm } from '../core/validation.js';
import { lessonAPIService } from '../services/lesson-api-service.js';
import { uiStateManager } from '../ui/ui-state-manager.js';

/**
 * MainLessonController - Handles main lesson generation
 * ENHANCED with personalization logic copied from supplementary-controller.js
 */
export class MainLessonController {
  constructor(parentController, api, ui) {
    this.parent = parentController; // Reference to main LessonPlanController
    this.api = api || new LessonPlanAPI();
    this.ui = ui;
    
    console.log('🎯 MainLessonController initialized');
  }

  /* Main lesson generation handler */
  async handleGenerateLessonPlan() {
    let response = null; // Store response for finally block
    
    try {
      console.log("🎯 MainLessonController: Bắt đầu tạo giáo án...");
  
      // ✅ FIX: Access through UIController
      const currentTab = this.parent.uiController ? 
        this.parent.uiController.getCurrentActiveTab() : 'main';
        
        if (currentTab === 'review') {
          console.log("Phát hiện chọn Review, delegate to ReviewManager...");
          if (window.reviewManager) {
            await window.reviewManager.generateReview();
            return;
          } else {
            console.error('❌ ReviewManager not found');
            alert('Có lỗi xảy ra với Review system');
            return;
          }
        }
        
        // ✅ NEW: Handle extracurricular tab
        if (currentTab === 'extracurricular') {
          console.log("🎭 Phát hiện chọn Extracurricular, processing...");
          // Continue with normal flow but với extracurricular-specific logic
          // Không return ở đây để tiếp tục xử lý bằng existing generation flow
        }
        
        // ✅ FIX: Ensure parent methods exist
        if (!this.parent.getFormParams) {
          throw new Error('getFormParams method not available in parent');
        }
      
      const params = this.parent.getFormParams(currentTab);
      if (!params) {
        console.error("DEBUG: getFormParams() trả về null");
        alert('Vui lòng điền đầy đủ thông tin để tạo giáo án.');
        return;
      }

      // ✅ QUICK FIX: Force read additional instructions field
      const additionalField = document.getElementById('additional-instructions');
      if (additionalField && additionalField.value.trim()) {
        params.additionalInstructions = additionalField.value.trim();
        console.log('🔍 FORCE READ additionalInstructions:', params.additionalInstructions);
      } else {
        console.log('🔍 DEBUG: No additional instructions found');
      }

      // Step 3: Build title và prepare data
      const title = this.buildLessonTitle(params);
      this.parent.currentLessonType = currentTab;
      
      // Step 4: Check cache trước khi generate
      const cacheKey = this.buildCacheKey(currentTab, params);
      const cachedContent = await this.checkCache(cacheKey);
      
      if (cachedContent) {
        console.log('📦 Sử dụng nội dung từ cache');
        this.displayResult(title, cachedContent, currentTab);
        // ✅ Ensure content visibility for cached content
        this.ensureContentVisibility(currentTab);
        return;
      }
      
      // Step 5: Show loading state
      this.ui.showLoading();
      
      // Step 6: Prepare prompt với ENHANCED personalization
      const prompt = await this.parent.preparePrompt(currentTab, params);
      const enhancedPrompt = this.enhancePromptWithPersonalization(prompt, params);
      const messages = this.buildMessages(enhancedPrompt, params);
      
      // Step 7: Build RAG query nếu cần
      const ragQuery = this.parent.buildRAGQuery(currentTab, params);
      console.log("🔍 RAG Query:", ragQuery);
      
      // Step 8: Khởi tạo streaming UI
      const streamingElement = this.ui.initStreamingUI(title, currentTab);
      
      // Step 9: Gọi API với streaming
      response = await this.api.generateLessonPlan(
        messages,
        (chunk, fullContent, ragInfo) => {
          // Update UI realtime khi nhận data
          this.ui.updateStreamingContent(streamingElement, chunk, fullContent, ragInfo);
        },
        {
          useRAG: true,
          lessonType: currentTab,
          ragQuery: ragQuery,
          maxTokens: 22000,
          temperature: 0.8,
          requireDetailedContent: true,
          // ✅ NEW: Add personalization level for API optimization
          personalizationLevel: this.detectPersonalizationLevel(params.additionalInstructions)
        }
      );
      
      // Step 10: Xử lý response
      if (response && response.content) {
        const fullContent = response.content;
        const ragInfo = response.ragInfo;
        
        // Finalize UI
        this.ui.finalizeStreamingContent(streamingElement, fullContent, ragInfo);
        
        // Save to cache với personalization trong key
        await this.saveToCache(cacheKey, fullContent);
        
        // Save to localStorage cho combine lessons
        if (currentTab === 'main' && params.selectedLesson) {
          this.saveForCombining(params, fullContent);
        }
        
        console.log("✅ Đã hoàn thành tạo giáo án");
      } else {
        throw new Error('Không nhận được nội dung từ API');
      }
      
    } catch (error) {
      console.error('❌ Lỗi trong MainLessonController.handleGenerateLessonPlan:', error);
      this.handleError(error);
    } finally {
      // Always hide loading
      this.ui.hideLoading();
      
      // ✅ FIXED: Simple and safe UI restoration
      if (response && response.content) {
        const currentTab = this.parent.currentLessonType;
        this.ensureContentVisibility(currentTab);
        console.log('✅ UI restoration completed - content visible');
      } else {
        console.log('✅ No content to restore');
      }
    }
  }

  /**
   * ✅ NEW METHOD: Detect personalization level for API optimization
   * COPIED from supplementary-controller.js lines 178-190
   * REASON: Cần detect level để optimize API calls và caching
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
   * ✅ NEW METHOD: Enhance prompt with personalization logic
   * COPIED & ADAPTED from supplementary-controller.js buildSupplementaryPrompt() lines 195-350
   * REASON: Main lesson cần same personalization như supplementary để consistency
   */
  enhancePromptWithPersonalization(basePrompt, params) {
    console.log('🔍 DEBUG: enhancePromptWithPersonalization called');
    console.log('🔍 DEBUG: params.additionalInstructions:', params.additionalInstructions);
    
    if (!params.additionalInstructions) {
      console.log('🔍 DEBUG: No additionalInstructions, returning base prompt');
      return basePrompt;
    }

    console.log('🔍 DEBUG: Processing personalization for:', params.additionalInstructions);
    const instruction = params.additionalInstructions.toLowerCase();
    let personalizationSection = '';

    if (instruction.includes('giỏi') || instruction.includes('nâng cao') || instruction.includes('khó')) {
      console.log('🎯 APPLYING: Personalization for advanced students');
      personalizationSection = `

🎯 CÁ NHÂN HÓA CHO HỌC SINH GIỎI - GIÁO ÁN CHUYÊN SÂU:
- Tăng độ phức tạp của tất cả hoạt động lên mức NÂNG CAO
- Thêm ít nhất 20 bài tập CHALLENGING với độ khó cao
- Bổ sung hoạt động PHÂN TÍCH SÂU và TƯ DUY PHẢN BIỆN:
  + Critical thinking exercises với step-by-step analysis
  + Problem-solving activities requiring creativity
  + Advanced vocabulary usage (idioms, collocations)
  + Complex grammar structures beyond basic level
- Thêm EXTENSION ACTIVITIES cho học sinh hoàn thành sớm:
  + Research tasks related to lesson topic
  + Peer teaching opportunities
  + Creative presentation assignments
- Hoạt động nhóm với vai trò LEADERSHIP:
  + Group project management
  + Peer assessment and feedback
  + Debate and discussion facilitation
- Assessment criteria NÂNG CAO:
  + Higher-order thinking skills evaluation
  + Creativity and originality assessment
  + Independent learning capabilities

Yêu cầu đặc biệt: ${params.additionalInstructions}

⚡ QUAN TRỌNG: Mỗi hoạt động nâng cao phải có hướng dẫn chi tiết 15-20 câu`;

    } else if (instruction.includes('trung bình') || instruction.includes('cơ bản') || instruction.includes('yếu')) {
      console.log('🎯 APPLYING: Personalization for basic students');
      personalizationSection = `

🎯 CÁ NHÂN HÓA CHO HỌC SINH CƠ BẢN - GIÁO ÁN HỖ TRỢ:
- Đơn giản hóa tất cả hoạt động với hướng dẫn từng bước CỰC KỲ RÕ RÀNG
- Thêm ít nhất 25 bài tập CƠ BẢN với scaffolding support:
  + Guided practice với teacher modeling
  + Peer support activities (pair work)
  + Multiple examples trước khi independent practice
  + Visual aids và graphic organizers
- Bổ sung CONFIDENCE-BUILDING activities:
  + Success-oriented tasks với immediate positive feedback
  + Repetition và drilling exercises
  + Simple role-play với structured dialogues
  + Games và interactive activities để tăng motivation
- Hỗ trợ đặc biệt:
  + Slower pacing với frequent checks for understanding
  + Simplified vocabulary và basic sentence structures
  + Extra time for processing và completion
  + Alternative assessment methods (visual, oral)
- Differentiated instruction:
  + Multiple learning pathways
  + Flexible grouping strategies
  + Individual support during activities

Yêu cầu đặc biệt: ${params.additionalInstructions}

⚡ QUAN TRỌNG: Mỗi bài tập cơ bản phải có hướng dẫn chi tiết 12-15 câu`;

    } else if (instruction.includes('khá') || instruction.includes('vừa') || instruction.includes('tb')) {
      console.log('🎯 APPLYING: Personalization for intermediate students');
      personalizationSection = `

🎯 CÁ NHÂN HÓA CHO HỌC SINH TRUNG BÌNH KHÁ - GIÁO ÁN CÂN BẰNG:
- Kết hợp hoạt động CƠ BẢN (40%) và NÂNG CAO (60%) một cách hài hòa
- Tạo ít nhất 22 bài tập đa dạng với độ khó tăng dần:
  + Warm-up exercises (basic level)
  + Core practice activities (intermediate level)
  + Challenge tasks (advanced level)
  + Application activities (real-world contexts)
- Hoạt động THỰC HÀNH có guided support nhưng khuyến khích independence:
  + Semi-controlled practice với gradual release
  + Collaborative learning opportunities
  + Self-assessment và reflection activities
  + Peer feedback và correction
- Bài tập ÁP DỤNG kiến thức vào tình huống thực tế:
  + Role-play scenarios related to daily life
  + Project-based learning tasks
  + Community connections
  + Technology integration
- Flexible assessment approaches:
  + Multiple choice + open-ended questions
  + Performance-based assessment
  + Portfolio development

Yêu cầu đặc biệt: ${params.additionalInstructions}

⚡ QUAN TRỌNG: Mỗi bài tập phải có hướng dẫn chi tiết 10-12 câu`;

    } else {
      // Generic special requirements
      console.log('🎯 APPLYING: Custom personalization requirements');
      personalizationSection = `

🎯 YÊU CẦU ĐẶC BIỆT CHO GIÁO ÁN CHÍNH:
${params.additionalInstructions}

- Điều chỉnh nội dung và phương pháp dạy học phù hợp với yêu cầu trên
- Tạo ít nhất 20 hoạt động đa dạng phù hợp với đặc thù học sinh
- Mỗi hoạt động có hướng dẫn chi tiết 10-15 câu
- Bổ sung assessment criteria phù hợp với yêu cầu đặc biệt`;
    }

    // ✅ IMPORTANT: Add personalization BEFORE the final requirements
    const finalPrompt = basePrompt + personalizationSection + `

⚠️⚠️⚠️ LƯU Ý CỰC KỲ QUAN TRỌNG CHO GIÁO ÁN CHÍNH ⚠️⚠️⚠️: 
1. Đây là GIÁO ÁN CHÍNH 45 PHÚT nên phải CỰC KỲ CHI TIẾT và HOÀN CHỈNH
2. TUYỆT ĐỐI PHẢI đạt ít nhất 15.000 ký tự - đây là yêu cầu BẮT BUỘC
3. Áp dụng ĐÚNG cá nhân hóa theo yêu cầu đặc biệt đã nêu ở trên
4. Mỗi phần trong giáo án phải được mô tả CỰC KỲ CHI TIẾT
5. Tạo giáo án phong phú, đầy đủ để đạt CHÍNH XÁC ít nhất 15.000 ký tự`;

    console.log('✅ DEBUG: Prompt enhanced with personalization successfully');
    return finalPrompt;
  }

  /**
   * ✅ NEW: Simple and safe method to ensure content visibility
   * This replaces the problematic "Skipped UI restoration"
   */
  ensureContentVisibility(tabName) {
    try {
      const outputArea = document.getElementById(`${tabName}-output`);
      
      if (outputArea) {
        // Check if content exists and is substantial
        const contentLength = outputArea.innerHTML.length;
        
        if (contentLength > 1000) {
          // Ensure output area is visible
          outputArea.style.display = 'block';
          outputArea.style.visibility = 'visible';
          
          // Ensure parent tab content is active
          const tabContent = document.getElementById(`${tabName}-content`);
          if (tabContent) {
            tabContent.style.display = 'block';
            tabContent.classList.add('active');
          }
          
          // ✅ AUTO-SCROLL to content (fixes viewport positioning issue)
          setTimeout(() => {
            outputArea.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }, 300);
          
          console.log(`✅ Content visibility ensured for ${tabName} (${contentLength} chars)`);
        } else {
          console.warn(`⚠️ Content too short for ${tabName} (${contentLength} chars)`);
        }
      } else {
        console.error(`❌ Output area not found: ${tabName}-output`);
      }
    } catch (error) {
      console.error('❌ Error ensuring content visibility:', error);
    }
  }

  /* EXTRACTED from handleGenerateLessonPlan */
  buildLessonTitle(params) {
    let title = '';
    
    if (params.isReview || this.parent.currentLessonType === 'review') {
      // FIXED: Review title generation
      title = `Review ${params.reviewNumber || 1} - ${params.skillsText || 'Ôn tập'} - Lớp ${params.grade}`;
    } else if (this.parent.currentLessonType === 'main') {
      if (params.selectedLesson === 'getting-started') {
        title = `Getting Started - Unit ${params.unitNumber} - Lớp ${params.grade}`;
      } else if (params.selectedLesson === 'closer-look-1') {
        title = `A closer look 1 - Unit ${params.unitNumber} - Lớp ${params.grade}`;
      } else if (params.selectedLesson === 'closer-look-2') {
        title = `A closer look 2 - Unit ${params.unitNumber} - Lớp ${params.grade}`;
      } else if (params.selectedLesson === 'communication') {
        title = `Communication - Unit ${params.unitNumber} - Lớp ${params.grade}`;
      } else if (params.selectedLesson === 'skills-1') {
        title = `Skills 1 - Unit ${params.unitNumber} - Lớp ${params.grade}`;
      } else if (params.selectedLesson === 'skills-2') {
        title = `Skills 2 - Unit ${params.unitNumber} - Lớp ${params.grade}`;
      } else if (params.selectedLesson === 'looking-back') {
        title = `Looking back & Project - Unit ${params.unitNumber} - Lớp ${params.grade}`;
      } else {
        title = `Giáo án Unit ${params.unitNumber} - Lớp ${params.grade}`;
      }
    } else if (this.parent.currentLessonType === 'supplementary') {
      title = `Giáo án tăng tiết ${params.topic || ''} - Unit ${params.unitNumber} - Lớp ${params.grade}`;
    } else if (this.parent.currentLessonType === 'extracurricular') {
      title = `Hoạt động ngoại khóa ${params.topic || ''} - Lớp ${params.grade}`;
    } else {
      title = `Giáo án ${params.title || ''} - Lớp ${params.grade}`;
    }
    
    return title;
  }

  /**
   * Handle errors in lesson generation
   */
  handleError(error) {
    console.error('❌ Error in main lesson generation:', error);
    alert('Có lỗi xảy ra khi tạo giáo án. Vui lòng thử lại.');
    
    // Set UI state
    if (uiStateManager) {
      uiStateManager.setLoadingState('main', false);
      uiStateManager.setError('mainForm', 'Có lỗi xảy ra khi tạo giáo án');
    }
  }

  /**
   * Save lesson plan
   * EXTRACTED helper method
   */
  async saveLessonPlan(title, content) {
    try {
      const lessonPlan = {
        id: Date.now().toString(),
        title: title,
        content: content,
        lessonType: this.parent.currentLessonType,
        createdAt: new Date().toISOString(),
        grade: this.extractGradeFromContent(content)
      };

      // Lưu vào localStorage
      const savedPlans = JSON.parse(localStorage.getItem('bibi_saved_lesson_plans') || '[]');
      savedPlans.unshift(lessonPlan);
      
      // Giới hạn 50 giáo án gần nhất
      if (savedPlans.length > 50) {
        savedPlans.splice(50);
      }
      
      localStorage.setItem('bibi_saved_lesson_plans', JSON.stringify(savedPlans));
      
      console.log(`✅ Đã lưu giáo án: ${title}`);
      
      // Hiển thị thông báo thành công
      if (uiStateManager) {
        uiStateManager.addNotification({
          type: 'success',
          message: 'Giáo án đã được lưu thành công!',
          timeout: 3000
        });
      }
      
    } catch (error) {
      console.error('Lỗi khi lưu giáo án:', error);
      alert('Có lỗi khi lưu giáo án. Vui lòng thử lại sau.');
    }
  }

  /**
   * Extract grade from content for metadata
   */
  extractGradeFromContent(content) {
    const gradeMatch = content.match(/lớp\s*(\d+)/i);
    return gradeMatch ? gradeMatch[1] : '6';
  }

  /**
   * Load lesson plan by ID
   */
  loadLessonPlan(id) {
    try {
      // Lấy giáo án từ API
      const lessonPlan = this.api.getLessonPlanById(id);
      
      if (!lessonPlan) {
        alert('Không tìm thấy giáo án.');
        return;
      }
      
      // Chuyển tab
      this.parent.switchLessonType(lessonPlan.lessonType);
      
      // Hiển thị giáo án
      const title = lessonPlan.title || 'Giáo án đã lưu';
      this.ui.showResult(title, lessonPlan.content, lessonPlan.lessonType);
      
      // ✅ Ensure content visibility
      this.ensureContentVisibility(lessonPlan.lessonType);
      
      // Thông báo
      console.log(`✅ Đã tải giáo án: ${title}`);
    } catch (error) {
      console.error('Lỗi khi tải giáo án:', error);
      alert('Có lỗi khi tải giáo án. Vui lòng thử lại sau.');
    }
  }

  /**
   * ✅ ENHANCED: Build cache key với personalization support
   * MODIFIED from original để include personalization level
   * REASON: Cần different cache cho different personalization levels
   */
  buildCacheKey(lessonType, params) {
    const lang = this.parent.selectedLanguage || 'vi';
    let baseKey = `lesson_${lessonType}_${lang}`;
    
    if (lessonType === 'main') {
      baseKey += `_unit${params.unitNumber}_${params.selectedLesson}`;
    } else if (lessonType === 'supplementary') {
      baseKey += `_unit${params.unitNumber}_${params.supplementary_type}`;
    } else if (lessonType === 'extracurricular') {
      // ✅ THÊM: Include topic trong cache key cho extracurricular
      const topicHash = params.topic ? btoa(encodeURIComponent(params.topic)).substring(0, 8) : 'default';
      baseKey += `_topic_${topicHash}`;
      console.log(`🔑 Cache key for extracurricular: ${baseKey}`);
    }
    
    // ✅ NEW: Add personalization to cache key
    if (params.additionalInstructions) {
      const personalizationLevel = this.detectPersonalizationLevel(params.additionalInstructions);
      baseKey += `_${personalizationLevel}`;
      
      // For custom instructions, add hash to make unique
      if (personalizationLevel === 'custom') {
        const hash = this.hashString(params.additionalInstructions);
        baseKey += `_${hash}`;
      }
    }
    
    return baseKey;
  }

  /**
   * ✅ NEW METHOD: Simple hash function for custom instructions
   * COPIED from supplementary-controller.js lines 436-444
   * REASON: Cần hash custom instructions để tạo unique cache keys
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

  // Check cache
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

  // Save to cache
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
   * ✅ MODIFIED: Build messages với enhanced prompt
   * BEFORE: Chỉ add language instruction
   * AFTER: Use enhanced prompt (đã có personalization)
   * REASON: Enhanced prompt đã include personalization rồi, chỉ cần add language
   */
  buildMessages(enhancedPrompt, params) {
    const languageInstruction = this.getLanguageInstruction();
    
    return [
      {
        role: "system",
        content: `${enhancedPrompt}\n\n${languageInstruction}`
      },
      {
        role: "user", 
        content: `Hãy soạn giáo án chi tiết cho tiết ${params.lessonName || ''} với các thông tin đã cung cấp.`
      }
    ];
  }

  // Get language instruction
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

  // Display result
  displayResult(title, content, lessonType) {
    this.ui.showResult(title, content, lessonType);
    // ✅ Ensure content visibility after display
    this.ensureContentVisibility(lessonType);
  }

  // Save for combining lessons
  saveForCombining(params, content) {
    const weekNumber = params.week.replace('Tuần ', '').padStart(2, '0');
    const key = `bibi_lesson_unit${params.unitNumber}_week${weekNumber}_${params.selectedLesson}`;
    
    localStorage.setItem(key, content);
    
    // Update combine button state
    if (this.parent.checkCreatedLessons) {
      this.parent.checkCreatedLessons(params.unitNumber);
    }
  }
}

// Export for use in main controller
export default MainLessonController;