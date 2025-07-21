// /static/js/controllers/lesson-plan/extracurricular/extracurricular_ui.js
// Main controller for extracurricular activities - INDEPENDENT from SGK system
// REFERENCE: Pattern from main-lesson-controller.js but simplified for activities

import { processInputCompletely, validateContentSafety } from './extracurricular_validator.js';
import { getCompleteTemplate } from './extracurricular_prompts.js';
import { processOutputCompletely, checkContentLength } from './extracurricular_formatter.js';

/**
 * ExtracurricularController - Handles activity generation independently
 * PURPOSE: Generate 3k-character educational activities without RAG dependency
 * PHILOSOPHY: Simple, focused, educational adaptation of any topic
 */
import ExtracurricularUI from './extracurricular_ui.js';

export class ExtracurricularController {
  
  /**
   * Constructor - Initialize controller
   * REFERENCE: Copy pattern from main-lesson-controller.js constructor line 89
   */
  constructor(parentController, api, ui) {
    this.parent = parentController;
    this.api = api;
    this.ui = new ExtracurricularUI(); // ✅ NEW: dedicated UI
    this.isGenerating = false;
    
    console.log('🎭 ExtracurricularController initialized - Independent system');
  }

  /**
   * Main entry point for activity generation
   * REFERENCE: Adapted from main-lesson-controller.js handleGenerateLessonPlan() line 95
   * SIMPLIFIED: No RAG, no personalization, no complex validation
   */
  async handleGenerateActivity() {
    if (this.isGenerating) {
      console.warn('⚠️ Activity generation already in progress');
      return;
    }

    this.isGenerating = true;
    let response = null;

    try {
      console.log('🎭 ExtracurricularController: Starting activity generation...');

      // Step 1: Collect and validate form parameters
      const rawParams = this.collectFormParameters();
      if (!rawParams) {
        throw new Error('Không thể thu thập thông tin từ form');
      }

      // Step 2: Process input completely (validation + adaptation)
      const inputProcessing = processInputCompletely(rawParams);
      if (!inputProcessing.isValid) {
        const errorMessage = inputProcessing.errors.join(', ');
        throw new Error(`Dữ liệu không hợp lệ: ${errorMessage}`);
      }

      const processedParams = inputProcessing.processedParams;
      
      // Step 3: Show warnings if any adaptations were made
      if (inputProcessing.warnings.length > 0) {
        this.showAdaptationWarnings(inputProcessing.warnings);
      }

      // Step 4: Build activity title
      const title = this.buildActivityTitle(processedParams);
      
      // Step 5: Show loading state
      this.ui.showLoading();

      // Step 6: Generate template and messages (NO RAG)
      const template = this.generateActivityTemplate(processedParams);
      const messages = this.buildActivityMessages(template, processedParams);

      // Step 7: Initialize streaming UI
      const streamingElement = this.ui.initActivityStreamingUI(title, processedParams);

      // Step 8: Call API with simple settings (NO RAG)
      response = await this.generateWithSimpleAPI(
        messages,
        processedParams,
        (chunk, fullContent, info) => {
          this.ui.updateActivityContent(chunk, fullContent);
        }
      );

      // Step 9: Process and format output
      if (response && response.content) {
        const processedOutput = processOutputCompletely(
          response.content,
          title,
          processedParams
        );

        // Step 10: Finalize UI with formatted content - USING CORRECT CONTENT STRUCTURE
        this.ui.finalizeActivityDisplay(response.content, processedParams);

        console.log('✅ Extracurricular activity generation completed successfully');
      } else {
        throw new Error('Không nhận được nội dung từ AI');
      }

    } catch (error) {
      console.error('❌ Error in ExtracurricularController:', error);
      this.handleError(error);
    } finally {
      this.ui.hideLoading();
      this.isGenerating = false;
      
      // Ensure content visibility
      if (response && response.content) {
        this.ensureContentVisibility('extracurricular');
      }
    }
  }

