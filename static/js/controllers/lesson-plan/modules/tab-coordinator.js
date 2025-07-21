// /static/js/controllers/lesson-plan/modules/tab-coordinator.js
// Module điều phối navigation giữa các tab - COMPLETE FIX VERSION

import { reviewManager } from './review-manager.js';

export class TabCoordinator {
    constructor() {
        this.currentTab = 'main';
        this.isInitialized = false;
        this.isSwitching = false; // ✅ PREVENT RECURSION FLAG
        this.pendingTimeouts = new Set(); // ✅ TRACK TIMEOUTS
        this.createdSidebars = new Set(); // ✅ TRACK INJECTED SIDEBARS
        console.log('🎯 TabCoordinator initialized with cleanup management');
    }

    // Khởi tạo tab navigation
    init() {
        if (this.isInitialized) {
            console.warn('⚠️ TabCoordinator already initialized');
            return;
        }

        this.setupTabNavigation();
        this.switchToTab('main');
        this.isInitialized = true;
        console.log('✅ TabCoordinator initialized with main tab active');
    }

    // ✅ CLEAR ALL PENDING TIMEOUTS
    clearPendingTimeouts() {
        this.pendingTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.pendingTimeouts.clear();
        console.log('🧹 Cleared all pending timeouts');
    }

    // ✅ SAFE TIMEOUT WITH TRACKING
    safeSetTimeout(callback, delay, context = 'unknown') {
        const timeoutId = setTimeout(() => {
            this.pendingTimeouts.delete(timeoutId);
            callback();
        }, delay);
        
        this.pendingTimeouts.add(timeoutId);
        console.log(`⏰ Added timeout for ${context} (ID: ${timeoutId})`);
        return timeoutId;
    }

    // ✅ CLEANUP INJECTED SIDEBARS
    cleanupInjectedSidebars(keepSidebar = null) {
        const sidebarIds = ['supplementary-sidebar', 'review-sidebar',
            'extracurricular-sidebar', 'test-sidebar'];  // ✅ THÊM 'test-sidebar'
        
        sidebarIds.forEach(sidebarId => {
            if (keepSidebar && sidebarId === `${keepSidebar}-sidebar`) {
                return;
            }
            
            const sidebar = document.getElementById(sidebarId);
            if (sidebar && this.createdSidebars.has(sidebarId)) {
                console.log(`🗑️ REMOVING injected sidebar: ${sidebarId}`);
                sidebar.remove();
                this.createdSidebars.delete(sidebarId);
            }
        });
    }

