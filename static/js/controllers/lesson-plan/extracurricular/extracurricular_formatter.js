// /static/js/controllers/lesson-plan/extracurricular/extracurricular_formatter.js
// Output formatting and length management for extracurricular activities
// REFERENCE: Adapted from lesson-plan-api.js content length logic but for 3k target

/**
 * Content length management and output formatting
 * TARGET: 3,000 characters (vs 15,000 for SGK lessons)
 * PURPOSE: Ensure appropriate length and format for activities
 */

/**
 * Check content length against target requirements
 * REFERENCE: Concept from lesson-plan-api.js lines 180-250 but adapted for activities
 */
export function checkContentLength(content, targetLength = 3000, activityType = 'general') {
  console.log(`📏 Checking content length: ${content.length} chars (target: ${targetLength})`);
  
  const result = {
    currentLength: content.length,
    targetLength: targetLength,
    isOptimal: false,
    isAcceptable: false,
    needsExpansion: false,
    qualityAssessment: 'insufficient'
  };
  
  // Define length thresholds based on activity type
  const thresholds = {
    sports: { min: 2000, target: 3000, max: 4000 },
    arts: { min: 2200, target: 3200, max: 4200 },
    culture: { min: 2500, target: 3500, max: 4500 },
    science: { min: 2800, target: 3800, max: 4800 },
    general: { min: 2000, target: 3000, max: 4000 }
  };
  
  const threshold = thresholds[activityType] || thresholds.general;
  result.targetLength = threshold.target;
  
  if (result.currentLength >= threshold.target && result.currentLength <= threshold.max) {
    result.isOptimal = true;
    result.qualityAssessment = 'optimal';
    console.log(`✅ Content length is optimal: ${result.currentLength} chars`);
  } else if (result.currentLength >= threshold.min && result.currentLength < threshold.target) {
    result.isAcceptable = true;
    result.qualityAssessment = 'acceptable';
    console.log(`⚠️ Content length acceptable but could be improved: ${result.currentLength} chars`);
  } else if (result.currentLength < threshold.min) {
    result.needsExpansion = true;
    result.qualityAssessment = 'needs_expansion';
    console.log(`❌ Content too short, needs expansion: ${result.currentLength}/${threshold.min} chars`);
  } else {
    result.qualityAssessment = 'too_long';
    console.log(`⚠️ Content might be too long: ${result.currentLength}/${threshold.max} chars`);
  }
  
  return result;
}

/**
 * Force content expansion when below minimum threshold
 * REFERENCE: Adapted from lesson-plan-api.js expansion logic but for activities
 */
export function forceExpansion(content, activityType, params, missingLength) {
  console.log(`🔧 Force expanding content for ${activityType} (missing: ${missingLength} chars)`);
  
  const expansionStrategies = {
    sports: generateSportsExpansion,
    arts: generateArtsExpansion,
    culture: generateCultureExpansion,
    science: generateScienceExpansion,
    general: generateGeneralExpansion
  };
  
  const expandFunction = expansionStrategies[activityType] || expansionStrategies.general;
  const expansion = expandFunction(params, missingLength);
  
  // Find appropriate insertion point (before conclusion/wrap-up)
  const insertionPoints = [
    'VI. ĐÁNH GIÁ',
    'V. AN TOÀN',
    'IV. TỪ VỰNG',
    '## KẾT THÚC',
    '## ĐÁNH GIÁ'
  ];
  
  let insertPoint = content.length;
  for (const point of insertionPoints) {
    const index = content.lastIndexOf(point);
    if (index !== -1) {
      insertPoint = index;
      break;
    }
  }
  
  const expandedContent = content.substring(0, insertPoint) + 
                         expansion + 
                         content.substring(insertPoint);
  
  console.log(`✅ Content expanded from ${content.length} to ${expandedContent.length} chars`);
  return expandedContent;
}

/**
 * Generate sports-specific expansion content
 */
