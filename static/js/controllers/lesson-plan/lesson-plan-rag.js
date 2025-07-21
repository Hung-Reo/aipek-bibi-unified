// /static/js/controllers/lesson-plan/lesson-plan-rag.js
// Module kết nối với dịch vụ RAG cho tính năng Soạn giáo án

// ✅ NEW IMPORT: Access to UNITS_DATA for unit name lookup
import { UNITS_DATA } from './lesson-plan-prompts.js';

export class LessonPlanRAG {
    constructor(options = {}) {
        // Xác định base URL cho môi trường phát triển và sản xuất
        const baseUrl = window.location.origin; // Unified deployment

        // Đường dẫn API
        this.apiUrl = options.apiUrl || `${baseUrl}/api/rag`; 
        this.healthUrl = `${baseUrl}/api/health`;
        
        // Danh sách các namespace để tìm kiếm
        this.namespaces = options.namespaces || ["bibi_sgk", "bibi_ctgd", "bibi_lesson_plan"];
        this.defaultNamespace = options.defaultNamespace || "bibi_lesson_plan"; 
        
        this.defaultTopK = options.topK || 5; // Tăng lên 5 để có đủ ngữ cảnh cho giáo án
        this.isAvailable = false; // Mặc định chưa kết nối
        this.debug = options.debug || false;
        this.enabled = options.enabled !== false;
        
        console.log(`🔄 Lesson Plan RAG API URL: ${this.apiUrl}`);
        console.log(`📚 Lesson Plan RAG Namespaces: ${this.namespaces.join(', ')}`);
    }

    // Kiểm tra kết nối đến API
    async checkConnection() {
        if (!this.enabled) {
            console.log('💤 RAG đã bị tắt trong cấu hình');
            return false;
        }
        
        try {
            console.log('🔍 Kiểm tra kết nối RAG cho giáo án...');
            
            // Gọi endpoint health check
            const response = await fetch(this.healthUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(15000) // ✅ FIX: 5s → 15s timeout
            });
            
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            // Chấp nhận cả 'success' và 'ok' là trạng thái thành công
            this.isAvailable = (data.status === 'success' || data.status === 'ok');
            
            if (this.isAvailable) {
                console.log(`✅ Kết nối RAG giáo án thành công: ${data.message}`);
                
                // Kiểm tra xem có dữ liệu Pinecone không
                if (data.pinecone_index && data.default_namespace) {
                    console.log(`📊 Pinecone index: ${data.pinecone_index}, namespace mặc định: ${data.default_namespace}`);
                } else {
                    // Vẫn được coi là thành công ngay cả khi không có thông tin Pinecone cụ thể
                    console.log(`📊 Kết nối thành công, không có thông tin chi tiết về Pinecone`);
                }
            } else {
                console.error('❌ API RAG không sẵn sàng cho giáo án');
            }
            
            return this.isAvailable;
        }
        catch (error) {
            console.error('❌ Lỗi kiểm tra kết nối RAG giáo án:', error);
            
            // Trong môi trường phát triển, giả lập kết nối thành công
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('⚠️ Đang ở môi trường phát triển: Giả lập kết nối RAG thành công mặc dù có lỗi');
                this.isAvailable = true;
                return true;
            }
            
