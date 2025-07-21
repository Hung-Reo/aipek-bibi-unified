// /static/js/controllers/lesson-plan/production-integration.js
// PRODUCTION INTEGRATION - Real integration with existing lesson-plan-main.js
// This file bridges the new architecture with the existing application

import { LessonPlanController } from './lesson-plan-main.js';

// Import new architecture modules
import { validateReviewForm, validateMainLessonForm, validateSupplementaryForm } from './core/validation.js';
import { getUnitFromWeek, getWeekDetails } from './core/lesson-utils.js';
import { lessonAPIService } from './services/lesson-api-service.js';
import { uiStateManager } from './ui/ui-state-manager.js';

// Import enhanced modules
import { reviewManagerV2 } from './modules/review-manager-v2.js';
import { tabCoordinatorV2 } from './modules/tab-coordinator-v2.js';

/**
 * ENHANCED LESSON PLAN CONTROLLER
 * Extends existing controller with new architecture capabilities
 */
export class EnhancedLessonPlanController extends LessonPlanController {
  constructor() {
    super();
    
    // Add new architecture components
    this.uiState = uiStateManager;
    this.apiService = lessonAPIService;
    this.tabCoordinator = tabCoordinatorV2;
    this.reviewManager = reviewManagerV2;
    
    // Feature flags
    this.useNewValidation = true;
    this.useNewAPIService = true;
    this.useNewStateManagement = true;
    
    console.log('🚀 Enhanced Lesson Plan Controller initialized');
  }

  /**
   * Override initialization to include new architecture
   */
  async init() {
    console.log('🔄 Initializing Enhanced Lesson Plan Controller...');
    
    try {
      // Initialize parent controller first
      await super.init();
      
      // Initialize new architecture components
      await this.initializeNewArchitecture();
      
      // Setup integrations
      this.setupNewArchitectureIntegrations();
      
      console.log('✅ Enhanced Lesson Plan Controller fully initialized');
    } catch (error) {
      console.error('❌ Enhanced initialization failed:', error);
      // Fallback to parent initialization only
      console.warn('🔄 Falling back to legacy initialization...');
    }
  }

  /**
   * Initialize new architecture components
   */
  async initializeNewArchitecture() {
    // Initialize UI State Manager
    this.uiState.setCurrentTab('main');
    this.uiState.setUIMode('modern');
    
    // Initialize enhanced tab coordinator
    this.tabCoordinator.init();
    
    // Initialize enhanced review manager
    this.reviewManager.init();
    
    // Check RAG status
    const ragStatus = await this.apiService.checkRAGStatus();
    this.uiState.setRAGStatus(ragStatus);
    
    console.log('🏗️ New architecture components initialized');
  }

  /**
   * Setup integrations between old and new architecture
   */
  setupNewArchitectureIntegrations() {
    // Subscribe to state changes and update legacy UI
    this.uiState.subscribe('currentTab', (newTab, oldTab) => {
      console.log(`🔄 State-driven tab change: ${oldTab} → ${newTab}`);
      // Update any legacy UI that depends on current tab
      this.updateLegacyTabUI(newTab);
    });

    // Subscribe to loading states
    this.uiState.subscribe('loading:main', (isLoading) => {
      this.updateLoadingButton('generate-lesson-plan-btn', isLoading, 'Tạo giáo án');
    });

    this.uiState.subscribe('loading:review', (isLoading) => {
      this.updateLoadingButton('generate-review-btn', isLoading, 'Tạo bài Review');
    });

    this.uiState.subscribe('loading:supplementary', (isLoading) => {
      this.updateLoadingButton('generate-supplementary-btn', isLoading, 'Tạo giáo án tăng tiết');
    });

    console.log('🔗 New architecture integrations setup complete');
  }

  /**
   * Update legacy tab UI when state changes
   */
  updateLegacyTabUI(newTab) {
    // Update any legacy UI elements that track current tab
    const legacyTabIndicator = document.getElementById('current-tab-indicator');
    if (legacyTabIndicator) {
      legacyTabIndicator.textContent = newTab;
    }
  }