function generateSportsExpansion(params, missingLength) {
  return `

## BỔ SUNG CHI TIẾT CHO HOẠT ĐỘNG THỂ THAO

### HƯỚNG DẪN KỸ THUẬT CHI TIẾT:

**Warm-up Exercises (Chi tiết từng bước):**
1. **Neck rotation**: Xoay cổ từ từ 8 lần mỗi chiều với counting bằng tiếng Anh
2. **Arm circles**: Vòng tay lớn và nhỏ, 10 lần mỗi hướng - "Big circles, small circles"
3. **Leg swings**: Đung đưa chân trước sau, trái phải - "Forward, backward, left, right"
4. **Joint mobility**: Xoay cổ tay, cổ chân với commands "Rotate your wrists, ankles"

**Skill Development Progression:**
- **Beginner level**: Basic movements với constant encouragement "Good job!", "Try again!", "You can do it!"
- **Intermediate level**: Combination movements với team coordination "Pass to your teammate!", "Work together!"
- **Advanced level**: Competitive elements với fair play emphasis "Play fair!", "Respect your opponent!"

**Team Building Activities:**
1. **Trust exercises**: Blind partner leading với communication practice
2. **Strategy planning**: Team huddles để discuss tactics bằng simple English
3. **Role rotation**: Everyone gets chance to lead và support teammates
4. **Achievement celebration**: Group cheers và positive reinforcement

**English Communication Practice:**
- **Game commands**: "Start!", "Stop!", "Your turn!", "Well done!"
- **Safety calls**: "Watch out!", "Slow down!", "Be careful!"
- **Encouragement phrases**: "Keep going!", "Almost there!", "Great effort!"
- **Team spirit**: "Let's go team!", "We can do this!", "Together we win!"

### SAFETY PROTOCOLS EXPANDED:

**Pre-activity Safety Check:**
- Equipment inspection với English vocabulary: "Check your helmet", "Adjust your shoes"
- Playing area assessment: "Look for obstacles", "Clear the space"
- Participant readiness: "Are you ready?", "Any injuries to report?"

**During Activity Monitoring:**
- Regular hydration breaks: "Water break!", "Stay hydrated!"
- Fatigue assessment: "How are you feeling?", "Take a rest if needed"
- Injury prevention: "Listen to your body", "Don't push too hard"

**Emergency Procedures:**
- First aid basics với English terms: "ice pack", "bandage", "call for help"
- Evacuation routes: "Emergency exit", "Meet at assembly point"
- Communication protocols: "I need help", "Emergency situation"

**Post-Activity Recovery:**
- Cool-down stretches với detailed instructions
- Team reflection về safety practices
- Equipment storage và area cleanup với responsibility assignment`;
}

/**
 * Generate arts-specific expansion content
 */
function generateArtsExpansion(params, missingLength) {
  return `

## BỔ SUNG CHI TIẾT CHO HOẠT ĐỘNG NGHỆ THUẬT

### CREATIVE PROCESS GUIDANCE:

**Inspiration Phase:**
- **Mind mapping**: Brainstorm ideas với visual thinking techniques
- **Reference gathering**: Look at examples từ different cultures và styles
- **Personal connection**: "What does this mean to you?", "How do you feel about this?"
- **Artistic vision**: "What story do you want to tell?", "What message do you want to share?"

**Technical Skills Development:**
- **Basic techniques**: Step-by-step demonstration với hands-on practice
- **Color theory**: "Primary colors", "Secondary colors", "Color harmony", "Contrast"
- **Composition rules**: "Rule of thirds", "Balance", "Focal point", "Visual flow"
- **Tool mastery**: Proper handling của brushes, pencils, digital tools

**Creative Expression Encouragement:**
- **Risk-taking**: "Try something new!", "Don't be afraid to experiment!"
- **Personal style**: "Find your unique voice", "Express your personality"
- **Process over product**: "Enjoy the journey", "Learning is more important than perfection"
- **Constructive feedback**: "What works well?", "What could be improved?", "How does this make you feel?"

**Cultural Integration:**
- **Art history connections**: Brief background về relevant art movements
- **Cross-cultural comparison**: How different cultures express similar themes
- **Contemporary relevance**: How does this connect to modern life?
- **Global perspective**: Art as universal language

### PRESENTATION SKILLS DEVELOPMENT:

**Artwork Description Practice:**
- **Basic vocabulary**: "I created...", "This represents...", "I used...", "The colors show..."
- **Emotional expression**: "This makes me feel...", "I want viewers to...", "The mood is..."
- **Technical explanation**: "I used this technique because...", "The process involved..."
- **Personal reflection**: "I learned...", "Next time I would...", "I'm proud of..."

**Audience Engagement:**
- **Question answering**: Practice responding to "Why did you choose...?", "How did you make...?"
- **Peer appreciation**: "I like how you...", "Your use of... is interesting", "This reminds me of..."
- **Constructive criticism**: "This is effective because...", "You might consider...", "Have you thought about...?"

**Portfolio Development:**
- **Documentation**: Taking photos, writing descriptions, reflecting on growth
- **Organization**: Chronological progress, thematic groupings, skill development tracking
- **Sharing platforms**: Digital portfolios, classroom exhibitions, family presentations
- **Goal setting**: "Next I want to learn...", "I want to improve my...", "My artistic goal is..."`;
}

