// /static/js/controllers/lesson-plan/extracurricular/extracurricular_prompts.js
// Multiple templates for different activity types - INDEPENDENT from SGK system
// REFERENCE: Adapted from lesson-plan-prompts.js structure but simplified for activities

/**
 * Activity-specific templates for extracurricular content generation
 * TARGET: 3,000 characters (vs 15,000 for SGK lessons)
 * NO RAG: Pure AI generation without database dependency
 */

export const EXTRACURRICULAR_TEMPLATES = {
  
  // SPORTS ACTIVITIES TEMPLATE
  sports: `Bạn là chuyên gia tổ chức hoạt động thể thao giáo dục cho học sinh THCS.

Hãy tạo kế hoạch hoạt động ngoại khóa chi tiết cho:

HOẠT ĐỘNG THẾ THAO: {adaptedTopic}
ĐỐI TƯỢNG: Học sinh lớp {grade}
THỜI GIAN: {duration} phút
YÊU CẦU ĐẶC BIỆT: {additionalRequirements}

KẾ HOẠCH HOẠT ĐỘNG THỂ THAO:

I. MỤC TIÊU HOẠT ĐỘNG:
- Phát triển kỹ năng thể chất và tinh thần đồng đội
- Học từ vựng tiếng Anh liên quan đến thể thao
- Rèn luyện kỹ năng giao tiếp trong hoạt động nhóm
- Tăng cường sức khỏe và tính kỷ luật

II. CHUẨN BỊ:
- Dụng cụ thể thao cần thiết và khu vực hoạt động an toàn
- Thẻ từ vựng tiếng Anh về thể thao
- Thiết bị âm thanh cho hướng dẫn
- Bộ sơ cứu và nước uống

III. TIẾN TRÌNH HOẠT ĐỘNG:

A. KHỞI ĐỘNG (5-8 phút):
- Tập thể dục nhẹ nhàng và stretching cơ bản
- Giới thiệu từ vựng tiếng Anh cần dùng trong hoạt động
- Chia đội và phân công vai trò bằng tiếng Anh

B. HOẠT ĐỘNG CHÍNH (25-35 phút):
- Hướng dẫn chi tiết các bước thực hiện hoạt động thể thao
- Thực hành kỹ năng cơ bản với hướng dẫn song ngữ
- Tổ chức mini-games để rèn luyện kỹ năng
- Rotation activities để tất cả học sinh tham gia

C. HOẠT ĐỘNG GIAO TIẾP (8-12 phút):
- Thảo luận về trải nghiệm bằng tiếng Anh đơn giản
- Chia sẻ cảm nghĩ và học hỏi từ hoạt động
- Học các câu cảm thán và động viên trong thể thao

D. KẾT THÚC VÀ ĐÁNH GIÁ (5-8 phút):
- Thư giãn và cool-down exercises
- Tổng kết bài học và từ vựng đã học
- Khen ngợi và động viên các thành viên
- Dọn dẹp và sắp xếp dụng cụ

IV. TỪ VỰNG TIẾNG ANH TRỌNG TÂM:
[Danh sách 15-20 từ vựng liên quan đến hoạt động thể thao cụ thể]

V. AN TOÀN VÀ LƯU Ý:
- Các nguyên tắc an toàn trong hoạt động thể thao
- Hướng dẫn xử lý tình huống khẩn cấp
- Điều chỉnh cường độ phù hợp với từng học sinh

VI. ĐÁNH GIÁ:
- Tiêu chí đánh giá tinh thần tham gia và kỹ năng
- Phương pháp khuyến khích và động viên tích cực

YÊU CẦU: Nội dung phải chi tiết, thực tế và an toàn cho học sinh THCS. 
TARGET LENGTH: Khoảng 3,000 ký tự với mức độ chi tiết vừa phải.`,

  // ARTS & CREATIVE ACTIVITIES TEMPLATE  
  arts: `Bạn là chuyên gia tổ chức hoạt động nghệ thuật giáo dục cho học sinh THCS.

Hãy tạo kế hoạch hoạt động sáng tạo chi tiết cho:

HOẠT ĐỘNG NGHỆ THUẬT: {adaptedTopic}
ĐỐI TƯỢNG: Học sinh lớp {grade}
THỜI GIAN: {duration} phút
YÊU CẦU ĐẶC BIỆT: {additionalRequirements}

KẾ HOẠCH HOẠT ĐỘNG SÁNG TẠO:

I. MỤC TIÊU HOẠT ĐỘNG:
- Phát triển khả năng sáng tạo và thẩm mỹ
- Học từ vựng tiếng Anh về nghệ thuật và màu sắc
- Rèn luyện kỹ năng thuyết trình và diễn đạt
- Tăng cường sự tự tin và khả năng biểu đạt cá nhân

II. CHUẨN BỊ:
- Vật liệu nghệ thuật (giấy, bút màu, keo, kéo, v.v.)
- Máy chiếu để trình chiếu ví dụ và hướng dẫn
- Không gian làm việc rộng rãi và đầy đủ ánh sáng
- Background music nhẹ nhàng để tạo không khí sáng tạo

III. TIẾN TRÌNH HOẠT ĐỘNG:

A. KHỞI ĐỘNG SÁNG TẠO (5-8 phút):
- Warm-up activities để kích thích tư duy sáng tạo
- Giới thiệu từ vựng tiếng Anh về nghệ thuật và màu sắc
- Brainstorming ideas và chia sẻ ý tưởng ban đầu

B. HƯỚNG DẪN KỸ THUẬT (8-12 phút):
- Demonstration các kỹ thuật cơ bản cần sử dụng
- Giải thích step-by-step process bằng tiếng Anh đơn giản
- Q&A session để clarify doubts

C. HOẠT ĐỘNG SÁNG TẠO CHÍNH (20-30 phút):
- Individual/group creative work
- Teacher guidance và individual support
- Peer collaboration và idea sharing
- Progress check và encouragement

D. THUYẾT TRÌNH VÀ CHIA SẺ (8-12 phút):
- Presentation của từng học sinh/nhóm
- Chia sẻ ý tưởng và process sáng tạo bằng tiếng Anh
- Peer feedback và appreciation
- Exhibition setup của các tác phẩm

E. REFLECTION VÀ KẾT THÚC (5-8 phút):
- Discussion về trải nghiệm sáng tạo
- Vocabulary review và new expressions learned
- Clean-up và organization của workspace

IV. TỪ VỰNG NGHỆ THUẬT TIẾNG ANH:
[Danh sách 15-20 từ vựng về nghệ thuật, màu sắc, kỹ thuật]

V. ĐÁNH GIÁ VÀ KHUYẾN KHÍCH:
- Tiêu chí đánh giá dựa trên creativity và effort
- Positive feedback techniques
- Portfolio building cho các hoạt động tiếp theo

TARGET LENGTH: Khoảng 3,000 ký tự với focus vào practical implementation.`,

  // CULTURE & LANGUAGE EXCHANGE TEMPLATE
  culture: `Bạn là chuyên gia tổ chức hoạt động giao lưu văn hóa cho học sinh THCS.

Hãy tạo kế hoạch hoạt động văn hóa chi tiết cho:

HOẠT ĐỘNG VĂN HÓA: {adaptedTopic}
ĐỐI TƯỢNG: Học sinh lớp {grade}
THỜI GIAN: {duration} phút
YÊU CẦU ĐẶC BIỆT: {additionalRequirements}

KẾ HOẠCH GIAO LƯU VĂN HÓA:

I. MỤC TIÊU HOẠT ĐỘNG:
- Mở rộng hiểu biết về văn hóa đa dạng
- Phát triển kỹ năng giao tiếp đa văn hóa
- Học từ vựng tiếng Anh về truyền thống và phong tục
- Tăng cường khả năng empathy và open-mindedness

II. CHUẨN BỊ:
- Presentation materials về different cultures
- Props và costumes traditional (nếu có)
- World map và cultural artifacts
- Audio/video materials về music và traditions

III. TIẾN TRÌNH HOẠT ĐỘNG:

A. CULTURAL WARM-UP (5-8 phút):
- Icebreaker games về cultural differences
- Introduction của key vocabulary về cultures
- Sharing về own cultural background

B. CULTURAL EXPLORATION (15-20 phút):
- Presentation về specific culture/tradition được chọn
- Interactive demonstration của cultural practices
- Comparison với Vietnamese culture
- Discussion về similarities và differences

C. HANDS-ON CULTURAL EXPERIENCE (15-20 phút):
- Practical activities như cooking, crafts, games từ culture được học
- Role-play cultural scenarios
- Learning traditional songs hoặc dances
- Cultural etiquette practice

D. CROSS-CULTURAL COMMUNICATION (8-12 phút):
- Practice greetings và basic phrases từ different languages
- Cultural sensitivity discussions
- Sharing personal cultural experiences
- Building cultural bridges through communication

E. REFLECTION VÀ CELEBRATION (5-8 phút):
- Group reflection về what they learned
- Appreciation của cultural diversity
- Planning cho future cultural activities
- Cultural appreciation certificates

IV. TỪ VỰNG VĂN HÓA TRỌNG TÂM:
[15-20 từ vựng về culture, tradition, customs, festivals]

V. CULTURAL SENSITIVITY GUIDELINES:
- Respectful approach đến all cultures
- Avoiding stereotypes và generalizations
- Celebrating diversity và inclusion

VI. FOLLOW-UP ACTIVITIES:
- Research projects về different cultures
- Pen pal programs với international students
- Cultural fair planning

TARGET LENGTH: Khoảng 3,000 ký tự với emphasis trên respectful cultural exchange.`,

  // SCIENCE & STEM ACTIVITIES TEMPLATE
  science: `Bạn là chuyên gia tổ chức hoạt động STEM giáo dục cho học sinh THCS.

Hãy tạo kế hoạch hoạt động khoa học chi tiết cho:

HOẠT ĐỘNG KHOA HỌC: {adaptedTopic}
ĐỐI TƯỢNG: Học sinh lớp {grade}
THỜI GIAN: {duration} phút
YÊU CẦU ĐẶC BIỆT: {additionalRequirements}

KẾ HOẠCH HOẠT ĐỘNG STEM:

I. MỤC TIÊU HOẠT ĐỘNG:
- Phát triển tư duy khoa học và logical thinking
- Học scientific vocabulary trong tiếng Anh
- Rèn luyện kỹ năng observation và hypothesis
- Tăng cường curiosity và problem-solving skills

II. CHUẨN BỊ:
- Scientific materials và experiment supplies
- Safety equipment và protective gear
- Worksheets và observation charts
- Digital tools cho data recording

III. TIẾN TRÌNH HOẠT ĐỘNG:

A. SCIENTIFIC WARM-UP (5-8 phút):
- Science trivia questions để kích thích curiosity
- Introduction của scientific vocabulary cần dùng
- Safety briefing và lab rules

B. HYPOTHESIS FORMATION (8-10 phút):
- Problem presentation và question formulation
- Brainstorming possible explanations
- Hypothesis writing practice trong tiếng Anh
- Prediction activities

C. HANDS-ON EXPERIMENT (20-25 phút):
- Step-by-step experiment implementation
- Data collection và observation recording
- Teamwork trong scientific investigation
- Troubleshooting và problem-solving

D. DATA ANALYSIS (8-12 phút):
- Results interpretation và pattern recognition
- Graph creation và data visualization
- Comparison với initial hypothesis
- Discussion của findings

E. SCIENTIFIC COMMUNICATION (5-8 phút):
- Presentation của results bằng scientific language
- Peer review và feedback
- Real-world applications discussion
- Future investigation ideas

IV. SCIENTIFIC VOCABULARY:
[15-20 từ vựng về scientific method, equipment, processes]

V. SAFETY PROTOCOLS:
- Lab safety rules và emergency procedures
- Proper handling của materials
- Waste disposal guidelines

VI. EXTENSION ACTIVITIES:
- Science fair project ideas
- Home experiments (safe ones)
- Scientific journal reading

TARGET LENGTH: Khoảng 3,000 ký tự với focus trên hands-on learning.`,

  // GENERAL FALLBACK TEMPLATE
  general: `🎭 Bạn là chuyên gia tổ chức hoạt động ngoại khóa sôi động cho học sinh THCS Việt Nam.

Hãy tạo kịch bản hoạt động VUI NHỘN và SÁNG TẠO cho:

🎯 CHỦ ĐỀ HOẠT ĐỘNG: {adaptedTopic}
👥 ĐỐI TƯỢNG: Học sinh lớp {grade} 
⏰ THỜI GIAN: {duration} phút
💡 YÊU CẦU ĐẶC BIỆT: {additionalRequirements}

🎉 KỊCH BẢN HOẠT ĐỘNG NGOẠI KHÓA:

I. 🎯 MỤC TIÊU HOẠT ĐỘNG:
- Tạo không khí vui tươi, hào hứng xung quanh chủ đề
- Khuyến khích học sinh tham gia tích cực và sáng tạo
- Xây dựng tinh thần đồng đội và chia sẻ
- Tạo ra những trải nghiệm đáng nhớ và ý nghĩa

II. 🎒 CHUẨN BỊ:
- Trang thiết bị và vật dụng cần thiết cho hoạt động
- Không gian tổ chức rộng rãi và an toàn
- Âm thanh, hình ảnh hỗ trợ (nếu cần)
- Phần thưởng và quà lưu niệm cho học sinh

III. 🚀 TIẾN TRÌNH HOẠT ĐỘNG (CHI TIẾT):

🌟 A. KHỞI ĐỘNG HỨNG KHỞI (8-10 phút):
[MÔ TẢ CỰC KỲ CHI TIẾT từng bước khởi động]
- Hoạt động làm quen vui nhộn liên quan trực tiếp đến chủ đề
- Cách tạo không khí hào hứng từ giây đầu tiên
- Chia nhóm sáng tạo với các tên gọi thú vị
- Games hoặc câu hỏi khởi động thu hút sự chú ý

🎮 B. HOẠT ĐỘNG CHÍNH - KHÁM PHÁ CHỦ ĐỀ (25-30 phút):
[MÔ TẢ TỪNG HOẠT ĐỘNG SIÊU CHI TIẾT]
- Hoạt động 1: [Tên cụ thể] - Cách thức tổ chức và tham gia
- Hoạt động 2: [Tên cụ thể] - Luật chơi và mục đích rõ ràng  
- Hoạt động 3: [Tên cụ thể] - Vai trò của từng thành viên
- Rotation giữa các stations nếu có nhiều hoạt động đồng thời

⭐ C. THỜI GIAN SÁNG TẠO (8-10 phút):
[CHI TIẾT CÁCH TỔ CHỨC PHẦN SÁNG TẠO]
- Thử thách sáng tạo liên quan đến chủ đề
- Trình bày ý tưởng hoặc sản phẩm của các nhóm
- Cách khuyến khích và đánh giá tích cực

🎊 D. KẾT THÚC VÀ CHIA SẺ (5-7 phút):
[CÁCH KẾT THÚC ĐÁNG NHỚ]
- Tổng kết những điều thú vị đã học được
- Chia sẻ cảm nghĩ và trải nghiệm của học sinh
- Trao phần thưởng và ghi nhận sự tham gia
- Dọn dẹp cùng nhau với tinh thần vui vẻ

IV. 🎪 CÁC HOẠT ĐỘNG VUI NHỘN CỤ THỂ:
[LIỆT KÊ 8-10 HOẠT ĐỘNG MINI CỤ THỂ]

V. 🏆 CÁCH ĐÁNH GIÁ VÀ KHUYẾN KHÍCH:
- Tiêu chí đánh giá dựa trên tinh thần tham gia
- Cách tạo động lực và khuyến khích tích cực
- Hình thức ghi nhận và khen thưởng

YÊU CẦU: Tập trung 100% vào chủ đề, tạo hoạt động VUI NHỘN và THỰC TẾ.
TARGET: Chính xác 3,000 ký tự với TIẾN TRÌNH HOẠT ĐỘNG cực kỳ chi tiết!`
};

