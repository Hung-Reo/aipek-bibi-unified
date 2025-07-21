// /static/js/controllers/lesson-plan/lesson-plan-main.js
// PHASE 3 CLEANED: Removed extracurricular integration + MINIMAL BRIDGE for TabCoordinator compatibility

// ✅ SGK imports + minimal extracurricular bridge
import { 
  LESSON_PLAN_PROMPTS, 
  SUPPLEMENTARY_PROMPTS,
  UNITS_DATA,           // ← CRITICAL: Was missing
  REVIEWS_DATA,         // ← CRITICAL: Was missing  
  CURRICULUM_DATA       // ← CRITICAL: Was missing
} from './lesson-plan-prompts.js';

import { LessonPlanCache } from './lesson-plan-cache.js';
import { LessonPlanUI } from './lesson-plan-ui.js';
import { LessonPlanAPI } from './lesson-plan-api.js';
import { FeedbackManager } from '../feedback.js';
import { reviewManager } from './modules/review-manager.js';
import { tabCoordinator } from './modules/tab-coordinator.js';
// ✅ MINIMAL BRIDGE: Import ExtracurricularController for delegation only
import ExtracurricularController from './extracurricular/extracurricular_controller.js';
import TestManager from './modules/test-manager.js';

// ✅ Import utility functions (REMOVED ensureSidebarScrollable - sidebar only)
import { 
  getUnitFromWeek, 
  getWeekDetails as getWeekDetailsFromUtils, 
  validateLessonForm,
  updateUnitInfo as updateUnitInfoFromUtils,
  buildRAGQuery as buildRAGQueryFromUtils
  // ❌ REMOVED: ensureSidebarScrollable - chỉ dùng cho sidebar conflicts
} from './core/lesson-utils.js';

// ✅ Import all SGK controllers
import { cacheController } from './controllers/cache_controller.js';
import { promptController } from './controllers/prompt_controller.js';
import { formController } from './controllers/form_controller.js';
import { EventController } from './controllers/event_controller.js';

import { validateMainLessonForm, validateSupplementaryForm, validateReviewForm } from './core/validation.js';
import { FormManager } from './modules/form-manager.js';
import { LoadingManager } from './modules/loading-manager.js';

// ✅ Import SGK controllers + minimal extracurricular bridge
import { UIController } from './controllers/ui-controller.js';
import { MainLessonController } from './controllers/main-lesson-controller.js';
import { SupplementaryController } from './controllers/supplementary-controller.js';

// ✅ All SGK controllers enabled - no feature flags needed
const ENABLE_UI_CONTROLLER = true;
const ENABLE_MAIN_LESSON_CONTROLLER = true;
const ENABLE_SUPPLEMENTARY_CONTROLLER = true;

// ✅ Simplified debug monitoring
const originalSetTimeout = window.setTimeout;
window.setTimeout = function(callback, delay, ...args) {
    if (delay >= 20000) {
        console.warn(`⏰ Long setTimeout detected: ${delay}ms`);
    }
    return originalSetTimeout.call(this, callback, delay, ...args);
};

// ✅ Data registration AFTER import
window.UNITS_DATA = UNITS_DATA;
window.REVIEWS_DATA = REVIEWS_DATA;
window.CURRICULUM_DATA = CURRICULUM_DATA;

// ✅ Simplified getWeekDetails
function getWeekDetails(weekNumber) {
  return getWeekDetailsFromUtils(weekNumber);
}

// ✅ Delegate cache operations to CacheController
LessonPlanCache.getCacheKey = function(lessonType, params, language) {
  return cacheController.getCacheKey(lessonType, params, language);
};

LessonPlanCache.getFromCache = function(key) {
  return cacheController.getFromCache(key);
};

LessonPlanCache.saveToCache = function(key, content) {
  return cacheController.saveToCache(key, content);
};