  /**
   * Update loading button with enhanced UX
   */
  updateLoadingButton(buttonId, isLoading, defaultText) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = isLoading;
      if (isLoading) {
        const originalText = button.getAttribute('data-original-text') || defaultText;
        button.setAttribute('data-original-text', originalText);
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        button.classList.add('loading');
      } else {
        const originalText = button.getAttribute('data-original-text') || defaultText;
        button.innerHTML = `<i class="fas fa-magic"></i> ${originalText}`;
        button.classList.remove('loading');
      }
    }
  }

  /**
   * ENHANCED: Override getUnitNumberFromWeek to use new utilities
   */
  getUnitNumberFromWeek(weekNumber) {
    if (this.useNewValidation) {
      return getUnitFromWeek(weekNumber);
    } else {
      // Fallback to parent method
      return super.getUnitNumberFromWeek ? super.getUnitNumberFromWeek(weekNumber) : 1;
    }
  }

  /**
   * ENHANCED: Override updateWeekInfo to use new utilities
   */
  updateWeekInfo() {
    const weekSelect = document.getElementById('week-select');
    if (!weekSelect) return;

    const weekNumber = weekSelect.value;
    if (!weekNumber) return;

    // Use new utility function
    const weekDetails = getWeekDetails(parseInt(weekNumber));
    if (!weekDetails) return;

    // Update UI with enhanced information
    const weekInfoElement = document.getElementById('week-info');
    if (weekInfoElement) {
      weekInfoElement.innerHTML = `
        <div class="week-details enhanced">
          <div class="week-period">
            <strong>Tuần ${weekNumber}:</strong> ${weekDetails.period}
          </div>
          <div class="week-unit">
            <strong>Unit:</strong> ${weekDetails.unit} 
          </div>
          <div class="week-lessons">
            <strong>Bài học chính:</strong> ${weekDetails.mainLessons.join(', ')}
          </div>
          <div class="week-supplementary">
            <strong>Bài bổ trợ:</strong> ${weekDetails.suppLessons.join(', ')}
          </div>
        </div>
      `;
    }

    // Auto-update unit selection
    const unitSelect = document.getElementById('unit-select');
    if (unitSelect) {
      unitSelect.value = weekDetails.unit.toString();
      unitSelect.dispatchEvent(new Event('change'));
    }
  }

  /**
   * ENHANCED: Override form validation to use new validation module
   */
  validateForm(formType, formData) {
    if (!this.useNewValidation) {
      // Use legacy validation
      return super.validateForm ? super.validateForm(formType, formData) : { isValid: true, errors: [] };
    }

    // Use new validation module
    switch (formType) {
      case 'main':
        return validateMainLessonForm(formData);
      case 'review':
        return validateReviewForm(formData);
      case 'supplementary':
        return validateSupplementaryForm(formData);
      default:
        console.warn(`Unknown form type: ${formType}`);
        return { isValid: true, errors: [] };
    }
  }

  /**
   * ENHANCED: Override API calls to use new API service
   */
  async callLessonPlanAPI(lessonType, formData, streamCallback = null) {
    if (!this.useNewAPIService) {
      // Use legacy API calls
      return super.callLessonPlanAPI ? super.callLessonPlanAPI(lessonType, formData, streamCallback) : null;
    }

    // Use new API service
    const options = {
      useCache: true,
      language: this.uiState.getLanguage() || 'vi'
    };

    switch (lessonType) {
      case 'main':
        return this.apiService.generateMainLesson(formData, streamCallback, options);
      case 'review':
        return this.apiService.generateReviewLesson(formData, streamCallback, options);
      case 'supplementary':
        return this.apiService.generateSupplementaryLesson(formData, streamCallback, options);
      default:
        return this.apiService.generateLessonPlan(lessonType, formData, streamCallback, options);
    }
  }

  /**
   * ENHANCED: Override error handling to use state management
   */
  showError(component, message) {
    if (this.useNewStateManagement) {
      // Use new state management
      this.uiState.setError(`${component}Form`, message);
      this.uiState.addNotification({
        type: 'error',
        message: message,
        component: component
      });
    } else {
      // Fallback to legacy error display
      if (super.showError) {
        super.showError(component, message);
      } else {
        console.error(`${component} Error:`, message);
      }
    }
  }

  /**
   * ENHANCED: Override success handling to use state management
   */
  showSuccess(component, message) {
    if (this.useNewStateManagement) {
      // Use new state management
      this.uiState.addNotification({
        type: 'success',
        message: message,
        component: component
      });
    } else {
      // Fallback to legacy success display
      if (super.showSuccess) {
        super.showSuccess(component, message);
      } else {
        console.log(`${component} Success:`, message);
      }
    }
  }

  /**
   * ENHANCED: Override loading state management
   */
  setLoadingState(component, isLoading) {
    if (this.useNewStateManagement) {
      // Use new state management
      this.uiState.setLoadingState(component, isLoading);
    } else {
      // Fallback to legacy loading state
      if (super.setLoadingState) {
        super.setLoadingState(component, isLoading);
      }
    }
  }

  /**
   * Get debug information about enhanced controller
   */
  getDebugInfo() {
    return {
      parentController: super.getDebugInfo ? super.getDebugInfo() : 'No parent debug info',
      enhancedFeatures: {
        useNewValidation: this.useNewValidation,
        useNewAPIService: this.useNewAPIService,
        useNewStateManagement: this.useNewStateManagement
      },
      uiState: this.uiState.getDebugInfo(),
      apiServiceCache: this.apiService.getCacheSize(),
      tabCoordinatorState: this.tabCoordinator.getDebugInfo()
    };
  }

  /**
   * Toggle feature flags for testing
   */
  toggleFeature(featureName, enabled = null) {
    const currentValue = this[featureName];
    const newValue = enabled !== null ? enabled : !currentValue;
    
    this[featureName] = newValue;
    
    console.log(`🔧 Feature ${featureName}: ${currentValue} → ${newValue}`);
    
    this.uiState.addNotification({
      type: 'info',
      message: `Feature ${featureName} ${newValue ? 'enabled' : 'disabled'}`,
      timeout: 3000
    });
    
    return newValue;
  }
}

