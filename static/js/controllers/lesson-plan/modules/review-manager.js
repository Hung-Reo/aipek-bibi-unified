// /static/js/controllers/lesson-plan/modules/review-manager.js
// ✅ FIXED VERSION - UI Integration like TT Pattern

import { LessonPlanAPI } from '../lesson-plan-api.js';
import { LessonPlanCache } from '../lesson-plan-cache.js';
import { REVIEWS_DATA, LESSON_PLAN_PROMPTS } from '../lesson-plan-prompts.js';
import { getReviewPrompt } from '../review-prompts.js';
import { cacheController } from '../controllers/cache_controller.js';

export class ReviewManager {
    constructor(uiInstance = null) {
        this.api = new LessonPlanAPI();
        this.cache = new LessonPlanCache();
        this.isInitialized = false;
        this.isGenerating = false;  // ← ADD THIS LINE
        
        // ✅ KEY FIX: Add UI reference like TT pattern
        this.ui = uiInstance;
        
        console.log('🔄 ReviewManager initialized with UI integration');
    }

    // ✅ NEW: Set UI reference (for integration)
    setUI(uiInstance) {
        this.ui = uiInstance;
        console.log('✅ ReviewManager: UI reference set');
    }

    // Keep all existing methods unchanged until generateReview()...