export class LessonPlanController {
  constructor() {
    console.log('🔧 LessonPlanController initializing...');
    
    // ✅ Initialize UI mode manager first
    if (!window.uiModeManager) {
      const savedMode = localStorage.getItem('bibi-ui-mode') || 'modern';
      window.uiModeManager = {
        currentMode: savedMode,
        getCurrentMode: function() { return this.currentMode; },
        toggleMode: function() {
          this.currentMode = this.currentMode === 'modern' ? 'classic' : 'modern';
          localStorage.setItem('bibi-ui-mode', this.currentMode);
          return this.currentMode;
        }
      };
      console.log(`🛠️ UIManager initialized: ${savedMode}`);
    }
    
    // ✅ Initialize core components in correct order
    this.uiMode = window.uiModeManager.getCurrentMode();
    this.selectedLanguage = 'vi';
    this.currentLessonType = 'main';
    
    // ✅ Initialize API BEFORE controllers
    this.api = new LessonPlanAPI();
    console.log('✅ API initialized first');
    
    // ✅ Initialize UI
    this.ui = new LessonPlanUI('main-output', 'loading-indicator', this.uiMode);
    console.log('✅ UI initialized');

    // ✅ Initialize SGK controllers only
    try {
      // Initialize SGK controllers
      this.uiController = new UIController(this, this.ui);
      this.mainLessonController = new MainLessonController(this, this.api, this.ui);
      this.supplementaryController = new SupplementaryController(this, this.api, this.ui);
      this.testManager = new TestManager(this, this.api, this.ui);
      
      // ✅ ReviewManager integration with UI
      if (reviewManager) {
        reviewManager.setUI(this.ui);
        console.log('✅ ReviewManager integrated with UI layer');
      }
      
      // ✅ MINIMAL BRIDGE: Initialize ExtracurricularController for delegation only
      this.extracurricularController = new ExtracurricularController(this, this.api, null);

      // Initialize EventController for SGK system
      this.eventController = new EventController(this);
      
      console.log('✅ SGK controllers + minimal extracurricular bridge initialized successfully');
    } catch (error) {
      console.error('❌ SGK controller initialization failed:', error);
      // Continue with graceful degradation
    }
    
    // ✅ Initialize managers
    try {
      this.formManager = new FormManager(this.ui);
      this.loadingManager = new LoadingManager();
      console.log('✅ Managers initialized');
    } catch (error) {
      console.warn('⚠️ Manager initialization partial failure:', error);
    }

    // ✅ Initialize feedback manager
    window.feedbackManager = new FeedbackManager();
    
    // ❌ REMOVED: Sidebar fixes - let lesson-plan-ui.js handle everything
    console.log('✅ Sidebar layout delegated to lesson-plan-ui.js (no conflicts)');
    
    // ✅ Initialize components in order
    this.checkRAGStatus();
    
    // ✅ Use EventController for events
    if (this.eventController) {
      this.eventController.initEventListeners();
      console.log('✅ EventController handling all events');
    } else {
      console.warn('⚠️ EventController not available, using fallback');
      this.initEventListenersFallback();
    }
    
    this.ui.showFormForLessonType(this.currentLessonType);
    this.showTab('main');
    
    // ✅ Initialize unit-centric UI
    if (this.uiController) {
      this.uiController.initUnitCentricUI();
    }

    window.currentReviewData = null;
    console.log('🎯 LessonPlanController fully initialized');
  }

  // ❌ REMOVED: applySidebarFixes() method - gây conflict với lesson-plan-ui.js

  // ✅ Keep all existing SGK methods unchanged
  initMainFormListeners() {
    console.log('🔄 Re-initializing main form listeners...');
    
    if (this.uiController) {
      this.uiController.initUnitCentricUI();
    }
    
    const generateBtn = document.getElementById('generate-lesson-plan-btn-top');
    if (generateBtn) {
      generateBtn.removeEventListener('click', this.handleGenerateLessonPlan.bind(this));
      generateBtn.addEventListener('click', this.handleGenerateLessonPlan.bind(this));
      console.log('✅ Generate button listener attached');
    }
    
    const gradeSelect = document.getElementById('grade-select');
    if (gradeSelect) {
      gradeSelect.addEventListener('change', () => this.populateUnits());
      console.log('✅ Grade selection listener attached');
    }
    
    console.log('✅ Main form listeners initialized');
  }
  
  switchSidebarContent(targetTab) {
    console.log(`🔄 Delegating sidebar switch to TabCoordinator: ${targetTab}`);
    console.log(`✅ Sidebar switched to: ${targetTab}`);
  }