/**
 * Smart template selection based on topic analysis
 * REFERENCE: New logic for activity classification
 */
export function selectTemplateByTopic(topic, additionalRequirements = '') {
  const normalizedTopic = topic.toLowerCase();
  const requirements = additionalRequirements.toLowerCase();
  
  // Sports keywords detection
  const sportsKeywords = ['thể thao', 'bóng', 'chạy', 'nhảy', 'bơi', 'võ', 'gym', 'fitness', 'marathon', 'tennis', 'basketball', 'football', 'volleyball', 'badminton'];
  
  // Arts keywords detection  
  const artsKeywords = ['nghệ thuật', 'vẽ', 'hát', 'nhảy', 'múa', 'nhạc', 'tranh', 'sáng tạo', 'thiết kế', 'photography', 'video', 'drama', 'theater'];
  
  // Culture keywords detection
  const cultureKeywords = ['văn hóa', 'truyền thống', 'lễ hội', 'ẩm thực', 'nấu', 'làm bánh', 'phong tục', 'tôn giáo', 'lịch sử', 'du lịch', 'quốc gia'];
  
  // Science keywords detection
  const scienceKeywords = ['khoa học', 'thí nghiệm', 'robot', 'máy tính', 'coding', 'toán', 'vật lý', 'hóa học', 'sinh học', 'công nghệ', 'kỹ thuật'];
  
  // Check which category matches
  if (sportsKeywords.some(keyword => normalizedTopic.includes(keyword) || requirements.includes(keyword))) {
    return 'sports';
  }
  
  if (artsKeywords.some(keyword => normalizedTopic.includes(keyword) || requirements.includes(keyword))) {
    return 'arts';
  }
  
  if (cultureKeywords.some(keyword => normalizedTopic.includes(keyword) || requirements.includes(keyword))) {
    return 'culture';
  }
  
  if (scienceKeywords.some(keyword => normalizedTopic.includes(keyword) || requirements.includes(keyword))) {
    return 'science';
  }
  
  // Default fallback
  return 'general';
}

