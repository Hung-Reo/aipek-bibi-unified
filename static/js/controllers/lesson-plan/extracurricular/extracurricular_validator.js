// /static/js/controllers/lesson-plan/extracurricular/extracurricular_validator.js
// Input validation and safety system for extracurricular activities
// REFERENCE: New safety logic for educational context enforcement

/**
 * Content safety and educational adaptation system
 * PURPOSE: Ensure all inputs result in appropriate educational activities
 * APPROACH: Option A - Accept and adapt to educational context
 */

/**
 * Validate and sanitize user input for educational appropriateness
 * REFERENCE: New safety logic inspired by content moderation systems
 */
export function validateContentSafety(topic, additionalRequirements = '') {
  console.log(`🛡️ Validating content safety for: ${topic}`);
  
  const result = {
    isAppropriate: true,
    sanitizedTopic: topic,
    adaptedTopic: topic,
    fallbackSuggestion: null,
    warningMessage: null,
    requiresRedirection: false
  };
  
  // Normalize input for analysis
  const normalizedTopic = topic.toLowerCase();
  const normalizedRequirements = additionalRequirements.toLowerCase();
  
  // Define inappropriate content categories
  const inappropriateCategories = {
    violence: ['đánh', 'đập', 'đánh nhau', 'bạo lực', 'chiến tranh', 'súng', 'dao', 'giết'],
    inappropriate_language: ['tục tĩu', 'chửi', 'xấu', 'ghét'],
    dangerous_activities: ['nguy hiểm', 'cháy', 'nổ', 'độc hại'],
    adult_content: ['người lớn', 'không phù hợp'],
    negative_behavior: ['lười', 'xấu', 'tiêu cực', 'phá hoại']
  };
  
  // Check for inappropriate content
  let foundIssue = null;
  for (const [category, keywords] of Object.entries(inappropriateCategories)) {
    if (keywords.some(keyword => 
        normalizedTopic.includes(keyword) || 
        normalizedRequirements.includes(keyword))) {
      foundIssue = category;
      break;
    }
  }
  
  // Apply educational adaptation if needed
  if (foundIssue) {
    console.log(`⚠️ Found inappropriate content: ${foundIssue}`);
    const adaptation = adaptToEducationalContext(topic, foundIssue);
    
    result.requiresRedirection = true;
    result.adaptedTopic = adaptation.newTopic;
    result.warningMessage = adaptation.warningMessage;
    result.sanitizedTopic = adaptation.newTopic;
    
    console.log(`✅ Adapted to educational context: ${adaptation.newTopic}`);
  }
  
  return result;
}

/**
 * Adapt inappropriate topics to educational equivalents
 * REFERENCE: New educational transformation logic
 */
function adaptToEducationalContext(originalTopic, issueType) {
  const adaptations = {
    violence: {
      newTopic: 'Kỹ năng giải quyết xung đột bằng giao tiếp',
      warningMessage: 'Đã chuyển đổi thành hoạt động về kỹ năng giao tiếp tích cực và giải quyết xung đột một cách hòa bình.'
    },
    inappropriate_language: {
      newTopic: 'Kỹ năng giao tiếp lịch sự và văn hóa',
      warningMessage: 'Đã chuyển đổi thành hoạt động rèn luyện kỹ năng giao tiếp tích cực và lịch sự.'
    },
    dangerous_activities: {
      newTopic: 'An toàn và phòng ngừa rủi ro trong sinh hoạt',
      warningMessage: 'Đã chuyển đổi thành hoạt động giáo dục về an toàn và kỹ năng phòng ngừa rủi ro.'
    },
    adult_content: {
      newTopic: 'Phát triển kỹ năng sống và trách nhiệm cá nhân',
      warningMessage: 'Đã điều chỉnh để phù hợp với độ tuổi học sinh THCS.'
    },
    negative_behavior: {
      newTopic: 'Xây dựng thái độ tích cực và động lực học tập',
      warningMessage: 'Đã chuyển hướng thành hoạt động xây dựng tinh thần tích cực.'
    }
  };
  
  return adaptations[issueType] || {
    newTopic: 'Hoạt động giao tiếp và phát triển kỹ năng sống',
    warningMessage: 'Đã điều chỉnh để phù hợp với môi trường giáo dục tích cực.'
  };
}

