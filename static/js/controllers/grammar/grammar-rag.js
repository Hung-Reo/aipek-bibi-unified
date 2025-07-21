// /static/js/controllers/grammar/grammar-rag.js
// Module kết nối với dịch vụ RAG

export class GrammarRAG {
    constructor(options = {}) {
        // Xác định base URL cho môi trường phát triển và sản xuất
        const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.hostname}:8000` // Server chạy trên cùng port 8000
        : window.location.origin;

        // Đường dẫn API
        this.apiUrl = options.apiUrl || `${baseUrl}/api/rag`; 
        this.healthUrl = `${baseUrl}/api/health`;
        
        // Danh sách các namespace để tìm kiếm
        this.namespaces = options.namespaces || ["bibi_sgk", "bibi_ctgd", "bibi_grammar", "others"];
        this.defaultNamespace = options.defaultNamespace || "bibi_sgk"; // Đổi namespace mặc định thành bibi_sgk
        
        this.defaultTopK = options.topK || 3;
        this.isAvailable = false; // Mặc định chưa kết nối
        this.debug = options.debug || false;
        this.enabled = options.enabled !== false;
        
        console.log(`🔄 RAG API URL: ${this.apiUrl}`);
        console.log(`📚 RAG Namespaces: ${this.namespaces.join(', ')}`);
    }

    // Kiểm tra kết nối đến API
    async checkConnection() {
        if (!this.enabled) {
            console.log('💤 RAG đã bị tắt trong cấu hình');
            return false;
        }
        
        try {
            console.log('🔍 Kiểm tra kết nối RAG...');
            
            // Gọi endpoint health check
            const response = await fetch(this.healthUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(5000) // 5 giây timeout
            });
            
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            // Chấp nhận cả 'success' và 'ok' là trạng thái thành công
            this.isAvailable = (data.status === 'success' || data.status === 'ok');
            
            if (this.isAvailable) {
                console.log(`✅ Kết nối RAG thành công: ${data.message}`);
                
                // Kiểm tra xem có dữ liệu Pinecone không
                if (data.pinecone_index && data.default_namespace) {
                    console.log(`📊 Pinecone index: ${data.pinecone_index}, namespace mặc định: ${data.default_namespace}`);
                } else {
                    // Vẫn được coi là thành công ngay cả khi không có thông tin Pinecone cụ thể
                    console.log(`📊 Kết nối thành công, không có thông tin chi tiết về Pinecone`);
                }
            } else {
                console.error('❌ API RAG không sẵn sàng');
            }
            
            return this.isAvailable;
        }
        catch (error) {
            console.error('❌ Lỗi kiểm tra kết nối RAG:', error);
            
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

    // Thêm phương thức tìm kiếm cascade vào class GrammarRAG
    async searchCascade(query, options = {}) {
        if (!this.enabled) {
            return { success: false, disabled: true, results: [] };
        }
        
        try {
            // Thứ tự ưu tiên các namespace
            const priorityNamespaces = options.namespaces || ["bibi_sgk", "bibi_grammar", "bibi_ctgd", "others"];
            
            // Timeout dài hơn cho môi trường production
            const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            const timeoutPerLevel = options.timeout || 45000; // Tăng lên 45 giây
            console.log(`🕒 Thiết lập timeout ${timeoutPerLevel/1000}s cho mỗi namespace trong cascade`);
            
            // Ngưỡng chất lượng và số lượng kết quả
            const qualityThreshold = options.qualityThreshold || 0.75;
            const minQualityResults = options.minQualityResults || 3;
            
            console.log(`🔍 Tìm kiếm theo cascade cho: "${query}" với các namespace ưu tiên`, priorityNamespaces);
            
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
            const maxResults = options.maxResults || 5; // Giảm từ 8 xuống 5
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

    // Tìm kiếm song song trên nhiều namespace
    async search(query, options = {}) {
        if (!this.enabled) {
            return { success: false, disabled: true, results: [] };
        }
        
        try {
            // Sử dụng namespaces từ options hoặc mặc định
            const namespaces = options.namespaces || this.namespaces;
            const topK = options.topK || this.defaultTopK;
            
            // Trường hợp đặc biệt khi chuyển tab
            if (query.includes('_tab')) {
                // Thay vì bỏ qua hoàn toàn, trích xuất phần query thực sự
                const tabParts = query.split('_tab ');
                let effectiveQuery = tabParts[1]; // Lấy phần sau "_tab "
                
                // Thêm bối cảnh vào truy vấn dựa trên loại tab
                if (query.includes('examples_tab')) {
                    effectiveQuery = `ví dụ ${effectiveQuery}`;
                } else if (query.includes('exercises_tab')) {
                    effectiveQuery = `bài tập ${effectiveQuery}`;
                } else if (query.includes('mistakes_tab')) {
                    effectiveQuery = `lỗi thường gặp ${effectiveQuery}`;
                }
                
                console.log(`🔄 Điều chỉnh query RAG cho tab: "${effectiveQuery}"`);
                query = effectiveQuery;
            }
            
            console.log(`🔍 Tìm kiếm RAG cho: "${query}" trên ${namespaces.length} namespaces`);
            
            // Tìm kiếm song song trên tất cả namespaces
            const searchPromises = namespaces.map(async (namespace) => {
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
                    url.searchParams.append("top_k", topK);
                    url.searchParams.append("search_all", "true"); // Thêm tham số search_all
                    
                    console.log(`🔎 Tìm kiếm trên namespace ${namespace}`);
                    
                    // Lấy timeout từ options hoặc sử dụng giá trị mặc định ngắn hơn
                    const requestTimeout = options.timeout || 40000; // Giảm xuống 40 giây mặc định
                    console.log(`⏱️ Thiết lập timeout ${requestTimeout/1000}s cho namespace ${namespace}`);

                    // Thêm timeout để tránh đợi quá lâu
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => {
                        controller.abort();
                        console.warn(`⏱️ Timeout sau ${requestTimeout/1000}s cho namespace ${namespace}`);
                    }, requestTimeout);
                                        
                    try {
                        const response = await fetch(url.toString(), {
                            signal: controller.signal
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
                            console.warn(`RAG API request timeout cho namespace ${namespace}`);
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
            
            // Tổng hợp kết quả với debug chi tiết hơn
            let allResults = [];
            let successCount = 0;
            let totalFound = 0;
            let successNamespaces = [];

            console.log("🔍 Tổng hợp kết quả từ các namespace:");
            searchResults.forEach((result, index) => {
                console.log(`- Namespace ${result.namespace}: ${result.success ? 'Thành công' : 'Thất bại'}, ${result.results?.length || 0} kết quả`);
                // Thêm log để kiểm tra search_namespace nếu có kết quả
                if (result.success && result.results && result.results.length > 0) {
                    const namespaces = [...new Set(result.results.map(r => r.metadata?.search_namespace || 'không rõ'))];
                    console.log(`  + Kết quả từ các namespaces: ${namespaces.join(', ')}`);
                }
                
                if (result.success && result.results && result.results.length > 0) {
                    successCount++;
                    totalFound += result.results.length;
                    allResults = allResults.concat(result.results);
                    successNamespaces.push(result.namespace);
                    
                    // Debug mẫu kết quả đầu tiên
                    const firstResult = result.results[0];
                    console.log(`  + Mẫu: score=${firstResult.score}, length=${firstResult.content?.length || 0}`);
                }
            });

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
            
            if (this.debug) {
                console.table(allResults.map(r => ({
                    source: r.metadata?.source,
                    namespace: r.namespace,
                    score: r.score,
                    length: r.content?.length || 0
                })));
            }
            
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
    
    getNamespaceDisplayName(namespace) {
        // Ánh xạ namespaces sang tên hiển thị thân thiện hơn
        const namespaceMap = {
            'bibi_sgk': 'Sách giáo khoa',
            'bibi_ctgd': 'Chương trình giảng dạy',
            'bibi_grammar': 'Ngữ pháp tiếng Anh',
            'others': 'Nguồn bổ sung'
        };
        
        return namespaceMap[namespace] || namespace;
    }

    enhancePrompt(originalPrompt, ragResults) {
        if (!ragResults || !ragResults.success || !ragResults.results || ragResults.results.length === 0) {
            return originalPrompt;
        }
    
        // Giữ nguyên code xử lý kết quả RAG hiện tại
        const resultsByNamespace = {};
        for (const doc of ragResults.results) {
            const namespace = doc.namespace || 'unknown';
            if (!resultsByNamespace[namespace]) {
                resultsByNamespace[namespace] = [];
            }
            resultsByNamespace[namespace].push(doc);
        }
        
        let contextBlocks = [];
        
        for (const namespace in resultsByNamespace) {
            const namespaceDocs = resultsByNamespace[namespace];
            if (namespaceDocs.length > 0) {
                const namespaceName = this.getNamespaceDisplayName(namespace);
                const namespaceContent = namespaceDocs
                    .map(doc => {
                        const source = doc.metadata && doc.metadata.source 
                            ? doc.metadata.source 
                            : namespaceName;
                        return `${doc.content.trim()}`;
                    })
                    .join('\n\n');
                
                contextBlocks.push(`### ${namespaceName}:\n${namespaceContent}`);
            }
        }
        
        const context = contextBlocks.join('\n\n');
        
        // ĐỔI: Tạo prompt cân bằng giữa RAG và sáng tạo
        return `Bạn là trợ lý giáo viên tiếng Anh chuyên nghiệp, giúp giáo viên chuẩn bị bài giảng về ngữ pháp cho học sinh lớp 6.
    
    Dưới đây là thông tin từ sách giáo khoa và tài liệu chính thức:
    
    ${context}
    
    Hãy trả lời câu hỏi dưới đây một cách sáng tạo và hấp dẫn, phù hợp với học sinh lớp 6 Việt Nam:
    ${originalPrompt}
    
    Yêu cầu khi trả lời:
    1. Tổng hợp thông tin từ các nguồn, ưu tiên nội dung từ Sách giáo khoa (nếu có)
    2. KHÔNG sao chép nguyên văn nội dung sách giáo khoa, thay vào đó hãy diễn giải lại dễ hiểu hơn
    3. Thêm ví dụ sinh động, dễ hình dung và phù hợp với học sinh Việt Nam
    4. Sắp xếp bài viết một cách rõ ràng với tiêu đề, định dạng phù hợp và emoji phù hợp
    5. Luôn đảm bảo nội dung chính xác về mặt ngữ pháp và phù hợp với độ tuổi học sinh lớp 6
    
    Hãy tạo nội dung cân bằng: 70% dựa trên kiến thức chính thống từ sách giáo khoa và 30% biến đổi sáng tạo để làm bài giảng sinh động hơn.`;
    }
}