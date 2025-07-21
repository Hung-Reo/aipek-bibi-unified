// /static/js/controllers/lesson-plan/lesson-plan-ui.js
// Module xử lý giao diện người dùng - Production Version

// Import các module đã tách
import { ExportManager } from './modules/export-manager.js';
import { ContentFormatter } from './modules/content-formatter.js';
import { FeedbackManager } from './modules/feedback-manager.js';
import { LoadingManager } from './modules/loading-manager.js';
import { FormManager } from './modules/form-manager.js';
import { RAGStatusManager } from './modules/rag-status-manager.js';

export class LessonPlanUI {
    constructor(outputAreaId, loadingIndicatorId, uiMode = 'modern') {
      // Khởi tạo vùng output
      this.outputAreas = {
        main: document.getElementById('main-output'),
        review: document.getElementById('review-output'),
        supplementary: document.getElementById('supplementary-output'),
        extracurricular: document.getElementById('extracurricular-output'),
        test: document.getElementById('test-output')
      };

      // Kiểm tra từng element
      Object.keys(this.outputAreas).forEach(key => {
        if (!this.outputAreas[key]) {
          console.error(`❌ ${key}-output: NOT FOUND!`);
        }
      });
  
      this.loadingIndicator = document.getElementById(loadingIndicatorId);
      this.isLoading = false;
      this.uiMode = uiMode;
      this.currentLessonType = 'main';
      this.isFinalized = false; // Flag ngăn RAG callbacks sau finalization

      // Khởi tạo các module con
      this.exportManager = new ExportManager();
      this.contentFormatter = new ContentFormatter(this.uiMode);
      this.feedbackManager = new FeedbackManager();
      this.loadingManager = new LoadingManager(this.loadingIndicator);
      this.formManager = new FormManager(this);
      this.ragStatusManager = new RAGStatusManager();
  
      // Đăng ký FeedbackManager toàn cầu
      window.feedbackManager = this.feedbackManager;
      console.log(`🖌️ LessonPlanUI initialized: ${this.uiMode} mode`);
  
      // Khởi tạo form templates
      this.formTemplates = this.formManager.initFormTemplates();
    }  
    
    // ===== PROXY METHODS TO MODULE FUNCTIONS =====
    
    // Form Management
    showFormForLessonType(lessonType) {
        return this.formManager.showForm(lessonType);
    }
    
    // Loading Management
    showLoading() {
        this.loadingManager.showLoading(this.currentLessonType, this.outputAreas[this.currentLessonType]);
    }
    
    hideLoading() {
        this.loadingManager.hideLoading();
    }
    
    // Content Formatting
    formatContent(content, options = {}) {
        return this.contentFormatter.formatContent(content, options);
    }
    
    enhanceLessonPlanFormat(htmlContent) {
        return this.contentFormatter.enhanceLessonPlanFormat(htmlContent);
    }
    
    createCollapsibleSections(content) {
        return this.contentFormatter.createCollapsibleSections(content);
    }
    
    // Export Functions
    exportToWord(contentElement, rawContent) {
        return this.exportManager.exportToWord(contentElement, rawContent);
    }
    
    exportToPdf(contentElement) {
        return this.exportManager.exportToPdf(contentElement);
    }
    
    // Feedback Functions
    addFeedbackForm(contentElement, topic, tabType) {
        return this.feedbackManager.addFeedbackForm(contentElement, topic, tabType);
    }
    
    // RAG Status
    updateRagStatus(ragInfo) {
        return this.ragStatusManager.updateStatus(ragInfo);
    }
    
    // ===== CORE FUNCTIONS =====
    
    // Lấy tiêu đề giáo án
    getLessonTitle(contentElement) {
        const card = contentElement.closest('.lesson-plan-card');
        if (!card) return '';
        
        const heading = card.querySelector('h3');
        if (!heading) return '';
        
        // Loại bỏ badge và các phần tử khác
        return heading.textContent.replace(/📚 RAG|🤖 AI/g, '').trim();
    }
    