/**
 * PRODUCTION INITIALIZATION
 * Replace the original controller with enhanced version
 */
export async function initializeProductionIntegration() {
  console.log('🚀 Starting production integration...');
  
  try {
    // Create enhanced controller instance
    const enhancedController = new EnhancedLessonPlanController();
    
    // Initialize enhanced controller
    await enhancedController.init();
    
    // Make available globally for compatibility
    window.lessonPlanController = enhancedController;
    window.enhancedController = enhancedController;
    
    
    // Add notification about successful integration
    uiStateManager.addNotification({
      type: 'success',
      message: '🚀 Enhanced architecture loaded successfully!',
      timeout: 5000
    });
    
    console.log('✅ Production integration completed successfully');
    return enhancedController;
    
  } catch (error) {
    console.error('❌ Production integration failed:', error);
    
    // Add error notification
    uiStateManager.addNotification({
      type: 'error',
      message: 'Failed to load enhanced architecture. Using legacy mode.',
      timeout: 10000
    });
    
    // Fallback to original controller
    const originalController = new LessonPlanController();
    await originalController.init();
    window.lessonPlanController = originalController;
    
    return originalController;
  }
}

// Auto-initialize if not in demo mode
if (!window.migrationDemo || !window.migrationDemo.useNewArchitecture) {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProductionIntegration);
  } else {
    initializeProductionIntegration();
  }
}

// Export for manual usage
export default {
  EnhancedLessonPlanController,
  initializeProductionIntegration
};