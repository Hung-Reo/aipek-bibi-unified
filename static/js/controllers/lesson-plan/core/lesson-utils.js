// /static/js/controllers/lesson-plan/core/lesson-utils.js
// ✅ ENHANCED VERSION - Utility Functions with Unit Names Support
// ✅ COMPLETED: Units 1-12 với week data đầy đủ và optimized RAG queries

// ✅ IMPORT UNITS_DATA for enhanced unit name lookup
import { UNITS_DATA } from '../lesson-plan-prompts.js';

/**
 * ✅ ENHANCED: Calculate unit number from week number
 */
export function getUnitFromWeek(weekNumber) {
  const weekNum = parseInt(weekNumber, 10);
  if (isNaN(weekNum) || weekNum < 1) {
    console.warn(`Invalid week number: ${weekNumber}`);
    return 1;
  }
  return Math.ceil(weekNum / 2);
}

/**
 * ✅ ENHANCED: Get unit data from global UNITS_DATA với improved fallback
 */
export function getUnitData(unitNumber) {
  const unitsData = window.UNITS_DATA || UNITS_DATA;
  if (!unitsData) {
    console.warn('⚠️ UNITS_DATA not available, using fallback');
    return getUnitDataFallback(unitNumber);
  }
  
  const unitData = unitsData[unitNumber];
  if (!unitData) {
    console.warn(`⚠️ No data found for Unit ${unitNumber}, using fallback`);
    return getUnitDataFallback(unitNumber);
  }
  
  return unitData;
}

/**
 * ✅ ENHANCED: Complete fallback unit data cho tất cả Units 1-12
 */
export function getUnitDataFallback(unitNumber) {
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
 * Format date to DD/MM/YYYY format
 */
export function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculate week period from week number
 */
export function calculateWeekPeriod(weekNumber) {
  const weekNum = parseInt(weekNumber, 10);
  if (isNaN(weekNum) || weekNum < 1) {
    throw new Error(`Invalid week number: ${weekNumber}`);
  }

  const startDate = new Date(2025, 6, 21); // 21/07/2025 (month is 0-based)
  startDate.setDate(startDate.getDate() + (weekNum - 1) * 7);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 5); // 5 days later (Monday to Friday)

  return {
    startDate,
    endDate,
    period: `${formatDate(startDate)}-${formatDate(endDate)}`
  };
}

/**
 * ✅ COMPLETED: Get week details with COMPLETE unit name support cho tất cả Units 1-12
 */
