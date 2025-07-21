// /static/js/controllers/lesson-plan/modules/form-manager.js
// ✅ ENHANCED VERSION - Unit Dropdown with Real Names

export class FormManager {
  constructor(parentUI) {
      this.parentUI = parentUI;
      this.formTemplates = this.initFormTemplates();
  }

  // ✅ ENHANCED: Add method to populate units dropdown with real names
  populateUnitsDropdown(selectElement, grade = 6) {
    if (!selectElement) return;
    
    // TODO: Remove this restriction when other grades are ready
    if (grade !== 6 && grade !== '6') {
      console.warn(`⚠️ Grade ${grade} not supported yet, using grade 6`);
      grade = 6; // Force to grade 6
    }
    
    // Access UNITS_DATA from window global
    const unitsData = window.UNITS_DATA;
    if (!unitsData) {
      console.warn('⚠️ UNITS_DATA not found, using fallback');
      return this.populateUnitsDropdownFallback(selectElement);
    }
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Populate with unit names
    for (let unitNumber = 1; unitNumber <= 12; unitNumber++) {
      const unitData = unitsData[unitNumber];
      const option = document.createElement('option');
      option.value = unitNumber.toString();
      
      if (unitData && unitData.name) {
        // ✅ FIX CHÍNH: Display "Unit X: NAME" instead of just "Unit X"
        option.textContent = `Unit ${unitNumber}: ${unitData.name}`;
      } else {
        // Fallback if data missing
        option.textContent = `Unit ${unitNumber}`;
        console.warn(`⚠️ Missing data for Unit ${unitNumber}`);
      }
      
      selectElement.appendChild(option);
    }
    
    console.log(`✅ Populated units dropdown with ${selectElement.options.length} units`);
  }
  