/**
 * Generate culture-specific expansion content
 */
function generateCultureExpansion(params, missingLength) {
  return `

## BỔ SUNG CHI TIẾT CHO HOẠT ĐỘNG VĂN HÓA

### CULTURAL EXPLORATION DEPTH:

**Historical Context Understanding:**
- **Timeline creation**: Map important cultural events và their significance
- **Cause and effect**: Why did these traditions develop? What purposes do they serve?
- **Evolution over time**: How have practices changed? What remains constant?
- **Global connections**: How did trade, migration, conflict shape cultural exchange?

**Hands-on Cultural Immersion:**
- **Traditional crafts**: Step-by-step creation của cultural artifacts với authentic techniques
- **Culinary exploration**: Safe cooking activities để understand food culture và significance
- **Music and movement**: Learn traditional songs, dances với cultural context explanation
- **Storytelling traditions**: Oral histories, folktales, và their moral lessons

**Language and Communication:**
- **Basic phrases**: Greetings, polite expressions, common phrases từ target culture
- **Non-verbal communication**: Gestures, personal space, eye contact norms
- **Written systems**: Introduction to different alphabets, calligraphy, symbols
- **Modern communication**: How do young people in this culture communicate today?

**Contemporary Cultural Issues:**
- **Tradition vs modernity**: How do young people balance old và new?
- **Cultural preservation**: What efforts are being made to maintain traditions?
- **Global influence**: How has globalization affected this culture?
- **Cultural pride**: What are people most proud of in their heritage?

### CROSS-CULTURAL COMPARISON:

**Similarities Exploration:**
- **Universal human needs**: Food, shelter, community, celebration, spirituality
- **Common life experiences**: Birth, growing up, education, work, family, aging
- **Shared values**: Love, respect, kindness, courage, wisdom across cultures
- **Problem-solving**: How do different cultures address similar challenges?

**Differences Appreciation:**
- **Unique perspectives**: Different ways of viewing time, success, relationships
- **Creative solutions**: Innovative approaches to universal problems
- **Artistic expression**: Unique aesthetic styles, color symbolism, design principles
- **Social structures**: Family roles, community organization, decision-making processes

**Building Cultural Bridges:**
- **Finding common ground**: Shared interests, values, experiences
- **Respectful curiosity**: Asking thoughtful questions, avoiding assumptions
- **Collaborative projects**: Working together on cultural exchange activities
- **Empathy development**: Understanding different viewpoints, walking in others' shoes

**Global Citizenship Skills:**
- **Cultural sensitivity**: Recognizing và respecting differences
- **Communication adaptation**: Adjusting style for different cultural contexts
- **Conflict resolution**: Addressing misunderstandings với cultural awareness
- **Collaborative problem-solving**: Working across cultural boundaries for common goals`;
}

/**
 * Generate science-specific expansion content
 */