/**
 * Analyze topic type for template selection
 * REFERENCE: Classification logic for template matching
 */
export function analyzeTopicType(topic, additionalRequirements = '') {
  console.log(`🔍 Analyzing topic type for: ${topic}`);
  
  const normalizedTopic = topic.toLowerCase();
  const normalizedRequirements = additionalRequirements.toLowerCase();
  const combinedText = `${normalizedTopic} ${normalizedRequirements}`;
  
  const topicCategories = {
    sports: {
      keywords: ['thể thao', 'bóng', 'chạy', 'nhảy', 'bơi', 'võ', 'gym', 'fitness', 'marathon', 'tennis', 'basketball', 'football', 'volleyball', 'badminton', 'yoga', 'aerobic'],
      confidence: 0
    },
    arts: {
      keywords: ['nghệ thuật', 'vẽ', 'hát', 'nhảy', 'múa', 'nhạc', 'tranh', 'sáng tạo', 'thiết kế', 'photography', 'video', 'drama', 'theater', 'piano', 'guitar', 'thời trang'],
      confidence: 0
    },
    culture: {
      keywords: ['văn hóa', 'truyền thống', 'lễ hội', 'ẩm thực', 'nấu', 'làm bánh', 'phong tục', 'tôn giáo', 'lịch sử', 'du lịch', 'quốc gia', 'món ăn', 'đặc sản'],
      confidence: 0
    },
    science: {
      keywords: ['khoa học', 'thí nghiệm', 'robot', 'máy tính', 'coding', 'toán', 'vật lý', 'hóa học', 'sinh học', 'công nghệ', 'kỹ thuật', 'AI', 'lập trình'],
      confidence: 0
    }
  };
  
  // Calculate confidence scores
  for (const [category, data] of Object.entries(topicCategories)) {
    data.confidence = data.keywords.filter(keyword => 
      combinedText.includes(keyword)
    ).length;
  }
  
  // Find best match
  const bestMatch = Object.entries(topicCategories)
    .sort(([,a], [,b]) => b.confidence - a.confidence)[0];
  
  const selectedType = bestMatch[1].confidence > 0 ? bestMatch[0] : 'general';
  
  console.log(`✅ Topic type selected: ${selectedType} (confidence: ${bestMatch[1].confidence})`);
  
  return {
    type: selectedType,
    confidence: bestMatch[1].confidence,
    suggestedKeywords: topicCategories[selectedType]?.keywords.slice(0, 5) || []
  };
}

/**
 * Smart topic adaptation for non-educational inputs
 * REFERENCE: Educational context transformation (Option A approach)
 */