    // Hiển thị kết quả
    showResult(title, content, lessonType, options = {}) {
        const formattedContent = this.formatContent(content);
        
        // Chọn template dựa vào chế độ UI
        let resultTemplate;
        
        if (this.uiMode === 'modern') {
            resultTemplate = `
                <div class="lesson-plan-card">
                    <div class="card-header">
                        <h3 data-type="${lessonType}">${title}</h3>
                    </div>
                    <div class="card-body">
                        <div class="card-content">${formattedContent}</div>
                    </div>
                </div>
            `;
        } else {
            // Template cho giao diện classic
            resultTemplate = `
                <div class="lesson-plan-card">
                    <div class="card-header">
                        <h3 data-type="${lessonType}">${title}</h3>
                        <div class="lesson-meta">
                            <span><strong>Bài:</strong> ${options.unit || '-'}</span>
                            <span><strong>Thời gian:</strong> ${options.duration || '45 phút'}</span>
                            <span><strong>Kỹ năng:</strong> ${options.skill || '-'}</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="card-content">${formattedContent}</div>
                    </div>
                </div>
            `;
        }
        
        // Chọn output area dựa trên loại giáo án
        const outputArea = this.outputAreas[lessonType];
        if (outputArea) {
            outputArea.innerHTML = resultTemplate;
        } else {
            console.error(`❌ Output area not found: ${lessonType}`);
        }
    }
  
    // Hiển thị lỗi
    showError(error, lessonType = null) {
        const outputArea = lessonType ? 
            this.outputAreas[lessonType] : 
            this.outputAreas[this.currentLessonType];
        
        if (!outputArea) return;
        
        outputArea.innerHTML = `
            <div class="error">
                <p>Có lỗi xảy ra khi soạn giáo án. Vui lòng thử lại.</p>
                <p class="error-details">${error.message || 'Không có thông tin chi tiết'}</p>
            </div>`;
    }
    
    // Khởi tạo UI streaming
    initStreamingUI(title, lessonType, outputAreaId = null) {
        // Update UI lesson type
        this.currentLessonType = lessonType;
        
        // Reset finalization flag cho streaming session mới
        this.isFinalized = false;
        
        // Khởi tạo outputAreas nếu chưa có
        if (!this.outputAreas) {
            this.outputAreas = {
                main: document.getElementById('main-output'),
                supplementary: document.getElementById('supplementary-output'),
                extracurricular: document.getElementById('extracurricular-output'),
                test: document.getElementById('test-output')
            };
        }

        // Chọn output area
        let outputArea = outputAreaId ? 
            document.getElementById(outputAreaId) : 
            this.outputAreas[lessonType];

        if (!outputArea) {
            console.error(`❌ Output area not found: ${lessonType}`);
            return null;
        }
        
        // Kiểm tra xem có phải đang target nhầm container không
        if (outputArea.classList.contains('lesson-plan-container')) {
            console.error('🚨 DANGER: Targeting container instead of output area!');
            return null;
        }

        // Chọn template dựa vào chế độ UI
        let streamingTemplate;
        if (this.uiMode === 'modern') {
            streamingTemplate = `
                <div class="lesson-plan-card">
                    <div class="card-header">
                        <h3 data-type="${lessonType}">${title}</h3>
                    </div>
                    <div class="card-body">
                        <div id="streaming-content-${lessonType}" class="card-content streaming-content">
                            <div class="simple-loading" style="
                                padding: 40px 20px;
                                text-align: center;
                                color: #666;
                                font-size: 16px;
                                background: #f9f9f9;
                                border-radius: 4px;
                                margin: 20px 0;
                            ">
                                <div style="margin-bottom: 15px;">
                                    <div class="spinner" style="
                                        width: 24px; height: 24px;
                                        border: 3px solid #f3f3f3;
                                        border-top: 3px solid #4CAF50;
                                        border-radius: 50%;
                                        animation: spin 1s linear infinite;
                                        margin: 0 auto 15px;
                                    "></div>
                                </div>
                                <p style="margin: 0; font-weight: 500;">Đang tìm nội dung...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            `;
        } else {
            streamingTemplate = `
                <div class="lesson-plan-card classic-style">
                    <div class="card-header">
                        <h3 data-type="${lessonType}">${title}</h3>
                    </div>
                    <div class="card-body classic-style">
                        <div id="streaming-content-${lessonType}" class="card-content streaming-content">
                            <div class="simple-loading" style="
                                padding: 40px 20px;
                                text-align: center;
                                color: #666;
                                font-size: 16px;
                                background: #f9f9f9;
                                border-radius: 4px;
                                margin: 20px 0;
                            ">
                                <div style="margin-bottom: 15px;">
                                    <div class="spinner" style="
                                        width: 24px; height: 24px;
                                        border: 3px solid #f3f3f3;
                                        border-top: 3px solid #4CAF50;
                                        border-radius: 50%;
                                        animation: spin 1s linear infinite;
                                        margin: 0 auto 15px;
                                    "></div>
                                </div>
                                <p style="margin: 0; font-weight: 500;">Đang tìm nội dung...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            `;
        }

        // Xóa nội dung hiện tại và thêm template mới
        outputArea.innerHTML = '';
        outputArea.innerHTML = streamingTemplate;

        // Trả về phần tử streaming-content
        const streamingContent = document.getElementById(`streaming-content-${lessonType}`);
        if (!streamingContent) {
            console.error(`❌ Could not find streaming-content-${lessonType}`);
        }

        return streamingContent;
    }
  