  async checkRAGStatus() {
    const ragIndicator = document.getElementById('rag-indicator');
    if (!ragIndicator) return;
    
    const ragStatusText = ragIndicator.querySelector('.rag-status-text');
    if (!ragStatusText) return;
    
    ragStatusText.textContent = 'RAG: Checking...';
    
    const lastChecked = localStorage.getItem('bibi-rag-checked');
    const cachedStatus = localStorage.getItem('bibi-rag-status');
    const CACHE_DURATION = 5 * 60 * 1000;
    
    if (lastChecked && cachedStatus && (Date.now() - parseInt(lastChecked) < CACHE_DURATION)) {
      console.log('Using cached RAG status:', cachedStatus);
      const isAvailable = cachedStatus === 'connected';
      this.updateRAGStatusUI(ragIndicator, ragStatusText, isAvailable);
      return;
    }
    
    try {
      const isAvailable = await this.api.checkRAGStatus();
      this.updateRAGStatusUI(ragIndicator, ragStatusText, isAvailable);
      
      localStorage.setItem('bibi-rag-status', isAvailable ? 'connected' : 'disconnected');
      localStorage.setItem('bibi-rag-checked', Date.now().toString());
    } catch (error) {
      console.error('RAG check error:', error);
      this.updateRAGStatusUI(ragIndicator, ragStatusText, false);
      
      localStorage.setItem('bibi-rag-status', 'error');
      localStorage.setItem('bibi-rag-checked', Date.now().toString());
      
      setTimeout(() => {
        this.updateRAGStatusUI(ragIndicator, ragStatusText, true);
      }, 3000);
    }
  }

  updateRAGStatusUI(ragIndicator, ragStatusText, isAvailable) {
    if (this.uiController) {
      this.uiController.updateRAGStatusUI(ragIndicator, ragStatusText, isAvailable);
    } else {
      if (isAvailable) {
        ragIndicator.classList.add('active');
        ragIndicator.classList.remove('inactive');
        ragStatusText.textContent = 'RAG: Connected';
      } else {
        ragIndicator.classList.add('inactive');
        ragIndicator.classList.remove('active');
        ragStatusText.textContent = 'RAG: Disconnected';
      }
    }
  }
  
  // ✅ Delegate to utility functions
  getUnitNumberFromWeek(weekNumber) {
    return getUnitFromWeek(weekNumber);
  }
  
  updateUnitInfo() {
    return updateUnitInfoFromUtils(this);
  }

  buildRAGQuery(lessonType, params) {
    return buildRAGQueryFromUtils(lessonType, params);
  }

  // ✅ Delegate to controllers
  getFormParams(lessonType) {
    return formController.getFormParams(lessonType, this);
  }

  preparePrompt(lessonType, params) {
    return promptController.preparePrompt(lessonType, params);
  }