export function adaptNonEducationalTopic(originalTopic) {
  console.log(`🔄 Adapting topic to educational context: ${originalTopic}`);
  
  const normalizedTopic = originalTopic.toLowerCase();
  
  // Educational adaptation mappings
  const adaptationMappings = {
    // Food & Cooking
    'nấu ăn': 'Học từ vựng tiếng Anh qua hoạt động nấu ăn',
    'làm bánh': 'English Baking Vocabulary và Cultural Exchange',
    'món ăn': 'Giới thiệu ẩm thực Việt Nam bằng tiếng Anh',
    'phở': 'Học tiếng Anh qua món ăn truyền thống Việt Nam',
    'bánh mì': 'Vietnamese Food Culture in English',
    
    // Entertainment  
    'xem phim': 'English Movie Discussion và Vocabulary Building',
    'nghe nhạc': 'Learning English through Songs',
    'game': 'Educational English Games và Team Building',
    'chơi': 'Interactive English Learning Activities',
    
    // Daily activities
    'ngủ': 'Healthy Lifestyle và Daily Routine Vocabulary',
    'mua sắm': 'Shopping English và Consumer Awareness',
    'du lịch': 'Travel English và Cultural Exploration',
    'làm đẹp': 'Self-care Vocabulary và Confidence Building',
    
    // Technology
    'facebook': 'Digital Citizenship và Online Communication Skills',
    'youtube': 'Creating Educational Content in English',
    'tiktok': 'Creative Expression và Media Literacy',
    'điện thoại': 'Technology Vocabulary và Responsible Usage',
    
    // Hobbies
    'đọc truyện': 'English Storytelling và Reading Comprehension',
    'chụp ảnh': 'Photography Vocabulary và Visual Communication',
    'làm vườn': 'Gardening English và Environmental Awareness'
  };
  
  // Find matching adaptation
  for (const [keyword, adaptation] of Object.entries(adaptationMappings)) {
    if (normalizedTopic.includes(keyword)) {
      console.log(`✅ Matched adaptation: ${keyword} → ${adaptation}`);
      return {
        adaptedTopic: adaptation,
        originalTopic: originalTopic,
        adaptationReason: `Đã chuyển đổi "${originalTopic}" thành hoạt động giáo dục có ý nghĩa.`,
        educationalValue: true
      };
    }
  }
  
  // Generic educational adaptation
  const genericAdaptation = `Học tiếng Anh qua chủ đề "${originalTopic}"`;
  console.log(`✅ Applied generic adaptation: ${genericAdaptation}`);
  
  return {
    adaptedTopic: genericAdaptation,
    originalTopic: originalTopic,
    adaptationReason: `Đã tích hợp "${originalTopic}" vào hoạt động học tiếng Anh.`,
    educationalValue: true
  };
}

/**
 * Validate activity parameters for completeness
 * REFERENCE: Simplified from existing lesson validation patterns
 */
export function validateActivityParams(params) {
  console.log('🔍 Validating activity parameters:', params);
  
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    sanitizedParams: { ...params }
  };
  
  // Required field validation
  if (!params.topic || params.topic.trim().length < 3) {
    validation.errors.push('Chủ đề hoạt động cần ít nhất 3 ký tự');
    validation.isValid = false;
  }
  
  if (!params.grade || !['6', '7', '8', '9'].includes(params.grade)) {
    validation.warnings.push('Khối lớp không hợp lệ, sử dụng mặc định lớp 6');
    validation.sanitizedParams.grade = '6';
  }
  
  if (!params.duration || isNaN(parseInt(params.duration))) {
    validation.warnings.push('Thời gian không hợp lệ, sử dụng mặc định 45 phút');
    validation.sanitizedParams.duration = '45';
  } else {
    const duration = parseInt(params.duration);
    if (duration < 15) {
      validation.warnings.push('Thời gian quá ngắn, điều chỉnh lên 15 phút');
      validation.sanitizedParams.duration = '15';
    } else if (duration > 120) {
      validation.warnings.push('Thời gian quá dài, điều chỉnh xuống 120 phút');
      validation.sanitizedParams.duration = '120';
    }
  }
  
  // Sanitize additional requirements
  if (params.additionalRequirements && params.additionalRequirements.length > 500) {
    validation.warnings.push('Yêu cầu đặc biệt quá dài, đã rút gọn');
    validation.sanitizedParams.additionalRequirements = 
      params.additionalRequirements.substring(0, 500) + '...';
  }
  
  console.log(`✅ Validation result: ${validation.isValid ? 'VALID' : 'INVALID'}`);
  return validation;
}

/**
 * Suggest educational improvements for topics
 * REFERENCE: New utility function for educational enhancement
 */