function generateScienceExpansion(params, missingLength) {
  return `

## BỔ SUNG CHI TIẾT CHO HOẠT ĐỘNG KHOA HỌC

### SCIENTIFIC METHOD DEEP DIVE:

**Observation Skills Enhancement:**
- **Detailed recording**: Using scientific notebooks với precise descriptions
- **Measurement techniques**: Proper use của measuring tools, units, precision
- **Pattern recognition**: Looking for trends, anomalies, unexpected results
- **Data organization**: Tables, charts, graphs for clear information presentation

**Hypothesis Development:**
- **Question formulation**: Moving from "I wonder..." to testable questions
- **Background research**: What do we already know? What are the gaps?
- **Prediction making**: "If...then..." statements với logical reasoning
- **Variable identification**: Independent, dependent, controlled variables

**Experimental Design Principles:**
- **Control groups**: Why do we need them? How do they strengthen our conclusions?
- **Sample size**: Why do we need multiple trials? How many is enough?
- **Fair testing**: Keeping everything the same except one variable
- **Safety considerations**: Risk assessment, protective equipment, emergency procedures

**Data Analysis and Interpretation:**
- **Statistical basics**: Averages, ranges, patterns in data
- **Graph creation**: Choosing appropriate graph types, scaling, labeling
- **Error analysis**: Understanding measurement uncertainty, experimental error
- **Conclusion drawing**: What does the data tell us? What questions remain?

### REAL-WORLD APPLICATIONS:

**Technology Connections:**
- **How it works**: Basic principles behind everyday technology
- **Innovation process**: How do scientists develop new technologies?
- **Problem-solving**: Engineering design process for real challenges
- **Future possibilities**: What technologies might we see in the future?

**Environmental Applications:**
- **Local ecosystem study**: What lives in our school environment?
- **Environmental monitoring**: Air quality, water quality, noise levels
- **Sustainability projects**: Reducing waste, energy conservation, green alternatives
- **Climate connections**: How do local changes connect to global patterns?

**Health and Medicine:**
- **Body systems**: How do our bodies work? What happens when we exercise?
- **Nutrition science**: What makes food healthy? How do our bodies use nutrients?
- **Disease prevention**: How do vaccines work? Why is hygiene important?
- **Mental health**: How does physical activity affect our mood và thinking?

**Career Exploration:**
- **Scientist profiles**: What do different types of scientists do daily?
- **Education pathways**: What subjects do scientists study? What skills do they need?
- **Problem-solving examples**: Real cases where science solved important problems
- **Citizen science**: How can ordinary people contribute to scientific knowledge?

### COMMUNICATION SKILLS:

**Scientific Vocabulary Building:**
- **Technical terms**: Accurate use của scientific language
- **Analogies and metaphors**: Explaining complex concepts simply
- **Visual communication**: Diagrams, models, demonstrations
- **Peer teaching**: Explaining concepts to classmates, younger students

**Presentation Techniques:**
- **Poster creation**: Clear, informative scientific posters
- **Oral presentations**: Structured talks với visual aids
- **Question handling**: Responding to audience questions professionally
- **Debate skills**: Discussing scientific issues với evidence-based arguments`;
}

/**
 * Generate general expansion content
 */
function generateGeneralExpansion(params, missingLength) {
  return `

## BỔ SUNG CHI TIẾT TOÀN DIỆN

### SKILL DEVELOPMENT FOCUS:

**Communication Enhancement:**
- **Active listening**: Paying full attention, asking clarifying questions, summarizing understanding
- **Clear expression**: Organizing thoughts, using appropriate vocabulary, confident delivery
- **Non-verbal awareness**: Body language, facial expressions, tone of voice impact
- **Audience adaptation**: Adjusting communication style for different listeners

**Critical Thinking Development:**
- **Problem identification**: Recognizing issues, understanding root causes, defining scope
- **Solution brainstorming**: Creative thinking, considering multiple perspectives, innovative approaches
- **Decision making**: Weighing pros and cons, considering consequences, making informed choices
- **Reflection practices**: Learning from experience, identifying growth areas, setting goals

**Collaboration Skills:**
- **Team dynamics**: Understanding roles, contributing effectively, supporting teammates
- **Conflict resolution**: Addressing disagreements constructively, finding win-win solutions
- **Leadership development**: Taking initiative, motivating others, sharing responsibility
- **Peer support**: Helping struggling teammates, celebrating others' successes, building trust

**Self-Management:**
- **Time management**: Planning activities, meeting deadlines, balancing priorities
- **Stress management**: Recognizing pressure, using healthy coping strategies, seeking help when needed
- **Goal setting**: Defining clear objectives, creating action plans, tracking progress
- **Self-assessment**: Honest evaluation of strengths/weaknesses, accepting feedback, continuous improvement

### PRACTICAL LIFE SKILLS:

**Organization and Planning:**
- **Project management**: Breaking large tasks into smaller steps, creating timelines, monitoring progress
- **Resource management**: Using materials efficiently, minimizing waste, sharing resources fairly
- **Space organization**: Keeping work areas clean, organizing materials logically, maintaining equipment
- **Documentation**: Recording important information, keeping track of learning, building portfolios

**Digital Literacy:**
- **Technology tools**: Using devices safely and effectively for learning and communication
- **Information evaluation**: Distinguishing reliable sources, fact-checking, avoiding misinformation
- **Digital citizenship**: Online etiquette, privacy protection, respectful communication
- **Creative applications**: Using technology for problem-solving, expression, collaboration

**Environmental Awareness:**
- **Sustainability practices**: Reducing consumption, reusing materials, recycling properly
- **Energy conservation**: Understanding impact of choices, making eco-friendly decisions
- **Community responsibility**: Contributing positively to shared spaces, caring for common resources
- **Global connections**: Understanding how local actions affect broader world

**Health and Wellness:**
- **Physical health**: Regular activity, proper nutrition, adequate rest, stress management
- **Mental health**: Emotional awareness, coping strategies, seeking support, maintaining balance
- **Social health**: Building positive relationships, resolving conflicts, community engagement
- **Safety awareness**: Risk assessment, prevention strategies, emergency response, personal responsibility

### ASSESSMENT AND REFLECTION:

**Continuous Improvement:**
- **Regular check-ins**: Daily reflection on learning, weekly goal review, monthly skill assessment
- **Feedback integration**: Receiving input gracefully, implementing suggestions, tracking improvements
- **Peer evaluation**: Giving constructive feedback, learning from others' perspectives, collaborative growth
- **Self-advocacy**: Communicating needs clearly, asking for help appropriately, taking ownership of learning`;
}