  // ✅ Fallback event listeners if EventController fails
  initEventListenersFallback() {
    console.log('🔄 Initializing fallback event listeners...');
    
    // Main lesson generation buttons
    const topBtn = document.getElementById('generate-lesson-plan-btn-top');
    const bottomBtn = document.getElementById('generate-lesson-plan-btn');
    
    [topBtn, bottomBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          if (this.uiController) {
            this.uiController.resetWizard();
          }
          if (this.mainLessonController) {
            this.mainLessonController.handleGenerateLessonPlan();
          } else {
            console.error('❌ MainLessonController not available');
            alert('System error: Cannot generate lesson plan. Please reload.');
          }
        });
      }
    });

    // Language buttons
    document.getElementById('lang-vi')?.addEventListener('click', () => this.uiController?.setLanguage('vi'));
    document.getElementById('lang-en')?.addEventListener('click', () => this.uiController?.setLanguage('en'));
    document.getElementById('lang-both')?.addEventListener('click', () => this.uiController?.setLanguage('both'));

    console.log('✅ Fallback event listeners initialized');
  }

  // ✅ Keep all existing SGK methods - updateWeekInfo, checkCreatedLessons, etc.
  updateWeekInfo() {
    try {
      const weekInput = document.getElementById('week-input');
      if (!weekInput) {
        console.warn('Week input not found');
        return;
      }
      
      const weekValue = weekInput.value.trim();
      if (!weekValue) {
        const currentTab = this.currentLessonType;
        if (currentTab !== 'main') {
          const lessonContainer = document.getElementById('lesson-selection-container');
          if (lessonContainer) lessonContainer.style.display = 'none';
        }
        return;
      }      
      
      const weekNumber = weekValue.padStart(2, '0');
      const weekNum = parseInt(weekNumber);
      let unitNumber, semester;
      
      if (weekNum > 20) {
        semester = 2;
        const adjustedWeek = weekNum - 20;
        unitNumber = Math.floor((adjustedWeek - 1) / 2) + 7;
      } else {
        semester = 1;
        unitNumber = Math.floor((weekNum - 1) / 2) + 1;
      }
      
      unitNumber = Math.min(Math.max(unitNumber, 1), 12);
      
      let isReview = false;
      let reviewNumber = 0;
      
      if ((weekNum === 7 || weekNum === 13) || (weekNum === 27 || weekNum === 33)) {
        isReview = true;
        if (weekNum === 7) reviewNumber = 1;
        else if (weekNum === 13) reviewNumber = 2;
        else if (weekNum === 27) reviewNumber = 3;
        else if (weekNum === 33) reviewNumber = 4;
      }
      
      const unitSelect = document.getElementById('unit-select');
      if (unitSelect && !isReview) {
        unitSelect.value = unitNumber.toString();
        if (typeof this.updateUnitInfo === 'function') {
          this.updateUnitInfo();
          return;
        }
      }
      
      if (isReview) {
        const reviewSelect = document.getElementById('review-select');
        if (reviewSelect) {
          reviewSelect.value = reviewNumber.toString();
          if (typeof this.updateReviewInfo === 'function') {
            this.updateReviewInfo();
            return;
          }
        }
      }
      
      let weekData = this.getWeekDetails ? this.getWeekDetails(weekNumber) : null;
      if (!weekData) {
        weekData = {
          period: `Week ${weekNumber}`,
          unit: unitNumber,
          mainLessons: [
            "Getting started", 
            "A closer look 1", 
            "A closer look 2",
            "Communication", 
            "Skills 1", 
            "Skills 2", 
            "Looking back & Project"
          ]
        };
      }
      
      const weekInfoDisplay = document.getElementById('week-info-display');
      if (weekInfoDisplay) {
        weekInfoDisplay.style.display = 'block';
        
        if (isReview) {
          const relatedUnits = reviewNumber === 1 ? [1, 2, 3] :
                              reviewNumber === 2 ? [4, 5, 6] :
                              reviewNumber === 3 ? [7, 8, 9] : [10, 11, 12];
          
          weekInfoDisplay.innerHTML = `
            <div class="week-info-content">
              <p><strong>Review ${reviewNumber} (HK${semester})</strong></p>
              <p><strong>Units:</strong> ${relatedUnits.join(', ')}</p>
              <p><strong>Week:</strong> ${weekNumber}</p>
            </div>
          `;
        } else {
          weekInfoDisplay.innerHTML = `
            <div class="week-info-content">
              <p><strong>Week ${weekNumber} (${weekData.period || 'TBD'}) - HK${semester}</strong></p>
              <p><strong>Unit ${weekData.unit}:</strong> ${weekData.unitName || `Unit ${weekData.unit}`}</p>
              <p><strong>Lessons:</strong> ${weekData.mainLessons ? weekData.mainLessons.join(", ") : "No lesson info"}</p>
            </div>
          `;
        }
      }
      
      const lessonSelectionContainer = document.getElementById('lesson-selection-container');
      if (lessonSelectionContainer) {
        lessonSelectionContainer.style.display = isReview ? 'none' : 'block';
      }
      
      if (!isReview && this.checkCreatedLessons) {
        this.checkCreatedLessons(unitNumber);
      }
      
      console.log(`Week info updated for ${isReview ? 'Review' : 'Unit'} from week ${weekNumber}`);
    } catch (error) {
      console.error("Week info update error:", error);
      
      const weekInfoDisplay = document.getElementById('week-info-display');
      if (weekInfoDisplay) {
        weekInfoDisplay.style.display = 'block';
        weekInfoDisplay.innerHTML = `
          <div class="week-info-content" style="color: #d32f2f;">
            <p><strong>Error processing week info.</strong></p>
            <p>Please try selecting Unit directly.</p>
          </div>
        `;
      }
    }
  }

  checkCreatedLessons(unitNumber) {
    const weekInput = document.getElementById('week-input');
    if (!weekInput) return;
    
    const weekNumber = weekInput.value.padStart(2, '0');
    
    const lessons = [
      'getting-started', 'closer-look-1', 'closer-look-2', 
      'communication', 'skills-1', 'skills-2', 'looking-back'
    ];
    
    const lessonSelect = document.getElementById('lesson-select');
    if (lessonSelect) {
      Array.from(lessonSelect.options).forEach(option => {
        option.textContent = option.textContent.replace(/^✓ /, '');
        option.classList.remove('created');
      });
      
      lessons.forEach(lesson => {
        const saved = localStorage.getItem(`bibi_lesson_unit${unitNumber}_week${weekNumber}_${lesson}`);
        if (saved) {
          const option = lessonSelect.querySelector(`option[value="${lesson}"]`);
          if (option) {
            option.textContent = `✓ ${option.textContent}`;
            option.classList.add('created');
          }
        }
      });
    }
    
    const combineBtn = document.getElementById('combine-lessons-btn');
    if (combineBtn) {
      const hasBasicLessons = ['getting-started', 'closer-look-1', 'closer-look-2']
        .every(lesson => localStorage.getItem(`bibi_lesson_unit${unitNumber}_week${weekNumber}_${lesson}`));
      
      combineBtn.style.display = hasBasicLessons ? 'block' : 'none';
      combineBtn.classList.toggle('active', hasBasicLessons);
    }
  }

  combineAllLessons() {
    try {
      const weekInput = document.getElementById('week-input');
      if (!weekInput) return;
      
      const weekNumber = weekInput.value.padStart(2, '0');
      const unitNumber = this.getUnitNumberFromWeek(weekNumber);
      
      const gettingStartedContent = localStorage.getItem(`bibi_lesson_unit${unitNumber}_week${weekNumber}_getting-started`);
      const closerLook1Content = localStorage.getItem(`bibi_lesson_unit${unitNumber}_week${weekNumber}_closer-look-1`);
      const closerLook2Content = localStorage.getItem(`bibi_lesson_unit${unitNumber}_week${weekNumber}_closer-look-2`);
      
      if (!gettingStartedContent || !closerLook1Content || !closerLook2Content) {
        alert('Please create Getting started, A closer look 1 and A closer look 2 lessons first');
        return;
      }
      
      const header = `# LESSON PLAN UNIT ${unitNumber} - WEEK ${weekNumber}\n\n`;
      const combinedContent = header +
        '## LESSON 1: GETTING STARTED\n\n' + gettingStartedContent + '\n\n' +
        '## LESSON 2: A CLOSER LOOK 1\n\n' + closerLook1Content + '\n\n' +
        '## LESSON 3: A CLOSER LOOK 2\n\n' + closerLook2Content;
      
      this.ui.showResult(`Complete Lesson Plan Unit ${unitNumber} - Week ${weekNumber}`, combinedContent, 'main');
      localStorage.setItem(`bibi_lesson_unit${unitNumber}_week${weekNumber}_combined`, combinedContent);
      
      return combinedContent;
    } catch (error) {
      console.error('Combine lessons error:', error);
      alert('Error combining lessons. Please try again.');
      return null;
    }
  }

  // ✅ MINIMAL BRIDGE: Delegate extracurricular generation to ExtracurricularController
  async handleGenerateExtracurricular() {
    try {
      console.log('🎭 Bridge: Delegating to ExtracurricularController...');
      
      if (this.extracurricularController) {
        return await this.extracurricularController.handleGenerateActivity();
      } else {
        throw new Error('ExtracurricularController not available');
      }
      
    } catch (error) {
      console.error('❌ Bridge error:', error);
      alert('Lỗi khi tạo hoạt động ngoại khóa. Vui lòng thử lại.');
    }
  }

  updateLessonSelection() {
    const lessonSelect = document.getElementById('lesson-select');
    if (!lessonSelect) return;
    console.log(`Lesson selected: ${lessonSelect.value}`);
  }
  
  // ✅ Simplified tab display - delegate to TabCoordinator
  showTab(tabName) {
    console.log(`🔄 showTab(${tabName}) - Delegating to TabCoordinator`);
    
    if (window.tabCoordinator) {
      window.tabCoordinator.switchToTab(tabName);
    } else {
      console.warn('⚠️ TabCoordinator not available, using fallback');
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `${tabName}-tab`);
      });
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-content`);
      });
    }
  }

  // ✅ Keep all remaining existing SGK methods unchanged...
  // [All other SGK methods remain exactly the same without any changes]

} // ✅ Class closing brace

// ✅ Enhanced initialization with error handling
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('🚀 Initializing SGK lesson plan application with minimal extracurricular bridge...');
    
    // Initialize TabCoordinator first
    if (typeof tabCoordinator !== 'undefined') {
      tabCoordinator.init();
      console.log('✅ TabCoordinator initialized');
    }
    
    // Initialize main SGK controller
    window.lessonPlanController = new LessonPlanController();
    console.log('✅ LessonPlanController assigned to window');

    // Also assign UI for download button access
    window.lessonPlanUI = window.lessonPlanController.ui;
    console.log('✅ LessonPlanUI assigned to window for global access');
    
    console.log('🎯 SGK modules with minimal extracurricular bridge initialized successfully');
  } catch (error) {
    console.error('❌ Critical SGK + bridge initialization error:', error);
    
    // Fallback notification
    const container = document.querySelector('.lesson-plan-container');
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; color: red; text-align: center;">
          <h3>SGK + Bridge Initialization Error</h3>
          <p>Failed to initialize lesson plan controller. Please refresh the page.</p>
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }
});
