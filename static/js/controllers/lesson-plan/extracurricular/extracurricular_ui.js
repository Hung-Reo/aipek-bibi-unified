// /static/js/controllers/lesson-plan/extracurricular/extracurricular_ui.js

import { FeedbackManager } from '../modules/feedback-manager.js';
/**
 * ExtracurricularUI - Simple display logic for activities
 * REUSES: existing lesson-plan.css styling
 * FOCUS: Fix content display issues, optimized for 3k characters
 */
export class ExtracurricularUI {
  
  constructor() {
    this.outputArea = document.getElementById('extracurricular-output');
    this.isLoading = false;
    this.currentStreamingElement = null;
    
    // ✅ COPY EXACT FEEDBACK SETUP FROM lesson-plan-ui.js lines 19-22
    this.feedbackManager = new FeedbackManager();
    window.feedbackManager = this.feedbackManager;
    
    console.log('🎭 ExtracurricularUI initialized - Using existing CSS');
    
    if (!this.outputArea) {
      console.error('❌ extracurricular-output not found');
    }
  }

  /**
   * Initialize streaming UI - REUSE existing lesson-plan-card structure
   */
  initActivityStreamingUI(title, activityParams = {}) {
    console.log('🎬 Initializing activity streaming:', title);
    
    if (!this.outputArea) {
      console.error('❌ Output area not available');
      return null;
    }

    // Clear previous content
    this.outputArea.innerHTML = '';
    
    // REUSE existing lesson-plan-card structure (same CSS classes)
    const activityCard = document.createElement('div');
    activityCard.className = 'lesson-plan-card'; // ✅ REUSE existing CSS
    
    activityCard.innerHTML = `
      <div class="card-header">
        <h3 data-type="extracurricular">
          <i class="fas fa-star"></i>
          ${title}
        </h3>
        <div class="lesson-meta">
          <span><strong>Lớp:</strong> ${activityParams.grade || '6'}</span>
          <span><strong>Thời gian:</strong> ${activityParams.duration || '45'} phút</span>
          <span><strong>Loại:</strong> Hoạt động ngoại khóa</span>
          <span><strong>Ngày:</strong> ${new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
      <div class="card-body">
        <div id="streaming-content-extracurricular" class="card-content streaming-content"></div>
      </div>
    `;
    
    this.outputArea.appendChild(activityCard);
    
    // Get streaming element
    this.currentStreamingElement = document.getElementById('streaming-content-extracurricular');
    
    if (!this.currentStreamingElement) {
      console.error('❌ Streaming element not found');
      return null;
    }
    
    // Show loading with existing styles
    this.showActivityLoading();
    
    console.log('✅ Activity streaming UI initialized with existing CSS');
    return this.currentStreamingElement;
  }

  /**
   * Show loading - REUSE existing loading styles
   */
  showActivityLoading() {
    if (!this.currentStreamingElement) return;
    
    this.isLoading = true;
    
    // REUSE existing loading structure
    this.currentStreamingElement.innerHTML = `
      <div class="ai-disclaimer" style="margin-bottom: 20px;">
        <p><strong>🎭 Đang tạo hoạt động ngoại khóa...</strong></p>
        <p>AI đang thiết kế hoạt động phù hợp cho học sinh lớp ${document.getElementById('grade-select-extra')?.value || '6'}</p>
      </div>
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>⏳ Vui lòng đợi khoảng 30 giây...</p>
      </div>
    `;
  }

  /**
   * Update content during streaming - OPTIMIZED for 3k chars
   */
  updateActivityContent(newContentFragment, fullContent) {
    if (!this.currentStreamingElement) return;
    
    // Stop loading when content starts
    if (this.isLoading) {
      this.isLoading = false;
    }
    
    try {
      // Simple content formatting - REUSE existing formatter if available
      let formattedContent = fullContent || newContentFragment;
      
      if (window.lessonPlanController?.ui?.formatContent) {
        // REUSE existing content formatter
        formattedContent = window.lessonPlanController.ui.formatContent(formattedContent);
      } else {
        // Simple fallback formatting
        formattedContent = this.simpleFormatContent(formattedContent);
      }
      
      // Update content
      this.currentStreamingElement.innerHTML = formattedContent;
      
      // Auto-scroll to keep in view
      this.currentStreamingElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
      
    } catch (error) {
      console.error('❌ Error updating activity content:', error);
      this.showError('Có lỗi khi hiển thị nội dung hoạt động');
    }
  }

