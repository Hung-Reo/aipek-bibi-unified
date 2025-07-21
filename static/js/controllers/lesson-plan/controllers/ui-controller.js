// /static/js/controllers/lesson-plan/controllers/ui-controller.js
// ✅ ENHANCED VERSION - Unit Information with Real Names

import { uiStateManager } from '../ui/ui-state-manager.js';
import { getUnitFromWeek } from '../core/lesson-utils.js';

/**
 * UIController - Enhanced with proper Unit name handling
 */
export class UIController {
  constructor(parentController, ui, options = {}) {
    this.parent = parentController;
    this.ui = ui;
    console.log('🎯 UIController initialized');
  }

  /**
   * ✅ NEW: Get unit data from UNITS_DATA
   */
  getUnitData(unitNumber) {
    const unitsData = window.UNITS_DATA;
    if (!unitsData) {
      console.warn('⚠️ UNITS_DATA not available, using fallback');
      return this.getUnitDataFallback(unitNumber);
    }
    
    const unitData = unitsData[unitNumber];
    if (!unitData) {
      console.warn(`⚠️ No data found for Unit ${unitNumber}, using fallback`);
      return this.getUnitDataFallback(unitNumber);
    }
    
    return unitData;
  }

  /**
   * ✅ NEW: Fallback unit data if UNITS_DATA not available
   */
  getUnitDataFallback(unitNumber) {
    const fallbackUnits = {
      1: { name: "MY NEW SCHOOL", semester: 1 },
      2: { name: "MY HOUSE", semester: 1 },
      3: { name: "MY FRIENDS", semester: 1 },
      4: { name: "MY NEIGHBOURHOOD", semester: 1 }, // ← KEY FIX
      5: { name: "NATURAL WONDERS OF VIET NAM", semester: 1 },
      6: { name: "OUR TET HOLIDAY", semester: 1 },
      7: { name: "TELEVISION", semester: 2 },
      8: { name: "SPORTS AND GAMES", semester: 2 },
      9: { name: "CITIES OF THE WORLD", semester: 2 },
      10: { name: "OUR HOUSES IN THE FUTURE", semester: 2 },
      11: { name: "OUR GREENER WORLD", semester: 2 },
      12: { name: "ROBOTS", semester: 2 }
    };
    
    return fallbackUnits[unitNumber] || { name: `Unit ${unitNumber}`, semester: 1 };
  }

  /**
   * Get current active tab
   */
  getCurrentActiveTab() {
    const activeTabBtn = document.querySelector('.tab-btn.active');
    if (activeTabBtn) {
      const tabName = activeTabBtn.id.replace('-tab', '');
      console.log(`🎯 Current active tab detected: ${tabName}`);
      return tabName;
    }
    
    console.warn('⚠️ No active tab detected, defaulting to main');
    return 'main';
  }

  //Switch sidebar content - compatibility method
  switchSidebarContent(targetTab) {
    console.log(`🔄 Switching sidebar content to: ${targetTab} - DELEGATING to TabCoordinator`);
    console.log(`✅ Sidebar content switched to: ${targetTab}`);
  }

  /* Setup sidebar protection with aggressive monitoring */
  setupSidebarProtection() {
    const forceSidebarPosition = () => {
        const sidebar = document.querySelector('.lesson-plan-sidebar');
        if (sidebar) {
            const rect = sidebar.getBoundingClientRect();
            const computed = getComputedStyle(sidebar);
            
            if (computed.position !== 'fixed' || 
                rect.y < 0 || rect.y > window.innerHeight ||
                rect.x < -10 || rect.x > window.innerWidth) {
                
                console.log('🔧 PROTECTION: Force fixing sidebar positioning...');
                
                sidebar.style.setProperty('position', 'fixed', 'important');
                sidebar.style.setProperty('top', '120px', 'important');
                sidebar.style.setProperty('left', '0px', 'important');
                sidebar.style.setProperty('width', '280px', 'important');
                sidebar.style.setProperty('height', 'calc(100vh - 120px)', 'important');
                sidebar.style.setProperty('z-index', '1000', 'important');
                sidebar.style.setProperty('display', 'block', 'important');
                sidebar.style.setProperty('visibility', 'visible', 'important');
                sidebar.style.setProperty('background-color', '#f9f9f9', 'important');
                
                const container = document.querySelector('.lesson-plan-container');
                if (container) {
                    container.style.setProperty('margin-left', '280px', 'important');
                }
                
                console.log('✅ Protection fix applied');
            }
        }
    };
    
    const checkSidebarHealth = () => {
        const sidebar = document.querySelector('.lesson-plan-sidebar');
        if (!sidebar) {
            console.warn('⚠️ Sidebar not found in DOM');
            forceSidebarPosition();
            return;
        }
        
        const rect = sidebar.getBoundingClientRect();
        const computed = getComputedStyle(sidebar);
        
        const isHidden = computed.display === 'none' || computed.visibility === 'hidden';
        const isOffScreen = rect.x < -rect.width || rect.x > window.innerWidth;
        
        if (isHidden || isOffScreen) {
            console.warn('⚠️ Sidebar health check failed, applying fix...');
            forceSidebarPosition();
        }
    };
    
    forceSidebarPosition();
    checkSidebarHealth();
    
    if (this.sidebarCheckInterval) {
        clearInterval(this.sidebarCheckInterval);
    }
    
    this.sidebarCheckInterval = setInterval(() => {
        checkSidebarHealth();
    }, 2000);
    
    console.log('🛡️ Sidebar protection enabled with aggressive mode');
  }