export function suggestEducationalContext(topic, activityType = 'general') {
  console.log(`💡 Suggesting educational context for: ${topic} (${activityType})`);
  
  const suggestions = {
    sports: [
      'Tích hợp từ vựng tiếng Anh về thể thao',
      'Rèn luyện kỹ năng teamwork và leadership',
      'Học các câu giao tiếp trong hoạt động thể thao',
      'Phát triển fair play và sportsmanship'
    ],
    arts: [
      'Học từ vựng về màu sắc và hình dạng bằng tiếng Anh',
      'Phát triển khả năng thuyết trình về tác phẩm nghệ thuật',
      'Tìm hiểu văn hóa nghệ thuật của các nước',
      'Rèn luyện tự tin và khả năng biểu đạt'
    ],
    culture: [
      'So sánh văn hóa Việt Nam với các nước khác',
      'Học từ vựng về truyền thống và phong tục',
      'Phát triển kỹ năng giao tiếp đa văn hóa',
      'Tăng cường hiểu biết và tolerance'
    ],
    science: [
      'Học scientific vocabulary bằng tiếng Anh',
      'Phát triển critical thinking và problem-solving',
      'Rèn luyện observation và hypothesis skills',
      'Ứng dụng kiến thức vào thực tế'
    ],
    general: [
      'Tích hợp học tiếng Anh vào hoạt động thực tế',
      'Phát triển communication và social skills',
      'Rèn luyện teamwork và collaboration',
      'Xây dựng confidence và leadership'
    ]
  };
  
  const contextSuggestions = suggestions[activityType] || suggestions.general;
  
  return {
    suggestedEnhancements: contextSuggestions,
    educationalFocus: `Chuyển đổi "${topic}" thành hoạt động học tập có ý nghĩa`,
    practicalTips: [
      'Sử dụng visual aids và hands-on activities',
      'Khuyến khích học sinh tham gia tích cực',
      'Tạo môi trường học tập thân thiện và an toàn',
      'Đánh giá dựa trên sự tham gia và effort'
    ]
  };
}

/**
 * Complete validation and adaptation pipeline
 * REFERENCE: Main validation function combining all checks
 */
export function processInputCompletely(rawParams) {
  console.log('🔄 Processing complete input validation and adaptation');
  
  const result = {
    isValid: false,
    processedParams: {},
    adaptations: {},
    warnings: [],
    errors: []
  };
  
  try {
    // Step 1: Basic parameter validation
    const paramValidation = validateActivityParams(rawParams);
    result.processedParams = paramValidation.sanitizedParams;
    result.warnings.push(...paramValidation.warnings);
    result.errors.push(...paramValidation.errors);
    
    if (!paramValidation.isValid) {
      return result;
    }
    
    // Step 2: Content safety check
    const safetyCheck = validateContentSafety(
      result.processedParams.topic,
      result.processedParams.additionalRequirements
    );
    
    if (safetyCheck.requiresRedirection) {
      result.adaptations.safety = safetyCheck;
      result.warnings.push(safetyCheck.warningMessage);
      result.processedParams.adaptedTopic = safetyCheck.adaptedTopic;
    }
    
    // Step 3: Educational adaptation if needed
    if (!safetyCheck.requiresRedirection) {
      const educationalAdaptation = adaptNonEducationalTopic(result.processedParams.topic);
      if (educationalAdaptation.adaptedTopic !== result.processedParams.topic) {
        result.adaptations.educational = educationalAdaptation;
        result.processedParams.adaptedTopic = educationalAdaptation.adaptedTopic;
        result.warnings.push(educationalAdaptation.adaptationReason);
      }
    }
    
    // Step 4: Topic type analysis
    const topicAnalysis = analyzeTopicType(
      result.processedParams.adaptedTopic || result.processedParams.topic,
      result.processedParams.additionalRequirements
    );
    
    result.processedParams.activityType = topicAnalysis.type;
    result.processedParams.confidence = topicAnalysis.confidence;
    
    // Step 5: Educational suggestions
    const educationalSuggestions = suggestEducationalContext(
      result.processedParams.adaptedTopic || result.processedParams.topic,
      topicAnalysis.type
    );
    
    result.adaptations.suggestions = educationalSuggestions;
    
    result.isValid = true;
    console.log('✅ Complete input processing successful');
    
  } catch (error) {
    console.error('❌ Error in input processing:', error);
    result.errors.push('Có lỗi xảy ra trong quá trình xử lý input');
  }
  
  return result;
}