    // Cập nhật nội dung streaming
    updateStreamingContent(contentElement, newContentFragment, fullContent, ragInfo = null) {
        if (!contentElement) return;
        
        // ✅ SIMPLE: Remove complex progress bar, just handle content
        
        // FINALIZATION PROTECTION: Ngăn RAG callbacks sau finalization
        const isReviewWorkflow = this.currentLessonType === 'review' || 
                                document.querySelector('input[type="radio"][value="review"]:checked');
        
        if (this.isFinalized && !fullContent && !isReviewWorkflow) {
            if (ragInfo) {
                this.updateRagStatus(ragInfo);
            }
            console.log('🛡️ Blocked post-finalization RAG callback');
            return;
        }
        
        // SPECIAL: Allow RAG for Review even after finalization
        if (this.isFinalized && !fullContent && isReviewWorkflow) {
            if (ragInfo) {
                this.updateRagStatus(ragInfo);
            }
            this.isFinalized = false;
        }
        
        try {
            if (!fullContent && !ragInfo) {
                console.warn('No content or RAG info to update');
                return;
            }

            // Nếu chỉ có ragInfo, chỉ cập nhật trạng thái RAG
            if (!fullContent && ragInfo) {
                this.updateRagStatus(ragInfo);
                return;
            }

            // Lưu lại vị trí scroll
            const scrollPos = window.scrollY;
            
            // ✅ SIMPLE: Remove loading message when content starts streaming
            const loadingElement = contentElement.querySelector('.simple-loading');
            if (loadingElement && fullContent && fullContent.length > 100) {
                loadingElement.remove();
            }
            
            // Tạo nội dung mới từ fullContent
            const formattedContent = this.formatContent(fullContent);
            
            // Cập nhật nội dung chính
            contentElement.innerHTML = formattedContent;
            
            // Cập nhật thông tin RAG nếu có
            if (ragInfo) {
                this.updateRagStatus(ragInfo);
            }
            
            // Khôi phục vị trí scroll
            window.scrollTo(0, scrollPos);
            
        } catch (error) {
            console.error('❌ Error updating content:', error);
            
            // Graceful fallback
            if (fullContent) {
                const safeContent = document.createElement('div');
                safeContent.textContent = fullContent;
                contentElement.innerHTML = '';
                contentElement.appendChild(safeContent);
            }
        }
    }
  