            this.isAvailable = false;
            return false;
        }
    }

    // 🔥 GET TIMEOUT CONFIGURATION - PHASE 2 OPTIMIZED
    getTimeoutConfiguration(lessonType = 'main') {
        // Main timeout configuration - OPTIMIZED for 3-namespace coverage
        const mainTimeouts = {
            'bibi_ctgd': 35000,       // Working fine với 35s
            'bibi_sgk': 30000,        // Working fine với 30s  
            'bibi_lesson_plan': 45000, // ✅ PHASE 2 FIX: 25s → 45s (backend cần >25s)
            'default': 30000
        };
        
        // Supplementary timeout configuration (EXTENDED FOR BETTER SUCCESS)
        const supplementaryTimeouts = {
            'bibi_ctgd': 55000,       // +20s (backend needs 35s + network + safety)
            'bibi_sgk': 50000,        // +20s (backend needs 30s + network + safety)
            'bibi_lesson_plan': 45000, // Consistent với main lesson timeout
            'default': 50000          // +20s default
        };

        // ✅ NEW: Dedicated Review timeout configuration (HIGHEST - covers 3 Units)
        const reviewTimeouts = {
            'bibi_ctgd': 35000,       // Copy từ mainTimeouts  
            'bibi_sgk': 30000,        // Copy từ mainTimeouts
            'bibi_lesson_plan': 45000, // Copy từ mainTimeouts
            'default': 30000          // Copy từ mainTimeouts
        };
        
        // 🎯 CONDITIONAL LOGIC: Only extend timeout for supplementary
        if (lessonType === 'supplementary') {
            console.log('⏱️ Using EXTENDED timeouts for Supplementary lesson');
            return supplementaryTimeouts;
        } else if (lessonType === 'review') {
            // ✅ ENHANCED: Review needs AGGRESSIVE timeouts (cross-unit complexity)
            console.log('⏱️ Using AGGRESSIVE timeouts for Review lesson');
            return reviewTimeouts; // Use dedicated review timeouts
        } else {
            console.log('⏱️ Using OPTIMIZED timeouts for Main lesson');
            return mainTimeouts;
        }
    }

    // Thêm vào class LessonPlanRAG
    async searchFastFirst(query, options = {}) {
        if (!this.enabled) {
        return { success: false, disabled: true, results: [] };
        }
        
        const lessonType = options.lessonType || 'main';
        
        // 1. Xác định namespace ưu tiên dựa trên loại giáo án
        let priorityNamespace;
        switch(lessonType) {
        case 'main':
            priorityNamespace = "bibi_ctgd"; // CTGD cho giáo án chính
            break;
        case 'supplementary':
            priorityNamespace = "bibi_ctgd"; // CTGD cho tăng tiết
            break;
        case 'extracurricular':
            priorityNamespace = "bibi_ctgd"; // CTGD cho ngoại khóa
            break;
        default:
            priorityNamespace = "bibi_ctgd";
        }
        
        console.log(`🚀 Tìm kiếm nhanh trên namespace ưu tiên: ${priorityNamespace}`);
        
        // 2. 🚀 PARALLEL OPTIMIZATION: Increased timeout for better RAG success  
        const fastTimeout = options.timeout || options.fastTimeout || 25000; // ⚡ URGENT: 15s → 25s to avoid race condition
        
        try {

        // 3. Tạo URL với query parameters - tối ưu dựa vào loại giáo án
        let url;
        if (this.apiUrl.startsWith('http')) {
            url = new URL(this.apiUrl);
        } else {
            url = new URL(this.apiUrl, window.location.origin);
        }
        url.searchParams.append("query", query);
        url.searchParams.append("namespace", priorityNamespace);

        // Điều chỉnh tham số dựa vào loại giáo án
        if (options.lessonType === 'supplementary') {
            // Cho supplementary - chỉ lấy 1 kết quả tốt nhất và hạ threshold
            url.searchParams.append("top_k", 1);
            url.searchParams.append("threshold", "0.55"); // Ngưỡng thấp hơn
            url.searchParams.append("max_tokens", "4000"); // Giới hạn kích thước token
        } else {
            // Cho main và extracurricular
            url.searchParams.append("top_k", 2); // Giảm từ 3 xuống 2
            url.searchParams.append("threshold", "0.7");
        }

        url.searchParams.append("search_all", "true"); // Thêm tham số search_all
        url.searchParams.append("threshold", "0.6"); // Thêm ngưỡng thấp hơn cho supplementary

        // Thêm tham số max_tokens cho kết quả ngắn hơn, nhanh hơn
        if (options.lessonType === 'supplementary') {
            url.searchParams.append("max_tokens", "8000"); // Giới hạn kích thước token
        }
        
        // 4. Thêm timeout ngắn để không đợi quá lâu
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.log(`⏱️ PARALLEL: Timeout sau ${fastTimeout/1000}s cho namespace ưu tiên ${priorityNamespace}`);
        }, fastTimeout);
        
        // 5. Gọi API tìm kiếm
        console.log(`⏱️ PARALLEL: Đợi tối đa ${fastTimeout/1000}s cho kết quả nhanh từ ${priorityNamespace} (race condition fix)`);
        const response = await fetch(url.toString(), {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        // 6. Xử lý kết quả
        if (!response.ok) {
            console.warn(`RAG API trả về status code: ${response.status} cho namespace ưu tiên`);
            return { success: false, namespace: priorityNamespace, results: [] };
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
            console.error(`RAG API Error cho ${priorityNamespace}:`, data.message);
            return { success: false, namespace: priorityNamespace, error: data.message, results: [] };
        }
        
        // 7. Đánh dấu nguồn của mỗi kết quả
        const results = (data.results || []).map(result => ({
            ...result,
            namespace: priorityNamespace,
            metadata: {
            ...result.metadata,
            namespace: priorityNamespace,
            source: result.metadata?.source || this.getNamespaceDisplayName(priorityNamespace)
            }
        }));
        
        // 8. Trả về kết quả
        console.log(`✅ PARALLEL: Tìm thấy ${results.length} kết quả nhanh từ namespace ưu tiên ${priorityNamespace}`);
        return {
            success: results.length > 0,
            namespace: priorityNamespace,
            results,
            count: results.length,
            prioritySearch: true
        };
        } catch (error) {
        if (error.name === 'AbortError') {
            console.warn(`RAG API timeout cho namespace ưu tiên ${priorityNamespace}`);
            return { success: false, namespace: priorityNamespace, error: 'Timeout', results: [] };
        }
        console.error(`Lỗi khi tìm kiếm trên namespace ưu tiên ${priorityNamespace}:`, error);
        return { success: false, namespace: priorityNamespace, error: error.message, results: [] };
        }
    }

    // Thêm phương thức tìm kiếm cascade vào class LessonPlanRAG
    async searchCascade(query, options = {}) {
        if (!this.enabled) {
            return { success: false, disabled: true, results: [] };
        }
        
        try {
            // Thứ tự ưu tiên các namespace dựa vào loại giáo án
            let priorityNamespaces;
            
            // Phần xử lý loại giáo án 'supplementary'
            if (options.lessonType === 'main') {
                // Ưu tiên SGK và CTGD cho giáo án chính
                priorityNamespaces = ["bibi_sgk", "bibi_ctgd", "bibi_lesson_plan"];
            } else if (options.lessonType === 'supplementary') {
                // SỬA ĐỔI: Ưu tiên CTGD (trước tiên), lesson plan và SGK cho tăng tiết
                priorityNamespaces = ["bibi_ctgd", "bibi_lesson_plan", "bibi_sgk"];
            } else if (options.lessonType === 'extracurricular') {
                // Ưu tiên lesson plan cho ngoại khóa
                priorityNamespaces = ["bibi_lesson_plan", "bibi_ctgd", "bibi_sgk"];
            } else {
                // Mặc định nếu không có thông tin loại
                priorityNamespaces = options.namespaces || ["bibi_sgk", "bibi_ctgd", "bibi_lesson_plan"];
            }
            
            // Timeout dài hơn cho môi trường production
            const timeoutPerLevel = options.timeout || 45000; // 45 giây
            console.log(`🕒 Thiết lập timeout ${timeoutPerLevel/1000}s cho mỗi namespace trong cascade`);
            
            // Ngưỡng chất lượng và số lượng kết quả
            const qualityThreshold = options.qualityThreshold || 0.75;
            const minQualityResults = options.minQualityResults || 3;
            
            console.log(`🔍 Tìm kiếm theo cascade cho giáo án: "${query}" với các namespace ưu tiên`, priorityNamespaces);
            
            // Thực hiện tìm kiếm theo cascade
            let allResults = [];
            let searchedNamespaces = [];
            let successNamespaces = [];
            
            for (const namespace of priorityNamespaces) {
                console.log(`🔎 Tìm kiếm trên namespace ưu tiên: ${namespace}`);
                searchedNamespaces.push(namespace);
                
                // Tìm kiếm trên namespace hiện tại với timeout ngắn
                try {
                    // Tạo URL với query parameters
                    let url;
                    if (this.apiUrl.startsWith('http')) {
                        url = new URL(this.apiUrl);
                    } else {
                        url = new URL(this.apiUrl, window.location.origin);
                    }
                    url.searchParams.append("query", query);
                    url.searchParams.append("namespace", namespace);
                    const topK = options.topK || this.defaultTopK;
                    url.searchParams.append("top_k", topK);
                    url.searchParams.append("search_all", "true"); // Thêm tham số search_all
                    
                    // Thêm timeout để tránh đợi quá lâu
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeoutPerLevel);
                    
                    const response = await fetch(url.toString(), {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        console.warn(`RAG API trả về status code: ${response.status} cho namespace ${namespace}`);
                        continue; // Bỏ qua namespace này nếu có lỗi
                    }
                    
                    const data = await response.json();
                    
                    if (data.status === 'error') {
                        console.error(`RAG API Error cho ${namespace}:`, data.message);
                        continue; // Bỏ qua namespace này nếu có lỗi
                    }
                    
                    // Đánh dấu nguồn của mỗi kết quả
                    const results = (data.results || []).map(result => ({
                        ...result,
                        // Sử dụng search_namespace từ API hoặc giữ namespace hiện tại
                        namespace: result.metadata?.search_namespace || namespace,
                        // Cập nhật metadata để hiển thị nguồn
                        metadata: {
                            ...result.metadata,
                            namespace: result.metadata?.search_namespace || namespace, // Sử dụng search_namespace nếu có
                            source: result.metadata?.source || this.getNamespaceDisplayName(result.metadata?.search_namespace || namespace)
                        }
                    }));
                    
                    if (results.length > 0) {
                        console.log(`✅ Tìm thấy ${results.length} kết quả từ namespace ${namespace}`);
                        allResults = allResults.concat(results);
                        successNamespaces.push(namespace);
                        
                        // Kiểm tra nếu đã có đủ kết quả chất lượng cao
                        const highQualityResults = results.filter(r => r.score >= qualityThreshold);
                        if (highQualityResults.length >= minQualityResults) {
                            console.log(`✅ Đã tìm thấy ${highQualityResults.length} kết quả chất lượng cao từ namespace ${namespace}, dừng cascade`);
                            // Đã đủ kết quả tốt, dừng cascade
                            break;
                        }
                    } else {
                        console.log(`ℹ️ Không tìm thấy kết quả từ namespace ${namespace}`);
                    }
                } catch (fetchError) {
                    if (fetchError.name === 'AbortError') {
                        console.warn(`RAG API request timeout cho namespace ${namespace}`);
                    } else {
                        console.error(`Lỗi khi tìm kiếm trên namespace ${namespace}:`, fetchError);
                    }
                    continue; // Bỏ qua namespace này nếu có lỗi, tiếp tục với namespace tiếp theo
                }
            }
            
            // Sắp xếp kết quả theo điểm số (từ cao đến thấp)
            allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
            
            // Giới hạn số lượng kết quả để tránh quá nhiều
            const maxResults = options.maxResults || 5;
            if (allResults.length > maxResults) {
                allResults = allResults.slice(0, maxResults);
            }
            
            console.log(`✅ Kết quả tìm kiếm cascade: ${allResults.length} kết quả từ ${successNamespaces.length}/${searchedNamespaces.length} namespaces`);
            
            if (this.debug) {
                console.table(allResults.map(r => ({
                    source: r.metadata?.source,
                    namespace: r.namespace,
                    score: r.score,
                    length: r.content?.length || 0
                })));
            }
            
            return {
                success: allResults.length > 0,
                results: allResults,
                query,
                searchedNamespaces,
                successNamespaces
            };
        } catch (error) {
            console.error('Error in searchCascade:', error);
            return {
                success: false,
                error: 'Không thể tìm kiếm theo cascade: ' + error.message,
                results: []
            };
        }
    }

    // Sửa phương thức search để sử dụng danh sách namespace được tối ưu (20-May)
    async search(query, options = {}) {
        if (!this.enabled) {
          return { success: false, disabled: true, results: [] };
        }
        
        try {
          // Hàm kiểm tra nội dung tài liệu có phù hợp với Unit không
          function isRelevantToUnit(document, unitNumber) {
            if (!document || !document.content) return false;
            
            const content = document.content.toLowerCase();
            
            // Kiểm tra Unit cụ thể
            const hasCorrectUnit = 
            content.includes(`unit ${unitNumber} `) || 
            content.includes(`unit ${unitNumber}.`) ||
            content.includes(`unit ${unitNumber}:`) ||
            content.includes(`unit ${unitNumber}\n`);
            
            // Kiểm tra Unit khác - tránh lấy Unit 10 khi tìm Unit 1
            const hasWrongUnit = 
            (unitNumber === 1 && content.match(/unit 1[0-9]/)) || // Tránh Unit 10-19 khi tìm Unit 1
            (unitNumber < 7 && content.match(/unit [7-9]/)) ||    // Tránh Unit 7-9 khi tìm Unit 1-6
            (unitNumber < 7 && content.match(/unit 1[0-2]/));     // Tránh Unit 10-12 khi tìm Unit 1-6
            
            return hasCorrectUnit && !hasWrongUnit;
          }
            
            
            // Sử dụng danh sách namespaces tối ưu dựa vào lessonType
            const lessonType = options.lessonType || 'main';
            const namespaces = options.namespaces || this.getPriorityNamespaces(lessonType);
            
            // Ưu tiên topK cho từng namespace theo mức độ quan trọng
            const topK = options.topK || (lessonType === 'main' ? 5 : 3);
            
            console.log(`🔍 Tìm kiếm RAG giáo án cho: "${query}" trên ${namespaces.length} namespaces`);
            
            // 🔥 OPTION A: CONDITIONAL TIMEOUT - Apply different timeouts based on lesson type
            const timeoutConfig = this.getTimeoutConfiguration(lessonType);
            console.log(`⏱️ Áp dụng timeout configuration cho ${lessonType}:`, timeoutConfig);
            
            // Tìm kiếm song song trên tất cả namespaces nhưng với độ ưu tiên khác nhau
            const searchPromises = namespaces.map(async (namespace) => {
                try {
                    // Tạo URL với query parameters
                    let url;
                    if (this.apiUrl.startsWith('http')) {
                        url = new URL(this.apiUrl);
                    } else {
                        url = new URL(this.apiUrl, window.location.origin);
                    }
                    
                    // Tối ưu top_k dựa vào namespace
                    const namespaceTopK = namespace === 'bibi_ctgd' ? Math.max(topK, 3) : topK;
                    
                    url.searchParams.append("query", query);
                    url.searchParams.append("namespace", namespace);
                    url.searchParams.append("top_k", namespaceTopK);
                    url.searchParams.append("search_all", "true");
                    url.searchParams.append("threshold", namespace === 'bibi_ctgd' ? "0.6" : "0.7"); // Giảm ngưỡng cho CTGD
                    
                    console.log(`🔎 Tìm kiếm trên namespace ${namespace} với top_k=${namespaceTopK}`);
                    
                    // 🔥 CONDITIONAL TIMEOUT: Apply appropriate timeout based on lesson type
                    const requestTimeout = timeoutConfig[namespace] || timeoutConfig.default;
                    console.log(`⏱️ Thiết lập timeout ${requestTimeout/1000}s cho namespace ${namespace} (${lessonType})`);
    
                    // Thêm timeout để tránh đợi quá lâu
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => {
                        controller.abort();
                        console.warn(`⏱️ Timeout sau ${requestTimeout/1000}s cho namespace ${namespace} (${lessonType})`);
                    }, requestTimeout);
                                        
                    try {
                        const response = await fetch(url.toString(), {
                            signal: AbortSignal.timeout(requestTimeout)  // ← Use modern timeout
                        });
                        clearTimeout(timeoutId);
                        
                        if (!response.ok) {
                            console.warn(`RAG API trả về status code: ${response.status} cho namespace ${namespace}`);
                            return { 
                                success: false, 
                                namespace,
                                error: `API trả về lỗi: ${response.status}`, 
                                results: [] 
                            };
                        }
                        
                        const data = await response.json();
                        
                        if (data.status === 'error') {
                            console.error(`RAG API Error cho ${namespace}:`, data.message);
                            return { success: false, namespace, error: data.message, results: [] };
                        }
                        
                        // THAY ĐỔI: Sử dụng options thay vì params không tồn tại
                        if (options && options.unitNumber) {
                            const unitNumber = parseInt(options.unitNumber);
                            if (!isNaN(unitNumber)) {
                            console.log(`🔍 Lọc kết quả cho Unit ${unitNumber}...`);
                            
                            // Lọc kết quả theo Unit
                            allResults = allResults.filter(doc => isRelevantToUnit(doc, unitNumber));
                            
                            console.log(`✅ Còn ${allResults.length} kết quả sau khi lọc theo Unit ${unitNumber}`);
                            }
                        }

                        // Đánh dấu nguồn của mỗi kết quả
                        const results = (data.results || []).map(result => ({
                            ...result,
                            namespace, // Thêm namespace vào kết quả
                            // Cập nhật metadata để hiển thị nguồn
                            metadata: {
                                ...result.metadata,
                                namespace, // Đảm bảo namespace có trong metadata
                                source: result.metadata?.source || this.getNamespaceDisplayName(namespace)
                            }
                        }));
                        
                        return {
                            success: true,
                            namespace,
                            results,
                            count: results.length
                        };
                    } catch (fetchError) {
                        clearTimeout(timeoutId);
                        if (fetchError.name === 'AbortError') {
                            console.warn(`RAG API request timeout cho namespace ${namespace} (${lessonType})`);
                            return { 
                                success: false, 
                                namespace,
                                error: 'Timeout', 
                                results: [] 
                            };
                        }
                        throw fetchError;
                    }
                } catch (error) {
                    console.error(`Lỗi khi tìm kiếm trên namespace ${namespace}:`, error);
                    return { 
                        success: false, 
                        namespace,
                        error: error.message, 
                        results: [] 
                    };
                }
            });
            
            // Đợi tất cả các tìm kiếm hoàn thành
            const searchResults = await Promise.all(searchPromises);
            
            // Tổng hợp kết quả
            let allResults = [];
            let successCount = 0;
            let totalFound = 0;
            let successNamespaces = [];
            
            console.log("🔍 Tổng hợp kết quả từ các namespace:");
            searchResults.forEach((result) => {
            console.log(`- Namespace ${result.namespace}: ${result.success ? 'Thành công' : 'Thất bại'}, ${result.results?.length || 0} kết quả`);
            
            if (result.success && result.results && result.results.length > 0) {
                successCount++;
                totalFound += result.results.length;
                allResults = allResults.concat(result.results);
                successNamespaces.push(result.namespace);
            }
            });
            
            // Lọc kết quả phù hợp với Unit nếu có thông tin unitNumber trong options
            if (options && options.unitNumber) {
                const unitNumber = parseInt(options.unitNumber);
                if (!isNaN(unitNumber)) {
                console.log(`🔍 Lọc kết quả cho Unit ${unitNumber}...`);
                
                // Lọc kết quả theo Unit
                allResults = allResults.filter(doc => isRelevantToUnit(doc, unitNumber));
                
                console.log(`✅ Còn ${allResults.length} kết quả sau khi lọc theo Unit ${unitNumber}`);
                }
            }

            if (allResults.length === 0) {
                console.log("⚠️ Không tìm thấy kết quả từ bất kỳ namespace nào!");
            }
            
            // Sắp xếp kết quả theo điểm số (từ cao đến thấp)
            allResults.sort((a, b) => (b.score || 0) - (a.score || 0));
            
            // Giới hạn số lượng kết quả để tránh quá nhiều
            const maxResults = options.maxResults || 8;
            if (allResults.length > maxResults) {
                allResults = allResults.slice(0, maxResults);
            }
            
            console.log(`✅ Tìm thấy ${totalFound} kết quả từ ${successCount}/${namespaces.length} namespaces, lấy ${allResults.length} kết quả tốt nhất`);
            
            return {
                success: successCount > 0,
                results: allResults,
                query,
                searchedNamespaces: namespaces,
                successNamespaces: searchResults.filter(r => r.success).map(r => r.namespace)
            };
        } catch (error) {
            console.error('Error connecting to RAG API:', error);
            return {
                success: false,
                error: 'Không thể kết nối đến RAG API: ' + error.message,
                results: []
            };
        }
    }
    
    // Thêm phương thức mới để tìm kiếm với retry và fallback (16-May)
    async searchWithRetry(query, options = {}) {
        if (!this.enabled) {
          return { success: false, disabled: true, results: [] };
        }
        
        // Tối ưu options và timeout
        const searchOptions = {
          ...options,
          timeout: options.timeout || 45000, // 45 giây mặc định
          maxRetries: options.maxRetries || 1, // Chỉ retry 1 lần
          fallbackThreshold: options.fallbackThreshold || 0.6 // Ngưỡng điểm để sử dụng fallback
        };
        
        try {
          // Lần tìm kiếm đầu tiên với query gốc
          const result = await this.search(query, searchOptions);
          
          // Kiểm tra kết quả
          if (result.success && result.results && result.results.length > 0) {
            return result;
          }
          
          // Nếu không tìm thấy kết quả, thử với query đơn giản hóa
          const simplifiedQuery = this.simplifyQuery(query);
          
          if (simplifiedQuery !== query) {
            const simplifiedOptions = {
              ...searchOptions,
              timeout: 30000, // 30 giây cho tìm kiếm thứ hai
              simplified: true
            };
            
            const simplifiedResult = await this.search(simplifiedQuery, simplifiedOptions);
            
            if (simplifiedResult.success && simplifiedResult.results && simplifiedResult.results.length > 0) {
              simplifiedResult.simplified = true;
              return simplifiedResult;
            }
          }
          
          // Tạo kết quả fallback
          return this.createFallbackResult(query, options.lessonType || 'main');
        } catch (error) {
          console.warn(`Lỗi khi tìm kiếm: ${error.message}`);
          
          // Trả về fallback
          return this.createFallbackResult(query, options.lessonType || 'main');
        }
    }
    
    async getFallbackResults(originalQuery) {
        console.log("DEBUG: Sử dụng kết quả RAG dự phòng cho query:", originalQuery);
        
        // Rút gọn query xuống còn tối đa 5 từ
        const keywords = originalQuery.split(' ')
          .filter(word => word.length > 3)
          .slice(0, 5)
          .join(' ');
        
        try {
          // Tìm kiếm với query đơn giản hóa và thời gian ngắn
          const result = await this.search(keywords, {
            topK: 3,
            timeout: 20000, // Chỉ đợi 20 giây
            threshold: 0.6  // Giảm ngưỡng điểm
          });
          
          if (result && result.results && result.results.length > 0) {
            console.log(`DEBUG: Tìm được ${result.results.length} kết quả dự phòng`);
            result.fallback = true;
            return result;
          }
        } catch (error) {
          console.warn("DEBUG: Lỗi khi tìm kết quả dự phòng:", error.message);
        }
        
        // Nếu vẫn không tìm được, tạo kết quả giả
        return {
          success: true,
          fallback: true,
          results: [{
            content: `Giáo án lớp 6 Unit 1: Getting Started. Mục tiêu: Giúp học sinh sử dụng từ vựng liên quan đến chủ đề MY NEW SCHOOL và giao tiếp trong ngày đầu đi học.`,
            score: 0.9,
            metadata: {
              source: "Fallback",
              namespace: "fallback"
            }
          }],
          query: originalQuery
        };
    }

    // Thêm phương thức mới để tạo kết quả fallback
    createFallbackResult(query, lessonType) {
    const fallbackContent = `Mẫu giáo án cho ${lessonType === 'main' ? 'giáo án chính' : 
                            lessonType === 'supplementary' ? 'giáo án tăng tiết' : 
                            'hoạt động ngoại khóa'} tiếng Anh.`;
    
        return {
            success: true,
            fallback: true,
            results: [{
            content: fallbackContent,
            score: 0.7,
            metadata: {
                source: 'Fallback template',
                namespace: 'fallback'
            }
            }],
            query
        };
    }

    // Thêm phương thức mới để tìm kiếm tối ưu cho TT
    async searchForSupplementary(query, options = {}) {
        if (!this.enabled) {
            return { success: false, disabled: true, results: [] };
        }
        
        const supplementaryType = options.supplementary_type || 'vocabulary';
        const unit = options.unit || 1;
        // THAY ĐỔI 1: Tăng timeout mặc định từ 15s lên 45s
        const timeout = options.timeout || 45000;
        
        console.log(`🔍 Tìm kiếm tối ưu cho TT "${supplementaryType}" Unit ${unit}`);
        
        try {
            // THAY ĐỔI 2: Tìm kiếm trên cả hai namespace chính
            const namespacesToSearch = ['bibi_ctgd', 'bibi_sgk', 'bibi_lesson_plan']; // Thêm bibi_sgk
            console.log(`🔎 Tìm kiếm TT trên các namespace: ${namespacesToSearch.join(', ')} với timeout ${timeout/1000}s`);
            
            // THAY ĐỔI 3: Tạo promises cho mỗi namespace
            const searchPromises = namespacesToSearch.map(namespace => {
                return this.searchNamespaceForTT(namespace, query, {
                    supplementaryType,
                    unit,
                    top_k: 3,
                    threshold: 0.6
                }).catch(error => {
                    console.warn(`⚠️ Lỗi khi tìm kiếm TT trên ${namespace}: ${error.message}`);
                    return { success: false, results: [], namespace };
                });
            });
            
            // THAY ĐỔI 4: Race với timeout
            const searchPromise = Promise.any(searchPromises)
                .catch(error => {
                    console.warn(`⚠️ Không tìm thấy kết quả từ bất kỳ namespace nào: ${error.message}`);
                    return { success: false };
                });
            
            // Tạo timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Tìm kiếm TT timeout sau ${timeout/1000}s`)), timeout);
            });
            
            // Race giữa tìm kiếm và timeout
            const result = await Promise.race([searchPromise, timeoutPromise])
                .catch(error => {
                    console.warn(`⏱️ ${error.message}`);
                    return { success: false };
                });
            
            // THAY ĐỔI 5: Chỉ sử dụng fallback khi thực sự không tìm thấy kết quả
            if (result.success && result.results && result.results.length > 0) {
                console.log(`✅ Tìm thấy ${result.results.length} kết quả TT từ namespace ${result.namespace}`);
                
                return {
                    success: true,
                    results: result.results,
                    query,
                    namespace: result.namespace,
                    searchedNamespaces: namespacesToSearch,
                    successNamespaces: [result.namespace]
                };
            }
            
            // Sử dụng fallback chỉ khi không tìm thấy kết quả từ tất cả các namespace
            console.log(`⚠️ Không tìm thấy kết quả RAG nào cho TT, sử dụng fallback`);
            return this.getFallbackContent(supplementaryType, unit);
            
        } catch (error) {
            console.error(`❌ Lỗi khi tìm kiếm TT: ${error.message}`);
            return this.getFallbackContent(supplementaryType, unit);
        }
    }

    // phương thức mới hỗ trợ tìm kiếm cho một namespace cho TT
    async searchNamespaceForTT(namespace, query, options = {}) {
        const supplementaryType = options.supplementaryType || 'vocabulary';
        const unit = options.unit || 1;
        const top_k = options.top_k || 3;
        const threshold = options.threshold || 0.6;
        
        try {
            // Tạo URL với query parameters
            let url;
            if (this.apiUrl.startsWith('http')) {
                url = new URL(this.apiUrl);
            } else {
                url = new URL(this.apiUrl, window.location.origin);
            }
            
            url.searchParams.append("query", query);
            url.searchParams.append("namespace", namespace);
            url.searchParams.append("top_k", top_k);
            url.searchParams.append("threshold", threshold);
            url.searchParams.append("search_all", "true");
            
            // Thêm thông tin supplementary type và unit vào query để cải thiện tìm kiếm
            url.searchParams.append("filter", JSON.stringify({
                unit: unit,
                type: supplementaryType
            }));
            
            console.log(`🔍 Tìm kiếm TT trên namespace ${namespace} cho ${supplementaryType} Unit ${unit}`);
            
            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'API error');
            }
            
            // Đánh dấu nguồn của mỗi kết quả
            const results = (data.results || []).map(result => ({
                ...result,
                namespace: namespace,
                metadata: {
                    ...result.metadata,
                    namespace: namespace,
                    source: result.metadata?.source || this.getNamespaceDisplayName(namespace)
                }
            }));
            
            return {
                success: results.length > 0,
                namespace: namespace,
                results: results,
                count: results.length
            };
        } catch (error) {
            throw error;
        }
    }

    // Thêm phương thức fallback cho TT
    getFallbackContent(supplementaryType, unit) {
        console.log(`🔄 Sử dụng nội dung fallback cho TT ${supplementaryType} Unit ${unit}`);
        
        // Template cơ bản theo loại TT
        let content = '';
        let metadata = {};
        
        switch(supplementaryType) {
            case 'vocabulary':
                content = `## Bài tập tăng cường từ vựng Unit ${unit}
                
    1. **Matching Exercise**: Match the words with their meanings.
    2. **Fill in the blanks**: Complete the sentences with appropriate words.
    3. **Multiple choice**: Choose the correct option for each question.
    4. **Word formation**: Create new words from the given root words.
    5. **Categorizing**: Group words into appropriate categories.

    Các từ vựng quan trọng trong Unit ${unit} cần ôn tập và củng cố.`;
                metadata = { type: 'vocabulary', unit: unit };
                break;
                
            case 'grammar':
                content = `## Bài tập tăng cường ngữ pháp Unit ${unit}
                
    1. **Fill in the blanks**: Complete the sentences with the correct grammatical form.
    2. **Transformation**: Rewrite the sentences using the given grammatical structure.
    3. **Error correction**: Find and correct grammatical errors in sentences.
    4. **Sentence building**: Create sentences using the provided words and grammar.
    5. **Multiple choice**: Choose the correct grammatical form.

    Cấu trúc ngữ pháp chính trong Unit ${unit} cần ôn tập và củng cố.`;
                metadata = { type: 'grammar', unit: unit };
                break;
                
            case 'pronunciation':
                content = `## Bài tập tăng cường phát âm Unit ${unit}
                
    1. **Minimal Pairs**: Identify the correct sound in pairs of similar-sounding words.
    2. **Word Stress**: Mark the stressed syllable in each word.
    3. **Intonation Practice**: Practice rising and falling intonation patterns.
    4. **Sound Recognition**: Identify specific sounds in words.
    5. **Pronunciation Drill**: Practice pronouncing challenging sounds.

    Các âm và cách phát âm quan trọng trong Unit ${unit} cần ôn tập và củng cố.`;
                metadata = { type: 'pronunciation', unit: unit };
                break;
                
            default:
                content = `## Bài tập tăng cường Unit ${unit}
                
    1. **Vocabulary Practice**: Activities to reinforce key vocabulary.
    2. **Grammar Exercises**: Practice grammatical structures from the unit.
    3. **Communicative Activities**: Interactive tasks to apply language.
    4. **Skills Integration**: Combined reading, writing, speaking, and listening.
    5. **Review Game**: Fun activity to consolidate learning.

    Nội dung quan trọng trong Unit ${unit} cần ôn tập và củng cố.`;
                metadata = { type: 'general', unit: unit };
        }
        
        // Trả về kết quả fallback giống như kết quả RAG thành công
        return {
            success: true,
            results: [{
                content: content,
                score: 0.85, // Điểm cao để đảm bảo được sử dụng
                metadata: {
                    ...metadata,
                    source: 'Template TT',
                    namespace: 'fallback'
                },
                namespace: 'fallback'
            }],
            fallback: true,
            query: `fallback content for ${supplementaryType} Unit ${unit}`,
            searchedNamespaces: ['fallback'],
            successNamespaces: ['fallback']
        };
    }

    // Thêm phương thức mới để đơn giản hóa query
    simplifyQuery(query) {
        // Loại bỏ các từ không quan trọng
        let simplified = query
            .replace(/\b(và|cũng|như|ví dụ|hoặc|nếu|thì|đối với|trong|cho)\b/gi, ' ')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Loại bỏ ký tự đặc biệt
            .replace(/\s+/g, ' ')              // Loại bỏ khoảng trắng thừa
            .trim();
        
        // Rút gọn nếu quá dài
        if (simplified.length > 50) {
            const words = simplified.split(' ');
            if (words.length > 10) {
                // Giữ lại tối đa 10 từ quan trọng nhất
                const importantWords = [];
                
                // Ưu tiên từ khóa liên quan đến giáo án
                const keyTerms = ['giáo án', 'bài', 'unit', 'lớp', 'tiếng anh', 'tăng tiết', 'ngữ pháp', 'từ vựng'];
                
                // Thêm từ khóa quan trọng trước
                for (const term of keyTerms) {
                    for (const word of words) {
                        if (word.toLowerCase().includes(term) && !importantWords.includes(word)) {
                            importantWords.push(word);
                            if (importantWords.length >= 10) break;
                        }
                    }
                    if (importantWords.length >= 10) break;
                }
                
                // Thêm các từ còn lại nếu cần
                for (const word of words) {
                    if (!importantWords.includes(word)) {
                        importantWords.push(word);
                        if (importantWords.length >= 10) break;
                    }
                }
                
                simplified = importantWords.join(' ');
            }
        }
        
        return simplified;
    }
    
    getNamespaceDisplayName(namespace) {
        // Ánh xạ namespaces sang tên hiển thị thân thiện hơn
        const namespaceMap = {
            'bibi_sgk': 'Sách giáo khoa',
            'bibi_ctgd': 'Chương trình giảng dạy',
            'bibi_lesson_plan': 'Mẫu giáo án',
            'others': 'Nguồn bổ sung'
        };
        
        return namespaceMap[namespace] || namespace;
    }

    // Cải thiện phương thức enhancePrompt 
    enhancePrompt(originalPrompt, ragResults) {
        if (!ragResults || !ragResults.success || !ragResults.results || ragResults.results.length === 0) {
          return originalPrompt;
        }
        
        console.log(`DEBUG: Tăng cường prompt với ${ragResults.results.length} kết quả RAG`);
        
        // THAY ĐỔI: Mở rộng từ khóa cho mỗi loại tiết học
        const gettingStartedKeywords = ['getting started', 'bài 1', 'tiết 1', 'mở đầu', 'bắt đầu', 'làm quen'];
        const closerLook1Keywords = ['closer look 1', 'bài 2', 'tiết 2', 'từ vựng', 'vocabulary', 'phát âm', 'pronunciation'];
        const closerLook2Keywords = ['closer look 2', 'bài 3', 'tiết 3', 'ngữ pháp', 'grammar'];
        
        // THÊM MỚI: Từ khóa cho Communication và các tiết khác
        const communicationKeywords = ['communication', 'bài 4', 'tiết 4', 'giao tiếp', 'nói', 'speaking', 'hội thoại', 'dialogue'];
        const skills1Keywords = ['skills 1', 'bài 5', 'tiết 5', 'đọc', 'reading'];
        const skills2Keywords = ['skills 2', 'bài 6', 'tiết 6', 'nghe', 'listening', 'viết', 'writing'];
        const lookingBackKeywords = ['looking back', 'project', 'bài 7', 'tiết 7', 'tổng kết', 'dự án'];
        
        // Tối ưu hóa việc lọc kết quả theo keywords
        const containsKeywords = (content, keywords) => {
          if (!content) return false;
          const loweredContent = content.toLowerCase();
          return keywords.some(keyword => loweredContent.includes(keyword));
        };
        
        // Phân loại kết quả theo từng loại tiết
        const gettingStartedResults = ragResults.results.filter(r => 
          containsKeywords(r.content, gettingStartedKeywords));
        
        const closerLook1Results = ragResults.results.filter(r => 
          containsKeywords(r.content, closerLook1Keywords));
        
        const closerLook2Results = ragResults.results.filter(r => 
          containsKeywords(r.content, closerLook2Keywords));
          
        // THÊM MỚI: Tìm kết quả cho Communication và các tiết khác
        const communicationResults = ragResults.results.filter(r => 
          containsKeywords(r.content, communicationKeywords));
          
        const skills1Results = ragResults.results.filter(r => 
          containsKeywords(r.content, skills1Keywords));
          
        const skills2Results = ragResults.results.filter(r => 
          containsKeywords(r.content, skills2Keywords));
          
        const lookingBackResults = ragResults.results.filter(r => 
          containsKeywords(r.content, lookingBackKeywords));
        
        // Mọi kết quả khác (không thuộc bất kỳ loại tiết nào đã nêu)
        const otherResults = ragResults.results.filter(r => 
          !containsKeywords(r.content, gettingStartedKeywords) && 
          !containsKeywords(r.content, closerLook1Keywords) && 
          !containsKeywords(r.content, closerLook2Keywords) &&
          !containsKeywords(r.content, communicationKeywords) &&
          !containsKeywords(r.content, skills1Keywords) &&
          !containsKeywords(r.content, skills2Keywords) &&
          !containsKeywords(r.content, lookingBackKeywords));
        
        // Log chi tiết phân loại kết quả
        console.log(`DEBUG: Phân loại kết quả RAG: 
          Getting Started (${gettingStartedResults.length}), 
          A closer look 1 (${closerLook1Results.length}), 
          A closer look 2 (${closerLook2Results.length}),
          Communication (${communicationResults.length}),
          Skills 1 (${skills1Results.length}),
          Skills 2 (${skills2Results.length}),
          Looking back (${lookingBackResults.length}),
          Khác (${otherResults.length})`);
        
        // Tạo context từ các kết quả - tối ưu các kết quả chất lượng cao hơn
        const createContext = (results) => {
          if (!results || results.length === 0) return "Chưa có thông tin cụ thể.";
          
          // THAY ĐỔI: Sắp xếp kết quả theo điểm số và lấy nhiều thông tin hơn
          results.sort((a, b) => (b.score || 0) - (a.score || 0));
          
          return results.map(r => {
            const content = r.content || "";
            // Lấy tối đa 2000 ký tự từ mỗi kết quả (tăng từ 1500)
            return content.length > 2000 ? content.substring(0, 2000) + "..." : content;
          }).join("\n\n");
        };
        
        // Tạo context cho từng phần
        const gettingStartedContext = createContext(gettingStartedResults);
        const closerLook1Context = createContext(closerLook1Results);
        const closerLook2Context = createContext(closerLook2Results);
        const communicationContext = createContext(communicationResults);
        const skills1Context = createContext(skills1Results);
        const skills2Context = createContext(skills2Results);
        const lookingBackContext = createContext(lookingBackResults);
        const otherContext = createContext(otherResults);
        
        // Tạo prompt được tăng cường từ context - thêm các phần mới
        const enhancedPrompt = `${originalPrompt}
      
      THÔNG TIN THAM KHẢO QUAN TRỌNG:
      
      ## THÔNG TIN CHO GETTING STARTED
      ${gettingStartedContext}
      
      ## THÔNG TIN CHO A CLOSER LOOK 1
      ${closerLook1Context}
      
      ## THÔNG TIN CHO A CLOSER LOOK 2
      ${closerLook2Context}
      
      ## THÔNG TIN CHO COMMUNICATION
      ${communicationContext}
      
      ## THÔNG TIN CHO SKILLS 1
      ${skills1Context}
      
      ## THÔNG TIN CHO SKILLS 2
      ${skills2Context}
      
      ## THÔNG TIN CHO LOOKING BACK & PROJECT
      ${lookingBackContext}
      
      ${otherResults.length > 0 ? `## THÔNG TIN THAM KHẢO KHÁC\n${otherContext}\n` : ''}
      
      LƯU Ý ĐẶC BIỆT: 
      1. Sử dụng thông tin từ các nguồn tham khảo trên khi soạn giáo án
      2. GIÁO ÁN PHẢI DÀI VÀ CỰC KỲ CHI TIẾT (TỐI THIỂU 15,000 KÝ TỰ), tương đương 15 trang A4
      3. TẤT CẢ các mục phải được triển khai đầy đủ và chi tiết, đặc biệt là phần Tiến trình dạy học
      4. MỖI GIAI ĐOẠN trong Tiến trình dạy học phải có tối thiểu 10-15 câu mô tả chi tiết
      5. Phần Phân tích ngôn ngữ phải liệt kê ít nhất 10 từ vựng/cấu trúc cùng giải thích chi tiết
      6. Phần Dự đoán khó khăn và Giải pháp phải có ít nhất 5 mục được mô tả cụ thể
      7. Board Plan phải có hình dung rõ ràng về những gì sẽ được viết trên bảng`;
      
        return enhancedPrompt;
    }

    // Tối ưu hóa tìm kiếm namespaces dựa trên loại giáo án
    getPriorityNamespaces(lessonType) {
        switch(lessonType) {
        case 'main':
            // AFTER: Full 3-namespace search cho comprehensive results
        return ["bibi_sgk", "bibi_ctgd", "bibi_lesson_plan"];
        case 'supplementary':
            // Ưu tiên CTGD, mẫu giáo án và SGK cho tăng tiết - THAY ĐỔI QUAN TRỌNG
            return ["bibi_ctgd", "bibi_lesson_plan", "bibi_sgk"];
        case 'extracurricular':
            // Chỉ tìm kiếm trên lesson_plan cho ngoại khóa
            return ["bibi_lesson_plan"];
        default:
            return ["bibi_sgk", "bibi_ctgd", "bibi_lesson_plan"];
        }
    }

    // Thêm phương thức mới để tối ưu kết quả RAG
    optimizeRagResults(results, maxSize = 7000) {
    if (!results || !results.results) return results;
    
    let totalSize = 0;
    results.results.forEach(result => {
        totalSize += result.content ? result.content.length : 0;
    });
    
    // Nếu tổng kích thước quá lớn, cắt giảm
    if (totalSize > maxSize) {
        console.log(`⚠️ Kết quả RAG quá lớn (${totalSize} bytes), đang tối ưu...`);
        
        // Giữ lại các kết quả có điểm số cao hơn
        results.results.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // Giới hạn số lượng kết quả
        let optimizedResults = [];
        let currentSize = 0;
        
        for (const result of results.results) {
        const size = result.content ? result.content.length : 0;
        if (currentSize + size <= maxSize) {
            optimizedResults.push(result);
            currentSize += size;
        } else {
            // Nếu kết quả đầu tiên đã quá lớn, cắt nó
            if (optimizedResults.length === 0) {
            const truncatedContent = result.content.substring(0, maxSize);
            optimizedResults.push({
                ...result,
                content: truncatedContent + "... [nội dung đã được cắt ngắn]"
            });
            currentSize = maxSize;
            }
            break;
        }
        }
        
        results.results = optimizedResults;
        console.log(`✅ Đã tối ưu xuống ${optimizedResults.length} kết quả, ${currentSize} bytes`);
    }
    
    return results;
    }

    // ✅ NEW METHOD: Get unit name from UNITS_DATA
    getUnitName(unitNumber) {
        try {
            // First try to get from window.UNITS_DATA (global)
            const unitsData = window.UNITS_DATA || UNITS_DATA;
            
            if (unitsData && unitsData[unitNumber]) {
                return unitsData[unitNumber].name;
            }
            
            // Fallback unit names if UNITS_DATA not available
            const fallbackUnits = {
                1: "MY NEW SCHOOL",
                2: "MY HOUSE", 
                3: "MY FRIENDS",
                4: "MY NEIGHBOURHOOD", // ← KEY FIX for Unit 4
                5: "NATURAL WONDERS OF VIET NAM",
                6: "OUR TET HOLIDAY",
                7: "TELEVISION",
                8: "SPORTS AND GAMES", 
                9: "CITIES OF THE WORLD",
                10: "OUR HOUSES IN THE FUTURE",
                11: "OUR GREENER WORLD",
                12: "ROBOTS"
            };
            
            return fallbackUnits[unitNumber] || "";
        } catch (error) {
            console.warn(`⚠️ Error getting unit name for Unit ${unitNumber}:`, error);
            return "";
        }
    }

    // Phương thức mới để tăng cường query trước khi tìm kiếm
    enhanceSearchQuery(originalQuery, options = {}) {
        if (!originalQuery) return originalQuery;
        
        // Log query gốc
        console.log(`🔍 Query gốc: "${originalQuery}"`);
        
        const lessonType = options.lessonType || 'main';
        const grade = options.grade || '';
        const skillType = options.skillType || '';
        
        // Từ khóa bắt buộc theo loại giáo án
        let keywords = [];
        
        // Thêm từ khóa dựa vào loại giáo án
        switch(lessonType) {
        case 'main':
            keywords.push('giáo án chính', 'tiếng Anh');
            break;
        case 'supplementary':
            keywords.push('giáo án tăng tiết', 'tiếng Anh');
            break;
        case 'extracurricular':
            keywords.push('hoạt động ngoại khóa', 'tiếng Anh');
            break;
        default:
            keywords.push('tiếng Anh', 'lớp 6');
        }
        
        // Loại bỏ các từ "giáo án chính" nếu loại là supplementary
        if (lessonType === 'supplementary' && originalQuery.includes('giáo án chính')) {
            originalQuery = originalQuery.replace('giáo án chính', 'giáo án tăng tiết');
        }
        
        // Thêm thông tin lớp nếu không có trong query
        if (grade && !originalQuery.toLowerCase().includes(`lớp ${grade}`)) {
            keywords.push(`lớp ${grade}`);
        }
        
        // Thêm thông tin kỹ năng nếu có
        if (skillType && !originalQuery.toLowerCase().includes(skillType.toLowerCase())) {
            keywords.push(skillType);
        }
        
        // Loại bỏ từ khóa đã có trong query gốc
        keywords = keywords.filter(keyword => 
            !originalQuery.toLowerCase().includes(keyword.toLowerCase())
        );
        
        // Kết hợp query với các từ khóa mới
        let enhancedQuery = keywords.length > 0 
        ? `${originalQuery} ${keywords.join(' ')}` 
        : originalQuery;

        // Loại bỏ các từ "giáo án chính" nếu loại là supplementary - đặt sau khi kết hợp
        if (lessonType === 'supplementary') {
            enhancedQuery = enhancedQuery.replace(/giáo án chính/g, 'giáo án tăng tiết');
        }

        // Log query đã tăng cường
        console.log(`✨ Query tối ưu: "${enhancedQuery}"`);

        return enhancedQuery;
    }
}