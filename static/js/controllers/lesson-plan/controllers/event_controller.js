// /static/js/controllers/lesson-plan/controllers/event-controller.js
// EXTRACTED FROM lesson-plan-main.js - Event listeners and handlers
// Handles all UI event management and interactions

/**
 * EventController - Centralized event management
 * EXTRACTED to reduce main.js complexity and improve event handling
 */
export class EventController {
  constructor(parentController) {
    this.parent = parentController;
    console.log('🎯 EventController initialized');
  }

  /**
   * Initialize all event listeners
   * EXTRACTED from lesson-plan-main.js:initEventListeners method (~200 lines)
   */
  initEventListeners() {
    console.log('🔧 EventController: Initializing all event listeners...');
    
    // Main lesson generation buttons
    this.initMainLessonEvents();
    
    // Language and theme controls
    this.initUIControlEvents();
    
    // Form input handlers
    this.initFormEvents();
    
    // Tab and lesson type handlers
    this.initTabEvents();
    
    // Show welcome message for default tab
    if (this.parent.uiController) {
      this.parent.uiController.showTabWelcomeMessage(this.parent.currentLessonType);
    }
    
    console.log('✅ All event listeners initialized');
  }

  /**
   * Initialize main lesson generation events
   * EXTRACTED from main lesson button handling
   */
  initMainLessonEvents() {
    const topBtn = document.getElementById('generate-lesson-plan-btn-top');
    const bottomBtn = document.getElementById('generate-lesson-plan-btn');
    
    [topBtn, bottomBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          if (this.parent.uiController) {
            this.parent.uiController.resetWizard();
          }
          if (this.parent.mainLessonController) {
            this.parent.mainLessonController.handleGenerateLessonPlan();
          } else {
            console.error('❌ MainLessonController not available');
            alert('System error: Cannot generate lesson plan. Please reload.');
          }
        });
        console.log(`✅ Main lesson button listener attached: ${btn.id}`);
      }
    });
  }

  /**
   * Initialize UI control events (language, theme)
   * EXTRACTED from UI control handling
   */
  initUIControlEvents() {
    // Language buttons
    const langButtons = [
      { id: 'lang-vi', lang: 'vi' },
      { id: 'lang-en', lang: 'en' },
      { id: 'lang-both', lang: 'both' }
    ];
    
    langButtons.forEach(({ id, lang }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          if (this.parent.uiController) {
            this.parent.uiController.setLanguage(lang);
          }
        });
        console.log(`✅ Language button listener attached: ${id}`);
      }
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('bibi-theme', theme);
        console.log(`🎨 Theme switched to: ${theme}`);
      });
      console.log('✅ Theme toggle listener attached');
    }
  }

  /**
   * Initialize form events
   * EXTRACTED from form handling logic
   */
  initFormEvents() {
    // Combine lessons button
    this.initCombineLessonsEvent();
    
    // Week input handling
    this.initWeekInputEvents();
    
    // Selection events
    this.initSelectionEvents();
    
    // Review form events
    this.initReviewEvents();
    
    // Supplementary events (delegate to controller)
    this.initSupplementaryEvents();
  }

  /**
   * Initialize combine lessons event
   */
  initCombineLessonsEvent() {
    const combineBtn = document.getElementById('combine-lessons-btn');
    if (combineBtn) {
      combineBtn.addEventListener('click', () => {
        if (this.parent.combineAllLessons) {
          this.parent.combineAllLessons();
        }
      });
      console.log('✅ Combine lessons button listener attached');
    }
  }

  /**
   * Initialize week input events
   */
  initWeekInputEvents() {
    const weekInput = document.getElementById('week-input');
    if (weekInput) {
      weekInput.addEventListener('change', () => {
        if (this.parent.currentLessonType !== 'main' && this.parent.currentLessonType !== 'review') {
          if (this.parent.updateWeekInfo) {
            this.parent.updateWeekInfo();
          }
        }
      });
      
      weekInput.addEventListener('input', () => {
        // Limit to 2 characters and only allow numbers
        weekInput.value = weekInput.value.replace(/\D/g, '').slice(0, 2);
      });
      
      console.log('✅ Week input listeners attached');
    }
  }

  /**
   * Initialize selection events
   */
  initSelectionEvents() {
    // Lesson selection
    const lessonSelect = document.getElementById('lesson-select');
    if (lessonSelect) {
      lessonSelect.addEventListener('change', () => {
        if (this.parent.updateLessonSelection) {
          this.parent.updateLessonSelection();
        }
      });
      console.log('✅ Lesson selection listener attached');
    }
    
    // Unit selection
    const unitSelect = document.getElementById('unit-select');
    if (unitSelect) {
      unitSelect.addEventListener('change', () => {
        if (this.parent.updateUnitInfo) {
          this.parent.updateUnitInfo();
        }
      });
      console.log('✅ Unit selection listener attached');
    }

    // Grade selection
    const gradeSelect = document.getElementById('grade-select');
    if (gradeSelect) {
      gradeSelect.addEventListener('change', () => {
        if (this.parent.populateUnits) {
          this.parent.populateUnits();
        }
      });
      console.log('✅ Grade selection listener attached');
    }
  }

  /**
   * Initialize review events
   */
  initReviewEvents() {
    // Review selection - main sidebar
    const reviewSelectMain = document.getElementById('review-select-main');
    if (reviewSelectMain) {
      reviewSelectMain.addEventListener('change', () => {
        if (this.parent.updateReviewInfoMain) {
          this.parent.updateReviewInfoMain();
        }
      });
      console.log('✅ Review selection (main) listener attached');
    }

    // Review generation button - main sidebar
    const generateReviewBtnMain = document.getElementById('generate-review-btn-main');
    if (generateReviewBtnMain) {
      generateReviewBtnMain.addEventListener('click', () => {
        if (this.parent.handleGenerateLessonPlan) {
          this.parent.handleGenerateLessonPlan();
        }
      });
      console.log('✅ Review generation (main) listener attached');
    }
    
    // Review selection - regular
    const reviewSelect = document.getElementById('review-select');
    if (reviewSelect) {
      reviewSelect.addEventListener('change', () => {
        if (this.parent.updateReviewInfo) {
          this.parent.updateReviewInfo();
        }
      });
      console.log('✅ Review selection listener attached');
    }
  }

  /**
   * Initialize supplementary events (delegate to controller)
   */
  initSupplementaryEvents() {
    console.log('🔧 Delegating Supplementary events to SupplementaryController...');
    
    if (this.parent.supplementaryController && typeof this.parent.supplementaryController.initSupplementaryEvents === 'function') {
      this.parent.supplementaryController.initSupplementaryEvents();
      console.log('✅ Supplementary events delegated successfully');
    } else {
      console.warn('⚠️ SupplementaryController not available, using fallback');
      this.initSupplementaryFallback();
    }
  }

  /**
   * Fallback supplementary events if controller not available
   */
  initSupplementaryFallback() {
    const generateBtn = document.getElementById('generate-supplementary-btn-top');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        if (this.parent.supplementaryController) {
          this.parent.supplementaryController.handleGenerateSupplementary();
        } else {
          alert('System error: SupplementaryController not ready');
        }
      });
      console.log('✅ Supplementary fallback listener attached');
    }
  }

  /**
   * Initialize tab events
   */
  initTabEvents() {
    // Radio button handling for lesson types
    const lessonTypeRadios = document.querySelectorAll('input[name="lesson-type"]');
    lessonTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          if (this.parent.switchLessonType) {
            this.parent.switchLessonType(radio.value);
          }
          
          // Ensure radio group remains visible after switch
          setTimeout(() => {
            this.ensureRadioGroupVisibility();
          }, 100);
        }
      });
    });
    
    console.log(`✅ ${lessonTypeRadios.length} lesson type radio listeners attached`);
  }

  /**
   * Ensure radio group visibility after tab switches
   */
  ensureRadioGroupVisibility() {
    const radioGroup = document.querySelector('.radio-group');
    if (radioGroup) {
      radioGroup.style.display = 'block';
    }
    
    // Ensure all radio buttons and labels are visible
    document.querySelectorAll('input[type="radio"][name="lesson-type"]').forEach(radio => {
      if (radio && radio.parentElement) {
        radio.parentElement.style.display = 'block';
        if (radio.parentElement.parentElement) {
          radio.parentElement.parentElement.style.display = 'block';
        }
      }
    });
  }

  /**
   * Add event listener with error handling
   * Utility method for safe event attachment
   */
  addSafeEventListener(elementId, event, handler, description = '') {
    try {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener(event, handler);
        console.log(`✅ Event listener attached: ${elementId} (${description})`);
        return true;
      } else {
        console.warn(`⚠️ Element not found: ${elementId}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to attach event listener to ${elementId}:`, error);
      return false;
    }
  }

  /**
   * Remove all event listeners (cleanup)
   * Utility method for cleanup
   */
  removeAllEventListeners() {
    console.log('🧹 EventController: Cleaning up event listeners...');
    
    // Note: This is a basic cleanup - in a real implementation,
    // we would store references to event handlers for proper removal
    
    const elementsWithEvents = [
      'generate-lesson-plan-btn-top',
      'generate-lesson-plan-btn',
      'lang-vi', 'lang-en', 'lang-both',
      'theme-toggle',
      'combine-lessons-btn',
      'week-input',
      'lesson-select',
      'unit-select', 
      'grade-select',
      'review-select-main',
      'generate-review-btn-main',
      'review-select',
      'generate-supplementary-btn-top'
    ];
    
    elementsWithEvents.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        // Clone and replace to remove all event listeners
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
      }
    });
    
    console.log('✅ Event listeners cleaned up');
  }

  /**
   * Reinitialize specific event types
   * Utility method for selective reinitialization
   */
  reinitializeEvents(eventTypes = ['all']) {
    console.log('🔄 EventController: Reinitializing events:', eventTypes);
    
    if (eventTypes.includes('all') || eventTypes.includes('main')) {
      this.initMainLessonEvents();
    }
    
    if (eventTypes.includes('all') || eventTypes.includes('form')) {
      this.initFormEvents();
    }
    
    if (eventTypes.includes('all') || eventTypes.includes('ui')) {
      this.initUIControlEvents();
    }
    
    if (eventTypes.includes('all') || eventTypes.includes('tabs')) {
      this.initTabEvents();
    }
    
    console.log('✅ Event reinitialization complete');
  }

  /**
   * Check event listener health
   * Debugging utility
   */
  checkEventHealth() {
    const criticalElements = [
      'generate-lesson-plan-btn-top',
      'unit-select',
      'lesson-select'
    ];
    
    const healthReport = {
      healthy: [],
      missing: [],
      total: criticalElements.length
    };
    
    criticalElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        healthReport.healthy.push(id);
      } else {
        healthReport.missing.push(id);
      }
    });
    
    healthReport.healthPercentage = Math.round((healthReport.healthy.length / healthReport.total) * 100);
    
    console.log('🏥 Event Health Report:', healthReport);
    
    if (healthReport.missing.length > 0) {
      console.warn('⚠️ Missing critical elements:', healthReport.missing);
    }
    
    return healthReport;
  }
}

// Create factory function for easy instantiation
export function createEventController(parentController) {
  return new EventController(parentController);
}

// Export for use in main controller
export default EventController;