    // Thiết lập navigation cho các tab
    setupTabNavigation() {
        const tabButtons = {
            'main-tab': 'main',
            'review-tab': 'review', 
            'supplementary-tab': 'supplementary',
            'extracurricular-tab': 'extracurricular',
            'test-tab': 'test'
        };

        Object.entries(tabButtons).forEach(([buttonId, tabName]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchToTab(tabName);
                });
            } else {
                console.error(`❌ Button not found: ${buttonId}`);
            }
        });
    }

    // Chuyển đổi tab - MAIN METHOD WITH COMPLETE CLEANUP
    switchToTab(tabName) {
        if (this.currentTab === tabName) return;
        
        // ✅ PREVENT RECURSION
        if (this.isSwitching) {
            console.warn(`⚠️ Tab switch in progress, ignoring: ${tabName}`);
            return;
        }
        
        this.isSwitching = true;
        console.log(`🔄 Switching from ${this.currentTab} to ${tabName}`);
        
        try {
            // ✅ STEP 1: COMPLETE CLEANUP
            this.clearPendingTimeouts();
            
            // ✅ STEP 2: SAVE CURRENT CONTENT
            if (this.currentTab && this.currentTab !== tabName) {
                this.saveTabContent(this.currentTab);
            }

            // ✅ STEP 3: CLEANUP UNUSED SIDEBARS (CRITICAL FIX)
            this.cleanupInjectedSidebars(tabName);

            // ✅ STEP 4: HIDE ALL CONTENT
            this.hideAllTabContent();
    
            // ✅ STEP 5: SIDEBAR MANAGEMENT
            this.hideOtherSidebars(tabName);
    
            // ✅ STEP 6: SHOW NEW CONTENT
            this.showTabContent(tabName);
    
            // ✅ STEP 7: SAFE ACTIVATION
            this.activateTabSafe(tabName);

            // ✅ STEP 8: UPDATE STATE
            this.currentTab = tabName;
            this.updateTabButtons();
            
            // ✅ STEP 9: DELAYED RESTORATION WITH ISOLATION
            this.safeSetTimeout(() => {
                // ✅ DOUBLE CHECK: Only restore if still current tab
                if (this.currentTab === tabName) {
                    this.restoreTabContent(tabName);
                    this.isSwitching = false;
                    console.log(`✅ Tab switch completed: ${tabName}`);
                } else {
                    console.log(`⚠️ Tab changed during restoration, skipping for ${tabName}`);
                    this.isSwitching = false;
                }
            }, 200, `restore-${tabName}`);
            
        } catch (error) {
            console.error(`❌ Error switching to tab ${tabName}:`, error);
            this.isSwitching = false;
        }
    }

    // ✅ Hide all tab content
    hideAllTabContent() {
        ['main', 'review', 'supplementary', 'extracurricular', 'test'].forEach(tab => {
            const content = document.getElementById(`${tab}-content`);
            if (content) {
                content.style.display = 'none';
                content.classList.remove('active');
            }
        });
    }

    // ✅ Show specific tab content
    showTabContent(tabName) {
        const newContent = document.getElementById(`${tabName}-content`);
        if (newContent) {
            newContent.style.display = 'block';
            newContent.classList.add('active');
        }
    }

    // ✅ Safe activation method - NO RECURSIVE CALLS
    activateTabSafe(tabName) {
        console.log(`🎯 Safe activating tab: ${tabName}`);
        
        // Only update button state
        this.activateTabButton(tabName);
        
        // Show sidebar and setup content WITHOUT triggering switchToTab again
        switch (tabName) {
            case 'main':
                this.showMainTabSafe();
                break;
            case 'review':
                this.showReviewTabSafe();
                break;
            case 'supplementary':
                this.showSupplementaryTabSafe();
                break;
            case 'extracurricular':
                this.showExtracurricularTabSafe();
                break;
            case 'test':
                this.showTestTabSafe();
                break;
            default:
                console.error(`❌ Unknown tab: ${tabName}`);
        }
    }

    // ✅ Safe show methods - NO RECURSIVE CALLS
    showMainTabSafe() {
        const mainSidebar = document.getElementById('main-sidebar');
        
        if (mainSidebar) {
            mainSidebar.classList.add('active');
            mainSidebar.style.display = 'block';
        }
        
        // ✅ ISOLATED WELCOME MESSAGE WITH TAB CHECK
        this.safeSetTimeout(() => {
            if (this.currentTab === 'main') {
                this.ensureWelcomeOrContent('main');
            }
        }, 100, 'main-welcome');
    }

    showReviewTabSafe() {
        // ✅ FIX: Force remove static sidebar and create dynamic one
        const existingSidebar = document.getElementById('review-sidebar');
        if (existingSidebar) {
            existingSidebar.remove();
            console.log('🗑️ Removed static review sidebar');
        }
        
        const container = document.querySelector('.lesson-plan-container');
        const reviewSidebar = window.lessonPlanController?.ui?.formManager?.injectSidebar('review', container);
        
        if (reviewSidebar) {
            this.createdSidebars.add('review-sidebar');
            reviewSidebar.classList.add('active');
            reviewSidebar.style.display = 'block';
            console.log('✅ Created dynamic review sidebar');
        }
    }

    showSupplementaryTabSafe() {
        let supplementarySidebar = document.getElementById('supplementary-sidebar');
        
        if (!supplementarySidebar) {
            supplementarySidebar = this.createSupplementarySidebar();
        }
        
        if (supplementarySidebar) {
            supplementarySidebar.classList.add('active');
            supplementarySidebar.style.display = 'block';
        }
        
        // ✅ ISOLATED WELCOME MESSAGE WITH TAB CHECK
        this.safeSetTimeout(() => {
            if (this.currentTab === 'supplementary') {
                this.ensureWelcomeOrContent('supplementary');
            }
        }, 100, 'supplementary-welcome');
    }

    showExtracurricularTabSafe() {
        let extracurricularSidebar = document.getElementById('extracurricular-sidebar');
        
        if (!extracurricularSidebar) {
            extracurricularSidebar = this.createExtracurricularSidebar();
        }
        
        if (extracurricularSidebar) {
            extracurricularSidebar.classList.add('active');
            extracurricularSidebar.style.display = 'block';
        }
        
        // ✅ ISOLATED WELCOME MESSAGE WITH TAB CHECK
        this.safeSetTimeout(() => {
            if (this.currentTab === 'extracurricular') {
                this.ensureWelcomeOrContent('extracurricular');
            }
        }, 100, 'extracurricular-welcome');
    }

    showTestTabSafe() {
        const container = document.querySelector('.lesson-plan-container');
        const testSidebar = window.lessonPlanController?.ui?.formManager?.injectSidebar('test', container);
        
        if (testSidebar) {
            this.createdSidebars.add('test-sidebar');
            testSidebar.classList.add('active');
            testSidebar.style.display = 'block';
            console.log('✅ Created dynamic test sidebar');
        }
        
        this.safeSetTimeout(() => {
            if (this.currentTab === 'test') {
                this.ensureWelcomeOrContent('test');
            }
        }, 100, 'test-welcome');
    }
    
    updateTabButtons() {
        const tabButtons = ['main', 'review', 'supplementary', 'extracurricular', 'test'];
        
        tabButtons.forEach(tabName => {
            const button = document.getElementById(`${tabName}-tab`);
            if (button) {
                if (tabName === this.currentTab) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }
    
    // ⚠️ LEGACY METHOD - Keep for backward compatibility but NOT used in new flow
    activateTab(tabName) {
        console.warn(`⚠️ Legacy activateTab called for ${tabName} - use activateTabSafe instead`);
        this.activateTabSafe(tabName);
    }

    // Kích hoạt tab button
    activateTabButton(tabName) {
        // Remove active from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active to current button
        const button = document.getElementById(`${tabName}-tab`);
        if (button) {
            button.classList.add('active');
        }
    }

    // ⚠️ LEGACY METHODS - Keep for backward compatibility but NOT used in new flow
    showMainTab() {
        console.warn('⚠️ Legacy showMainTab called - use showMainTabSafe instead');
        this.showMainTabSafe();
    }

    showReviewTab() {
        console.warn('⚠️ Legacy showReviewTab called - use showReviewTabSafe instead');
        this.showReviewTabSafe();
    }

    showSupplementaryTab() {
        console.warn('⚠️ Legacy showSupplementaryTab called - use showSupplementaryTabSafe instead');
        this.showSupplementaryTabSafe();
    }

    showExtracurricularTab() {
        console.warn('⚠️ Legacy showExtracurricularTab called - use showExtracurricularTabSafe instead');
        this.showExtracurricularTabSafe();
    }

    showTestTab() {
        console.warn('⚠️ Legacy showTestTab called - use showTestTabSafe instead');
        this.showTestTabSafe();
    }
    
    // ✅ IMPROVED: Create Supplementary sidebar with tracking
    createSupplementarySidebar() {
        const container = document.querySelector('.lesson-plan-container');
        if (!container) {
            console.error('❌ Container not found for sidebar injection');
            return null;
        }
        
        const formManager = window.lessonPlanController?.ui?.formManager;
        if (!formManager) {
            console.error('❌ FormManager not available');
            return null;
        }
        
        const formContent = formManager.formTemplates.supplementary;
        if (!formContent) {
            console.error('❌ Supplementary template not found');
            return null;
        }
        
        const sidebarHTML = `
            <div id="supplementary-sidebar" class="lesson-plan-sidebar" style="display: none;">
                ${formContent}
            </div>
        `;
        
        container.insertAdjacentHTML('afterbegin', sidebarHTML);
        this.setupSupplementaryEvents();
        
        // ✅ TRACK CREATED SIDEBAR
        this.createdSidebars.add('supplementary-sidebar');
        console.log('✅ Created and tracked supplementary-sidebar');
        
        return document.getElementById('supplementary-sidebar');
    }
    
    // Setup events cho supplementary sidebar
    setupSupplementaryEvents() {
        const generateBtn = document.getElementById('generate-supplementary-btn-top');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                if (window.lessonPlanController?.supplementaryController) {
                    window.lessonPlanController.supplementaryController.handleGenerateSupplementary();
                } else if (window.lessonPlanController?.handleGenerateSupplementary) {
                    window.lessonPlanController.handleGenerateSupplementary();
                } else {
                    console.error('❌ SupplementaryController not available');
                    alert('Lỗi hệ thống: Không thể tạo giáo án tăng tiết');
                }
            });
        }
    }

    // ✅ NEW: Create Extracurricular sidebar with tracking (copy supplementary pattern)
    createExtracurricularSidebar() {
        const container = document.querySelector('.lesson-plan-container');
        if (!container) {
            console.error('❌ Container not found for extracurricular sidebar injection');
            return null;
        }
        
        const formManager = window.lessonPlanController?.ui?.formManager;
        if (!formManager) {
            console.error('❌ FormManager not available for extracurricular');
            return null;
        }
        
        const formContent = formManager.formTemplates.extracurricular;
        if (!formContent) {
            console.error('❌ Extracurricular template not found');
            return null;
        }
        
        const sidebarHTML = `
            <div id="extracurricular-sidebar" class="lesson-plan-sidebar" style="display: none;">
                ${formContent}
            </div>
        `;
        
        container.insertAdjacentHTML('afterbegin', sidebarHTML);
        this.setupExtracurricularEvents();
        
        // ✅ TRACK CREATED SIDEBAR (same as supplementary)
        this.createdSidebars.add('extracurricular-sidebar');
        console.log('✅ Created and tracked extracurricular-sidebar');
        
        return document.getElementById('extracurricular-sidebar');
    }

    // Setup events cho extracurricular sidebar
    setupExtracurricularEvents() {
        const generateBtn = document.getElementById('generate-extracurricular-btn-top');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                // ✅ UPDATED: Try new controller first, fallback to old system
                if (window.lessonPlanController?.extracurricularController) {
                    console.log('🎭 Using new ExtracurricularController');
                    window.lessonPlanController.extracurricularController.handleGenerateActivity();
                } else if (window.lessonPlanController?.handleGenerateExtracurricular) {
                    console.log('🔄 Using legacy extracurricular handler');
                    window.lessonPlanController.handleGenerateExtracurricular();
                } else {
                    console.error('❌ No extracurricular controller available');
                    alert('Lỗi hệ thống: Không thể tạo hoạt động ngoại khóa');
                }
            });
            console.log('✅ Extracurricular generate button event attached (with new controller support)');
        } else {
            console.warn('⚠️ Generate button not found for extracurricular');
        }
        
        // ✅ THÊM: Clear cache khi topic thay đổi
        const topicInput = document.getElementById('topic-input-extra');
        if (topicInput) {
            let lastTopic = topicInput.value;
            
            topicInput.addEventListener('input', () => {
                const currentTopic = topicInput.value.trim();
                
                // Chỉ clear cache khi topic thay đổi đáng kể (>3 chars difference)
                if (lastTopic && currentTopic && 
                    Math.abs(currentTopic.length - lastTopic.length) > 3) {
                    
                    // Clear extracurricular cache
                    Object.keys(localStorage).forEach(key => {
                        if (key.includes('lesson_extracurricular')) {
                            localStorage.removeItem(key);
                        }
                    });
                    console.log('🧹 Cleared extracurricular cache - topic changed significantly');
                }
                
                lastTopic = currentTopic;
            });
            
            console.log('✅ Topic change detection attached');
        }
    }

    // Get current tab
    getCurrentTab() {
        return this.currentTab;
    }

    // Helper method to hide all sidebars except the specified one
    hideOtherSidebars(activeTab) {
        console.log(`🔄 Hiding other sidebars, showing: ${activeTab}`);
        
        // ✅ DYNAMIC LOOKUP: Find sidebars that actually exist in DOM
        const allSidebars = {
            main: document.getElementById('main-sidebar'),
            review: document.getElementById('review-sidebar'), 
            supplementary: document.getElementById('supplementary-sidebar'),
            extracurricular: document.getElementById('extracurricular-sidebar'),
            test: document.getElementById('test-sidebar')
        };
        
        // ✅ REFRESH DYNAMIC SIDEBARS: Check for newly created ones
        const dynamicSidebars = ['supplementary', 'review', 'extracurricular'];
        dynamicSidebars.forEach(type => {
            const sidebar = document.getElementById(`${type}-sidebar`);
            if (sidebar) {
                allSidebars[type] = sidebar;
            }
        });
        
        // Hide all sidebars
        Object.entries(allSidebars).forEach(([type, sidebar]) => {
            if (sidebar) {
                sidebar.style.setProperty('display', 'none', 'important');
                sidebar.classList.remove('active');
                console.log(`  ➤ Hidden ${type}-sidebar`);
            }
        });
        
        // Show active sidebar
        const activeSidebar = allSidebars[activeTab];
        if (activeSidebar) {
            activeSidebar.style.setProperty('display', 'block', 'important');
            activeSidebar.classList.add('active');
            console.log(`  ➤ Shown ${activeTab}-sidebar`);
        } else {
            console.warn(`⚠️ Active sidebar not found: ${activeTab}`);
        }
    }

    // Save tab content
    saveTabContent(tabName) {
        try {
            const outputArea = document.getElementById(`${tabName}-output`);
            if (!outputArea) return;
            
            const hasValidContent = this.hasValidContentForTab(outputArea, tabName);
            
            if (hasValidContent) {
                const content = outputArea.innerHTML;
                sessionStorage.setItem(`bibi_tab_content_${tabName}`, content);
                console.log(`💾 Saved content for ${tabName} (${content.length} chars)`);
            } else {
                sessionStorage.removeItem(`bibi_tab_content_${tabName}`);
                console.log(`🗑️ Removed invalid content for ${tabName}`);
            }
        } catch (error) {
            console.error(`❌ Error saving content for ${tabName}:`, error);
        }
    }

    // ✅ IMPROVED: Restore tab content with isolation check
    restoreTabContent(tabName) {
        try {
            // ✅ CRITICAL: Only restore for current tab
            if (this.currentTab !== tabName) {
                console.log(`⚠️ Skipping restore for ${tabName}, current tab is ${this.currentTab}`);
                return;
            }

            const savedContent = sessionStorage.getItem(`bibi_tab_content_${tabName}`);
            const outputArea = document.getElementById(`${tabName}-output`);
            
            if (!outputArea) return;
            
            // Clear existing content first
            outputArea.innerHTML = '';
            
            if (savedContent && savedContent.trim()) {
                if (this.isValidSavedContent(savedContent, tabName)) {
                    outputArea.innerHTML = savedContent;
                    this.reattachContentEvents(outputArea);
                    console.log(`📄 Restored content for ${tabName} (${savedContent.length} chars)`);
                } else {
                    console.log(`⚠️ Invalid saved content for ${tabName}, showing welcome`);
                    this.showWelcomeMessage(tabName);
                }
            } else {
                console.log(`👋 No saved content for ${tabName}, showing welcome`);
                this.showWelcomeMessage(tabName);
            }
        } catch (error) {
            console.error(`❌ Error restoring content for ${tabName}:`, error);
            this.showWelcomeMessage(tabName);
        }
    }

    // Validate saved content
    isValidSavedContent(savedContent, tabName) {
        if (!savedContent || savedContent.length < 100) return false;
        if (!savedContent.includes('lesson-plan-card') && !savedContent.includes('card-content')) return false;
        
        switch (tabName) {
            case 'main':
                return savedContent.includes('Unit');
            case 'supplementary':
                return savedContent.includes('tăng tiết') || savedContent.includes('bổ sung');
            case 'review':
                return savedContent.includes('Review') || savedContent.includes('ôn tập');
            default:
                return true;
        }
    }

    // Ensure welcome message or valid content shows
    ensureWelcomeOrContent(tabName) {
        // ✅ CRITICAL: Only process for current tab
        if (this.currentTab !== tabName) {
            console.log(`⚠️ Skipping ensureWelcome for ${tabName}, current tab is ${this.currentTab}`);
            return;
        }

        const outputArea = document.getElementById(`${tabName}-output`);
        if (!outputArea) return;
        
        const hasValidContent = this.hasValidContentForTab(outputArea, tabName);
        
        if (!hasValidContent) {
            outputArea.innerHTML = '';
            this.showWelcomeMessage(tabName);
        }
    }

    // Basic content validation
    hasValidContentForTab(outputArea, tabName) {
        if (!outputArea) return false;
        
        const content = outputArea.innerHTML.trim();
        if (!content || content.length < 200) return false;
        if (!content.includes('lesson-plan-card') && !content.includes('card-content')) return false;
        
        return true;
    }

    // Re-attach event listeners for restored content
    reattachContentEvents(outputArea) {
        try {
            const exportButtons = outputArea.querySelectorAll('.export-word-btn, .export-pdf-btn');
            exportButtons.forEach(btn => {
                if (!btn.dataset.eventAttached) {
                    btn.addEventListener('click', () => {
                        if (window.lessonPlanController?.ui?.exportToWord) {
                            window.lessonPlanController.ui.exportToWord(outputArea, outputArea.innerText);
                        }
                    });
                    btn.dataset.eventAttached = 'true';
                }
            });
        } catch (error) {
            console.warn('⚠️ Could not re-attach all event listeners:', error);
        }
    }

    // ✅ IMPROVED: Show welcome message with isolation
    showWelcomeMessage(tabType) {
        // ✅ CRITICAL: Only show welcome for current tab
        if (this.currentTab !== tabType) {
            console.log(`⚠️ Skipping welcome for ${tabType}, current tab is ${this.currentTab}`);
            return;
        }

        const outputArea = document.getElementById(`${tabType}-output`);
        if (!outputArea) return;
        
        console.log(`👋 Showing welcome message for ${tabType}`);
        
        // Try UIController first
        if (window.lessonPlanController?.uiController) {
            try {
                window.lessonPlanController.uiController.showTabWelcomeMessage(tabType);
                this.safeSetTimeout(() => {
                    if (this.currentTab === tabType) {
                        this.verifyWelcomeMessage(tabType);
                    }
                }, 100, `verify-${tabType}`);
                return;
            } catch (error) {
                console.warn(`⚠️ UIController failed for ${tabType}:`, error);
            }
        }
        
        // Fallback to direct creation
        this.createDirectWelcomeMessage(tabType, outputArea);
    }

    // Verify welcome message shows
    verifyWelcomeMessage(tabType) {
        // ✅ CRITICAL: Only verify for current tab
        if (this.currentTab !== tabType) {
            console.log(`⚠️ Skipping verify for ${tabType}, current tab is ${this.currentTab}`);
            return;
        }

        const outputArea = document.getElementById(`${tabType}-output`);
        if (!outputArea) return;
        
        const hasWelcome = outputArea.innerHTML.includes('welcome') ||
                          outputArea.innerHTML.includes('Chào mừng') ||
                          outputArea.innerHTML.includes('tab-welcome-message');
        
        if (!hasWelcome) {
            console.warn(`⚠️ Welcome message not found for ${tabType}, creating direct`);
            this.createDirectWelcomeMessage(tabType, outputArea);
        }
    }

    // Create welcome message directly
    createDirectWelcomeMessage(tabType, outputArea) {
        const welcomeMessages = {
            'main': {
                title: 'Soạn giáo án chính',
                content: 'Chọn Unit và tiết học để tạo giáo án chi tiết cho học sinh lớp 6.'
            },
            'supplementary': {
                title: 'Soạn giáo án tăng tiết', 
                content: 'Chọn Unit và kỹ năng cần rèn luyện để tạo giáo án tăng tiết với các bài tập bổ sung.'
            },
            'review': {
                title: 'Soạn bài Review',
                content: 'Chọn Review và kỹ năng để tạo giáo án ôn tập tổng hợp kiến thức đã học.'
            },

            'test': {
                title: 'Tạo đề kiểm tra',
                content: 'Chọn phạm vi kiểm tra, thời gian và độ khó để tạo đề kiểm tra tiếng Anh chuẩn cho học sinh.'
            },

            'extracurricular': {
                title: 'Soạn hoạt động ngoại khóa',
                content: 'Nhập chủ đề và thời lượng để tạo kế hoạch hoạt động ngoại khóa phù hợp với học sinh.'
            }
        };
        
        const welcome = welcomeMessages[tabType] || {
            title: 'Soạn giáo án',
            content: 'Điền thông tin cần thiết để tạo giáo án phù hợp.'
        };
        
        const welcomeHTML = `
            <div class="welcome-message tab-welcome-message" style="display: block; padding: 20px; background-color: #f5f9ff !important; border-left: 4px solid #4a6fa5 !important;">
                <h3 style="color: #4a6fa5; font-size: 18px; font-weight: 600; margin-bottom: 10px;">
                    Chào mừng đến với trợ lý ${welcome.title.toLowerCase()}!
                </h3>
                <p style="color: #666; line-height: 1.5; margin-bottom: 15px;">
                    ${welcome.content}
                </p>
                <p style="color: #666; line-height: 1.5;">Công cụ này giúp giáo viên:</p>
                <ul style="color: #666; line-height: 1.5; padding-left: 20px;">
                    <li>Tạo giáo án chi tiết dựa trên sách giáo khoa và chương trình giáo dục chính thức</li>
                    <li>Tiết kiệm thời gian soạn giáo án thông qua AI và cơ sở tri thức</li>
                    <li>Tùy chỉnh giáo án theo nhu cầu cụ thể</li>
                    <li>Xuất và lưu giáo án dễ dàng</li>
                </ul>
            </div>
        `;
        
        outputArea.innerHTML = welcomeHTML;
        console.log(`✅ Created direct welcome message for ${tabType}`);
    }

    // ✅ DEBUG METHOD
    debugStatus() {
        return {
            currentTab: this.currentTab,
            isSwitching: this.isSwitching,
            isInitialized: this.isInitialized,
            pendingTimeouts: this.pendingTimeouts.size,
            createdSidebars: Array.from(this.createdSidebars),
            activeSidebars: this.getActiveSidebars()
        };
    }

    getActiveSidebars() {
        const sidebars = ['main', 'review', 'supplementary', 'extracurricular', 'test'];
        return sidebars.filter(name => {
            const sidebar = document.getElementById(`${name}-sidebar`);
            return sidebar && getComputedStyle(sidebar).display !== 'none';
        });
    }

    // ✅ COMPLETE CLEANUP METHOD
    forceCleanup() {
        console.log('🧹 FORCE CLEANUP - Removing all injected sidebars');
        this.clearPendingTimeouts();
        this.cleanupInjectedSidebars(); // Remove all injected sidebars
        this.isSwitching = false;
        console.log('✅ Force cleanup completed');
    }
}

// Export singleton instance
export const tabCoordinator = new TabCoordinator();
window.tabCoordinator = tabCoordinator;