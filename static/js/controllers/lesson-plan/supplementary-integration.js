// /static/js/controllers/lesson-plan/supplementary-integration.js
// SUPPLEMENTARY TAB INTEGRATION - Fix and enhance supplementary functionality
// This file ensures supplementary tab works with new architecture

import { validateSupplementaryForm } from './core/validation.js';
import { lessonAPIService } from './services/lesson-api-service.js';
import { uiStateManager } from './ui/ui-state-manager.js';

/**
 * Enhanced Supplementary Manager
 * Integrates with new architecture while maintaining compatibility
 */
export class SupplementaryManagerV2 {
  constructor() {
    this.isInitialized = false;
    this.formElements = {};
    
    console.log('🔧 SupplementaryManagerV2 initialized');
  }

  /**
   * Initialize supplementary functionality
   */
  init() {
    if (this.isInitialized) {
      console.log('⚠️ SupplementaryManagerV2 already initialized');
      return;
    }

    this.findFormElements();
    this.setupEventListeners();
    this.setupStateSubscriptions();
    this.isInitialized = true;
    
    console.log('✅ SupplementaryManagerV2 fully initialized');
  }

  /**
   * Find and cache form elements
   */
  findFormElements() {
    this.formElements = {
      gradeSelect: document.getElementById('supplementary-grade-select'),
      unitSelect: document.getElementById('supplementary-unit-select'),
      skillsContainer: document.getElementById('supplementary-skills-container'),
      skillsCheckboxes: document.getElementById('supplementary-skills-checkboxes'),
      additionalInstructions: document.getElementById('supplementary-additional-instructions'),
      generateBtn: document.getElementById('generate-supplementary-btn') || 
                   document.getElementById('generate-lesson-plan-btn-supp'),
      outputArea: document.getElementById('supplementary-output')
    };

    // Log found elements for debugging
    Object.entries(this.formElements).forEach(([name, element]) => {
      if (element) {
        console.log(`✅ Found ${name}:`, element.id);
      } else {
        console.warn(`❌ Missing ${name}`);
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Generate button
    if (this.formElements.generateBtn) {
      this.formElements.generateBtn.addEventListener('click', () => this.generateSupplementaryLesson());
      console.log('✅ Supplementary generate button listener attached');
    }

    // Grade selection
    if (this.formElements.gradeSelect) {
      this.formElements.gradeSelect.addEventListener('change', () => {
        this.onGradeChange();
        this.validateFormRealTime();
      });
    }

    // Unit selection  
    if (this.formElements.unitSelect) {
      this.formElements.unitSelect.addEventListener('change', () => {
        this.onUnitChange();
        this.validateFormRealTime();
      });
    }

    // Skills checkboxes
    if (this.formElements.skillsCheckboxes) {
      const checkboxes = this.formElements.skillsCheckboxes.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => this.validateFormRealTime());
      });
    }

    // Additional instructions
    if (this.formElements.additionalInstructions) {
      this.formElements.additionalInstructions.addEventListener('input', () => this.validateFormRealTime());
    }

    console.log('🔗 Supplementary event listeners setup complete');
  }

  /**
   * Setup state subscriptions
   */
  setupStateSubscriptions() {
    // Subscribe to loading state changes
    uiStateManager.subscribe('loading:supplementary', (isLoading) => {
      this.updateLoadingUI(isLoading);
    });

    // Subscribe to form errors
    uiStateManager.subscribe('error:supplementaryForm', (error) => {
      this.displayFormError(error);
    });

    // Subscribe to notifications
    uiStateManager.subscribe('notification:added', (notification) => {
      if (notification.component === 'supplementary') {
        this.handleNotification(notification);
      }
    });
  }

  /**
   * Handle grade change
   */
  onGradeChange() {
    const grade = this.formElements.gradeSelect?.value;
    console.log('📚 Supplementary grade changed to:', grade);
    
    // Update UI based on grade selection
    if (grade) {
      this.showSkillsContainer();
    }
  }

  /**
   * Handle unit change
   */
  onUnitChange() {
    const unit = this.formElements.unitSelect?.value;
    console.log('📖 Supplementary unit changed to:', unit);
    
    // Update UI based on unit selection
    if (unit) {
      this.showSkillsContainer();
    }
  }

  /**
   * Show skills container
   */
  showSkillsContainer() {
    if (this.formElements.skillsContainer) {
      this.formElements.skillsContainer.style.display = 'block';
      console.log('👁️ Skills container shown');
    }
  }

  /**
   * Real-time form validation
   */
  validateFormRealTime() {
    const formData = this.getSupplementaryFormData();
    const validation = validateSupplementaryForm(formData);
    
    // Update form state
    uiStateManager.setFormState('supplementary', {
      isValid: validation.isValid,
      isDirty: true,
      errors: validation.errors
    });

    // Clear previous errors if form is now valid
    if (validation.isValid) {
      uiStateManager.setError('supplementaryForm', null);
    }

    return validation;
  }

  /**
   * Collect supplementary form data
   */
  getSupplementaryFormData() {
    const grade = this.formElements.gradeSelect?.value || '';
    const unit = this.formElements.unitSelect?.value || '';
    const additionalInstructions = this.formElements.additionalInstructions?.value || '';

    // Collect selected skills
    const selectedSkills = [];
    if (this.formElements.skillsCheckboxes) {
      const checkedBoxes = this.formElements.skillsCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
      checkedBoxes.forEach(checkbox => {
        selectedSkills.push(checkbox.value);
      });
    }

    return {
      grade,
      unit,
      selectedSkills,
      additionalInstructions
    };
  }