    init() {
        if (this.isInitialized) {
            console.log('⚠️ ReviewManager already initialized');
            return;
        }

        this.setupEventListeners();
        this.populateReviewOptions();
        this.isInitialized = true;
        
        console.log('✅ ReviewManager fully initialized');
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generate-review-btn') || 
                           document.getElementById('generate-review-btn-top');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateReview());
            console.log('✅ Review generate button listener attached');
        }

        const gradeSelect = document.getElementById('review-grade-select');
        if (gradeSelect) {
            gradeSelect.addEventListener('change', () => this.onGradeChange());
            console.log('✅ Review grade select listener attached');
        }

        console.log('📝 Review event listeners setup complete');
    }

    populateReviewOptions() {
        setTimeout(() => {
            const gradeSelect = document.getElementById('review-grade-select');
            
            if (!gradeSelect) {
                console.error('❌ Review grade select still not found after delay');
                return;
            }
    
            const grade = gradeSelect.value || '6';
            const semester = '1';
            
            this.updateReviewSelect(grade, semester);
            console.log(`✅ Successfully populated reviews for Grade ${grade}`);
        }, 300);
    }

    updateReviewSelect(grade, semester = '1') {
        const reviewSelect = document.getElementById('review-type-select');
        if (!reviewSelect) {
            console.warn('⚠️ Review select element not found');
            return;
        }
    
        console.log(`🔍 Review select has ${reviewSelect.options.length} options already`);
        
        if (reviewSelect.options.length <= 1) {
            console.log('📝 Populating from static template fallback...');
            reviewSelect.innerHTML = `
                <option value="">Chọn Review...</option>
                <option value="1">Review 1 (Units 1-3): MY NEW SCHOOL, MY HOUSE, MY FRIENDS</option>
                <option value="2">Review 2 (Units 4-6): MY NEIGHBOURHOOD, NATURAL WONDERS, OUR TET HOLIDAY</option>
                <option value="3">Review 3 (Units 7-9): TELEVISION, SPORTS AND GAMES, CITIES OF THE WORLD</option>
                <option value="4">Review 4 (Units 10-12): OUR HOUSES IN THE FUTURE, OUR GREENER WORLD, ROBOTS</option>
            `;
        }
        
        console.log(`✅ Review select now has ${reviewSelect.options.length} options`);
    }

    onGradeChange() {
        const gradeSelect = document.getElementById('review-grade-select');
        
        if (gradeSelect) {
            this.updateReviewSelect(gradeSelect.value, '1');
        }
    }

    getReviewFormData() {
        const grade = document.getElementById('review-grade-select')?.value;
        const reviewType = (document.getElementById('review-type-select') || 
                           document.getElementById('review-type-select-main'))?.value;
        const additionalInstructions = document.getElementById('review-additional-instructions')?.value;

        let semester = '1';
        if (reviewType === '3' || reviewType === '4') {
            semester = '2';
        }

        const selectedSkills = [];
        const skillCheckboxes = document.querySelectorAll('input[name="review-skill"]:checked, input[name="review-skill-main"]:checked');
        skillCheckboxes.forEach(checkbox => {
            selectedSkills.push(checkbox.value);
        });

        return {
            grade,
            semester,
            reviewType,
            selectedSkills,
            additionalInstructions
        };
    }

    validateReviewForm(formData) {
        const errors = [];

        if (!formData.grade) errors.push('Vui lòng chọn lớp');
        if (!formData.reviewType) errors.push('Vui lòng chọn Review');
        if (formData.selectedSkills.length === 0) errors.push('Vui lòng chọn ít nhất một kỹ năng');

        return errors;
    }

    showError(message) {
        const outputArea = document.getElementById('review-output');
        if (outputArea) {
            outputArea.innerHTML = `
                <div class="error-message">
                    <h4>❌ Lỗi</h4>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    buildRAGQuery(formData, reviewData) {
        const skills = formData.selectedSkills?.slice(0, 2).join(' ');
        const grade = formData.grade || '6';
        
        const query = `Review ${reviewData.name} grade ${grade} ${skills}`.trim();
        
        console.log('🔍 Built RAG query:', query);
        return query;
    }

    // ✅ MAIN FIX: generateReview() - Copy TT UI Pattern
    async generateReview() {
        if (this.isGenerating) {  // ← ADD THIS BLOCK
            console.log('⚠️ Review generation already in progress, skipping');
            return;
        }
        
        this.isGenerating = true;  // ← ADD THIS LINE
        console.log('🚀 Starting Review generation...');
        
        const formData = this.getReviewFormData();
        const errors = this.validateReviewForm(formData);
        
        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
            return;
        }

        try {
            // ✅ Step 1: Find Review data
            const key = `grade_${formData.grade}_semester_${formData.semester}`;
            const reviews = REVIEWS_DATA[key] || [];
            const reviewId = `review${formData.reviewType}`;
            const selectedReview = reviews.find(r => r.id === reviewId);

            if (!selectedReview) {
                console.error(`❌ Review lookup failed:`, {
                    key: key,
                    reviewId: reviewId,
                    formData: formData,
                    availableReviews: reviews.map(r => r.id)
                });
                throw new Error('Không tìm thấy thông tin Review đã chọn');
            }

            // ✅ Step 2: Build title and RAG query
            const title = `Review ${selectedReview.name} - Lớp ${formData.grade}`;
            const ragQuery = this.buildRAGQuery(formData, selectedReview);
            console.log('📊 Built RAG query for Review:', ragQuery);

            // ✅ Step 3: Build messages
            const prompt = this.buildReviewPrompt(formData, selectedReview);
            const messages = [
                {
                    role: 'system',
                    content: prompt
                }
            ];

            console.log('📝 Built messages for Review:', messages.length, 'messages');

            // ✅ Step 4: UI INTEGRATION - Check if UI available
            let streamingElement = null;
            
            if (this.ui && this.ui.initStreamingUI) {
                // Use UI abstraction layer like TT
                streamingElement = this.ui.initStreamingUI(title, 'review');
                console.log('✅ Using UI abstraction layer for streaming');
            } else {
                // Fallback: Show loading manually
                this.showLoading();
                console.log('⚠️ UI layer not available, using fallback loading');
            }

            // ✅ Step 5: API call with proper streaming
            const response = await this.api.generateLessonPlan(
                messages,
                (content, fullContent, ragInfo) => {
                    // ✅ FIX: Use UI layer if available
                    if (this.ui && this.ui.updateStreamingContent && streamingElement) {
                        // TT Pattern: Use UI abstraction
                        this.ui.updateStreamingContent(streamingElement, content, fullContent, ragInfo);
                    } else {
                        // Fallback: Direct DOM (safer version)
                        this.updateStreamingContentFallback(fullContent);
                    }
                },
                {
                    lessonType: 'review',
                    grade: formData.grade,
                    semester: formData.semester,
                    reviewType: formData.reviewType,
                    skills: formData.selectedSkills,
                    useRAG: true,
                    ragQuery: ragQuery
                }
            );

            // ✅ Step 6: Finalize properly
            if (response && response.content) {
                console.log('✅ Review generated successfully:', response.content.length, 'characters');
                
                if (this.ui && this.ui.finalizeStreamingContent && streamingElement) {
                    // TT Pattern: Use UI finalization
                    this.ui.finalizeStreamingContent(streamingElement, response.content, response.ragInfo);
                } else {
                    // Fallback: Display result manually
                    this.displayReviewResult(response.content, formData);
                }
                
                // Save to cache
                const cacheKey = cacheController.getCacheKey('review', {
                    reviewNumber: formData.reviewType,
                    selectedSkills: formData.selectedSkills,
                    grade: formData.grade
                }, 'vi');
                
                cacheController.saveToCache(cacheKey, {
                    type: 'review', 
                    content: response.content,
                    formData: formData,
                    timestamp: new Date().toISOString(),
                    ragInfo: response.ragInfo || {}
                });
                
                console.log('✅ Review cached successfully with key:', cacheKey);
                
                console.log('✅ Review generation completed');
            } else {
                const errorMsg = response?.error || 'Có lỗi xảy ra khi tạo Review - response format invalid';
                console.error('❌ Response format:', response);
                throw new Error(errorMsg);
            }

        } catch (error) {
            console.error('❌ Review generation failed:', error);
            
            let errorMessage = 'Có lỗi xảy ra khi tạo Review';
            
            if (error.message.includes('timeout')) {
                errorMessage = 'Timeout: Hệ thống mất quá nhiều thời gian phản hồi. Vui lòng thử lại.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
            } else if (error.message.includes('API')) {
                errorMessage = 'Lỗi từ hệ thống AI. Vui lòng thử lại sau ít phút.';
            } else if (error.message) {
                errorMessage = `Lỗi: ${error.message}`;
            }
            
            this.showError(errorMessage);
        } finally {  // ← ADD THIS BLOCK
            this.isGenerating = false;
            console.log('🏁 Review generation guard reset');
        }
    }

    // ✅ NEW: Fallback streaming method (safer than original)
    updateStreamingContentFallback(fullContent) {
        const outputArea = document.getElementById('review-output');
        if (!outputArea) return;
        
        // ✅ SAFE: Find existing content div or create structure once
        let contentDiv = outputArea.querySelector('.lesson-content');
        
        if (!contentDiv) {
            // Create structure once only
            outputArea.innerHTML = `
                <div class="lesson-plan-result streaming">
                    <div class="lesson-header">
                        <h3>Đang tạo bài Review...</h3>
                    </div>
                    <div class="lesson-content"></div>
                </div>
            `;
            contentDiv = outputArea.querySelector('.lesson-content');
        }
        
        // ✅ SAFE: Only update content div, not entire structure
        if (contentDiv && fullContent) {
            contentDiv.innerHTML = fullContent;
        }
    }

    // ✅ NEW: Safe loading method
    showLoading() {
        const outputArea = document.getElementById('review-output');
        if (outputArea) {
            outputArea.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Đang tạo bài Review...</p>
                </div>
            `;
        }
    }

    // Keep existing methods for prompts, display, etc...
    buildReviewPrompt(formData, reviewData) {
        // ✅ GET CURRENT LANGUAGE STATE
        const currentLanguage = window.uiStateManager ? window.uiStateManager.getLanguage() : 'vi';
        console.log('🌐 Review using language:', currentLanguage); // Debug log
        
        // ✅ SỬ DỤNG FILE MỚI - DYNAMIC UNITS
        const reviewInfo = {
            name: reviewData.name,
            units: reviewData.units || this.getUnitsFromReviewType(formData), // ← DYNAMIC!
            grade: formData.grade
        };
        
        const selectedSkills = formData.selectedSkills.map(skill => {
            const skillNames = {
                vocabulary: 'Vocabulary',
                pronunciation: 'Pronunciation', 
                grammar: 'Grammar',
                reading: 'Reading',
                writing: 'Writing',
                listening: 'Listening',
                speaking: 'Speaking'
            };
            return skillNames[skill] || skill;
        });
        
        const specialRequirements = formData.additionalInstructions || '';
        
        return getReviewPrompt(reviewInfo, selectedSkills, specialRequirements, '', currentLanguage);
    }
    
    // ✅ THÊM HÀM HELPER
    getUnitsFromReviewType(formData) {
        // Tự động xác định units dựa trên reviewType
        switch(formData.reviewType) {
            case '1': return [1, 2, 3];
            case '2': return [4, 5, 6]; 
            case '3': return [7, 8, 9];
            case '4': return [10, 11, 12];
            default: return [1, 2, 3]; // fallback
        }
    }

    displayReviewResult(content, formData) {
        const outputArea = document.getElementById('review-output');
        if (!outputArea) return;

        outputArea.innerHTML = `
            <div class="lesson-plan-result">
                <div class="lesson-header">
                    <h3>Bài Review đã tạo</h3>
                    <div class="lesson-info">
                        <span><strong>Lớp:</strong> ${formData.grade}</span>
                        <span><strong>Review:</strong> ${formData.reviewType}</span>
                        <span><strong>Kỹ năng:</strong> ${formData.selectedSkills.join(', ')}</span>
                    </div>
                </div>
                <div class="lesson-content">
                    ${content}
                </div>
                <div class="lesson-actions">
                    <button onclick="window.print()" class="action-btn secondary-btn">
                        <i class="fas fa-print"></i> In
                    </button>
                    <button onclick="reviewManager.exportReview()" class="action-btn primary-btn">
                        <i class="fas fa-download"></i> Xuất Word
                    </button>
                </div>
            </div>
        `;

        outputArea.scrollIntoView({ behavior: 'smooth' });
    }

    exportReview() {
        const content = document.querySelector('#review-output .lesson-content');
        if (!content) {
            alert('Không tìm thấy nội dung để xuất');
            return;
        }

        console.log('📄 Exporting Review to Word...');
    }

    show() {
        const reviewSidebar = document.getElementById('review-sidebar');
        const reviewContent = document.getElementById('review-content');
        
        if (reviewSidebar) {
            reviewSidebar.classList.add('active');
            reviewSidebar.style.display = 'block';
        }
        if (reviewContent) reviewContent.classList.add('active');
        
        console.log('👁️ Review tab shown - TabCoordinator manages other sidebars');
        
        if (!this.isInitialized) {
            this.init();
        }
    }

    hide() {
        const reviewSidebar = document.getElementById('review-sidebar');
        const reviewContent = document.getElementById('review-content');
        
        if (reviewSidebar) {
            reviewSidebar.classList.remove('active');
            reviewSidebar.style.display = 'none';
        }
        if (reviewContent) reviewContent.classList.remove('active');
        
        console.log('🙈 Review tab hidden');
    }

    hideOtherSidebars() {
        console.warn('⚠️ ReviewManager.hideOtherSidebars() is deprecated - TabCoordinator handles this');
    }
}

export const reviewManager = new ReviewManager();
window.reviewManager = reviewManager;