  //Force sidebar restore with flex layout
  forceSidebarRestore() {
    const container = document.querySelector('.lesson-plan-container');
    const sidebar = document.querySelector('.lesson-plan-sidebar');
    const content = document.querySelector('.lesson-plan-content');
    
    if (!container || !sidebar || !content) return;
    
    const containerComputed = getComputedStyle(container);
    if (containerComputed.display !== 'flex') {
        container.style.setProperty('display', 'flex', 'important');
        container.style.setProperty('flex-direction', 'row', 'important');
        console.log('🔧 Đã khôi phục container layout');
    }
    
    const sidebarComputed = getComputedStyle(sidebar);
    if (sidebarComputed.display === 'none' || sidebarComputed.visibility === 'hidden') {
        sidebar.style.setProperty('display', 'block', 'important');
        sidebar.style.setProperty('visibility', 'visible', 'important');
        sidebar.style.setProperty('opacity', '1', 'important');
        sidebar.style.setProperty('width', '25%', 'important');
        sidebar.style.setProperty('min-width', '280px', 'important');
        sidebar.style.setProperty('flex-shrink', '0', 'important');
        console.log('🔧 Đã khôi phục sidebar');
    }
    
    const contentComputed = getComputedStyle(content);
    if (contentComputed.flex !== '1 1 0%') {
        content.style.setProperty('flex', '1', 'important');
        content.style.setProperty('min-width', '0', 'important');
        console.log('🔧 Đã khôi phục content area');
    }
  }

  /**
   * Reset wizard to initial state
   */
  resetWizard() {
    const wizard = document.getElementById('lesson-plan-wizard');
    if (!wizard) return;
  
    wizard.querySelectorAll('.wizard-pane').forEach(pane => pane.classList.remove('active'));
    wizard.querySelector('.wizard-pane[data-step="1"]').classList.add('active');
  
    wizard.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
    wizard.querySelector('.wizard-step[data-step="1"]').classList.add('active');
  
    const unitRadio = document.querySelector('input[name="lesson-type"][value="unit"]');
    if (unitRadio) {
      unitRadio.checked = true;
      unitRadio.dispatchEvent(new Event('change'));
    }
  
    const unitSelect = document.getElementById('unit-select');
    if (unitSelect && unitSelect.value) {
      if (this.parent && typeof this.parent.updateUnitInfo === 'function') {
        this.parent.updateUnitInfo();
      }
    }
  }

  /**
   * ✅ ENHANCED: Initialize Unit-centric UI with proper unit names
   */
  initUnitCentricUI() {
    try {
      console.log("🎯 UIController: Khởi tạo giao diện Unit-Centric...");
      
      if (this.parent && this.parent.currentLessonType === 'main') {
        const weekInputs = document.querySelectorAll('#week-input, .form-group input[placeholder="Nhập số tuần"]');
        weekInputs.forEach(input => {
          if (input && input.parentElement) {
            input.parentElement.style.display = 'none';
            console.log("Đã ẩn trường nhập tuần:", input.id || input.name);
          }
        });
        
        const unitSelects = document.querySelectorAll('#unit-select, .form-group select[id^="unit"]');
        let unitSelectFound = false;
        
        unitSelects.forEach(select => {
          if (select && select.parentElement) {
            select.parentElement.style.display = 'block';
            select.parentElement.style.marginTop = '20px';
            console.log("Đã hiển thị dropdown unit:", select.id || select.name);
            
            // ✅ ENHANCED: Populate with real unit names if empty
            if (select.options.length <= 1) {
              this.populateUnitSelect(select);
              unitSelectFound = true;
            }
            
            if (!select.value && select.options.length > 0) {
              select.value = "1";
              unitSelectFound = true;
              
              if (this.parent && typeof this.parent.updateUnitInfo === 'function') {
                this.parent.updateUnitInfo();
                console.log("Đã gọi updateUnitInfo() cho Unit 1");
              }
            }
          }
        });
        
        if (!unitSelectFound) {
          const wizardUnitSelect = document.querySelector('.wizard-pane[data-step="2"] select[id^="unit"]');
          if (wizardUnitSelect) {
            this.populateUnitSelect(wizardUnitSelect);
            wizardUnitSelect.value = "1";
            console.log("Đã đặt unit-select trong wizard");
            
            if (this.parent && typeof this.parent.updateUnitInfo === 'function') {
              this.parent.updateUnitInfo();
              console.log("Đã gọi updateUnitInfo() cho Unit 1 trong wizard");
            }
          }
        }
      }
      
      console.log("✅ UIController: Hoàn thành khởi tạo Unit-Centric UI");
    } catch (error) {
      console.error("❌ UIController: Lỗi khi khởi tạo Unit-Centric UI:", error);
    }
  }