/**
 * Format activity output with proper structure
 * REFERENCE: New logic for activity-specific formatting
 */
export function formatActivityOutput(content, title, params) {
  console.log('🎨 Formatting activity output with proper structure');
  
  const formattedOutput = `
<div class="lesson-plan-card activity-card">
  <div class="card-header">
    <h2 class="card-title">
      <i class="fas fa-star"></i>
      ${title}
    </h2>
    <div class="lesson-metadata">
      <span class="metadata-item">
        <i class="fas fa-users"></i>
        Lớp ${params.grade}
      </span>
      <span class="metadata-item">
        <i class="fas fa-clock"></i>
        ${params.duration} phút
      </span>
      <span class="metadata-item">
        <i class="fas fa-tag"></i>
        ${params.activityType || 'Hoạt động ngoại khóa'}
      </span>
      <span class="metadata-item timestamp">
        <i class="fas fa-calendar"></i>
        ${new Date().toLocaleDateString('vi-VN')}
      </span>
    </div>
  </div>
  
  <div class="card-content">
    <div class="activity-content">
      ${content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
    </div>
    
    <div class="activity-stats">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-number">${content.length}</span>
          <span class="stat-label">Ký tự</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${Math.ceil(content.length / 200)}</span>
          <span class="stat-label">Phút đọc</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${(content.match(/\n/g) || []).length}</span>
          <span class="stat-label">Đoạn văn</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="card-actions">
    <button class="action-btn export-btn" onclick="exportActivityToWord(this)">
      <i class="fas fa-file-word"></i>
      Xuất Word
    </button>
    <button class="action-btn save-btn" onclick="saveActivity(this)">
      <i class="fas fa-save"></i>
      Lưu hoạt động
    </button>
    <button class="action-btn share-btn" onclick="shareActivity(this)">
      <i class="fas fa-share"></i>
      Chia sẻ
    </button>
    <button class="action-btn feedback-btn" onclick="submitActivityFeedback(this)">
      <i class="fas fa-comment"></i>
      Phản hồi
    </button>
  </div>
</div>`;

  return formattedOutput;
}

/**
 * Save activity to cache with proper metadata
 * REFERENCE: Copy pattern from main-lesson-controller.js saveForCombining()
 */
export function saveActivityToCache(params, content) {
  console.log('💾 Saving activity to cache');
  
  try {
    const cacheKey = `bibi_activity_${params.grade}_${params.activityType}_${Date.now()}`;
    const cacheData = {
      content: content,
      params: params,
      timestamp: Date.now(),
      type: 'extracurricular',
      version: '1.0'
    };
    
    // Save to localStorage
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    
    // Update activity history
    const activityHistory = JSON.parse(localStorage.getItem('bibi_activity_history') || '[]');
    activityHistory.unshift({
      key: cacheKey,
      title: params.title || `Hoạt động ${params.topic}`,
      date: new Date().toISOString(),
      grade: params.grade,
      type: params.activityType
    });
    
    // Keep only latest 20 activities
    if (activityHistory.length > 20) {
      const oldKey = activityHistory.pop().key;
      localStorage.removeItem(oldKey);
    }
    
    localStorage.setItem('bibi_activity_history', JSON.stringify(activityHistory));
    
    console.log(`✅ Activity saved with key: ${cacheKey}`);
    return cacheKey;
    
  } catch (error) {
    console.error('❌ Error saving activity to cache:', error);
    return null;
  }
}