export function getWeekDetails(weekNumber) {
  const weekNum = parseInt(weekNumber, 10);
  if (isNaN(weekNum) || weekNum < 1) {
    console.warn(`Invalid week number: ${weekNumber}`);
    return null;
  }
  
  // ✅ COMPLETED: Hard-coded data cho TẤT CẢ Units 1-12 (weeks 1-24)
  const weekData = {
    // === HỌC KỲ 1 - UNITS 1-6 ===
    // Unit 1: MY NEW SCHOOL
    "1": {
      period: "21/07/2025-26/07/2025",
      unit: 1,
      unitName: "MY NEW SCHOOL",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 1", "Pronunciation: /ɑː/, /ʌ/"]
    },
    "2": {
      period: "28/07/2025-02/08/2025",
      unit: 1,
      unitName: "MY NEW SCHOOL",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["the Present Simple", "the Present Simple"]
    },
    
    // Unit 2: MY HOUSE
    "3": {
      period: "04/08/2025-09/08/2025",
      unit: 2,
      unitName: "MY HOUSE",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 2", "Pronunciation: /s/, /z/"]
    },
    "4": {
      period: "11/08/2025-16/08/2025",
      unit: 2,
      unitName: "MY HOUSE",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["Possessive case", "Prepositions of place"]
    },
    
    // Unit 3: MY FRIENDS
    "5": {
      period: "18/08/2025-23/08/2025",
      unit: 3,
      unitName: "MY FRIENDS",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 3", "Pronunciation: /p/, /b/"]
    },
    "6": {
      period: "25/08/2025-30/08/2025",
      unit: 3,
      unitName: "MY FRIENDS",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["Present continuous", "Present continuous vs Present simple"]
    },
    
    // Unit 4: MY NEIGHBOURHOOD (✅ EXISTING - đã có)
    "7": {
      period: "01/09/2025-06/09/2025",
      unit: 4,
      unitName: "MY NEIGHBOURHOOD",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 4", "Pronunciation: /ɪ/, /iː/"]
    },
    "8": {
      period: "08/09/2025-13/09/2025",
      unit: 4,
      unitName: "MY NEIGHBOURHOOD",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["Comparative adjectives", "Prepositions of place"]
    },
    
    // ✅ NEW: Unit 5: NATURAL WONDERS OF VIET NAM
    "9": {
      period: "15/09/2025-20/09/2025",
      unit: 5,
      unitName: "NATURAL WONDERS OF VIET NAM",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 5", "Pronunciation: /t/, /d/"]
    },
    "10": {
      period: "22/09/2025-27/09/2025",
      unit: 5,
      unitName: "NATURAL WONDERS OF VIET NAM",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["Superlative adjectives", "Must/mustn't for prohibition"]
    },
    
    // ✅ NEW: Unit 6: OUR TET HOLIDAY
    "11": {
      period: "29/09/2025-04/10/2025",
      unit: 6,
      unitName: "OUR TET HOLIDAY",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 6", "Pronunciation: /s/, /ʃ/"]
    },
    "12": {
      period: "06/10/2025-11/10/2025",
      unit: 6,
      unitName: "OUR TET HOLIDAY",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["Should/shouldn't for advice", "Some/any for countable and uncountable nouns"]
    },
    
    // === HỌC KỲ 2 - UNITS 7-12 ===
    // ✅ NEW: Unit 7: TELEVISION
    "13": {
      period: "12/01/2026-17/01/2026",
      unit: 7,
      unitName: "TELEVISION",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 7", "Pronunciation: /θ/, /ð/"]
    },
    "14": {
      period: "19/01/2026-24/01/2026",
      unit: 7,
      unitName: "TELEVISION",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["Wh-questions", "Conjunctions: and, but, so"]
    },
    
    // ✅ NEW: Unit 8: SPORTS AND GAMES
    "15": {
      period: "26/01/2026-31/01/2026",
      unit: 8,
      unitName: "SPORTS AND GAMES",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 8", "Pronunciation: /eə/, /ɪə/"]
    },
    "16": {
      period: "02/02/2026-07/02/2026",
      unit: 8,
      unitName: "SPORTS AND GAMES",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["Past Simple", "Imperatives"]
    },
    
    // ✅ NEW: Unit 9: CITIES OF THE WORLD
    "17": {
      period: "09/02/2026-14/02/2026",
      unit: 9,
      unitName: "CITIES OF THE WORLD",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 9", "Pronunciation: /aʊ/, /əʊ/"]
    },
    "18": {
      period: "16/02/2026-21/02/2026",
      unit: 9,
      unitName: "CITIES OF THE WORLD",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["Present Perfect", "Superlative adjectives"]
    },
    
    // ✅ NEW: Unit 10: OUR HOUSES IN THE FUTURE
    "19": {
      period: "23/02/2026-28/02/2026",
      unit: 10,
      unitName: "OUR HOUSES IN THE FUTURE",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 10", "Pronunciation: /dr/, /tr/"]
    },
    "20": {
      period: "02/03/2026-07/03/2026",
      unit: 10,
      unitName: "OUR HOUSES IN THE FUTURE",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["Will for future", "Might for future possibility"]
    },
    
    // ✅ NEW: Unit 11: OUR GREENER WORLD
    "21": {
      period: "09/03/2026-14/03/2026",
      unit: 11,
      unitName: "OUR GREENER WORLD",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 11", "Pronunciation: /ɑː/, /æ/"]
    },
    "22": {
      period: "16/03/2026-21/03/2026",
      unit: 11,
      unitName: "OUR GREENER WORLD",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["First conditional", "Articles: a, an, the"]
    },
    
    // ✅ NEW: Unit 12: ROBOTS
    "23": {
      period: "23/03/2026-28/03/2026",
      unit: 12,
      unitName: "ROBOTS",
      mainLessons: ["Getting started", "A closer look 1", "A closer look 2"],
      suppLessons: ["Vocabulary in Unit 12", "Pronunciation: /ɔɪ/, /aʊ/"]
    },
    "24": {
      period: "30/03/2026-04/04/2026",
      unit: 12,
      unitName: "ROBOTS",
      mainLessons: ["Communication", "Skills 1", "Skills 2"],
      suppLessons: ["Could for ability", "Will be able to for future ability"]
    }
  };
  
  if (weekData[weekNumber]) {
    console.log(`✅ Found complete data for week ${weekNumber}: Unit ${weekData[weekNumber].unit} - ${weekData[weekNumber].unitName}`);
    return weekData[weekNumber];
  }
  
  console.log(`⚠️ No hard-coded data for week ${weekNumber}, generating automatic data`);
  
  const unitNumber = getUnitFromWeek(weekNumber);
  const unitData = getUnitData(unitNumber);
  const { period } = calculateWeekPeriod(weekNumber);
  
  const isOddWeek = weekNum % 2 === 1;
  const mainLessons = isOddWeek 
    ? ["Getting started", "A closer look 1", "A closer look 2"]
    : ["Communication", "Skills 1", "Skills 2"];
    
  const suppLessons = [
    `Vocabulary in Unit ${unitNumber}`,
    `Grammar practice for Unit ${unitNumber}`
  ];

  const generatedData = {
    period,
    unit: unitNumber,
    unitName: unitData.name, // ✅ ENHANCED: Include unit name
    mainLessons,
    suppLessons
  };
  
  console.log(`✅ Generated automatic data for week ${weekNumber}: Unit ${unitNumber} - ${unitData.name}`);
  return generatedData;
}