  /**
   * Simple content formatting fallback
   */
  simpleFormatContent(content) {
    if (!content) return '<p>Đang tạo nội dung...</p>';
    
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  /**
   * Finalize display - REUSE existing finalization logic
   */
  finalizeActivityDisplay(finalContent, activityParams = {}) {
    console.log('🎨 Finalizing activity display');
    
    if (!this.currentStreamingElement) return;
    
    try {
      // Format final content
      let formattedContent;
      
      if (window.lessonPlanController?.ui?.formatContent) {
        // REUSE existing formatter
        formattedContent = window.lessonPlanController.ui.formatContent(finalContent);
      } else {
        formattedContent = this.simpleFormatContent(finalContent);
      }
      
      // Set final content
      this.currentStreamingElement.innerHTML = formattedContent;
      
      // Add AI disclaimer - REUSE existing style
      this.addAIDisclaimer();
      
      // Add export buttons - REUSE existing export manager
      this.addExportButtons();
      
      // Add feedback - REUSE existing feedback system
      this.addFeedbackSection(activityParams);
      
      // Mark as complete
      this.currentStreamingElement.classList.add('stream-complete');
      
      // 🔧 CRITICAL FIX: Ensure complete content display
      this.ensureCompleteDisplay(finalContent);
      
      console.log('✅ Activity display finalized');
      
    } catch (error) {
      console.error('❌ Error finalizing display:', error);
      this.showError('Có lỗi khi hoàn thiện hiển thị');
    }
  }

  /**
   * 🔧 CRITICAL: Ensure complete content display
   * This fixes the truncation issue
   */
  ensureCompleteDisplay(originalContent) {
    if (!this.currentStreamingElement || !originalContent) return;
    
    setTimeout(() => {
      const displayedText = this.currentStreamingElement.textContent || '';
      const originalLength = originalContent.length;
      const displayedLength = displayedText.length;
      
      // Check if content is truncated (less than 80% displayed)
      if (displayedLength < originalLength * 0.8) {
        console.warn(`⚠️ Content truncated: ${displayedLength}/${originalLength} chars`);
        
        // Force complete display
        this.currentStreamingElement.innerHTML = this.simpleFormatContent(originalContent);
        
        console.log('✅ Fixed content truncation');
      }
      
    }, 500); // Small delay to let UI settle
  }

  /**
   * Add AI disclaimer - REUSE existing style
   */
  addAIDisclaimer() {
    const disclaimer = document.createElement('div');
    disclaimer.className = 'ai-disclaimer';
    disclaimer.innerHTML = `
      <div style="margin: 25px 0 15px; padding: 10px 15px; background-color: rgba(255, 193, 7, 0.1); 
                border-left: 4px solid #FFC107; border-radius: 4px; font-size: 0.9em; color: #555;">
          <p><strong>⚠️ Lưu ý:</strong> Hệ thống được kết nối với OpenAI có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.</p>
          <p><strong>🎭 Khuyến nghị:</strong> Điều chỉnh hoạt động cho phù hợp với điều kiện thực tế của lớp học.</p>
      </div>
    `;
    
    this.currentStreamingElement.appendChild(disclaimer);
  }

  /**
   * Add export buttons - REUSE existing export manager
   */
  addExportButtons() {
    if (window.lessonPlanController?.ui?.exportManager) {
      // REUSE existing export functionality
      window.lessonPlanController.ui.exportManager.addExportButtons(this.currentStreamingElement);
    } else {
      // Simple fallback export button
      const exportBtn = document.createElement('button');
      exportBtn.className = 'action-button export-word-btn'; // ✅ REUSE existing CSS
      exportBtn.innerHTML = '<i class="fas fa-file-word"></i> Xuất Word';
      exportBtn.onclick = () => this.handleSimpleExport();
      
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'action-buttons-container'; // ✅ REUSE existing CSS
      buttonContainer.appendChild(exportBtn);
      
      this.currentStreamingElement.appendChild(buttonContainer);
    }
  }

  /**
   * Add feedback section - REUSE existing feedback system
   */
  addFeedbackSection(params) {
    if (!this.currentStreamingElement) {
      console.warn('Không tìm thấy currentStreamingElement khi thêm form phản hồi');
      return;
    }
    
    // ✅ COPY EXACT PATTERN FROM lesson-plan-ui.js finalizeStreamingContent line 456
    const title = document.querySelector('.card-header h3')?.textContent || 'Hoạt động ngoại khóa';
    this.feedbackManager.addFeedbackForm(this.currentStreamingElement, title, 'extracurricular');
  }

  /**
   * Simple export fallback
   */
  handleSimpleExport() {
    try {
      const content = this.currentStreamingElement?.textContent || '';
      const title = document.querySelector('.card-header h3')?.textContent || 'Hoạt động';
      
      if (content.length < 100) {
        alert('Nội dung quá ngắn để xuất file');
        return;
      }
      
      // Copy to clipboard as fallback
      navigator.clipboard.writeText(`${title}\n\n${content}`).then(() => {
        alert('Nội dung đã được sao chép. Bạn có thể dán vào Word.');
      });
      
    } catch (error) {
      console.error('❌ Export error:', error);
      alert('Có lỗi khi xuất file');
    }
  }

  /**
   * Show error - REUSE existing error styles
   */
  showError(message) {
    if (!this.currentStreamingElement) return;
    
    this.currentStreamingElement.innerHTML = `
      <div class="error"> 
        <p>❌ ${message}</p>
        <button onclick="location.reload()" class="action-button">
          <i class="fas fa-redo"></i> Thử lại
        </button>
      </div>
    `;
  }

  /**
   * Hide loading
   */
  hideLoading() {
    this.isLoading = false;
  }

  /**
   * ✅ COMPATIBILITY: showLoading() method to match main tabs pattern
   * COPY EXACT METHOD NAME from lesson-plan-ui.js line 75
   */
  showLoading() {
    return this.showActivityLoading();
  }

  /**
   * Clear display
   */
  clearDisplay() {
    if (this.outputArea) {
      this.outputArea.innerHTML = '';
    }
    this.currentStreamingElement = null;
    this.isLoading = false;
  }

  /**
   * Get current content
   */
  getCurrentContent() {
    return this.currentStreamingElement?.textContent || '';
  }
}

// Export for use in ExtracurricularController
export default ExtracurricularUI;