  /**
   * Collect form parameters from extracurricular form
   * REFERENCE: New logic specific to extracurricular form structure
   */
  collectFormParameters() {
    console.log('📋 Collecting extracurricular form parameters');

    try {
      // Get form elements (specific to extracurricular form)
      const gradeSelect = document.getElementById('grade-select-extra');
      const topicInput = document.getElementById('topic-input-extra');
      const durationInput = document.getElementById('duration-input-extra');
      const additionalInput = document.getElementById('additional-instructions-extra');

      // Validate required fields
      if (!topicInput || !topicInput.value.trim()) {
        alert('Vui lòng nhập chủ đề hoạt động');
        return null;
      }

      // Build parameters object
      const params = {
        topic: topicInput.value.trim(),
        grade: gradeSelect?.value || '6',
        duration: durationInput?.value || '45',
        additionalRequirements: additionalInput?.value || '',
        lessonType: 'extracurricular',
        isExtracurricular: true,
        preparingDate: new Date().toLocaleDateString('vi-VN'),
        teachingDate: ''
      };

      console.log('✅ Form parameters collected:', params);
      return params;

    } catch (error) {
      console.error('❌ Error collecting form parameters:', error);
      return null;
    }
  }

  /**
   * Build activity title
   * REFERENCE: Adapted from main-lesson-controller.js buildLessonTitle() line 292
   */
  buildActivityTitle(params) {
    const adaptedTopic = params.adaptedTopic || params.topic;
    const title = `Hoạt động ngoại khóa: ${adaptedTopic} - Lớp ${params.grade}`;
    
    console.log(`🏷️ Activity title: ${title}`);
    return title;
  }

  /**
   * Generate activity template
   * REFERENCE: Integration with extracurricular_prompts.js
   */
  generateActivityTemplate(params) {
    console.log('📝 Generating activity template');

    try {
      const template = getCompleteTemplate(
        params.adaptedTopic || params.topic,
        params.additionalRequirements,
        params
      );

      console.log(`✅ Template generated for type: ${params.activityType}`);
      return template;

    } catch (error) {
      console.error('❌ Error generating template:', error);
      // Return safe fallback template
      return this.getSafeQuoteFallbackTemplate(params);
    }
  }

  /**
   * Build messages for AI generation
   * REFERENCE: Simplified from main-lesson-controller.js buildMessages() line 678
   */
  buildActivityMessages(template, params) {
    console.log('💬 Building activity messages for AI');

    const languageInstruction = this.getLanguageInstruction();
    
    const messages = [
      {
        role: "system",
        content: `${template}\n\n${languageInstruction}`
      },
      {
        role: "user",
        content: `Hãy tạo kế hoạch hoạt động ngoại khóa chi tiết cho chủ đề "${params.adaptedTopic || params.topic}" với thời gian ${params.duration} phút cho học sinh lớp ${params.grade}.`
      }
    ];

    console.log('✅ Messages built for AI generation');
    return messages;
  }

  /**
   * Get language instruction
   * REFERENCE: Copy from main-lesson-controller.js getLanguageInstruction() line 697
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
   * Generate with simple API settings (NO RAG)
   * REFERENCE: New API logic optimized for activities
   */
  async generateWithSimpleAPI(messages, params, streamCallback) {
    console.log('🔌 Calling API with simple settings (NO RAG)');

    try {
      // Activity-optimized API settings
      const apiOptions = {
        useRAG: false,                    // NO RAG for activities
        lessonType: 'extracurricular',
        ragQuery: '',                     // No RAG query needed
        maxTokens: 22000,                  // Reduced for 3k target (vs 16000 for SGK)
        temperature: 0.7,                 // Slightly higher for creativity
        requireDetailedContent: false     // Not as strict as SGK lessons
      };

      console.log('🔧 API settings:', apiOptions);

      // Call API through parent
      const response = await this.api.generateLessonPlan(
        messages,
        streamCallback,
        apiOptions
      );

      return response;

    } catch (error) {
      console.error('❌ Error in API call:', error);
      throw error;
    }
  }