    // Hoàn thiện nội dung streaming
    finalizeStreamingContent(contentElement, fullContent, ragInfo = null) {
        if (!contentElement) return;
        
        try {
            // KIỂM TRA NGUY HIỂM: contentElement có phải là container không?
            if (contentElement.classList.contains('lesson-plan-container') || 
                contentElement.classList.contains('lesson-plan-sidebar') ||
                contentElement.id === 'bibi-lesson-plan-app') {
                console.error('🚨 DANGER: contentElement is main container! STOPPING!');
                return;
            }
            
            // Xác định và lưu trữ các phần tử cần giữ lại
            const actionButtons = contentElement.querySelector('.action-buttons-container');
            const feedbackSection = contentElement.querySelector('.feedback-section');
            const ragSources = contentElement.querySelector('.rag-sources-simple');
            
            // SAFE CLEAR: Store layout elements before innerHTML clear
            const container = document.querySelector('.lesson-plan-container');
            const sidebar = document.querySelector('.lesson-plan-sidebar');
            
            // Store current layout state
            const layoutState = {
                containerDisplay: container ? getComputedStyle(container).display : null,
                sidebarDisplay: sidebar ? getComputedStyle(sidebar).display : null
            };
            
            // Xóa tất cả nội dung hiện có trong contentElement
            contentElement.innerHTML = '';

            // IMMEDIATE RECOVERY: Check and restore layout immediately
            setTimeout(() => {
                const containerAfter = document.querySelector('.lesson-plan-container');
                const sidebarAfter = document.querySelector('.lesson-plan-sidebar');
                
                if (!containerAfter || !sidebarAfter) {
                    console.error('🚨 CRITICAL: Layout elements missing after clear!');
                    return;
                }
                
                // GRID LAYOUT FIX
                const containerDisplay = getComputedStyle(container).display;
                if (containerDisplay !== 'grid') {
                    // Apply PURE GRID layout
                    container.style.setProperty('display', 'grid', 'important');
                    container.style.setProperty('grid-template-columns', '280px 1fr', 'important');
                    container.style.setProperty('width', '100vw', 'important');
                    container.style.setProperty('margin', '0', 'important');
                    container.style.setProperty('padding', '0', 'important');
                    container.style.setProperty('position', 'relative', 'important');
                    
                    // Pure grid sidebar positioning
                    sidebar.style.setProperty('display', 'block', 'important');
                    sidebar.style.setProperty('grid-column', '1', 'important');
                    sidebar.style.setProperty('width', '280px', 'important');
                    sidebar.style.setProperty('background-color', '#f9f9f9', 'important');
                    sidebar.style.setProperty('padding', '12px', 'important');
                    sidebar.style.setProperty('border-right', '1px solid #ddd', 'important');
                    sidebar.style.setProperty('position', 'relative', 'important');
                }
            }, 0);
            
            // Tạo nội dung mới đã được định dạng
            const formattedContent = this.formatContent(fullContent);
            
            // Tạo container cho nội dung mới
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'lesson-content-wrapper';
            contentWrapper.innerHTML = formattedContent;
            
            // Thêm wrapper vào contentElement
            contentElement.appendChild(contentWrapper);
            
            // Xử lý ragInfo và badge
            let badgeType = 'disabled';
            let badgeHtml = '';
            
            if (ragInfo) {
                if (ragInfo.sources && ragInfo.sources.length > 0) {
                    ragInfo.usedRAG = true;
                    badgeType = 'success';
                } else if (ragInfo.usedRAG === true) {
                    badgeType = 'success';
                } else if (ragInfo.attempted) {
                    badgeType = 'fallback';
                }
            
                badgeHtml = this.ragStatusManager.createRAGBadge(badgeType);
            }
            
            // Thêm badge vào tiêu đề
            const h3Element = contentElement.closest('.lesson-plan-card')?.querySelector('h3');
            if (h3Element && !h3Element.querySelector('.rag-badge') && badgeHtml) {
                const badgeElement = document.createElement('span');
                badgeElement.innerHTML = badgeHtml;
                h3Element.appendChild(badgeElement.firstChild);
            }
            
            // Thêm banner cảnh báo
            const warningBanner = document.createElement('div');
            warningBanner.className = 'ai-disclaimer';
            warningBanner.innerHTML = `
                <div style="margin: 25px 0 15px; padding: 10px 15px; background-color: rgba(255, 193, 7, 0.1); 
                          border-left: 4px solid #FFC107; border-radius: 4px; font-size: 0.9em; color: #555;">
                    <p><strong>⚠️ Lưu ý:</strong> Hệ thống được kết nối với OpenAI có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.</p>
                </div>
            `;
            contentElement.appendChild(warningBanner);
            
            // THÊM RAG SOURCES
            if (ragInfo && ragInfo.usedRAG && ragInfo.sources && 
                ragInfo.sources.length > 0 && !ragSources) {
                try {
                  const sourcesHtml = this.ragStatusManager.createSourcesList(ragInfo.sources);
                  contentElement.insertAdjacentHTML('beforeend', sourcesHtml);
              } catch (error) {
                  console.error('❌ Error processing RAG sources:', error);
              }
          } else if (ragSources) {
              contentElement.appendChild(ragSources);
          }
          
          // THÊM HOẶC KHÔI PHỤC CÁC NÚT HÀNH ĐỘNG
          if (actionButtons) {
              contentElement.appendChild(actionButtons);
          } else {
              this.exportManager.addExportButtons(contentElement);
          }
          
          // THÊM HOẶC KHÔI PHỤC FORM FEEDBACK
          if (feedbackSection) {
              contentElement.appendChild(feedbackSection);
          } else {
              const title = this.getLessonTitle(contentElement) || 'Giáo án';
              this.feedbackManager.addFeedbackForm(contentElement, title, this.currentLessonType);
          }
          
          // Đánh dấu hoàn thành streaming
            contentElement.classList.add('stream-complete');
            
            // Set finalization flag
            this.isFinalized = true;
        
        // Thiết lập event listeners cho các phần có thể thu gọn
        setTimeout(() => {
              const headers = contentElement.querySelectorAll('.section-header');
              headers.forEach(header => {
                  header.addEventListener('click', () => {
                      const body = header.nextElementSibling;
                      if (body) {
                          body.style.display = body.style.display === 'none' || body.style.display === '' ? 'block' : 'none';
                          const icon = header.querySelector('.toggle-icon');
                          if (icon) {
                              icon.classList.toggle('fa-chevron-down');
                              icon.classList.toggle('fa-chevron-up');
                          }
                      }
                  });
              });
          }, 200);

            // ✅ LAYOUT VERIFICATION AND CORRECTION
            setTimeout(() => {
                const sidebar = document.querySelector('.lesson-plan-sidebar');
                const container = document.querySelector('.lesson-plan-container');
                const content = document.querySelector('.lesson-plan-content');
                
                if (sidebar && container && content) {
                // Get header width for precise alignment
                const header = document.querySelector('.smart-header');
                const headerWidth = header ? header.getBoundingClientRect().width : window.innerWidth;

                // STEP 1: Clean slate - remove conflicting styles
                container.removeAttribute('style');
                container.style.cssText = '';

                // STEP 2: Apply clean grid layout
                container.style.setProperty('display', 'grid', 'important');
                container.style.setProperty('grid-template-columns', '280px 1fr', 'important');
                container.style.setProperty('width', `${headerWidth}px`, 'important');
                container.style.setProperty('max-width', `${headerWidth}px`, 'important');
                container.style.setProperty('margin', '0', 'important');
                container.style.setProperty('padding', '0', 'important');
                container.style.setProperty('position', 'relative', 'important');
                container.style.setProperty('box-sizing', 'border-box', 'important');

                // STEP 3: Clean and fix sidebar positioning
                sidebar.removeAttribute('style');
                sidebar.style.cssText = '';

                sidebar.style.setProperty('display', 'block', 'important');
                sidebar.style.setProperty('grid-column', '1', 'important');
                sidebar.style.setProperty('width', '280px', 'important');
                sidebar.style.setProperty('background-color', '#f9f9f9', 'important');
                sidebar.style.setProperty('padding', '20px 12px 12px 20px', 'important');
                sidebar.style.setProperty('border-right', '1px solid #ddd', 'important');
                sidebar.style.setProperty('overflow-y', 'auto', 'important');
                sidebar.style.setProperty('box-sizing', 'border-box', 'important');
                sidebar.style.setProperty('margin', '0', 'important');
                
                // STEP 4: Clean and fix content area
                content.removeAttribute('style');
                content.style.cssText = '';

                content.style.setProperty('display', 'block', 'important');
                content.style.setProperty('grid-column', '2', 'important');
                content.style.setProperty('width', '100%', 'important');
                content.style.setProperty('padding', '20px', 'important');
                content.style.setProperty('background-color', '#fff', 'important');
                content.style.setProperty('box-sizing', 'border-box', 'important');
                content.style.setProperty('margin', '0', 'important');
                content.style.setProperty('overflow-x', 'auto', 'important');
                }
            }, 200);
          
      } catch (error) {
          console.error('❌ Error in finalization process:', error);
          
          // Emergency fallback
          if (fullContent) {
              contentElement.innerHTML = `
                  <div class="emergency-content">
                      <h3>Giáo án</h3>
                      <div>${this.formatContent(fullContent)}</div>
                  </div>
                  <div class="action-buttons-container" style="margin-top:20px">
                      <button class="action-button export-word-btn">
                          <i class="fas fa-file-word"></i> Xuất Word
                      </button>
                  </div>
              `;
              
              const exportBtn = contentElement.querySelector('.export-word-btn');
              if (exportBtn) {
                  exportBtn.addEventListener('click', () => {
                      this.exportToWord(contentElement, fullContent);
                  });
              }
          }
      }
  }
  