  /**
   * Generate supplementary lesson
   */
  async generateSupplementaryLesson() {
    console.log('🚀 Starting supplementary lesson generation...');
    
    try {
      // 1. Collect form data
      const formData = this.getSupplementaryFormData();
      
      // 2. Validate form data
      const validation = validateSupplementaryForm(formData);
      if (!validation.isValid) {
        uiStateManager.setError('supplementaryForm', validation.errors.join(', '));
        return;
      }

      // 3. Clear previous errors
      uiStateManager.setError('supplementaryForm', null);

      // 4. Set loading state
      uiStateManager.setLoadingState('supplementary', true);

      // 5. Generate lesson plan
      const response = await lessonAPIService.generateSupplementaryLesson(
        formData,
        (content) => this.handleStreamingContent(content),
        { 
          useCache: true, 
          language: uiStateManager.getLanguage() 
        }
      );

      // 6. Handle response
      if (response.success) {
        this.displaySupplementaryResult(response.content, formData);
        
        // Add success notification
        uiStateManager.addNotification({
          type: 'success',
          message: 'Giáo án tăng tiết đã được tạo thành công!',
          component: 'supplementary'
        });
        
        console.log('✅ Supplementary lesson generated successfully');
      } else {
        throw new Error(response.error || 'Có lỗi xảy ra khi tạo giáo án tăng tiết');
      }

    } catch (error) {
      console.error('❌ Supplementary lesson generation failed:', error);
      uiStateManager.setError('supplementaryForm', error.message);
    } finally {
      uiStateManager.setLoadingState('supplementary', false);
    }
  }

  /**
   * Handle streaming content updates
   */
  handleStreamingContent(content) {
    if (this.formElements.outputArea) {
      this.formElements.outputArea.innerHTML = `
        <div class="lesson-plan-result streaming">
          <div class="lesson-header">
            <h3>Đang tạo giáo án tăng tiết...</h3>
            <div class="streaming-indicator">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
          </div>
          <div class="lesson-content">
            ${content}
          </div>
        </div>
      `;
    }
  }

  /**
   * Display supplementary result
   */
  displaySupplementaryResult(content, formData) {
    if (!this.formElements.outputArea) return;

    const skillsText = formData.selectedSkills.join(', ') || 'Không có';

    this.formElements.outputArea.innerHTML = `
      <div class="lesson-plan-result">
        <div class="lesson-header">
          <h3>Giáo án tăng tiết đã tạo</h3>
          <div class="lesson-info">
            <span><strong>Lớp:</strong> ${formData.grade}</span>
            <span><strong>Unit:</strong> ${formData.unit}</span>
            <span><strong>Kỹ năng:</strong> ${skillsText}</span>
          </div>
        </div>
        <div class="lesson-content">
          ${content}
        </div>
        <div class="lesson-actions">
          <button onclick="window.print()" class="action-btn secondary-btn">
            <i class="fas fa-print"></i> In
          </button>
          <button onclick="supplementaryManagerV2.exportSupplementary()" class="action-btn primary-btn">
            <i class="fas fa-download"></i> Xuất Word
          </button>
        </div>
      </div>
    `;

    // Scroll to result
    this.formElements.outputArea.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Update loading UI
   */
  updateLoadingUI(isLoading) {
    if (this.formElements.generateBtn) {
      this.formElements.generateBtn.disabled = isLoading;
      this.formElements.generateBtn.innerHTML = isLoading 
        ? '<i class="fas fa-spinner fa-spin"></i> Đang tạo...'
        : '<i class="fas fa-plus"></i> Tạo giáo án tăng tiết';
    }

    if (isLoading && this.formElements.outputArea) {
      this.formElements.outputArea.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Đang tạo giáo án tăng tiết...</p>
        </div>
      `;
    }
  }

  /**
   * Display form error
   */
  displayFormError(error) {
    if (this.formElements.outputArea && error) {
      this.formElements.outputArea.innerHTML = `
        <div class="error-message">
          <h4>❌ Lỗi validation</h4>
          <p>${error}</p>
        </div>
      `;
    }
  }

  /**
   * Handle notifications
   */
  handleNotification(notification) {
    console.log(`📢 Supplementary notification: ${notification.message}`);
  }

  /**
   * Export supplementary lesson
   */
  exportSupplementary() {
    const content = this.formElements.outputArea?.querySelector('.lesson-content');
    if (!content) {
      uiStateManager.addNotification({
        type: 'warning',
        message: 'Không tìm thấy nội dung để xuất',
        component: 'supplementary'
      });
      return;
    }

    console.log('📄 Exporting supplementary lesson to Word...');
    // TODO: Implement Word export
  }

  /**
   * Show supplementary tab
   */
  show() {
    uiStateManager.setCurrentTab('supplementary');
    
    if (!this.isInitialized) {
      this.init();
    }
    
    console.log('👁️ Supplementary tab shown');
  }

  /**
   * Hide supplementary tab
   */
  hide() {
    console.log('🙈 Supplementary tab hidden');
  }

  /**
   * Get debug info
   */
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      formElements: Object.keys(this.formElements).reduce((acc, key) => {
        acc[key] = !!this.formElements[key];
        return acc;
      }, {}),
      formState: uiStateManager.getFormState('supplementary'),
      loadingState: uiStateManager.getLoadingState('supplementary')
    };
  }
}

// Create singleton instance
export const supplementaryManagerV2 = new SupplementaryManagerV2();

// Make available globally
window.supplementaryManagerV2 = supplementaryManagerV2;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => supplementaryManagerV2.init());
} else {
  supplementaryManagerV2.init();
}