/**
 * Add activity-specific metadata
 * REFERENCE: New logic for activity enrichment
 */
export function addActivityMetadata(content, params) {
  console.log('📝 Adding activity metadata');
  
  const metadata = {
    generatedAt: new Date().toISOString(),
    targetAudience: `Học sinh lớp ${params.grade}`,
    estimatedDuration: `${params.duration} phút`,
    activityType: params.activityType || 'general',
    educationalObjectives: extractEducationalObjectives(content),
    requiredMaterials: extractMaterials(content),
    safetyConsiderations: extractSafetyNotes(content),
    assessmentCriteria: extractAssessmentCriteria(content)
  };
  
  return {
    content: content,
    metadata: metadata,
    qualityScore: calculateQualityScore(content, params)
  };
}

/**
 * Helper functions for metadata extraction
 */
function extractEducationalObjectives(content) {
  const objectivePattern = /(?:mục tiêu|objectives?)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi;
  const matches = content.match(objectivePattern);
  return matches ? matches[0].substring(0, 200) + '...' : 'Phát triển kỹ năng toàn diện';
}

function extractMaterials(content) {
  const materialPattern = /(?:chuẩn bị|materials?)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi;
  const matches = content.match(materialPattern);
  return matches ? matches[0].substring(0, 150) + '...' : 'Vật dụng cơ bản cho hoạt động';
}

function extractSafetyNotes(content) {
  const safetyPattern = /(?:an toàn|safety)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi;
  const matches = content.match(safetyPattern);
  return matches ? matches[0].substring(0, 150) + '...' : 'Tuân thủ quy tắc an toàn chung';
}

function extractAssessmentCriteria(content) {
  const assessmentPattern = /(?:đánh giá|assessment)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi;
  const matches = content.match(assessmentPattern);
  return matches ? matches[0].substring(0, 150) + '...' : 'Đánh giá dựa trên sự tham gia';
}

/**
 * Calculate content quality score
 */
function calculateQualityScore(content, params) {
  let score = 0;
  
  // Length score (30%)
  const lengthCheck = checkContentLength(content, 3000, params.activityType);
  if (lengthCheck.isOptimal) score += 30;
  else if (lengthCheck.isAcceptable) score += 20;
  else score += 10;
  
  // Structure score (25%)
  const hasStructure = content.includes('MỤC TIÊU') && 
                      content.includes('TIẾN TRÌNH') && 
                      content.includes('ĐÁNH GIÁ');
  score += hasStructure ? 25 : 10;
  
  // Educational value (25%)
  const hasEducationalKeywords = /(?:học|kỹ năng|phát triển|rèn luyện)/gi.test(content);
  score += hasEducationalKeywords ? 25 : 10;
  
  // Safety consideration (20%)
  const hasSafety = /(?:an toàn|safety|cẩn thận|phòng ngừa)/gi.test(content);
  score += hasSafety ? 20 : 10;
  
  return Math.min(score, 100);
}

/**
 * Complete formatting pipeline
 * REFERENCE: Main formatting function combining all features
 */
export function processOutputCompletely(rawContent, title, params) {
  console.log('🔄 Processing complete output formatting');
  
  try {
    // Step 1: Check and expand content if needed
    const lengthCheck = checkContentLength(rawContent, 3000, params.activityType);
    let processedContent = rawContent;
    
    if (lengthCheck.needsExpansion) {
      const missingLength = lengthCheck.targetLength - lengthCheck.currentLength;
      processedContent = forceExpansion(rawContent, params.activityType, params, missingLength);
      console.log(`✅ Content expanded from ${rawContent.length} to ${processedContent.length} chars`);
    }
    
    // Step 2: Add metadata
    const enrichedContent = addActivityMetadata(processedContent, params);
    
    // Step 3: Format for display
    const formattedOutput = formatActivityOutput(enrichedContent.content, title, params);
    
    // Step 4: Save to cache
    const cacheKey = saveActivityToCache(params, enrichedContent.content);
    
    return {
      formattedContent: formattedOutput,
      rawContent: enrichedContent.content,
      metadata: enrichedContent.metadata,
      qualityScore: enrichedContent.qualityScore,
      cacheKey: cacheKey,
      lengthInfo: lengthCheck
    };
    
  } catch (error) {
    console.error('❌ Error in complete output processing:', error);
    return {
      formattedContent: formatActivityOutput(rawContent, title, params),
      rawContent: rawContent,
      error: error.message
    };
  }
}