  // Kiểm tra và khôi phục nội dung
  ensureContentVisible(contentElement, originalContent) {
      if (!contentElement || !originalContent) return;
      
      setTimeout(() => {
          const hasContent = contentElement.innerText.trim().length > 20;
          
          if (!hasContent) {
              console.warn('⚠️ Content not visible, restoring...');
              
              contentElement.innerHTML = '';

              const emergencyContainer = document.createElement('div');
              emergencyContainer.className = 'emergency-content';
              emergencyContainer.innerHTML = originalContent;
              
              contentElement.appendChild(emergencyContainer);
              
              const notification = document.createElement('div');
              notification.className = 'content-notification';
              notification.innerHTML = '<small><i>Đã khôi phục nội dung</i></small>';
              contentElement.appendChild(notification);
              
              const title = this.getLessonTitle(contentElement) || 'Giáo án';
              this.feedbackManager.addFeedbackForm(contentElement, title, this.currentLessonType);
          }
      }, 500);
  }
  
    // Khôi phục event listeners sau khi cập nhật nội dung
    reattachEventListeners(container) {
        try {
        if (!container) return;
        
        // Tìm các nút export
        const exportButtons = container.querySelector('.action-buttons-container');
        if (exportButtons) {
            this.exportManager.attachButtonEvents(exportButtons, container);
        }
        
        // Thiết lập lại rating stars
        if (window.feedbackManager) {
            if (typeof window.feedbackManager.setupRatingStars === 'function') {
                window.feedbackManager.setupRatingStars();
            } else {
                // Fallback rating stars setup
                const starContainers = container.querySelectorAll('.star-rating, .feedback-stars');
                if (starContainers.length > 0) {
                    starContainers.forEach(starContainer => {
                        const stars = starContainer.querySelectorAll('.star');
                        stars.forEach((star, index) => {
                            star.addEventListener('click', () => {
                                stars.forEach((s, i) => {
                                    if (i <= index) {
                                        s.classList.add('selected');
                                        s.style.color = '#FFD700';
                                    } else {
                                        s.classList.remove('selected');
                                        s.style.color = '#ccc';
                                    }
                                });
                                starContainer.dataset.rating = index + 1;
                            });
                        });
                    });
                }
            }
        }
        
        // Event listeners cho phần có thể thu gọn
        const headers = container.querySelectorAll('.section-header, .collapsible-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const body = header.nextElementSibling;
                if (body) {
                    if (body.style.display === 'none' || body.style.display === '') {
                        body.style.display = 'block';
                        body.classList.add('expanded');
                    } else {
                        body.style.display = 'none';
                        body.classList.remove('expanded');
                    }
                    
                    const icon = header.querySelector('.toggle-icon');
                    if (icon) {
                        icon.classList.toggle('fa-chevron-down');
                        icon.classList.toggle('fa-chevron-up');
                    }
                }
            });
        });
        } catch (error) {
        console.warn('⚠️ Error reattaching events:', error);
        }
    }
    /**
     * Hiển thị loading cho audio generation
     */
    showAudioGeneration() {
        const loadingHtml = `
        <div id="audio-loading" class="audio-loading-container" style="
            margin: 20px 0; 
            padding: 15px; 
            background: #f0f8ff; 
            border: 1px solid #4CAF50; 
            border-radius: 4px;
            text-align: center;
        ">
            <p><strong>🎧 Đang tạo Audio files...</strong></p>
            <p style="margin: 5px 0; color: #666;">Estimated time: 10-15 giây</p>
            <div style="margin-top: 10px;">
            <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #4CAF50; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
        </div>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        `;
        
        // Tìm content element và thêm loading
        const contentElements = document.querySelectorAll('.streaming-content, .card-content');
        contentElements.forEach(element => {
        if (!element.querySelector('#audio-loading')) {
            element.insertAdjacentHTML('beforeend', loadingHtml);
        }
        });
    }
    
    /**
     * Ẩn loading audio generation
     */
    hideAudioGeneration() {
        const loadingElements = document.querySelectorAll('#audio-loading');
        loadingElements.forEach(element => element.remove());
    }
    
    /**
     * Hiển thị audio players trong content
     */
    displayAudioPlayers(contentElement, audioResults) {
        if (!contentElement || !audioResults.success || !audioResults.audioFiles) {
          console.warn('⚠️ Invalid audio results or content element');
          return;
        }
        
        const audioFiles = audioResults.audioFiles;
        console.log(`🎵 Displaying ${audioFiles.length} audio players`);
        
        // ✅ FIX: Enhanced validation logging
        if (audioResults.validation) {
          const val = audioResults.validation;
          console.log(`📊 Audio validation: Expected ${val.expectedConversations + val.expectedPassages}, Got ${audioFiles.length}`);
          
          if (!val.allExpectedGenerated) {
            console.warn(`⚠️ Audio generation incomplete:`);
            console.warn(`   - Missing ${val.expectedConversations - val.actualConversations} conversations`);
            console.warn(`   - Missing ${val.expectedPassages - val.actualPassages} passages`);
            
            // Show warning to user
            this.showAudioWarning(contentElement, val);
          }
        }
        
        // Tạo audio section HTML
        const audioHtml = this.createAudioSection(audioFiles, audioResults);
        
        // Thêm vào content element
        contentElement.insertAdjacentHTML('beforeend', audioHtml);
        
        // Setup event listeners cho audio controls
        this.setupAudioEventListeners(contentElement);
      }
    
    /**
     * Tạo HTML cho audio section
     */
    createAudioSection(audioFiles, audioResults) {
        const totalDuration = audioResults.totalDuration || 240; // fallback 4 min
        
        let audioHtml = `
        <div class="audio-section" style="
            margin: 25px 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            border-radius: 8px; 
            color: white;
        ">
            <h4 style="margin: 0 0 15px 0; color: white;">
            🎧 Generated Audio Files (${Math.floor(totalDuration/60)}:${(totalDuration%60).toString().padStart(2,'0')})
            </h4>
        `;
        
        // Group files by type
        const conversations = audioFiles.filter(f => f.type === 'conversation');
        const passages = audioFiles.filter(f => f.type === 'passage');
        
        // Part 1 Conversations
        if (conversations.length > 0) {
        audioHtml += `
            <div class="audio-group" style="margin-bottom: 20px;">
            <h5 style="margin: 0 0 10px 0; color: #E8F5E8;">Part 1 - Conversations:</h5>
        `;
        
        conversations.forEach(file => {
            audioHtml += this.createAudioPlayer(file);
        });
        
        audioHtml += `</div>`;
        }
        
        // Part 2 Passages
        if (passages.length > 0) {
        audioHtml += `
            <div class="audio-group" style="margin-bottom: 15px;">
            <h5 style="margin: 0 0 10px 0; color: #E8F5E8;">Part 2 - Extended Passage:</h5>
        `;
        
        passages.forEach(file => {
            audioHtml += this.createAudioPlayer(file);
        });
        
        audioHtml += `</div>`;
        }
        
        // Download all button
        audioHtml += `
        <div class="audio-actions" style="text-align: center; margin-top: 15px;">
            <button class="download-all-btn" style="
            background: white; 
            color: #667eea; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer;
            font-weight: bold;
            ">
            📥 Download All Audio Files
            </button>
        </div>
        `;
        
        audioHtml += `</div>`;
        
        return audioHtml;
    }
    
    /**
     * Tạo single audio player
     */
    createAudioPlayer(audioFile) {
        return `
        <div class="audio-player" style="
            margin: 8px 0; 
            padding: 10px; 
            background: rgba(255,255,255,0.1); 
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        ">
            <div style="flex: 1;">
            <strong>${audioFile.title}</strong>
            <audio controls style="width: 100%; margin-top: 5px;">
                <source src="${audioFile.url}" type="audio/mpeg">
                Your browser does not support audio playback.
            </audio>
            </div>
            <div style="margin-left: 15px;">
            <a href="${audioFile.url}" download="${audioFile.title}.mp3" style="
                background: rgba(255,255,255,0.2); 
                color: white; 
                padding: 6px 12px; 
                border-radius: 3px; 
                text-decoration: none;
                font-size: 12px;
            ">📥 Download</a>
            </div>
        </div>
        `;
    }
    
    /* Setup event listeners cho audio controls */
    setupAudioEventListeners(contentElement) {
        // Setup download all button
        const downloadAllBtn = contentElement.querySelector('.download-all-btn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => {
                this.downloadAllAudio();
            });
            console.log('✅ Download all button event listener attached');
        }
        
        // Audio players auto-setup via HTML5, no additional JS needed
        console.log('✅ Audio players ready');
    }
    
    /**
     * Download all audio files
     */
    downloadAllAudio() {
        const audioLinks = document.querySelectorAll('.audio-player a[download]');
        audioLinks.forEach((link, index) => {
        setTimeout(() => {
            link.click();
        }, index * 500); // Stagger downloads
        });
        
        console.log(`📥 Downloading ${audioLinks.length} audio files`);
    }
}