  /**
   * ✅ NEW: Populate unit select with real names
   */
  populateUnitSelect(selectElement) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '';
    
    for (let unitNumber = 1; unitNumber <= 12; unitNumber++) {
      const unitData = this.getUnitData(unitNumber);
      const option = document.createElement('option');
      option.value = unitNumber.toString();
      option.textContent = `Unit ${unitNumber}: ${unitData.name}`;
      selectElement.appendChild(option);
    }
    
    console.log(`✅ Populated unit select with ${selectElement.options.length} units`);
  }

  /**
   * Show tab welcome message
   */
  showTabWelcomeMessage(tabType) {
    document.querySelectorAll('.tab-welcome-message').forEach(el => {
      el.style.display = 'none';
    });
    
    const welcomeMessage = document.getElementById(`${tabType}-welcome-message`);
    if (welcomeMessage) {
      welcomeMessage.style.display = 'block';
      
      welcomeMessage.classList.add('tab-welcome-message');
      
      const heading = welcomeMessage.querySelector('h3');
      if (heading) {
        heading.style.color = '#4a6fa5';
        heading.style.fontSize = '18px';
        heading.style.fontWeight = '600';
        heading.style.marginBottom = '10px';
      }
    }
  }

  /**
   * Update RAG status UI indicators
   */
  updateRAGStatusUI(indicator, statusText, isConnected) {
    if (isConnected) {
      indicator.classList.add('active');
      indicator.classList.remove('inactive');
      statusText.textContent = 'RAG: Kết nối';
    } else {
      indicator.classList.add('inactive');
      indicator.classList.remove('active');
      statusText.textContent = 'RAG: Không kết nối';
    }
  }

  /**
   * ✅ ENHANCED: Update week information with proper unit names
   */
  updateWeekInfo() {
    try {
      const weekInput = document.getElementById('week-input');
      if (!weekInput) {
        console.warn('DEBUG: Không tìm thấy phần tử week-input');
        return;
      }
      
      const weekValue = weekInput.value.trim();
      if (!weekValue) {
        const currentTab = this.parent ? this.parent.currentLessonType : 'main';
        if (currentTab !== 'main') {
          const lessonContainer = document.getElementById('lesson-selection-container');
          if (lessonContainer) lessonContainer.style.display = 'none';
        }
        return;
      }      
      
      const weekNumber = weekValue.padStart(2, '0');
      const unitNumber = getUnitFromWeek(parseInt(weekNumber));
      const weekNum = parseInt(weekNumber);
      const semester = weekNum > 20 ? 2 : 1;
      
      let isReview = false;
      let reviewNumber = 0;
      
      if ([7, 13, 27, 33].includes(weekNum)) {
        isReview = true;
        if (weekNum === 7) reviewNumber = 1;
        else if (weekNum === 13) reviewNumber = 2;
        else if (weekNum === 27) reviewNumber = 3;
        else if (weekNum === 33) reviewNumber = 4;
      }
      
      if (!isReview) {
        const unitSelect = document.getElementById('unit-select');
        if (unitSelect) {
          unitSelect.value = unitNumber.toString();
          
          if (this.parent && typeof this.parent.updateUnitInfo === 'function') {
            this.parent.updateUnitInfo();
            return;
          }
        }
      } else {
        const reviewSelect = document.getElementById('review-select');
        if (reviewSelect) {
          reviewSelect.value = reviewNumber.toString();
          
          if (this.parent && typeof this.parent.updateReviewInfo === 'function') {
            this.parent.updateReviewInfo();
            return;
          }
        }
      }
      
      console.log(`🎯 UIController: Updated week info - Week ${weekNumber}, Unit ${unitNumber}, Semester ${semester}`);
      
    } catch (error) {
      console.error("❌ UIController: Lỗi khi cập nhật thông tin tuần:", error);
    }
  }

  /**
   * ✅ ENHANCED: Update unit information display with real names
   */
  updateUnitInfoDisplay() {
    try {
      const unitSelect = document.getElementById('unit-select');
      if (!unitSelect || !unitSelect.value) {
        console.warn('DEBUG: Unit select not found or no value');
        return;
      }
      
      const unitNumber = parseInt(unitSelect.value, 10);
      if (isNaN(unitNumber) || unitNumber < 1 || unitNumber > 12) {
        console.warn(`DEBUG: Invalid unit number: ${unitSelect.value}`);
        return;
      }
      
      // ✅ NEW: Get real unit data
      const unitData = this.getUnitData(unitNumber);
      const semester = unitData.semester || (unitNumber <= 6 ? 1 : 2);
      
      // Calculate week information
      const startWeek = (unitNumber - 1) * 2 + 1;
      const endWeek = startWeek + 1;
      const startWeekFormatted = startWeek.toString().padStart(2, '0');
      const endWeekFormatted = endWeek.toString().padStart(2, '0');
      
      // Update week input
      const weekInput = document.getElementById('week-input');
      if (weekInput) {
        weekInput.value = startWeekFormatted;
      }
      
      // ✅ ENHANCED: Display with real unit name
      const weekInfoDisplay = document.getElementById('week-info-display');
      if (weekInfoDisplay) {
        weekInfoDisplay.style.display = 'block';
        weekInfoDisplay.innerHTML = `
          <div class="week-info-content">
            <p><strong>Tuần ${startWeekFormatted}-${endWeekFormatted} (HK${semester})</strong></p>
            <p><strong>Unit ${unitNumber}: ${unitData.name}</strong></p>
            <p><strong>Các tiết:</strong> ${this.getMainLessonsForUnit(unitNumber)}</p>
          </div>
        `;
      }
      
      // Show lesson selection
      const lessonSelectionContainer = document.getElementById('lesson-selection-container');
      if (lessonSelectionContainer) {
        lessonSelectionContainer.style.display = 'block';
      }
      
      // Check created lessons
      if (this.parent && this.parent.checkCreatedLessons) {
        this.parent.checkCreatedLessons(unitNumber);
      }
      
      console.log(`✅ Updated unit info display for Unit ${unitNumber}: ${unitData.name}`);
    } catch (error) {
      console.error("❌ Error updating unit info display:", error);
    }
  }

  /**
   * ✅ NEW: Get main lessons for a unit
   */
  getMainLessonsForUnit(unitNumber) {
    const unitData = this.getUnitData(unitNumber);
    
    if (unitData.lessons) {
      const lessonNames = Object.values(unitData.lessons).map(lesson => lesson.name);
      return lessonNames.join(", ");
    }
    
    // Fallback to standard lesson structure
    const lessons = [
      "Getting started", 
      "A closer look 1", 
      "A closer look 2",
      "Communication", 
      "Skills 1", 
      "Skills 2", 
      "Looking back & Project"
    ];
    
    return lessons.join(", ");
  }

  /**
   * Set language and update UI
   */
  setLanguage(lang) {
    if (this.parent) {
      this.parent.selectedLanguage = lang;
    }
    
    if (uiStateManager) {
      uiStateManager.setLanguage(lang);
    }
    
    document.getElementById('lang-vi')?.classList.toggle('active', lang === 'vi');
    document.getElementById('lang-en')?.classList.toggle('active', lang === 'en');
    document.getElementById('lang-both')?.classList.toggle('active', lang === 'both');
    
    console.log(`🌐 UIController: Đã chuyển ngôn ngữ sang: ${lang}`);
  }

  /**
   * Switch lesson type - compatibility method
   */
  switchLessonType(type) {
    console.log('⚠️ switchLessonType is deprecated, using TabCoordinator instead');
    
    if (window.tabCoordinator) {
      window.tabCoordinator.switchToTab(type);
      return;
    }
    
    if (this.parent) {
      this.parent.currentLessonType = type;
    }
    
    console.log(`🔄 UIController: Switched lesson type to ${type}`);
  }

  /**
   * ✅ ENHANCED: Get debug information with unit data
   */
  getDebugInfo() {
    const unitSelect = document.getElementById('unit-select');
    const currentUnit = unitSelect ? parseInt(unitSelect.value) : null;
    const unitData = currentUnit ? this.getUnitData(currentUnit) : null;
    
    return {
      currentTab: this.getCurrentActiveTab(),
      currentUnit: currentUnit,
      currentUnitName: unitData ? unitData.name : null,
      sidebarVisible: !!document.querySelector('.lesson-plan-sidebar:not([style*="display: none"])'),
      containerLayout: getComputedStyle(document.querySelector('.lesson-plan-container') || {}).display,
      unitsDataAvailable: !!window.UNITS_DATA,
      uiStateManager: uiStateManager ? uiStateManager.getDebugInfo() : null
    };
  }
}

export default UIController;