  // ✅ NEW: Fallback method if UNITS_DATA not available
  populateUnitsDropdownFallback(selectElement) {
    const fallbackUnits = [
      {num: 1, name: "MY NEW SCHOOL"},
      {num: 2, name: "MY HOUSE"},
      {num: 3, name: "MY FRIENDS"},
      {num: 4, name: "MY NEIGHBOURHOOD"}, // ← KEY FIX
      {num: 5, name: "NATURAL WONDERS OF VIET NAM"},
      {num: 6, name: "OUR TET HOLIDAY"},
      {num: 7, name: "TELEVISION"},
      {num: 8, name: "SPORTS AND GAMES"},
      {num: 9, name: "CITIES OF THE WORLD"},
      {num: 10, name: "OUR HOUSES IN THE FUTURE"},
      {num: 11, name: "OUR GREENER WORLD"},
      {num: 12, name: "ROBOTS"}
    ];
    
    selectElement.innerHTML = '';
    
    fallbackUnits.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit.num.toString();
      option.textContent = `Unit ${unit.num}: ${unit.name}`;
      selectElement.appendChild(option);
    });
    
    console.log('✅ Used fallback units data');
  }

  // ✅ ENHANCED: Updated templates with enhanced unit dropdowns
  initFormTemplates() {
      return {
        // ✅ ENHANCED: Main form với proper unit dropdown
        main: `
          <div class="form-panel simplified">
            <h4>Soạn giáo án chính</h4>
            
            <div class="form-group">
              <label for="grade-select">Khối lớp:</label>
              <select id="grade-select" class="full-width">
                <option value="6">Lớp 6</option>
              </select>
            </div>
            
            <div class="form-group" id="unit-select-container">
              <label for="unit-select">Unit:</label>
              <select id="unit-select" class="full-width">
                <!-- ✅ Will be populated by populateUnitsDropdown() -->
                <option value="">Chọn Unit...</option>
              </select>
            </div>
            
            <div class="form-group" id="review-select-container" style="display: none;">
              <label for="review-select">Review:</label>
              <select id="review-select" class="full-width">
                <option value="1">Review 1 (Units 1-3)</option>
                <option value="2">Review 2 (Units 4-6)</option>
                <option value="3">Review 3 (Units 7-9)</option>
                <option value="4">Review 4 (Units 10-12)</option>
              </select>
            </div>
            
          <!-- THÊM MỚI: Chọn kỹ năng khi Review -->
          <div class="form-group review-skills-container" id="review-skills-container" style="display: none;">
              <label>Chọn kỹ năng ôn tập (có thể chọn nhiều):</label>
              <div class="skills-list-with-separator" id="review-skills-checkboxes">
                  <span class="skill-item">Vocabulary<input type="checkbox" name="review-skill" value="vocabulary"></span>
                  <span class="skill-item">Pronunciation<input type="checkbox" name="review-skill" value="pronunciation"></span>
                  <span class="skill-item">Grammar<input type="checkbox" name="review-skill" value="grammar"></span>
                  <span class="skill-item">Reading<input type="checkbox" name="review-skill" value="reading"></span>
                  <span class="skill-item">Writing<input type="checkbox" name="review-skill" value="writing"></span>
                  <span class="skill-item">Listening<input type="checkbox" name="review-skill" value="listening"></span>
                  <span class="skill-item">Speaking<input type="checkbox" name="review-skill" value="speaking"></span>
              </div>
          </div>
            <div class="form-group">
              <label for="week-input">Tuần học:</label>
              <input type="text" id="week-input" placeholder="Nhập số tuần (Ví dụ: 01)" class="full-width">
            </div>
            
            <!-- Hiển thị thông tin tuần -->
            <div id="week-info-display" class="week-info-box" style="display: none;"></div>
            
            <!-- Dropdown chọn tiết -->
            <div class="form-group lesson-selection" id="lesson-selection-container">
              <label for="lesson-select">Tiết học:</label>
              <select id="lesson-select" class="form-control">
                <option value="getting-started">Tiết 1: Getting Started</option>
                <option value="closer-look-1">Tiết 2: A closer look 1</option>
                <option value="closer-look-2">Tiết 3: A closer look 2</option>
                <option value="communication">Tiết 4: Communication</option>
                <option value="skills-1">Tiết 5: Skills 1</option>
                <option value="skills-2">Tiết 6: Skills 2</option>
                <option value="looking-back">Tiết 7: Looking back & Project</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="additional-instructions">Yêu cầu đặc biệt (nếu có):</label>
              <textarea id="additional-instructions" rows="3" placeholder="Ví dụ: 'Trung bình' (cơ bản), 'Khá' (HS Khá), 'Giỏi' (HS Giỏi), hoặc yêu cầu khác..."></textarea>
            </div>
            
            <!-- Nút kết hợp (mặc định ẩn) -->
            <button id="combine-lessons-btn" class="action-btn combine-btn" style="display: none;">
              <i class="fas fa-object-group"></i> Kết hợp các tiết đã tạo
            </button>
          </div>
        `,
        
        // ✅ ENHANCED: Review template với unit names
        review: `
          <h3>Soạn bài Review</h3>
          <div class="lesson-plan-form">
            <button id="generate-review-btn-top" class="action-btn primary-btn sticky-btn">
              <i class="fas fa-redo"></i> Tạo bài Review
            </button>
            <div id="review-form-container">
              <div class="review-sidebar-content">
                <div class="form-panel">
                  <div class="form-group">
                    <label for="review-grade-select">Khối lớp:</label>
                    <select id="review-grade-select" class="full-width">
                      <option value="6">Lớp 6</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="review-type-select">Review:</label>
                    <select id="review-type-select" class="full-width">
                      <option value="">Chọn Review...</option>
                      <option value="1">Review 1 (Units 1-3): MY NEW SCHOOL, MY HOUSE, MY FRIENDS</option>
                      <option value="2">Review 2 (Units 4-6): MY NEIGHBOURHOOD, NATURAL WONDERS, OUR TET HOLIDAY</option>
                      <option value="3">Review 3 (Units 7-9): TELEVISION, SPORTS AND GAMES, CITIES OF THE WORLD</option>
                      <option value="4">Review 4 (Units 10-12): OUR HOUSES IN THE FUTURE, OUR GREENER WORLD, ROBOTS</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label>Chọn kỹ năng ôn tập (có thể chọn nhiều):</label>
                    <div class="skills-list-with-separator" id="review-skills-checkboxes" style="display:flex; flex-wrap:wrap;">
                      <span class="skill-item">Vocabulary<input type="checkbox" name="review-skill" value="vocabulary"></span>
                      <span class="skill-item">Pronunciation<input type="checkbox" name="review-skill" value="pronunciation"></span>
                      <span class="skill-item">Grammar<input type="checkbox" name="review-skill" value="grammar"></span>
                      <span class="skill-item">Reading<input type="checkbox" name="review-skill" value="reading"></span>
                      <span class="skill-item">Writing<input type="checkbox" name="review-skill" value="writing"></span>
                      <span class="skill-item">Listening<input type="checkbox" name="review-skill" value="listening"></span>
                      <span class="skill-item">Speaking<input type="checkbox" name="review-skill" value="speaking"></span>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="review-additional-instructions">Yêu cầu đặc biệt (nếu có):</label>
                    <textarea id="review-additional-instructions" rows="3" placeholder="Ví dụ: 'Trung bình' (cơ bản), 'Khá' (HS Khá), 'Giỏi' (HS Giỏi), hoặc yêu cầu khác..."></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        
        // ✅ ENHANCED: Supplementary template với unit dropdown
        supplementary: `
          <h3>Soạn giáo án tăng tiết</h3>
          <div class="lesson-plan-form">
            <button id="generate-supplementary-btn-top" class="action-btn primary-btn sticky-btn">
              <i class="fas fa-plus"></i> Tạo giáo án
            </button>
            <div id="supplementary-form-container">
              <div class="supplementary-sidebar-content">
                <div class="form-panel">
                  <div class="form-group">
                    <label for="grade-select-supp">Khối lớp:</label>
                    <select id="grade-select" class="full-width">
                      <option value="6">Lớp 6</option>
                    </select>
                  </div>
                  
                  <div class="form-group" id="unit-select-container-supp">
                    <label for="unit-select-supp">Unit:</label>
                    <select id="unit-select-supp" class="full-width">
                      <option value="1">Unit 1</option>
                      <option value="2">Unit 2</option>
                      <option value="3">Unit 3</option>
                      <option value="4">Unit 4</option>
                      <option value="5">Unit 5</option>
                      <option value="6">Unit 6</option>
                      <option value="7">Unit 7</option>
                      <option value="8">Unit 8</option>
                      <option value="9">Unit 9</option>
                      <option value="10">Unit 10</option>
                      <option value="11">Unit 11</option>
                      <option value="12">Unit 12</option>
                    </select>
                  </div>
                  
                  <div class="form-group" id="review-select-container-supp" style="display: none;">
                    <label for="review-select-supp">Review:</label>
                    <select id="review-select-supp" class="full-width">
                      <option value="1">Review 1 (Units 1-3)</option>
                      <option value="2">Review 2 (Units 4-6)</option>
                      <option value="3">Review 3 (Units 7-9)</option>
                      <option value="4">Review 4 (Units 10-12)</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label>Kỹ năng cần rèn luyện (có thể chọn nhiều):</label>
                    <div class="skills-list-with-separator" id="supp-skills-checkboxes" style="display:flex; flex-wrap:wrap;">
                      <span class="skill-item">Vocabulary<input type="checkbox" name="skill" value="vocabulary"></span>
                      <span class="skill-item">Pronunciation<input type="checkbox" name="skill" value="pronunciation"></span>
                      <span class="skill-item">Grammar<input type="checkbox" name="skill" value="grammar"></span>
                      <span class="skill-item">Reading<input type="checkbox" name="skill" value="reading"></span>
                      <span class="skill-item">Writing<input type="checkbox" name="skill" value="writing"></span>
                      <span class="skill-item">Listening<input type="checkbox" name="skill" value="listening"></span>
                      <span class="skill-item">Speaking<input type="checkbox" name="skill" value="speaking"></span>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="additional-instructions-supp">Yêu cầu đặc biệt (nếu có):</label>
                    <textarea id="additional-instructions-supp" rows="3" 
                      placeholder="Ví dụ: 'Trung bình' (cơ bản), 'Khá' (HS Khá), 'Giỏi' (HS Giỏi), hoặc yêu cầu khác..."
                      class="full-width"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        
        // Keep other templates unchanged
        extracurricular: `
          <h3>Soạn hoạt động ngoại khóa</h3>
          <div class="lesson-plan-form">
            <button id="generate-extracurricular-btn-top" class="action-btn primary-btn sticky-btn">
              <i class="fas fa-calendar-alt"></i> Tạo hoạt động ngoại khóa
            </button>
            
            <div id="extracurricular-form-container">
              <div class="extracurricular-sidebar-content">
                <div class="form-panel">
                  <div class="form-group">
                    <label for="grade-select-extra">Khối lớp:</label>
                    <select id="grade-select" class="full-width">
                      <option value="6">Lớp 6</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="topic-input-extra">Chủ đề hoạt động:</label>
                    <input type="text" id="topic-input-extra" placeholder="Nhập chủ đề (Ví dụ: English Club, Cultural Exchange)" class="full-width">
                  </div>
                  
                  <div class="form-group">
                    <label for="duration-input-extra">Thời lượng (phút):</label>
                    <input type="number" id="duration-input-extra" value="45" min="15" max="120" class="full-width">
                  </div>
                  
                  <div class="form-group">
                    <label for="additional-instructions-extra">Yêu cầu đặc biệt (nếu có):</label>
                    <textarea id="additional-instructions-extra" rows="3" 
                      placeholder="Ví dụ: 'Trung bình' (cơ bản), 'Khá' (HS Khá), 'Giỏi' (HS Giỏi), hoặc yêu cầu khác..."
                      class="full-width"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        
        test: `
          <h3>Soạn đề kiểm tra</h3>
          <div class="lesson-plan-form">
            <button id="generate-test-btn-top" class="action-btn primary-btn sticky-btn">
              <i class="fas fa-clipboard-check"></i> Tạo đề kiểm tra
            </button>
            
            <div id="test-form-container">
              <div class="test-sidebar-content">
                <div class="form-panel">
                  <h4>■ PHẠM VI KIỂM TRA</h4>
                  <div class="radio-group">
                    <label class="radio-container">
                      <input type="radio" name="test-scope" value="mid-hk1" checked> Giữa HK1 (Units 1-3)
                    </label>
                    <label class="radio-container">
                      <input type="radio" name="test-scope" value="final-hk1"> Cuối HK1 (Units 1-6)
                    </label>
                    <label class="radio-container">
                      <input type="radio" name="test-scope" value="mid-hk2"> Giữa HK2 (Units 7-9)
                    </label>
                    <label class="radio-container">
                      <input type="radio" name="test-scope" value="final-hk2"> Cuối HK2 (Units 7-12)
                    </label>
                  </div>
                </div>
                
                <div class="form-panel">
                  <h4>■ THỜI GIAN & CẤU TRÚC</h4>
                  <div class="form-group">
                    <label for="test-duration">Thời gian:</label>
                    <select id="test-duration" class="full-width">
                      <option value="60" selected>60 phút</option>
                      <option value="45">45 phút</option>
                      <option value="30">30 phút</option>
                      <option value="15">15 phút</option>
                    </select>
                  </div>
                  
                  <div id="test-structure-preview" class="test-preview" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                    <h5 style="margin: 0 0 8px 0; font-size: 14px;">Cấu trúc tự động:</h5>
                    <div id="preview-content" style="font-size: 12px; line-height: 1.3;">
                      • Listening: 10 câu (trắc nghiệm)<br>
                      • Language: 10 câu (trắc nghiệm)<br>
                      • Reading: 10 câu (trắc nghiệm)<br>
                      • Writing: 5 câu (tự luận)<br>
                      <hr style="margin: 6px 0; border: none; border-top: 1px solid #ddd;">
                      <strong>Tổng: 35 câu</strong>
                    </div>
                  </div>
                </div>
                
                <div class="form-panel">
                  <h4>■ TÙY CHỈNH</h4>
                  <div class="form-group">
                    <label for="test-difficulty">Độ khó:</label>
                    <select id="test-difficulty" class="full-width">
                      <option value="easy">Dễ</option>
                      <option value="medium" selected>Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="test-special-requirements">Yêu cầu đặc biệt:</label>
                    <textarea id="test-special-requirements" rows="3" 
                      placeholder="Ví dụ: 'Tập trung vào thì quá khứ và từ vựng về gia đình'"
                      class="full-width"></textarea>
                  </div>
                </div>

                <div class="form-panel">
                  <h4>■ AUDIO GENERATION</h4>
                  <div class="form-group">
                    <label class="audio-checkbox">
                      <input type="checkbox" id="generate-audio" checked>
                      🎧 Tạo Audio cho Listening (4 phút)
                    </label>
                  </div>
                  
                  <div class="audio-settings" id="audio-settings">
                    <div class="form-group">
                      <label for="tts-voice">Voice:</label>
                      <select id="tts-voice" class="full-width">
                        <option value="alloy">Alloy (Natural)</option>
                        <option value="echo" selected>Echo (Clear - Recommend)</option>
                        <option value="nova">Nova (Warm)</option>
                      </select>
                    </div>
                    
                    <div class="form-group">
                      <label for="tts-speed">Speed:</label>
                      <select id="tts-speed" class="full-width">
                        <option value="0.9">Slow (0.9x)</option>
                        <option value="1.0" selected>Normal (1.0x)</option>
                        <option value="1.1">Fast (1.1x)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      };  
  }

  // ✅ ENHANCED: Updated createSidebarForType with proper initialization
  createSidebarForType(type) {
    const formContent = this.formTemplates[type];
    if (!formContent) {
        console.error(`❌ No template found for type: ${type}`);
        return null;
    }
    
    const sidebarHTML = `
        <div id="${type}-sidebar" class="lesson-plan-sidebar" style="display: none;">
            ${formContent}
        </div>
    `;
    
    return sidebarHTML;
  }

  // ✅ ENHANCED: Updated injectSidebar with unit dropdown initialization
  injectSidebar(type, container) {
    if (!container) {
        console.error(`❌ Container not found for ${type} sidebar injection`);
        return null;
    }
    
    const sidebarHTML = this.createSidebarForType(type);
    if (!sidebarHTML) {
        console.error(`❌ Failed to create sidebar HTML for type: ${type}`);
        return null;
    }
    
    try {
      container.insertAdjacentHTML('afterbegin', sidebarHTML);
      this.setupSidebarEvents(type);
      
      // ✅ NEW: Initialize unit dropdowns after injection
      this.initializeUnitDropdowns(type);
      
      // ✅ FIX: Initialize Review-specific elements
      if (type === 'review' && window.reviewManager) {
          setTimeout(() => {
              if (!window.reviewManager.isInitialized) {
                  window.reviewManager.init();
                  console.log('✅ ReviewManager auto-initialized after sidebar injection');
              }
              window.reviewManager.populateReviewOptions();
          }, 100);
      }
        
        const injectedSidebar = document.getElementById(`${type}-sidebar`);
        if (injectedSidebar) {
            console.log(`✅ Successfully injected ${type} sidebar with enhanced units`);
            return injectedSidebar;
        } else {
            console.error(`❌ Sidebar element not found after injection: ${type}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error injecting ${type} sidebar:`, error);
        return null;
    }
  }

  // ✅ NEW: Initialize unit dropdowns for sidebar
  initializeUnitDropdowns(type) {
    let unitSelect = null;
    
    if (type === 'main') {
      unitSelect = document.getElementById('unit-select');
    } else if (type === 'supplementary') {
      unitSelect = document.getElementById('unit-select-supp');
    }
    
    if (unitSelect) {
      this.populateUnitsDropdown(unitSelect);
      console.log(`✅ Initialized unit dropdown for ${type}`);
    }
  }

  // ✅ ENHANCED: Updated showForm with unit dropdown initialization
  showForm(lessonType) {
      const formContainer = document.getElementById('lesson-plan-form-container');
      if (!formContainer) return;
      
      this.parentUI.currentLessonType = lessonType;
      
      formContainer.innerHTML = this.formTemplates[lessonType] || this.formTemplates.main;
      this.attachFormEvents(lessonType);
      
      // ✅ NEW: Initialize unit dropdown after showing form
      const unitSelect = document.getElementById('unit-select');
      if (unitSelect) {
        this.populateUnitsDropdown(unitSelect);
      }
      
      console.log(`📝 Đã chuyển form sang loại: ${lessonType} với enhanced units`);
  }

  // ✅ ENHANCED: Updated attachFormEvents with unit selection handling
  attachFormEvents(lessonType) {
      setTimeout(() => {
        // Handle unit selection change
        const unitSelect = document.getElementById('unit-select');
        if (unitSelect) {
          unitSelect.addEventListener('change', () => {
            const lessonContainer = document.getElementById('lesson-selection-container');
            if (lessonContainer && unitSelect.value) {
              lessonContainer.style.display = 'block';
              console.log('✅ Hiển thị lesson selection dropdown');
              
              // ✅ NEW: Update unit info when unit changes
              if (window.lessonPlanController && window.lessonPlanController.updateUnitInfo) {
                window.lessonPlanController.updateUnitInfo();
              }
            }
          });
        }
        
        // Handle grade selection change
        const gradeSelect = document.getElementById('grade-select');
        if (gradeSelect) {
          gradeSelect.addEventListener('change', () => {
            // TODO: Remove this restriction when other grades are ready
            if (gradeSelect.value !== '6') {
              alert('Hiện tại chỉ hỗ trợ lớp 6. Lớp 7,8,9 sẽ cập nhật sớm.');
              gradeSelect.value = '6'; // Force back to grade 6
              return; // Exit early
            }
            
            const unitSelect = document.getElementById('unit-select');
            if (unitSelect) {
              this.populateUnitsDropdown(unitSelect, gradeSelect.value);
              console.log(`✅ Updated units for grade ${gradeSelect.value}`);
            }
          });
        }
        
        // Keep existing event handlers...
        const unitRadio = document.getElementById(`type-unit${lessonType === 'main' ? '' : '-' + lessonType}`);
        const reviewRadio = document.getElementById(`type-review${lessonType === 'main' ? '' : '-' + lessonType}`);
        
        if (unitRadio && reviewRadio) {
          unitRadio.addEventListener('change', () => this.toggleContentTypeContainers(lessonType, true));
          reviewRadio.addEventListener('change', () => this.toggleContentTypeContainers(lessonType, false));
          this.toggleContentTypeContainers(lessonType, unitRadio.checked);
        }
        
        const weekInput = document.getElementById(`week-input${lessonType === 'main' ? '' : '-' + lessonType}`);
        if (weekInput) {
          weekInput.addEventListener('input', () => {
            weekInput.value = weekInput.value.replace(/\D/g, '').slice(0, 2);
            const event = new Event('change');
            weekInput.dispatchEvent(event);
          });
          
          weekInput.addEventListener('change', () => {
            if (typeof this.parentUI.updateWeekInfo === 'function') {
              this.parentUI.updateWeekInfo();
            } else if (window.lessonPlanController && typeof window.lessonPlanController.updateWeekInfo === 'function') {
              window.lessonPlanController.updateWeekInfo();
            }
          });
        }
        
        const skillsContainer = document.querySelector('.skills-selection');
        if (skillsContainer && (lessonType === 'supplementary' || lessonType === 'test')) {
          this.createSkillCheckboxes(skillsContainer, lessonType === 'test' ? 'test-skill' : 'skill');
        }
      }, 100);
  }

  // ✅ Keep all remaining methods unchanged...
  setupSidebarEvents(type) {
    const generateBtn = document.getElementById(`generate-${type}-btn-top`);
    
    if (generateBtn && window.lessonPlanController) {
      generateBtn.addEventListener('click', () => {
          switch(type) {
            case 'review':
              // ✅ FIX: Initialize ReviewManager if not already done
              if (window.reviewManager && !window.reviewManager.isInitialized) {
                  window.reviewManager.init();
                  console.log('✅ ReviewManager initialized via sidebar setup');
              }
              if (window.reviewManager && window.reviewManager.generateReview) {
                  window.reviewManager.generateReview();
              } else if (window.lessonPlanController.handleGenerateLessonPlan) {
                  // Fallback to old method
                  window.lessonPlanController.handleGenerateLessonPlan();
              } else {
                  console.error('❌ Review generation method not available');
                  alert('Lỗi hệ thống: Không thể tạo bài Review');
              }
              break;
          case 'supplementary':
              if (window.lessonPlanController.supplementaryController) {
                  window.lessonPlanController.supplementaryController.handleGenerateSupplementary();
              } else {
                  console.error('❌ SupplementaryController not available');
                  alert('Lỗi hệ thống: Không thể tạo giáo án tăng tiết');
              }
              break;
          case 'test':
              if (window.lessonPlanController.testManager) {
                  window.lessonPlanController.testManager.generateTest();
              } else {
                  console.error('❌ TestManager not available');
                  alert('Lỗi hệ thống: Không thể tạo đề kiểm tra');
              }
              break;
                default:
                    console.warn(`⚠️ No handler defined for type: ${type}`);
            }
        });
        console.log(`✅ Events setup for ${type} sidebar`);
    } else {
        console.warn(`⚠️ Generate button or controller not found for ${type}`);
    }
    // ✅ THÊM: Test-specific auto-distribution logic
    if (type === 'test') {
      this.setupTestDistributionPreview();
    }
    
    if (type === 'review') {
        const reviewSelect = document.getElementById('review-type-select');
        if (reviewSelect && window.lessonPlanController) {
            reviewSelect.addEventListener('change', () => {
                if (window.lessonPlanController.updateReviewInfoMain) {
                    window.lessonPlanController.updateReviewInfoMain();
                }
            });
            console.log(`✅ Review select events setup`);
        }
    }
  }

  // ✅ THÊM METHOD MỚI sau setupSidebarEvents()
  setupTestDistributionPreview() {
    setTimeout(() => {
        const durationSelect = document.getElementById('test-duration');
        if (durationSelect) {
            // Setup change listener
            durationSelect.addEventListener('change', this.updateTestPreview);
            
            // Trigger initial preview
            this.updateTestPreview();
            
            console.log('✅ Test distribution preview setup completed');
        } else {
            console.warn('⚠️ Test duration select not found');
        }
    }, 200);
  }

  // ✅ THÊM METHOD MỚI
  updateTestPreview() {
    const duration = document.getElementById('test-duration')?.value || 60;
    
    const distributions = {
        60: {listening: 10, language: 10, reading: 10, writing: 5, total: 35},
        45: {listening: 7, language: 8, reading: 6, writing: 2, total: 23},  
        30: {listening: 5, language: 5, reading: 4, writing: 1, total: 15},
        15: {listening: 3, language: 3, reading: 2, writing: 0, total: 8}
    };
    
    const dist = distributions[duration];
    const previewContent = document.getElementById('preview-content');
    
    if (previewContent && dist) {
        previewContent.innerHTML = `
          <div style="font-size: 12px; line-height: 1.3;">
          • Listening: ${dist.listening} câu (trắc nghiệm)<br>
          • Language: ${dist.language} câu (trắc nghiệm)<br>
          • Reading: ${dist.reading} câu (trắc nghiệm)<br>
          • Writing: ${dist.writing} câu (tự luận)<br>
          <hr style="margin: 6px 0; border: none; border-top: 1px solid #ddd;">
          <strong>Tổng: ${dist.total} câu</strong>
          </div>
      `;
        
        console.log(`✅ Updated test preview for ${duration} minutes: ${dist.total} questions`);
    } else {
        console.warn('⚠️ Preview content element not found or invalid duration');
    }
  }

  // Keep all other existing methods...
  updateReviewSkillsContainer(show) {
      const reviewSkillsContainer = document.getElementById('review-skills-container');
      if (reviewSkillsContainer) {
      reviewSkillsContainer.style.display = show ? 'block' : 'none';
      }
  }

  createSkillCheckboxes(container, namePrefix, skills = null) {
      if (!container) return;
      
      container.innerHTML = '';
      
      const defaultSkills = [
          { value: 'vocabulary', label: 'Vocabulary (Từ vựng)' },
          { value: 'pronunciation', label: 'Pronunciation (Phát âm)' },
          { value: 'grammar', label: 'Grammar (Ngữ pháp)' },
          { value: 'reading', label: 'Reading (Đọc)' },
          { value: 'writing', label: 'Writing (Viết)' },
          { value: 'listening', label: 'Listening (Nghe)' },
          { value: 'speaking', label: 'Speaking (Nói)' }
      ];
      
      const skillsToUse = skills || defaultSkills;
      
      const checkboxesWrapper = document.createElement('div');
      checkboxesWrapper.className = 'skills-checkboxes';
      container.appendChild(checkboxesWrapper);
      
      skillsToUse.forEach(skill => {
          const label = document.createElement('label');
          label.className = 'checkbox-container';
          
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.name = namePrefix || 'skill';
          input.value = skill.value;
          
          const labelText = document.createElement('span');
          labelText.textContent = skill.label;
          labelText.className = 'checkbox-label';
          
          label.appendChild(input);
          label.appendChild(labelText);
          
          checkboxesWrapper.appendChild(label);
      });
  }

  getSelectedSkills(namePrefix) {
      const prefixes = Array.isArray(namePrefix) ? namePrefix : [namePrefix || 'skill'];
      let selectedSkills = [];
      
      prefixes.forEach(prefix => {
        const checkboxes = document.querySelectorAll(`input[name="${prefix}"]`);
        checkboxes.forEach(checkbox => {
          if (checkbox.checked) {
            selectedSkills.push(checkbox.value);
          }
        });
      });
      
      return selectedSkills;
  }

  // Keep all remaining methods unchanged...
  toggleContentTypeContainers(lessonType, showUnit) {
      const suffix = lessonType === 'main' ? '' : '-' + lessonType;
      const unitContainer = document.getElementById(`unit-select-container${suffix}`);
      const reviewContainer = document.getElementById(`review-select-container${suffix}`);
      
      if (unitContainer && reviewContainer) {
          unitContainer.style.display = showUnit ? 'block' : 'none';
          reviewContainer.style.display = showUnit ? 'none' : 'block';
          
          if (lessonType === 'main') {
          this.updateReviewSkillsContainer(!showUnit);
          }
      }
  }
  
  validateForm(formData) {
      const errors = [];
      
      if (!formData.title) {
          errors.push('Vui lòng nhập tiêu đề bài học');
      }
      
      if (!formData.unit) {
          errors.push('Vui lòng nhập Unit/Bài');
      }
      
      if (!formData.objectives) {
          errors.push('Vui lòng nhập mục tiêu bài học');
      }
      
      return {
          isValid: errors.length === 0,
          errors: errors
      };
  }
  
  collectFormData() {
      const formData = {
          lessonType: this.parentUI.currentLessonType,
          grade: document.getElementById('grade-select')?.value || '6',
          unit: document.getElementById('unit-input')?.value || '',
          title: document.getElementById('title-input')?.value || '',
          skillType: document.getElementById('skill-type-select')?.value || 'grammar',
          objectives: document.getElementById('objectives-input')?.value || '',
          additionalInstructions: document.getElementById('additional-instructions')?.value || ''
      };
      
      if (this.parentUI.currentLessonType === 'supplementary') {
          formData.suppType = document.getElementById('supp-type-select')?.value || 'vocabulary';
          formData.ttNumber = document.getElementById('supp-tt-number')?.value || '';
          formData.topicValue = document.getElementById('supp-topic-select')?.value || '';
          formData.topicText = document.getElementById('supp-topic-select')?.options[
              document.getElementById('supp-topic-select')?.selectedIndex || 0
          ]?.text || '';
          formData.lessonLink = document.getElementById('supp-lesson-link')?.value || '';
          
          formData.exerciseTypes = [];
          const skillType = document.getElementById('supp-type-select')?.value || 'vocabulary';
          const exerciseDiv = document.getElementById(`${skillType}-exercises`);
          if (exerciseDiv) {
              exerciseDiv.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                  formData.exerciseTypes.push(checkbox.value);
              });
          }
          
          const weekSelect = document.getElementById('week-select');
          if (weekSelect) {
              const weekOption = weekSelect.options[weekSelect.selectedIndex];
              formData.weekText = weekOption?.text || '';
              formData.weekValue = weekSelect.value || '';
              
              const unitMatch = formData.weekText.match(/\(Unit (\d+)\)/);
              formData.unitNumber = unitMatch ? unitMatch[1] : '';
              formData.unitTitle = '';
          }
      } else if (this.parentUI.currentLessonType === 'extracurricular') {
          formData.topic = document.getElementById('topic-input')?.value || '';
          formData.duration = document.getElementById('duration-input')?.value || '45';
          formData.location = document.getElementById('location-input')?.value || '';
          formData.activityGoal = document.getElementById('activity-goal-input')?.value || '';
      }
      
      return formData;
  }

  // Keep all remaining methods unchanged...
  showFormError(message) {
      const errorContainer = document.getElementById('form-error-container');
      if (!errorContainer) {
          const container = document.createElement('div');
          container.id = 'form-error-container';
          container.className = 'form-error-container';
          container.style.color = '#f44336';
          container.style.padding = '10px';
          container.style.marginBottom = '15px';
          container.style.border = '1px solid #f44336';
          container.style.borderRadius = '4px';
          container.style.backgroundColor = '#ffebee';
          
          const formContainer = document.getElementById('lesson-plan-form-container');
          if (formContainer) {
              formContainer.prepend(container);
          }
      }
      
      if (errorContainer) {
          errorContainer.textContent = message;
          errorContainer.style.display = 'block';
          
          setTimeout(() => {
              errorContainer.style.display = 'none';
          }, 5000);
      }
  }
  
  resetForm() {
      const inputs = document.querySelectorAll('#lesson-plan-form-container input, #lesson-plan-form-container textarea');
      inputs.forEach(input => {
          if (input.type === 'text' || input.type === 'textarea') {
              input.value = '';
          } else if (input.type === 'number') {
              input.value = input.defaultValue || '0';
          }
      });
      
      const selects = document.querySelectorAll('#lesson-plan-form-container select');
      selects.forEach(select => {
          if (select.options.length > 0) {
              select.selectedIndex = 0;
          }
      });
  }

  updateSkillsBasedOnContent(contentType, lessonType) {
      let container;
      
      if (lessonType === 'main' && contentType === 'review') {
      container = document.getElementById('review-skills-checkboxes');
      } else if (lessonType === 'supplementary') {
      container = document.querySelector('.skills-checkboxes');
      } else if (lessonType === 'test') {
      container = document.querySelector('.skills-checkboxes');
      }
      
      if (!container) return;
      
      const skills = [
      { value: 'vocabulary', label: 'Vocabulary (Từ vựng)' },
      { value: 'pronunciation', label: 'Pronunciation (Phát âm)' },
      { value: 'grammar', label: 'Grammar (Ngữ pháp)' },
      { value: 'reading', label: 'Reading (Đọc)' },
      { value: 'writing', label: 'Writing (Viết)' },
      { value: 'listening', label: 'Listening (Nghe)' },
      { value: 'speaking', label: 'Speaking (Nói)' }
      ];
      
      container.innerHTML = '';
      
      skills.forEach(skill => {
      const label = document.createElement('label');
      label.className = 'checkbox-container';
      
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = lessonType === 'main' ? 'review-skill' : 
                  lessonType === 'test' ? 'test-skill' : 'skill';
      input.value = skill.value;
      
      const span = document.createElement('span');
      span.textContent = skill.label;
      
      label.appendChild(input);
      label.appendChild(span);
      container.appendChild(label);
      });
      
      if (lessonType === 'main' && contentType === 'review') {
      container.querySelector('input[value="vocabulary"]').checked = true;
      container.querySelector('input[value="grammar"]').checked = true;
      }
  }
}

// Keep existing functions unchanged
function toggleReviewSkillCheckboxes() {
  const selected = document.querySelector('input[name="content-type"]:checked')?.value;
  const reviewBox = document.getElementById("review-select-container");
  const skillsBox = document.getElementById("review-skills-container");

  if (selected === "review") {
    if (reviewBox) reviewBox.style.display = "block";
    if (skillsBox) skillsBox.style.display = "block";
  } else {
    if (reviewBox) reviewBox.style.display = "none";
    if (skillsBox) skillsBox.style.display = "none";
  }
}

document.addEventListener("change", (e) => {
  if (e.target.name === "content-type") toggleReviewSkillCheckboxes();
});