/**
 * Add length requirements to template
 * REFERENCE: Adapted from lesson-plan-prompts.js length requirements
 * TARGET: 3,000 characters (different from SGK 15,000)
 */
export function addLengthRequirements(template, targetLength = 3000) {
  const lengthRequirement = `

⚠️⚠️⚠️ YÊU CẦU QUAN TRỌNG VỀ ĐỘ DÀI ⚠️⚠️⚠️

Hoạt động ngoại khóa PHẢI dài khoảng ${targetLength} KÝ TỰ (~ 3-4 trang A4).

Mỗi phần PHẢI được mô tả chi tiết nhưng VỪA PHẢI:

1. TIẾN TRÌNH HOẠT ĐỘNG: Mô tả chi tiết từng bước thực hiện
   - Mỗi giai đoạn: 8-12 câu hướng dẫn cụ thể
   - Timing chính xác cho từng hoạt động
   - Clear instructions cho học sinh

2. TỪ VỰNG TIẾNG ANH: 15-20 từ/cụm từ hữu ích
   - Phiên âm và nghĩa tiếng Việt
   - Ví dụ sử dụng trong hoạt động

3. CHUẨN BỊ & AN TOÀN: Chi tiết đầy đủ
   - Materials list cụ thể
   - Safety guidelines rõ ràng
   - Setup instructions

4. ĐÁNH GIÁ: Tiêu chí và phương pháp cụ thể

TARGET: CHÍNH XÁC ${targetLength} ký tự - vừa đủ chi tiết cho hoạt động thực tế!

⚡ LƯU Ý: Đây là HOẠT ĐỘNG NGOẠI KHÓA nên tập trung vào:
- Tính thực tế và khả thi
- Hoạt động tương tác nhiều
- Ngôn ngữ tiếng Anh practical
- Phù hợp môi trường trường học
- An toàn cho học sinh THCS`;

  return template + lengthRequirement;
}

/**
 * Get complete template with all enhancements
 * REFERENCE: Main function to get final template
 */
export function getCompleteTemplate(topic, additionalRequirements, params) {
  // Select appropriate template
  const templateType = selectTemplateByTopic(topic, additionalRequirements);
  let selectedTemplate = EXTRACURRICULAR_TEMPLATES[templateType];
  
  // Add length requirements
  selectedTemplate = addLengthRequirements(selectedTemplate, 3000);
  
  // Replace placeholders with actual values
  selectedTemplate = selectedTemplate
    .replace(/\{adaptedTopic\}/g, params.adaptedTopic || topic)
    .replace(/\{grade\}/g, params.grade || '6')
    .replace(/\{duration\}/g, params.duration || '45')
    .replace(/\{additionalRequirements\}/g, additionalRequirements || 'Không có yêu cầu đặc biệt');
  
  console.log(`✅ Selected template type: ${templateType} for topic: ${topic}`);
  return selectedTemplate;
}