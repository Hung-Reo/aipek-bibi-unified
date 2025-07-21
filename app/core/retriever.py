from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from app.core.embeddings import embedding_service
from app.config import (
    VECTOR_STORE_PATH, PINECONE_API_KEY, BIBI_PINECONE_INDEX, CHUNK_SIZE, CHUNK_OVERLAP
)
import os
import logging
import threading
from datetime import datetime
from typing import Callable, Optional

logger = logging.getLogger(__name__)


class RetrieverService:
    def __init__(self):
        """Khởi tạo dịch vụ tìm kiếm tài liệu"""
        self.vector_store = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP
        )

        # Thêm logger cho đối tượng
        self.logger = logger  # Sử dụng logger đã khởi tạo ở cấp module

        # Tạo thư mục lưu vector store nếu cần
        os.makedirs(VECTOR_STORE_PATH, exist_ok=True)

        # Khởi tạo Pinecone vector store
        self._initialize_pinecone()

        logger.info("Retriever service initialized")

    def _initialize_pinecone(self):
        """Khởi tạo Pinecone vector store"""
        if not PINECONE_API_KEY or not BIBI_PINECONE_INDEX:
            logger.error(
                "Missing Pinecone configuration. Check PINECONE_API_KEY and BIBI_PINECONE_INDEX environment variables.")
            return

        try:
            # Sử dụng langchain_pinecone thay vì langchain.vectorstores
            from langchain_pinecone import PineconeVectorStore

            # Import thư viện Pinecone mới
            from pinecone import Pinecone

            # Khởi tạo Pinecone client
            pc = Pinecone(api_key=PINECONE_API_KEY)

            # Kiểm tra nếu index tồn tại
            indexes = pc.list_indexes()
            index_names = [idx.name for idx in indexes]

            if BIBI_PINECONE_INDEX not in index_names:
                logger.error(f"Pinecone index '{BIBI_PINECONE_INDEX}' does not exist. Please create it first.")
                return

            # Lấy reference đến index
            index = pc.Index(BIBI_PINECONE_INDEX)

            # Tạo vector store từ index đã có - đây là điểm cần thay đổi để tương thích
            self.vector_store = PineconeVectorStore(
                index=index,  # Thay BIBI_PINECONE_INDEX thành index
                embedding=embedding_service.embedder,
                text_key="text"  # Trường chứa nội dung văn bản
            )

            logger.info(f"Successfully connected to Pinecone index: {BIBI_PINECONE_INDEX}")

        except Exception as e:
            logger.error(f"Error initializing Pinecone: {e}")
            logger.error("Unable to initialize vector store. Chat functionality may be limited.")
            self.vector_store = None

    def add_documents(self, texts, metadatas=None, namespace="bibi_grammar"):
        """Thêm tài liệu vào vector store với namespace cụ thể"""
        try:
            # Kiểm tra vector store đã được khởi tạo
            if self.vector_store is None:
                logger.error("Vector store has not been initialized successfully. Cannot add documents.")
                return 0

            # Phân đoạn văn bản
            chunks = []
            for text in texts:
                chunks.extend(self.text_splitter.split_text(text))

            logger.info(f"Phân tách được {len(chunks)} đoạn văn bản từ {len(texts)} văn bản")

            # Nếu không có metadata, tạo metadata mặc định
            if not metadatas:
                metadatas = [{"source": "unknown"} for _ in range(len(texts))]

            # Tạo metadata cho từng chunk
            chunk_metadatas = []
            chunk_index = 0
            for i, text in enumerate(texts):
                text_chunks = self.text_splitter.split_text(text)
                for _ in range(len(text_chunks)):
                    chunk_metadatas.append(metadatas[i])
                    chunk_index += 1

            # Thêm vào Pinecone vector store với namespace cụ thể
            try:
                # Phương pháp 1: Sử dụng add_texts với namespace
                logger.info(f"Thêm {len(chunks)} đoạn văn bản vào namespace '{namespace}'")
                self.vector_store.add_texts(
                    chunks,
                    chunk_metadatas,
                    namespace=namespace  # Thêm namespace vào đây
                )
                logger.info(f"Đã thêm {len(chunks)} đoạn văn bản vào Pinecone index, namespace '{namespace}'")
            except TypeError as e:
                # Phương pháp 2: Nếu add_texts không hỗ trợ namespace
                logger.warning(f"add_texts không hỗ trợ namespace: {e}")
                logger.info("Thử phương pháp thay thế...")

                # Sử dụng phương pháp trực tiếp
                from pinecone import Pinecone
                from app.core.embeddings import embedding_service

                pc = Pinecone(api_key=PINECONE_API_KEY)
                index = pc.Index(BIBI_PINECONE_INDEX)

                # Tạo embeddings
                embeddings = embedding_service.embedder.embed_documents(chunks)

                # Chuẩn bị vector để upsert
                vectors = []
                for i, (emb, chunk, meta) in enumerate(zip(embeddings, chunks, chunk_metadatas)):
                    # Thêm text vào metadata
                    meta["text"] = chunk
                    vectors.append((f"chunk_{i}", emb, meta))

                # Gửi theo batch để tránh lỗi khi có quá nhiều vectors
                batch_size = 100
                for i in range(0, len(vectors), batch_size):
                    batch = vectors[i:i + batch_size]
                    index.upsert(vectors=batch, namespace=namespace)

                logger.info(f"Đã thêm {len(chunks)} đoạn văn bản vào Pinecone index qua phương pháp trực tiếp")

            # Log thông tin về các đoạn quan trọng
            transport_chunks = [chunk for chunk in chunks if "xe đưa" in chunk.lower() or "đưa rước" in chunk.lower()]
            if transport_chunks:
                logger.info(f"Đã thêm {len(transport_chunks)} đoạn văn bản về xe đưa rước")

            return len(chunks)
        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            import traceback
            logger.error(f"Chi tiết lỗi: {traceback.format_exc()}")
            return 0

    def get_vector_count(self, namespace=None):
        """Lấy số lượng vector trong Pinecone theo namespace cụ thể"""
        try:
            if hasattr(self, 'vector_store') and self.vector_store is not None:
                if hasattr(self.vector_store, 'index') and self.vector_store.index is not None:
                    stats = self.vector_store.index.describe_index_stats()
                    if namespace:
                        return stats.get('namespaces', {}).get(namespace, {}).get('vector_count', 0)
                    else:
                        return stats.get('total_vector_count', 0)
            return 0
        except Exception as e:
            print(f"Lỗi khi lấy số lượng vector: {e}")
            return 0

    # Tìm hàm search trong class RetrieverService:
    def search(self, query, top_k=5, namespace=None, filter_condition=None):
        """Tìm kiếm tài liệu dựa trên truy vấn với khả năng lọc."""
        try:
            if not self.vector_store:
                self.logger.error("Không có vector store để tìm kiếm")
                return []

            # Nếu không có namespace, mặc định sử dụng bibi_grammar
            if namespace is None:
                namespace = "bibi_grammar"
                self.logger.info(f"Sử dụng namespace mặc định: {namespace}")

            # Phương pháp 1: Truy vấn Pinecone trực tiếp (phiên bản sửa lỗi)
            try:
                self.logger.info(f"Tìm kiếm với query: '{query}' trong namespace '{namespace}'")

                # Tạo embedding cho truy vấn
                try:
                    from app.core.embeddings import embedding_service
                    query_embedding = embedding_service.embedder.embed_query(query)

                    # Kiểm tra tính hợp lệ của vector embedding
                    if not isinstance(query_embedding, list) or len(query_embedding) == 0:
                        self.logger.error("Query embedding không hợp lệ")
                        return []

                    # Đảm bảo vector là list các số
                    if not all(isinstance(x, (int, float)) for x in query_embedding):
                        self.logger.error("Query embedding chứa phần tử không phải số")
                        self.logger.debug(f"Query embedding raw: {query_embedding[:10]}... (first 10 elements)")

                        # Xử lý chuyển đổi mạnh mẽ hơn
                        cleaned_embedding = []
                        for x in query_embedding:
                            try:
                                cleaned_embedding.append(float(x))
                            except (ValueError, TypeError):
                                cleaned_embedding.append(0.0)

                        # Thay thế embedding
                        query_embedding = cleaned_embedding
                        self.logger.info(
                            f"Đã chuyển đổi query embedding sang float, kích thước: {len(query_embedding)}")

                    # Kiểm tra kích thước vector
                    expected_dim = 1536  # OpenAI embeddings có 1536 chiều
                    if len(query_embedding) != expected_dim:
                        self.logger.error(f"Kích thước vector sai: {len(query_embedding)}, kỳ vọng: {expected_dim}")
                        # Nếu kích thước lớn hơn, cắt bớt
                        if len(query_embedding) > expected_dim:
                            query_embedding = query_embedding[:expected_dim]
                            self.logger.info(f"Đã cắt vector embedding xuống {expected_dim} chiều")
                        # Nếu kích thước nhỏ hơn, thêm 0
                        else:
                            padding = [0.0] * (expected_dim - len(query_embedding))
                            query_embedding.extend(padding)
                            self.logger.info(f"Đã thêm padding vào vector embedding để đạt {expected_dim} chiều")

                except Exception as e:
                    self.logger.error(f"Lỗi tạo embedding: {e}")
                    import traceback
                    self.logger.error(f"Chi tiết lỗi embedding: {traceback.format_exc()}")
                    return []

                # Sử dụng phương pháp trực tiếp để truy cập Pinecone
                from pinecone import Pinecone
                pc = Pinecone(api_key=PINECONE_API_KEY)
                pinecone_index = pc.Index(BIBI_PINECONE_INDEX)

                # Chuẩn bị tham số truy vấn
                query_params = {
                    "vector": query_embedding,
                    "top_k": top_k,
                    "namespace": namespace,
                    "include_metadata": True
                }

                # Thêm filter_condition nếu có
                if filter_condition:
                    query_params["filter"] = filter_condition
                    self.logger.info(f"Áp dụng điều kiện lọc: {filter_condition}")

                # Truy vấn trực tiếp thông qua Pinecone API
                query_results = pinecone_index.query(**query_params)

                # Chuyển đổi kết quả thành Document
                from langchain.schema import Document
                results = []
                for match in query_results.get('matches', []):
                    metadata = match.get('metadata', {})
                    if 'text' in metadata:
                        # SỬA LỖI: Lưu score trong metadata thay vì gán thuộc tính _score
                        metadata["search_score"] = match.get('score', 0)
                        doc = Document(
                            page_content=metadata.get('text', ''),
                            metadata=metadata
                        )
                        results.append(doc)

                self.logger.info(f"Tìm thấy {len(results)} kết quả qua API trực tiếp")
                if results:
                    return results
            except Exception as e:
                self.logger.warning(f"Lỗi khi truy vấn Pinecone API trực tiếp: {e}")
                self.logger.warning(f"Chi tiết lỗi: {str(e)}")

            # Phương pháp 2: Thử truy vấn không chỉ định namespace
            try:
                # Thêm mới: Nếu namespace đã chỉ định vẫn không có kết quả, thử tìm không có namespace
                self.logger.info("Thử truy vấn không chỉ định namespace")

                query_embedding = embedding_service.embedder.embed_query(query)
                query_params = {
                    "vector": query_embedding,
                    "top_k": top_k,
                    "include_metadata": True
                }

                query_results = pinecone_index.query(**query_params)

                results = []
                for match in query_results.get('matches', []):
                    metadata = match.get('metadata', {})
                    if 'text' in metadata:
                        metadata["search_score"] = match.get('score', 0)
                        doc = Document(
                            page_content=metadata.get('text', ''),
                            metadata=metadata
                        )
                        results.append(doc)

                self.logger.info(f"Phương pháp không namespace trả về {len(results)} kết quả")
                if results:
                    return results
            except Exception as e:
                self.logger.warning(f"Lỗi khi truy vấn không namespace: {e}")

            # Phương pháp 3: Thử với similarity_search và filter
            try:
                filter_dict = {"namespace": namespace}
                if filter_condition:
                    filter_dict.update(filter_condition)

                self.logger.info(f"Thử phương pháp similarity_search với filter: {filter_dict}")
                results = self.vector_store.similarity_search(
                    query, k=top_k, filter=filter_dict
                )
                self.logger.info(f"Phương pháp similarity_search với filter trả về {len(results)} kết quả")
                if results:
                    return results
            except Exception as e:
                self.logger.warning(f"Lỗi khi sử dụng similarity_search với filter: {e}")

            # Phương pháp 4: Cuối cùng thử không có filter
            try:
                self.logger.info("Thử phương pháp similarity_search không có filter")
                results = self.vector_store.similarity_search(query, k=top_k)
                self.logger.info(f"Phương pháp similarity_search không filter trả về {len(results)} kết quả")
                return results
            except Exception as e:
                self.logger.error(f"Lỗi khi sử dụng similarity_search không filter: {e}")

            return []
        except Exception as e:
            self.logger.error(f"Lỗi khi tìm kiếm tài liệu: {e}")
            return []

    def check_pinecone_index_structure(self):
        """Kiểm tra cấu trúc của index Pinecone để debug"""
        try:
            from pinecone import Pinecone
            pc = Pinecone(api_key=PINECONE_API_KEY)
            index = pc.Index(BIBI_PINECONE_INDEX)

            # Lấy thông tin về index
            stats = index.describe_index_stats()
            total_vectors = stats.get('total_vector_count', 0)

            self.logger.info(f"Tổng số vectors trong Pinecone index: {total_vectors}")

            # Kiểm tra từng namespace
            namespaces = stats.get('namespaces', {})
            for ns_name, ns_info in namespaces.items():
                ns_count = ns_info.get('vector_count', 0)
                self.logger.info(f"Namespace '{ns_name or 'default'}': {ns_count} vectors")

                # Thử truy vấn mẫu trong namespace này
                if ns_count > 0:
                    import numpy as np
                    dummy_vector = np.random.rand(1536).tolist()  # OpenAI embeddings có 1536 chiều

                    query_results = index.query(
                        vector=dummy_vector,
                        top_k=1,
                        namespace=ns_name,
                        include_metadata=True
                    )

                    matches = query_results.get('matches', [])
                    if matches:
                        match = matches[0]
                        metadata = match.get('metadata', {})
                        self.logger.info(f"Mẫu metadata từ namespace '{ns_name}': {metadata.keys()}")
                        if 'text' in metadata:
                            text_preview = metadata['text'][:100] + "..." if len(metadata['text']) > 100 else metadata[
                                'text']
                            self.logger.info(f"Mẫu text: {text_preview}")
                    else:
                        self.logger.warning(
                            f"Không tìm thấy vectors trong namespace '{ns_name}' mặc dù có {ns_count} vectors")

            return {
                "total_vectors": total_vectors,
                "namespaces": {ns: info.get('vector_count', 0) for ns, info in namespaces.items()}
            }
        except Exception as e:
            self.logger.error(f"Lỗi khi kiểm tra cấu trúc index: {e}")
            import traceback
            self.logger.error(traceback.format_exc())
            return {"error": str(e)}

    def search_multiple_namespaces(self, query, namespaces=None, top_k=5):
        """Tìm kiếm trong nhiều namespace và kết hợp kết quả"""
        if not namespaces:
            # Sử dụng các namespace mặc định từ config
            from app.config import NAMESPACE_DEFAULT, NAMESPACE_SGK, NAMESPACE_CTGD, NAMESPACE_OTHERS
            namespaces = [NAMESPACE_DEFAULT, NAMESPACE_SGK, NAMESPACE_CTGD, NAMESPACE_OTHERS]

        all_results = []

        for ns in namespaces:
            self.logger.info(f"Tìm kiếm trong namespace: {ns}")
            docs = self.search(query, top_k=top_k // len(namespaces) + 1, namespace=ns)

            if docs:
                # Đánh dấu nguồn namespace
                for doc in docs:
                    doc.metadata["search_namespace"] = ns

                all_results.extend(docs)
                self.logger.info(f"Tìm thấy {len(docs)} kết quả từ namespace '{ns}'")

        # Sắp xếp kết quả theo độ liên quan (nếu có search_score)
        if all_results and "search_score" in all_results[0].metadata:
            all_results.sort(key=lambda doc: doc.metadata.get("search_score", 0), reverse=True)

        # Giới hạn số lượng kết quả
        return all_results[:top_k]

    # Giữ lại phương thức _semantic_enhanced_search không thay đổi
    def _semantic_enhanced_search(self, query, top_k=5, namespace=None):
        """Tìm kiếm nâng cao với hiểu biết ngữ nghĩa về các chủ đề"""
        # Kiểm tra vector_store trước khi thực hiện tìm kiếm nâng cao
        if self.vector_store is None:
            logger.warning("Vector store chưa được khởi tạo, không thể thực hiện tìm kiếm nâng cao")
            return None

        # Cập nhật concept_groups trong _semantic_enhanced_search
        concept_groups = {
            "ngữ pháp": ["ngữ pháp", "grammar", "cấu trúc câu", "sentence structure", "grammar rules", "verb", "noun",
                         "adjective", "adverb", "preposition", "tense", "thì", "động từ", "danh từ", "tính từ",
                         "giới từ"],
            "từ vựng": ["từ vựng", "vocabulary", "từ mới", "new words", "word bank", "vocab", "phát âm",
                        "pronunciation", "meaning", "nghĩa", "collocation", "word family", "từ đồng nghĩa",
                        "từ trái nghĩa"],
            "thì động từ": ["thì", "tenses", "hiện tại", "quá khứ", "tương lai", "present", "past", "future",
                            "continuous", "perfect", "simple", "progressive", "hiện tại đơn", "hiện tại tiếp diễn",
                            "quá khứ đơn"],
            "bài tập": ["bài tập", "exercises", "practice", "homework", "assignments", "luyện tập", "drills",
                        "worksheet", "workbook", "activity", "hoạt động", "task", "nhiệm vụ", "game", "trò chơi"],
            "kiểm tra đánh giá": ["kiểm tra", "tests", "exam", "assessment", "quiz", "đánh giá", "test paper",
                                  "marking", "grading", "chấm điểm", "score", "điểm số", "formative", "summative",
                                  "đánh giá quá trình", "đánh giá tổng kết"],
            "giáo án": ["giáo án", "lesson plan", "teaching plan", "syllabus", "kế hoạch giảng dạy",
                        "teaching materials", "course book", "giáo trình", "unit plan", "course outline", "curriculum",
                        "chương trình", "tiến độ", "mục tiêu", "objective"]
        }

        # Xác định chủ đề của câu hỏi
        identified_concepts = []
        for concept, terms in concept_groups.items():
            if any(term in query.lower() for term in terms):
                identified_concepts.append(concept)

        # Nếu xác định được chủ đề
        if identified_concepts:
            logger.info(f"Phát hiện câu hỏi liên quan đến: {', '.join(identified_concepts)}")

            # Trường hợp đặc biệt: tìm kiếm trực tiếp với chủ đề
            combined_results = []

            # Tìm kiếm với từng chủ đề
            for concept in identified_concepts:
                # Tạo truy vấn nâng cao
                enhanced_query = f"{query} {concept}"
                logger.info(f"Tìm kiếm với truy vấn nâng cao: '{enhanced_query}'")

                # Tìm kiếm tài liệu với namespace nếu có
                if namespace:
                    search_params = {"namespace": namespace}
                    concept_results = self.vector_store.similarity_search(
                        enhanced_query, k=top_k, search_params=search_params
                    )
                else:
                    concept_results = self.vector_store.similarity_search(enhanced_query, k=top_k)
                logger.info(f"Tìm thấy {len(concept_results)} tài liệu cho chủ đề {concept}")

                # Tìm kiếm với các từ khóa trong nhóm
                for term in concept_groups[concept]:
                    if term in query.lower():
                        continue  # Bỏ qua nếu từ khóa đã có trong câu hỏi

                    term_query = f"{query} {term}"
                    logger.info(f"Tìm kiếm bổ sung với từ khóa: '{term}'")

                    term_results = self.vector_store.similarity_search(term_query, k=3)
                    if term_results:
                        logger.info(f"Tìm thấy {len(term_results)} tài liệu với từ khóa {term}")
                        concept_results.extend(term_results)

                # Thêm vào kết quả tổng hợp
                combined_results.extend(concept_results)

            # Loại bỏ trùng lặp (dựa trên nội dung)
            unique_results = []
            seen_content = set()

            for doc in combined_results:
                # Tạo "fingerprint" của nội dung
                content_hash = hash(doc.page_content[:100])  # Lấy 100 ký tự đầu để so sánh

                # Nếu chưa thấy nội dung này
                if content_hash not in seen_content:
                    unique_results.append(doc)
                    seen_content.add(content_hash)

            # Xếp hạng kết quả
            ranked_results = self._rank_results_by_relevance(unique_results, query, identified_concepts)

            # Giới hạn số lượng kết quả
            final_results = ranked_results[:top_k]

            logger.info(f"Kết quả tìm kiếm nâng cao: {len(final_results)} tài liệu")
            for i, doc in enumerate(final_results):
                content_preview = doc.page_content[:150].replace('\n', ' ')
                logger.info(f"Kết quả nâng cao #{i + 1}: '{content_preview}...'")

            return final_results

        # Nếu không xác định được chủ đề, trả về None để sử dụng tìm kiếm thông thường
        return None

    def init_direct_connection(self):
        """Khởi tạo kết nối trực tiếp với Pinecone không phụ thuộc vào vector_store hiện tại"""
        try:
            if not PINECONE_API_KEY or not BIBI_PINECONE_INDEX:
                self.logger.error("Thiếu thông tin cấu hình Pinecone")
                return None

            # Import thư viện Pinecone mới
            from pinecone import Pinecone
            from langchain_pinecone import PineconeVectorStore

            # Khởi tạo Pinecone client
            pc = Pinecone(api_key=PINECONE_API_KEY)

            # Kiểm tra nếu index tồn tại
            indexes = pc.list_indexes()
            index_names = [idx.name for idx in indexes]

            if BIBI_PINECONE_INDEX not in index_names:
                self.logger.error(f"Pinecone index '{BIBI_PINECONE_INDEX}' không tồn tại")
                return None

            # Lấy reference đến index
            index = pc.Index(BIBI_PINECONE_INDEX)

            # Kiểm tra số lượng vectors
            stats = index.describe_index_stats()
            total_vectors = stats.get('total_vector_count', 0)
            namespaces = stats.get('namespaces', {})

            # Hiển thị thông tin chi tiết về từng namespace
            for ns_name, ns_info in namespaces.items():
                ns_count = ns_info.get('vector_count', 0)
                self.logger.info(f"Namespace '{ns_name or 'default'}': {ns_count} vectors")

            if total_vectors == 0:
                self.logger.warning(f"Pinecone index '{BIBI_PINECONE_INDEX}' không chứa vectors nào")
                return None

            # Tạo vector store
            from app.core.embeddings import embedding_service
            vector_store = PineconeVectorStore(
                index=index,
                embedding=embedding_service.embedder,
                text_key="text"
            )

            self.logger.info(
                f"Đã kết nối trực tiếp thành công với Pinecone index: {BIBI_PINECONE_INDEX} ({total_vectors} vectors)")
            self.vector_store = vector_store
            return vector_store

        except Exception as e:
            self.logger.error(f"Lỗi khi kết nối trực tiếp với Pinecone: {e}")
            import traceback
            self.logger.error(f"Chi tiết lỗi: {traceback.format_exc()}")
            return None

    def debug_vector_store(self):
        """Trả về thông tin debug về vector store"""
        try:
            debug_info = {
                "vector_store_initialized": self.vector_store is not None,
                "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }

            # Kiểm tra thông tin index nếu có
            if self.vector_store:
                try:
                    from pinecone import Pinecone
                    pc = Pinecone(api_key=PINECONE_API_KEY)
                    index = pc.Index(BIBI_PINECONE_INDEX)
                    stats = index.describe_index_stats()

                    debug_info["index_stats"] = stats
                    debug_info["total_vectors"] = stats.get('total_vector_count', 0)
                    debug_info["namespaces"] = {
                        ns_name: ns_info.get('vector_count', 0)
                        for ns_name, ns_info in stats.get('namespaces', {}).items()
                    }
                except Exception as e:
                    debug_info["index_error"] = str(e)

            return debug_info
        except Exception as e:
            return {"error": str(e)}

    def list_namespaces(self):
        """Lấy danh sách các namespace trong Pinecone index"""
        try:
            # Gọi API từ Pinecone để lấy stats hoặc danh sách namespace
            stats = self.vector_store.index.describe_index_stats()
            namespaces = list(stats.get('namespaces', {}).keys())

            # Trả về danh sách các namespace đã được xử lý
            processed_namespaces = []
            for ns in namespaces:
                vector_count = stats['namespaces'].get(ns, {}).get('vector_count', 0)
                processed_namespaces.append({
                    "name": ns,
                    "vector_count": vector_count,
                    "display_name": self.get_namespace_display_name(ns)
                })

            return processed_namespaces
        except Exception as e:
            print(f"Lỗi khi lấy danh sách namespace: {e}")
            return []

    def get_namespace_display_name(self, namespace):
        """Chuyển đổi tên namespace thành tên hiển thị thân thiện hơn"""
        namespace_map = {
            'bibi_sgk': 'Sách giáo khoa',
            'bibi_ctgd': 'Chương trình giảng dạy',
            'bibi_grammar': 'Ngữ pháp tiếng Anh',
            'others': 'Nguồn bổ sung'
        }
        return namespace_map.get(namespace, namespace)

    # Giữ lại phương thức _rank_results_by_relevance không thay đổi
    def _rank_results_by_relevance(self, docs, query, concepts=None):
        """Xếp hạng kết quả tìm kiếm dựa trên độ liên quan"""
        query_lower = query.lower()

        # Tạo danh sách từ khóa từ query
        query_words = [word for word in query_lower.split() if len(word) > 3]

        # Từ khóa theo chủ đề
        concept_keywords = {
            "chế độ chăm sóc": ["chăm sóc", "bán trú", "ngoại trú", "nội trú", "ăn uống", "sinh hoạt"],
            "xe đưa rước": ["xe đưa", "đưa đón", "đưa rước", "xe buýt", "bus", "vận chuyển"],
            "học phí": ["học phí", "tiền học", "chi phí", "đóng tiền", "ưu đãi", "giảm học phí"]
        }

        # Tính điểm cho mỗi tài liệu
        scored_docs = []
        for doc in docs:
            score = 0
            content_lower = doc.page_content.lower()
            metadata = doc.metadata if hasattr(doc, 'metadata') else {}

            # 1. Điểm cho metadata đánh dấu
            if metadata.get('important', False):
                score += 100

            if 'header' in metadata:
                # Nếu tiêu đề chứa từ khóa trong query
                header = metadata['header'].lower()
                for word in query_words:
                    if word in header:
                        score += 50

                # Hoặc nếu tiêu đề liên quan đến chủ đề đã xác định
                if concepts:
                    for concept in concepts:
                        if concept in header or any(term in header for term in concept_keywords.get(concept, [])):
                            score += 100

            # 2. Điểm cho metadata khái niệm
            if 'concept' in metadata:
                concept = metadata['concept'].lower()
                if concepts and any(c.lower() in concept for c in concepts):
                    score += 150

            # 3. Điểm cho từ khóa cụ thể
            if 'keywords' in metadata:
                for keyword in metadata['keywords']:
                    keyword_lower = keyword.lower()

                    # Nếu keyword có trong query
                    if keyword_lower in query_lower:
                        score += 80

                    # Nếu keyword liên quan đến chủ đề đã xác định
                    if concepts:
                        for concept in concepts:
                            if keyword_lower in concept_keywords.get(concept, []):
                                score += 50

            # 4. Điểm cho nội dung
            # Từ khóa từ query
            for word in query_words:
                if word in content_lower:
                    score += 10

                    # Thêm điểm nếu từ xuất hiện nhiều lần
                    count = content_lower.count(word)
                    if count > 1:
                        score += min(count * 2, 20)  # Tối đa 20 điểm cho mỗi từ

            # Chủ đề đã xác định
            if concepts:
                for concept in concepts:
                    # Kiểm tra tên chủ đề
                    if concept in content_lower:
                        score += 40

                    # Kiểm tra từ khóa liên quan
                    for term in concept_keywords.get(concept, []):
                        if term in content_lower:
                            score += 30

                            # Vị trí xuất hiện
                            position = content_lower.find(term)
                            if position < 100:  # Nếu xuất hiện sớm trong nội dung
                                score += 20

            # 5. Điểm phạt cho nội dung quá dài
            content_length = len(content_lower)
            if content_length > 1500:
                score -= (content_length - 1500) // 100  # Trừ 1 điểm cho mỗi 100 ký tự vượt quá 1500

            # Thêm vào danh sách
            scored_docs.append((doc, score))

        # Sắp xếp theo điểm giảm dần
        scored_docs.sort(key=lambda x: x[1], reverse=True)

        # Ghi log danh sách kết quả đã xếp hạng
        logger.info(f"Kết quả xếp hạng:")
        for i, (doc, score) in enumerate(scored_docs[:5]):  # Log 5 kết quả đầu tiên
            content_preview = doc.page_content[:100].replace('\n', ' ')
            logger.info(f"  #{i + 1}: Điểm = {score}, Nội dung = '{content_preview}...'")

        # Trả về tài liệu đã xếp hạng
        return [doc for doc, _ in scored_docs]

    def _apply_namespace_weighting(self, docs):
        """Áp dụng trọng số cho kết quả dựa trên namespace"""
        # Xác định trọng số cho từng namespace
        namespace_weights = {
            "bibi_sgk": 1.2,  # Ưu tiên sách giáo khoa
            "bibi_ctgd": 1.1,  # Ưu tiên chương trình giáo dục
            "bibi_grammar": 1.0,  # Trọng số mặc định
            "bibi_others": 0.9  # Giảm ưu tiên tài liệu khác
        }

        # Áp dụng trọng số
        weighted_docs = []
        for doc in docs:
            if hasattr(doc, '_score'):  # Nếu đã có score
                ns = doc.metadata.get('search_namespace', 'bibi_grammar')
                weight = namespace_weights.get(ns, 1.0)
                doc._score = doc._score * weight
            weighted_docs.append(doc)

        # Sắp xếp lại theo score
        if hasattr(weighted_docs[0], '_score'):
            weighted_docs.sort(key=lambda x: x._score, reverse=True)

        return weighted_docs

    def get_context_from_query(self, query, top_k=5):
        """Tạo ngữ cảnh từ các tài liệu liên quan đến câu hỏi"""
        docs = self.search(query, top_k=top_k)

        if not docs:
            logger.warning(f"No relevant documents found for query: {query}")
            return ""

        # Tạo context từ kết quả tìm kiếm
        context_parts = []
        for i, doc in enumerate(docs):
            source_info = f"[Nguồn: {doc.metadata.get('source', 'Không rõ')}]" if hasattr(doc, 'metadata') else ""
            context_parts.append(f"---\nThông tin #{i + 1} {source_info}\n{doc.page_content}")

        return "\n".join(context_parts)

    def retrieve_and_stream(self, query: str, callback: Callable[[str], None],
                            stop_event: Optional[threading.Event] = None) -> None:
        """
        Tìm kiếm thông tin và stream câu trả lời.

        Args:
            query: Câu hỏi của người dùng
            callback: Hàm callback để nhận các token streaming
            stop_event: Event để báo hiệu dừng streaming (tùy chọn)
        """
        from app.core.streaming_direct import DirectOpenAIStreamer
        import logging
        from typing import Optional
        import threading

        # Đảm bảo logger tồn tại
        if not hasattr(self, 'logger'):
            self.logger = logging.getLogger(__name__)

        self.logger.info(f"retrieve_and_stream được gọi với query: {query}")

        try:
            # Định nghĩa top_k với giá trị mặc định là 5
            top_k = 5

            # Tìm documents liên quan với phương pháp thông thường
            docs = self.search(query, top_k=top_k)

            # Log thông tin về các tài liệu tìm được
            self.logger.info(f"Tìm thấy {len(docs)} tài liệu cho truy vấn: '{query}'")
            for i, doc in enumerate(docs[:5]):  # Chỉ log 5 tài liệu đầu tiên
                preview = doc.page_content[:100] + '...' if len(doc.page_content) > 100 else doc.page_content
                self.logger.info(f"Tài liệu {i + 1}: '{preview}'")

            # Kiểm tra kết quả tìm kiếm
            if not docs:
                self.logger.warning("Không tìm thấy tài liệu liên quan")
                callback("Tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn.")
                callback("[DONE]")
                return

            # Sử dụng DirectOpenAIStreamer
            from app.config import OPENAI_API_KEY

            # Xác định model để sử dụng
            model = "gpt-4.1"  # Mặc định
            if hasattr(self, 'streaming_model'):
                model = self.streaming_model

            # Kiểm tra biến môi trường
            try:
                from app.config import OPENAI_STREAMING_MODEL
                model = OPENAI_STREAMING_MODEL
            except ImportError:
                pass  # Sử dụng model mặc định nếu không tìm thấy

            # Khởi tạo hoặc sử dụng lại streamer
            if not hasattr(self, '_streamer') or self._streamer is None:
                self.logger.info(f"Khởi tạo DirectOpenAIStreamer với model {model}")
                self._streamer = DirectOpenAIStreamer(openai_api_key=OPENAI_API_KEY, model=model)

            # Bắt đầu streaming trực tiếp
            self.logger.info("Bắt đầu streaming trực tiếp")
            self._streamer.stream(query, docs, callback, stop_event)
            self.logger.info("Kết thúc streaming trực tiếp")

        except Exception as e:
            self.logger.error(f"Lỗi trong retrieve_and_stream: {e}")
            import traceback
            self.logger.error(f"Chi tiết lỗi: {traceback.format_exc()}")
            callback(f"[ERROR] Có lỗi xảy ra: {str(e)}")
            callback("[DONE]")

    def search_multiple_namespaces(self, query, namespaces=None, top_k=5, filter_condition=None):
        """Tìm kiếm tài liệu dựa trên truy vấn qua nhiều namespace với khả năng lọc"""
        if not namespaces:
            # Sử dụng tất cả namespace đã định nghĩa
            from app.config import NAMESPACE_DEFAULT, NAMESPACE_SGK, NAMESPACE_CTGD, NAMESPACE_OTHERS
            namespaces = [NAMESPACE_DEFAULT, NAMESPACE_SGK, NAMESPACE_CTGD, NAMESPACE_OTHERS]

        all_results = []
        results_per_namespace = {}
        total_namespaces = len(namespaces)

        # Số kết quả cần lấy từ mỗi namespace
        k_per_namespace = max(2, top_k // total_namespaces)

        for namespace in namespaces:
            self.logger.info(f"Tìm kiếm trong namespace: {namespace}")

            # Thêm điều kiện lọc nếu có
            if filter_condition:
                self.logger.info(f"Áp dụng điều kiện lọc: {filter_condition}")
                results = self.search(query, top_k=k_per_namespace, namespace=namespace,
                                      filter_condition=filter_condition)
            else:
                results = self.search(query, top_k=k_per_namespace, namespace=namespace)

            if results:
                # Đánh dấu nguồn namespace trong metadata
                for doc in results:
                    if hasattr(doc, 'metadata'):
                        doc.metadata['search_namespace'] = namespace

                all_results.extend(results)
                results_per_namespace[namespace] = len(results)
                self.logger.info(f"Tìm thấy {len(results)} kết quả từ namespace '{namespace}'")
            else:
                self.logger.info(f"Không tìm thấy kết quả từ namespace '{namespace}'")
                results_per_namespace[namespace] = 0

        # Sắp xếp kết quả theo độ liên quan
        ranked_results = self._rank_results_by_relevance(all_results, query)

        # Áp dụng trọng số theo namespace nếu cần
        weighted_results = self._apply_namespace_weighting(ranked_results)

        # Log thông tin tổng hợp
        self.logger.info(f"Tổng số kết quả trước khi xếp hạng: {len(all_results)}")
        self.logger.info(f"Phân bố kết quả theo namespace: {results_per_namespace}")
        self.logger.info(f"Trả về {min(top_k, len(weighted_results))} kết quả tốt nhất")

        return weighted_results[:top_k]  # Trả về top_k kết quả tốt nhất

# Singleton instance
retriever_service = RetrieverService()