  /**
   * Show adaptation warnings to user
   * REFERENCE: New user feedback system
   */
  showAdaptationWarnings(warnings) {
    console.log('⚠️ Showing adaptation warnings:', warnings);

    const warningContainer = document.createElement('div');
    warningContainer.className = 'adaptation-warnings';
    warningContainer.innerHTML = `
      <div class="warning-box">
        <i class="fas fa-info-circle"></i>
        <div class="warning-content">
          <h4>Thông báo điều chỉnh:</h4>
          <ul>
            ${warnings.map(warning => `<li>${warning}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    // Insert before output area
    const outputArea = document.getElementById('extracurricular-output');
    if (outputArea && outputArea.parentNode) {
      outputArea.parentNode.insertBefore(warningContainer, outputArea);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (warningContainer.parentNode) {
          warningContainer.parentNode.removeChild(warningContainer);
        }
      }, 10000);
    }
  }

  /**
   * Finalize activity display
   * REFERENCE: Simplified from lesson-plan-ui.js finalizeStreamingContent()
   */
  finalizeActivityDisplay(streamingElement, processedOutput) {
    console.log('🎨 Finalizing activity display');

    try {
      // Replace streaming content with formatted output
      streamingElement.innerHTML = processedOutput.formattedContent;

      // Add quality indicator
      this.addQualityIndicator(streamingElement, processedOutput);

      // Attach event listeners for action buttons
      this.attachActionListeners(streamingElement);

      console.log(`✅ Activity display finalized (quality: ${processedOutput.qualityScore || 'unknown'})`);

    } catch (error) {
      console.error('❌ Error finalizing display:', error);
      // Fallback to basic display
      streamingElement.innerHTML = `
        <div class="activity-card">
          <div class="card-content">
            ${processedOutput.rawContent || processedOutput.formattedContent}
          </div>
        </div>
      `;
    }
  }

  /**
   * Add quality indicator to output
   * REFERENCE: New quality feedback system
   */
  addQualityIndicator(element, processedOutput) {
    if (!processedOutput.qualityScore) return;

    const qualityBadge = document.createElement('div');
    qualityBadge.className = 'quality-indicator';
    
    let qualityLevel = 'good';
    let qualityText = 'Chất lượng tốt';
    
    if (processedOutput.qualityScore >= 90) {
      qualityLevel = 'excellent';
      qualityText = 'Chất lượng xuất sắc';
    } else if (processedOutput.qualityScore >= 70) {
      qualityLevel = 'good';
      qualityText = 'Chất lượng tốt';
    } else {
      qualityLevel = 'fair';
      qualityText = 'Chất lượng ổn';
    }

    qualityBadge.innerHTML = `
      <div class="quality-badge ${qualityLevel}">
        <i class="fas fa-star"></i>
        ${qualityText} (${processedOutput.qualityScore}/100)
      </div>
    `;

    // Insert at top of card
    const cardHeader = element.querySelector('.card-header');
    if (cardHeader) {
      cardHeader.appendChild(qualityBadge);
    }
  }

  /**
   * Attach event listeners for action buttons
   * REFERENCE: New event handling for activity-specific actions
   */
  attachActionListeners(element) {
    console.log('🔗 Attaching action listeners');

    // Export to Word button
    const exportBtn = element.querySelector('.export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', (e) => {
        this.handleExportActivity(e.target);
      });
    }

    // Save activity button
    const saveBtn = element.querySelector('.save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        this.handleSaveActivity(e.target);
      });
    }

    // Share button
    const shareBtn = element.querySelector('.share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        this.handleShareActivity(e.target);
      });
    }

    // Feedback button
    const feedbackBtn = element.querySelector('.feedback-btn');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', (e) => {
        this.handleActivityFeedback(e.target);
      });
    }
  }

  /**
   * Handle export activity to Word
   * REFERENCE: Adapted from existing export functionality
   */
  handleExportActivity(button) {
    console.log('📄 Exporting activity to Word');

    try {
      const activityCard = button.closest('.activity-card');
      const content = activityCard.querySelector('.activity-content').innerText;
      const title = activityCard.querySelector('.card-title').innerText;

      // Use existing export functionality if available
      if (this.ui && this.ui.exportToWord) {
        this.ui.exportToWord(activityCard, content, title);
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(content).then(() => {
          alert('Nội dung đã được sao chép vào clipboard');
        });
      }

    } catch (error) {
      console.error('❌ Error exporting activity:', error);
      alert('Có lỗi khi xuất file. Vui lòng thử lại.');
    }
  }

  /**
   * Handle save activity
   * REFERENCE: Activity-specific save logic
   */
  handleSaveActivity(button) {
    console.log('💾 Saving activity');

    try {
      const activityCard = button.closest('.activity-card');
      const content = activityCard.querySelector('.activity-content').innerText;
      const title = activityCard.querySelector('.card-title').innerText;

      // Save to local storage
      const savedActivities = JSON.parse(localStorage.getItem('bibi_saved_activities') || '[]');
      const newActivity = {
        id: Date.now().toString(),
        title: title,
        content: content,
        type: 'extracurricular',
        createdAt: new Date().toISOString()
      };

      savedActivities.unshift(newActivity);
      
      // Keep only latest 10 activities
      if (savedActivities.length > 10) {
        savedActivities.splice(10);
      }

      localStorage.setItem('bibi_saved_activities', JSON.stringify(savedActivities));
      
      // Visual feedback
      button.innerHTML = '<i class="fas fa-check"></i> Đã lưu';
      button.style.backgroundColor = '#28a745';
      
      setTimeout(() => {
        button.innerHTML = '<i class="fas fa-save"></i> Lưu hoạt động';
        button.style.backgroundColor = '';
      }, 2000);

    } catch (error) {
      console.error('❌ Error saving activity:', error);
      alert('Có lỗi khi lưu hoạt động. Vui lòng thử lại.');
    }
  }

  /**
   * Handle share activity
   * REFERENCE: New sharing functionality
   */
  handleShareActivity(button) {
    console.log('📤 Sharing activity');

    const activityCard = button.closest('.activity-card');
    const title = activityCard.querySelector('.card-title').innerText;
    const shareText = `Hoạt động ngoại khóa: ${title}\n\nTạo bởi BiBi AI Assistant`;

    if (navigator.share) {
      navigator.share({
        title: title,
        text: shareText,
        url: window.location.href
      });
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Thông tin hoạt động đã được sao chép');
      });
    }
  }

  /**
   * Handle activity feedback
   * REFERENCE: Integration with feedback system
   */
  handleActivityFeedback(button) {
    console.log('💬 Submitting activity feedback');

    const activityCard = button.closest('.activity-card');
    const title = activityCard.querySelector('.card-title').innerText;

    // Use existing feedback system if available
    if (window.feedbackManager) {
      window.feedbackManager.showFeedbackModal({
        type: 'extracurricular',
        title: title,
        category: 'activity_generation'
      });
    } else {
      alert('Hệ thống phản hồi hiện không khả dụng');
    }
  }

  /**
   * Ensure content visibility
   * REFERENCE: Copy from main-lesson-controller.js ensureContentVisibility() line 236
   */
  ensureContentVisibility(tabName) {
    try {
      const outputArea = document.getElementById(`${tabName}-output`);
      
      if (outputArea) {
        const contentLength = outputArea.innerHTML.length;
        
        if (contentLength > 1000) {
          outputArea.style.display = 'block';
          outputArea.style.visibility = 'visible';
          
          const tabContent = document.getElementById(`${tabName}-content`);
          if (tabContent) {
            tabContent.style.display = 'block';
            tabContent.classList.add('active');
          }
          
          // Auto-scroll to content
          setTimeout(() => {
            outputArea.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }, 300);
          
          console.log(`✅ Content visibility ensured for ${tabName} (${contentLength} chars)`);
        }
      }
    } catch (error) {
      console.error('❌ Error ensuring content visibility:', error);
    }
  }

  /**
   * Handle errors in activity generation
   * REFERENCE: Simplified from main-lesson-controller.js handleError() line 343
   */
  handleError(error) {
    console.error('❌ Error in extracurricular generation:', error);
    
    let userMessage = 'Có lỗi xảy ra khi tạo hoạt động ngoại khóa. ';
    
    if (error.message.includes('không hợp lệ')) {
      userMessage += 'Vui lòng kiểm tra lại thông tin đã nhập.';
    } else if (error.message.includes('API')) {
      userMessage += 'Vui lòng thử lại sau ít phút.';
    } else {
      userMessage += 'Vui lòng thử lại hoặc liên hệ hỗ trợ.';
    }
    
    alert(userMessage);
  }

  /**
   * Safe fallback template
   * REFERENCE: Emergency template when main system fails
   */
  getSafeFallbackTemplate(params) {
    return `Bạn là chuyên gia tổ chức hoạt động giáo dục cho học sinh THCS.

Hãy tạo kế hoạch hoạt động ngoại khóa cho:

HOẠT ĐỘNG: ${params.adaptedTopic || params.topic}
ĐỐI TƯỢNG: Học sinh lớp ${params.grade}
THỜI GIAN: ${params.duration} phút

Tạo kế hoạch gồm:
1. MỤC TIÊU hoạt động
2. CHUẨN BỊ cần thiết
3. TIẾN TRÌNH thực hiện chi tiết
4. TỪ VỰNG tiếng Anh hữu ích
5. ĐÁNH GIÁ kết quả

YÊU CẦU: Hoạt động phù hợp với môi trường trường học, an toàn, tích cực.
TARGET: Khoảng 3,000 ký tự.

${params.additionalRequirements || ''}`;
  }
}

// Export for use in main system
export default ExtracurricularController;