/**
 * Validate lesson form data
 */
export function validateLessonForm(formData) {
  const errors = [];
  
  if (!formData.grade || formData.grade.trim() === '') {
    errors.push('Grade is required');
  }
  
  if (!formData.unit || formData.unit.trim() === '') {
    errors.push('Unit is required');
  }
  
  if (!formData.lesson || formData.lesson.trim() === '') {
    errors.push('Lesson is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * ✅ ENHANCED: Update unit information with real unit names
 */
export function updateUnitInfo(controller) {
  try {
    const unitSelect = document.getElementById('unit-select');
    if (!unitSelect) {
      console.warn('DEBUG: Không tìm thấy phần tử unit-select');
      return;
    }
    
    const unitNumber = parseInt(unitSelect.value, 10);
    if (isNaN(unitNumber) || unitNumber < 1 || unitNumber > 12) {
      console.warn(`DEBUG: Giá trị Unit không hợp lệ: ${unitSelect.value}`);
      return;
    }
    
    // ✅ ENHANCED: Get real unit data with complete Units 1-12 support
    const unitData = getUnitData(unitNumber);
    const semester = unitData.semester || (unitNumber <= 6 ? 1 : 2);
    const startWeek = (unitNumber - 1) * 2 + 1;
    const endWeek = startWeek + 1;
    const startWeekFormatted = startWeek.toString().padStart(2, '0');
    const endWeekFormatted = endWeek.toString().padStart(2, '0');
    
    const weekInput = document.getElementById('week-input');
    if (weekInput) {
      weekInput.value = startWeekFormatted;
    }
    
    let weekDetails = getWeekDetailsFromUnit(unitNumber, startWeekFormatted, controller);
    
    // ✅ ENHANCED: Display with real unit name cho tất cả Units 1-12
    const weekInfoDisplay = document.getElementById('week-info-display');
    if (weekInfoDisplay) {
      weekInfoDisplay.style.display = 'block';
      weekInfoDisplay.innerHTML = `
        <div class="week-info-content">
          <p><strong>Tuần ${startWeekFormatted}-${endWeekFormatted} (HK${semester})</strong> ${weekDetails.period || ''}</p>
          <p><strong>Unit ${unitNumber}: ${unitData.name}</strong></p>
          <p><strong>Các tiết:</strong> ${getMainLessonsForUnit(unitNumber)}</p>
        </div>
      `;
    }
    
    const lessonSelectionContainer = document.getElementById('lesson-selection-container');
    if (lessonSelectionContainer) {
      lessonSelectionContainer.style.display = 'block';
    }
    
    if (controller.checkCreatedLessons) {
      controller.checkCreatedLessons(unitNumber);
    }
    
    console.log(`✅ Updated unit info for Unit ${unitNumber}: ${unitData.name}, Week ${startWeekFormatted}-${endWeekFormatted}`);
  } catch (error) {
    console.error("DEBUG: Lỗi khi cập nhật thông tin Unit:", error);
  }
}

/**
 * ✅ ENHANCED: Get main lessons list for a unit with real data support
 */
export function getMainLessonsForUnit(unitNumber) {
  const unitData = getUnitData(unitNumber);
  
  // Try to get lessons from unit data
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
 * ✅ ENHANCED: Get week details from unit with real unit names
 */
export function getWeekDetailsFromUnit(unitNumber, weekNumber, controller) {
  const weekDetails = controller && controller.getWeekDetails ? controller.getWeekDetails(weekNumber) : null;
  
  if (weekDetails) {
    return weekDetails;
  }
  
  const unitData = getUnitData(unitNumber);
  const semester = unitData.semester || (unitNumber <= 6 ? 1 : 2);
  const { period } = calculateWeekPeriod(parseInt(weekNumber));
  
  return {
    period: period,
    unit: unitNumber,
    unitName: unitData.name, // ✅ ENHANCED: Include unit name
    semester: semester
  };
}

/**
 * Generate cache key for lesson data
 */
export function generateCacheKey(lessonType, params, language = 'vi') {
  const safeType = lessonType ? String(lessonType) : 'unknown';
  const safeLang = language ? String(language) : 'vi';
  
  const keyParts = [`lesson-${safeType}`, `lang-${safeLang}`];
  
  if (params) {
    if (params.grade) keyParts.push(`grade-${params.grade}`);
    if (params.unit) keyParts.push(`unit-${params.unit}`);
    if (params.lesson) keyParts.push(`lesson-${params.lesson}`);
    if (params.week) keyParts.push(`week-${params.week}`);
  }
  
  return keyParts.join('_');
}

/**
 * ✅ BALANCED OPTIMIZATION: Build RAG query with enhanced unit names (8-9 words target)
 */
export function buildRAGQuery(lessonType, params) {
  let query = '';
  
  const lessonNameMap = {
    'getting-started': 'Getting started',
    'closer-look-1': 'A closer look 1',
    'closer-look-2': 'A closer look 2',
    'communication': 'Communication',
    'skills-1': 'Skills 1',
    'skills-2': 'Skills 2',
    'looking-back': 'Looking back & Project'
  };
  
  const supplementaryTypeMap = {
    'vocabulary': 'từ vựng',
    'grammar': 'ngữ pháp', 
    'pronunciation': 'phát âm',
    'reading': 'đọc hiểu',
    'writing': 'viết',
    'listening': 'nghe hiểu',
    'speaking': 'nói'
  };
  
  if (lessonType === 'main') {
    const lessonName = lessonNameMap[params.selectedLesson] || '';
    
    // ✅ BALANCED: Enhanced unit context with reasonable length
    let unitContext = `Unit ${params.unitNumber}`;
    if (params.unitNumber) {
      const unitData = getUnitData(parseInt(params.unitNumber));
      if (unitData && unitData.name) {
        // ✅ BALANCED: Keep first 2 words của unit name (instead of 1)
        const unitWords = unitData.name.split(' ');
        const shortUnitName = unitWords.slice(0, 2).join(' '); // "MY NEW", "MY HOUSE", etc.
        unitContext += ` ${shortUnitName}`;
      }
    }
    
    // ✅ BALANCED: Target 8-9 words
    query = `${unitContext} lớp ${params.grade} ${lessonName}`;
    
    console.log(`✅ Balanced main RAG query: ${query}`);
  } 
  else if (lessonType === 'review') {
    // ✅ BALANCED: Include more context for review
    query = `review ${params.reviewNumber || 1} lớp ${params.grade || 6}`;
    
    if (params.relatedUnits && params.relatedUnits.length > 0) {
      // Include up to 3 units (instead of 2)
      const units = params.relatedUnits.slice(0, 3).join(' ');
      query += ` units ${units}`;
    }
    
    if (params.selectedSkills && params.selectedSkills.length > 0) {
      // Include top 2 skills (instead of 1)
      const topSkills = params.selectedSkills.slice(0, 2)
        .map(skill => supplementaryTypeMap[skill] || skill)
        .join(' ');
      query += ` ${topSkills}`;
    }
    
    console.log(`✅ Balanced review RAG query: ${query}`);
  }
  else if (lessonType === 'supplementary') {
    // ✅ BALANCED: Enhanced supplementary queries với đủ context
    let unitContext = `Unit ${params.unitNumber}`;
    if (params.unitNumber) {
      const unitData = getUnitData(parseInt(params.unitNumber));
      if (unitData && unitData.name) {
        // ✅ BALANCED: Keep first 2 words instead of 1
        const unitWords = unitData.name.split(' ');
        const shortUnitName = unitWords.slice(0, 2).join(' ');
        unitContext += ` ${shortUnitName}`;
      }
    }
    
    // ✅ BALANCED: Include top 2-3 skills cho better context
    let skillsText = '';
    if (params.supplementary_type) {
      skillsText = supplementaryTypeMap[params.supplementary_type] || params.supplementary_type;
    } else if (params.selectedSkills && params.selectedSkills.length > 0) {
      // Priority order và include top 2-3 skills
      const skillPriority = ['vocabulary', 'grammar', 'pronunciation', 'reading', 'writing', 'listening', 'speaking'];
      const prioritizedSkills = skillPriority.filter(skill => params.selectedSkills.includes(skill));
      const topSkills = prioritizedSkills.length > 0 ? prioritizedSkills.slice(0, 2) : params.selectedSkills.slice(0, 2);
      skillsText = topSkills.map(skill => supplementaryTypeMap[skill] || skill).join(' ');
    }
    
    // ✅ BALANCED: Target 8-9 words with meaningful context
    query = `${unitContext} lớp ${params.grade} ${skillsText} tăng tiết`;
    
    console.log(`✅ Balanced supplementary RAG query: ${query}`);
  } 
  else if (lessonType === 'extracurricular') {
    // ✅ BALANCED: Reasonable length for extracurricular
    const topicText = params.topic ? params.topic.split(' ').slice(0, 2).join(' ') : 'hoạt động';
    query = `ngoại khóa tiếng Anh ${topicText} lớp ${params.grade}`;
    console.log(`✅ Balanced extracurricular RAG query: ${query}`);
  } 
  else if (lessonType === 'test') {
    // ✅ BALANCED: Include reasonable context for tests
    query = `kiểm tra tiếng Anh lớp ${params.grade}`;
    
    if (params.reviewNumber) {
      query += ` review ${params.reviewNumber}`;
    }
    
    if (params.selectedSkills && params.selectedSkills.length > 0) {
      // Include top 2 skills instead of 1
      const topSkills = params.selectedSkills.slice(0, 2)
        .map(skill => supplementaryTypeMap[skill] || skill)
        .join(' ');
      query += ` ${topSkills}`;
    }
    
    console.log(`✅ Balanced test RAG query: ${query}`);
  }
  
  // ✅ BALANCED CHECK: Target 8-9 words, max 70 chars (increased from 50)
  const wordCount = query.split(' ').length;
  if (wordCount > 10 || query.length > 70) {
    console.warn(`⚠️ Query potentially too long (${wordCount} words, ${query.length} chars): ${query}`);
    // Don't truncate automatically - let it through but warn
  }
  
  console.log(`📊 Query stats: ${wordCount} words, ${query.length} chars`);
  return query;
}

/**
 * ✅ ENHANCED: Get unit name for display cho tất cả Units 1-12
 */
export function getUnitDisplayName(unitNumber) {
  const unitData = getUnitData(unitNumber);
  return `Unit ${unitNumber}: ${unitData.name}`;
}

/**
 * ✅ ENHANCED: Get all available units with names
 */
export function getAllUnits() {
  const units = [];
  for (let i = 1; i <= 12; i++) {
    const unitData = getUnitData(i);
    units.push({
      number: i,
      name: unitData.name,
      semester: unitData.semester,
      displayName: `Unit ${i}: ${unitData.name}`
    });
  }
  return units;
}

/**
 * ✅ ENHANCED: Validate unit number với support cho tất cả Units 1-12
 */
export function isValidUnitNumber(unitNumber) {
  const num = parseInt(unitNumber, 10);
  return !isNaN(num) && num >= 1 && num <= 12;
}

/**
 * ✅ OPTIMIZED: Sidebar layout management (disabled to prevent conflicts)
 */
export function manageSidebarLayout(mode = 'disable') {
  console.log(`🔧 manageSidebarLayout called with mode: ${mode}`);
  
  if (mode === 'disable') {
    console.log('✅ Sidebar management disabled - delegating to lesson-plan-ui.js');
    return;
  }
  
  if (mode === 'emergency') {
    console.warn('⚠️ Emergency sidebar restore triggered');
    
    const container = document.querySelector('.lesson-plan-container');
    const sidebar = document.querySelector('.lesson-plan-sidebar');
    const content = document.querySelector('.lesson-plan-content');
    
    if (!container || !sidebar || !content) {
      console.error('❌ Core layout elements missing');
      return;
    }
    
    container.style.cssText = '';
    sidebar.style.cssText = '';
    content.style.cssText = '';
    
    container.style.display = 'flex';
    container.style.width = '100%';
    container.style.margin = '0';
    container.style.padding = '0';
    
    sidebar.style.width = '280px';
    sidebar.style.flexShrink = '0';
    sidebar.style.height = 'calc(100vh - 120px)';
    sidebar.style.overflowY = 'auto';
    sidebar.style.backgroundColor = '#f9f9f9';
    sidebar.style.borderRight = '1px solid #ddd';
    
    content.style.flex = '1';
    content.style.padding = '20px';
    content.style.overflowY = 'auto';
    
    console.log('✅ Emergency sidebar layout applied');
  }
}

/**
 * ✅ ENHANCED: Helper function to ensure sidebar is scrollable
 */
export function ensureSidebarScrollable() {
  const sidebar = document.querySelector('.lesson-plan-sidebar');
  if (!sidebar) return;
  
  sidebar.style.height = 'calc(100vh - 120px)';
  sidebar.style.overflowY = 'auto';
  sidebar.style.overflowX = 'hidden';
  
  const sidebarContent = sidebar.querySelector('.sidebar-content');
  if (sidebarContent) {
    sidebarContent.style.height = 'auto';
    sidebarContent.style.minHeight = '100%';
  }
  
  console.log('✅ Sidebar scrollability ensured');
}