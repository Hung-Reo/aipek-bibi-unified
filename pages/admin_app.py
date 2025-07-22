import streamlit as st
import os
import sys
# Thêm thư mục gốc của project để import được utils.py
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import time
import numpy as np
from utils import (
    init_session_state, process_files, SCHOOL_NAME,
    data_processor, index_manager, retriever_service,
    init_qa_chain, log_system_status
)
from langchain_community.chat_models import ChatOpenAI
# ConversationalRetrievalChain import with compatibility
try:
    from langchain.chains import ConversationalRetrievalChain
except ImportError:
    try:
        from langchain_community.chains import ConversationalRetrievalChain
    except ImportError:
        # Mock class for compatibility if not available
        ConversationalRetrievalChain = None
from pinecone import Pinecone
from app.config import (
    OPENAI_API_KEY, OPENAI_MODEL, OPENAI_TEMPERATURE, 
    VECTOR_STORE_PATH as INDEX_DIRECTORY, VECTOR_STORE_TYPE, 
    PINECONE_API_KEY, BIBI_PINECONE_INDEX
)

# Set ENABLE_BACKUP for compatibility
ENABLE_BACKUP = False

# Note: Unified version doesn't have these separate managers
# We'll use mock implementations from utils.py

# THAY THẾ hoàn toàn hàm delete_pinecone_namespace hiện tại bằng hàm này
def delete_pinecone_namespace(namespace):
    """Xóa dữ liệu trong namespace cụ thể của Pinecone index sử dụng phương pháp SDK trực tiếp"""
    try:
        from pinecone import Pinecone
        import time

        st.info(f"Bắt đầu xóa namespace: {namespace}")
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(BIBI_PINECONE_INDEX)

        # Lấy thông tin trước khi xóa
        before_stats = index.describe_index_stats()
        namespaces = before_stats.get('namespaces', {})
        st.write(f"Thông tin namespace trước khi xóa: {namespaces}")

        if namespace in namespaces:
            vectors_before = namespaces[namespace].get('vector_count', 0)

            if vectors_before == 0:
                st.success(f"✅ Namespace '{namespace}' đã trống, không cần xóa")
                return {
                    "success": True,
                    "namespace": namespace,
                    "message": "Namespace đã trống, không cần xóa",
                    "vectors_before": 0,
                    "vectors_after": 0
                }

            st.info(f"Tìm thấy {vectors_before} vectors trong namespace '{namespace}'")
            st.warning("⚠️ Quá trình xóa có thể mất một thời gian. Vui lòng không đóng trang.")

            # Hiển thị progress bar
            progress_bar = st.progress(0)
            status_text = st.empty()
            status_text.text(f"Đang xóa namespace: {namespace} ({vectors_before} vectors)...")

            # Thử xóa nhiều lần để đảm bảo
            max_attempts = 3
            for attempt in range(max_attempts):
                try:
                    # Sử dụng SDK trực tiếp để xóa - PHƯƠNG PHÁP HIỆU QUẢ
                    status_text.text(f"Đang xóa namespace (lần {attempt + 1}/{max_attempts})...")
                    index.delete(delete_all=True, namespace=namespace)

                    # Kiểm tra kết quả xóa
                    time.sleep(5)  # Đợi 5 giây để đảm bảo hoàn tất
                    check_stats = index.describe_index_stats()
                    check_namespaces = check_stats.get('namespaces', {})

                    # Cập nhật progress
                    progress_bar.progress((attempt + 1) / max_attempts)

                    if namespace not in check_namespaces:
                        status_text.text("✅ Xóa hoàn thành, đã kiểm tra xác nhận!")
                        progress_bar.progress(1.0)
                        return {
                            "success": True,
                            "namespace": namespace,
                            "vectors_before": vectors_before,
                            "vectors_after": 0,
                            "message": f"Đã xóa thành công namespace '{namespace}'"
                        }
                    elif check_namespaces[namespace].get('vector_count', 0) == 0:
                        status_text.text("✅ Xóa hoàn thành, đã kiểm tra xác nhận!")
                        progress_bar.progress(1.0)
                        return {
                            "success": True,
                            "namespace": namespace,
                            "vectors_before": vectors_before,
                            "vectors_after": 0,
                            "message": f"Đã xóa thành công namespace '{namespace}'"
                        }
                    else:
                        vectors_remaining = check_namespaces[namespace].get('vector_count', 0)
                        status_text.text(f"⚠️ Vẫn còn {vectors_remaining} vectors. Thử lại...")
                        # Nếu không phải lần cuối, tiếp tục thử
                        if attempt < max_attempts - 1:
                            time.sleep(3)  # Đợi 3 giây trước khi thử lại

                except Exception as ns_err:
                    st.warning(f"Lỗi khi xóa namespace {namespace} (lần {attempt + 1}): {ns_err}")
                    if attempt < max_attempts - 1:
                        time.sleep(3)  # Đợi 3 giây trước khi thử lại

            # Nếu sau nhiều lần thử vẫn không thành công, hiển thị tùy chọn xóa toàn bộ
            final_stats = index.describe_index_stats()
            final_namespaces = final_stats.get('namespaces', {})

            if namespace in final_namespaces and final_namespaces[namespace].get('vector_count', 0) > 0:
                st.warning("⚠️ Không thể xóa hoàn toàn namespace. Bạn có muốn xóa toàn bộ index không?")

                if st.button("⚠️ XÁC NHẬN XÓA TOÀN BỘ INDEX", key="reset_all_confirm"):
                    with st.spinner("Đang xóa toàn bộ index..."):
                        # Xóa toàn bộ index
                        index.delete(delete_all=True)
                        time.sleep(5)  # Đợi 5 giây

                        # Kiểm tra lại
                        final_stats = index.describe_index_stats()
                        total_after = final_stats.get('total_vector_count', 0)

                        if total_after == 0:
                            return {
                                "success": True,
                                "namespace": "ALL",
                                "vectors_before": vectors_before,
                                "vectors_after": 0,
                                "message": "Đã reset toàn bộ index"
                            }
                        else:
                            return {
                                "success": False,
                                "namespace": "ALL",
                                "vectors_before": vectors_before,
                                "vectors_after": total_after,
                                "error": "Không thể reset index"
                            }

                return {
                    "success": False,
                    "namespace": namespace,
                    "vectors_before": vectors_before,
                    "vectors_after": final_namespaces[namespace].get('vector_count', 0),
                    "error": "Không thể xóa hoàn toàn namespace"
                }

            # Kiểm tra kết quả cuối cùng
            if namespace not in final_namespaces:
                status_text.text("✅ Xóa hoàn thành!")
                progress_bar.progress(1.0)
                return {
                    "success": True,
                    "namespace": namespace,
                    "vectors_before": vectors_before,
                    "vectors_after": 0,
                    "message": f"Đã xóa thành công namespace '{namespace}'"
                }
            else:
                vectors_after = final_namespaces[namespace].get('vector_count', 0)
                if vectors_after == 0:
                    status_text.text("✅ Xóa hoàn thành!")
                    progress_bar.progress(1.0)
                    return {
                        "success": True,
                        "namespace": namespace,
                        "vectors_before": vectors_before,
                        "vectors_after": 0,
                        "message": f"Đã xóa thành công namespace '{namespace}'"
                    }
                else:
                    status_text.text(f"⚠️ Vẫn còn {vectors_after} vectors. Xóa không hoàn toàn.")
                    return {
                        "success": False,
                        "namespace": namespace,
                        "vectors_before": vectors_before,
                        "vectors_after": vectors_after,
                        "error": f"Chỉ xóa được một phần, còn lại {vectors_after} vectors"
                    }
        else:
            st.info(f"Namespace '{namespace}' không tồn tại, không cần xóa")
            return {
                "success": True,
                "message": f"Namespace '{namespace}' không tồn tại, không cần xóa"
            }
    except Exception as e:
        st.error(f"Lỗi tổng thể: {e}")
        import traceback
        st.code(traceback.format_exc())
        return {
            "success": False,
            "error": str(e)
        }

def _get_host_name(pc):
    """Helper function to get Pinecone host name"""
    try:
        # Try to access _get_host_name method
        if hasattr(pc, '_get_host_name') and callable(pc._get_host_name):
            return pc._get_host_name()

        # Alternative ways to get the host
        if hasattr(pc, 'host'):
            return pc.host

        # Fallback to fixed host
        return "us-east-1-aws.pinecone.io"
    except Exception as e:
        st.error(f"Lỗi khi lấy host name: {e}")
        return "us-east-1-aws.pinecone.io"  # Default fallback


def _get_vector_ids_in_namespace(namespace, top_k=10000):
    """Lấy danh sách vector IDs trong một namespace với cơ chế thử lại"""
    try:
        from pinecone import Pinecone
        import numpy as np
        import time

        st.info(f"Đang lấy danh sách vector IDs trong namespace: {namespace}")

        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(BIBI_PINECONE_INDEX)

        # Tạo vector ngẫu nhiên với kích thước phù hợp cho API truy vấn
        try:
            # Lấy thông tin index để biết chiều của vector
            stats = index.describe_index_stats()
            dimension = stats.get('dimension', 1536)  # Mặc định 1536 cho OpenAI embeddings
            st.info(f"Kích thước vector của index: {dimension} chiều")
            dummy_vector = np.random.rand(dimension).tolist()
        except Exception as dim_error:
            st.warning(f"Không thể xác định kích thước vector: {dim_error}")
            st.info("Sử dụng vector 1536 chiều (OpenAI mặc định)")
            dummy_vector = np.random.rand(1536).tolist()

        # Thử lại nhiều lần
        max_retries = 3
        for attempt in range(max_retries):
            try:
                st.info(f"Truy vấn vector IDs (lần {attempt + 1}/{max_retries})...")

                # Kiểm tra nếu index có phương thức fetch
                if hasattr(index, 'fetch') and callable(index.fetch):
                    st.info("Sử dụng phương thức fetch để lấy danh sách IDs...")
                    # Nếu có, lấy danh sách IDs bằng fetch
                    response = index.fetch(
                        ids=[],  # Để trống để lấy tất cả
                        namespace=namespace
                    )
                    # Lấy IDs từ response
                    if hasattr(response, 'ids'):
                        vector_ids = response.ids
                    elif hasattr(response, 'vectors'):
                        vector_ids = list(response.vectors.keys())
                    else:
                        st.warning("Không thể lấy IDs từ kết quả fetch")
                        vector_ids = []
                else:
                    # Nếu không, sử dụng query
                    st.info("Sử dụng phương thức query để lấy danh sách IDs...")
                    query_response = index.query(
                        vector=dummy_vector,
                        top_k=top_k,
                        namespace=namespace,
                        include_metadata=False
                    )

                    # Lấy IDs từ kết quả truy vấn
                    vector_ids = [match.id for match in query_response.matches]

                st.info(f"Đã lấy được {len(vector_ids)} vector IDs")
                # Hiển thị một số IDs đầu tiên (tối đa 5)
                if vector_ids:
                    st.info(f"Ví dụ một số IDs: {vector_ids[:5]}")
                return vector_ids

            except Exception as e:
                st.warning(f"Lỗi khi lấy vector IDs (lần thử {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    wait_time = 3 * (attempt + 1)
                    st.info(f"Đợi {wait_time} giây trước khi thử lại...")
                    time.sleep(wait_time)

        st.error("Đã thử lấy vector IDs nhiều lần nhưng không thành công.")
        return []

    except Exception as e:
        st.error(f"Lỗi khi lấy vector IDs: {e}")
        import traceback
        st.code(traceback.format_exc())
        return []

# Thêm hàm này sau các import và trước các định nghĩa khác
def safe_rerun():
    """Hàm tương thích với các phiên bản Streamlit khác nhau"""
    try:
        # Thử phương thức mới nhất
        st.rerun()
    except AttributeError:
        try:
            # Thử phương thức cũ
            st.experimental_rerun()
        except AttributeError:
            # Fallback - cách cuối cùng
            import time
            if "last_rerun" not in st.session_state:
                st.session_state.last_rerun = 0
            st.session_state.last_rerun = time.time()
            st.empty()  # Kích hoạt cập nhật UI

# Cấu hình riêng cho dự án BiBi
BIBI_NAMESPACE = "bibi_grammar"  # Namespace riêng cho BiBi
BIBI_SCHOOL_NAME = "BiBi - Trợ lý AI Giáo dục K12"  # Tên riêng cho BiBi

# sau phần import và trước st.set_page_config
def ensure_sample_pdf_dir():
    """Đảm bảo thư mục sample_pdf tồn tại"""
    sample_pdf_dir = os.path.join(os.getcwd(), "sample_pdf")
    os.makedirs(sample_pdf_dir, exist_ok=True)
    return sample_pdf_dir

# Khởi tạo thư mục sample_pdf
sample_pdf_dir = ensure_sample_pdf_dir()

st.set_page_config(
    page_title=f"Admin - {BIBI_SCHOOL_NAME}",
    page_icon="📚",
    layout="centered",
    initial_sidebar_state="collapsed"
)



st.write("🔄 Phiên bản cập nhật: ✅ Admin BiBi - Quản lý dữ liệu tiếng Anh lớp 6")

# Đảm bảo numpy arrays được chuyển đổi đúng cách
np.set_printoptions(threshold=np.inf)

# Hàm đơn giản để xóa dữ liệu Pinecone
def delete_pinecone_data():
    """Xóa toàn bộ dữ liệu trong Pinecone index với kiểm tra và thử lại"""
    try:
        # Sử dụng Pinecone API trực tiếp
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(BIBI_PINECONE_INDEX)

        # Lấy thông tin trước khi xóa
        before_stats = index.describe_index_stats()
        total_before = before_stats.get('total_vector_count', 0)

        if total_before == 0:
            return {
                "success": True,
                "message": "Không có dữ liệu để xóa",
                "vectors_before": 0,
                "vectors_after": 0
            }

        # Thêm thông tin chi tiết
        st.write(f"Tổng số vectors trước khi xóa: {total_before}")
        progress_bar = st.progress(0)
        status_text = st.empty()

        # Kiểm tra namespace và xóa từng namespace
        namespaces = before_stats.get('namespaces', {})

        if namespaces:
            namespace_count = len(namespaces)
            for i, (namespace, ns_info) in enumerate(namespaces.items()):
                ns_vectors = ns_info.get('vector_count', 0)
                namespace_display = namespace if namespace else "(default)"
                status_text.text(
                    f"Đang xóa namespace {i + 1}/{namespace_count}: {namespace_display} ({ns_vectors} vectors)")

                # Lặp lại việc xóa vài lần để đảm bảo
                for attempt in range(3):
                    try:
                        # Xóa dữ liệu trong namespace cụ thể
                        index.delete(delete_all=True, namespace=namespace)

                        # Kiểm tra kết quả xóa
                        time.sleep(1)
                        check_stats = index.describe_index_stats()
                        check_namespaces = check_stats.get('namespaces', {})

                        if namespace not in check_namespaces or check_namespaces.get(namespace, {}).get('vector_count',
                                                                                                        0) == 0:
                            break  # Xóa thành công
                    except Exception as ns_err:
                        st.warning(f"Lỗi khi xóa namespace {namespace}: {ns_err}")
                        time.sleep(1)

                # Cập nhật progress
                progress_bar.progress((i + 1) / namespace_count)

        # Xóa dữ liệu mặc định (không có namespace)
        status_text.text("Đang xóa dữ liệu mặc định (không namespace)...")
        index.delete(delete_all=True, namespace="")

        # Xóa tất cả dữ liệu để đảm bảo
        status_text.text("Đang xóa tất cả dữ liệu còn lại...")
        index.delete(delete_all=True)

        # Đợi và kiểm tra lại nhiều lần
        max_checks = 5
        for check in range(max_checks):
            status_text.text(f"Đang kiểm tra kết quả ({check + 1}/{max_checks})...")
            time.sleep(2)  # Đợi 2 giây trước mỗi lần kiểm tra

            check_stats = index.describe_index_stats()
            total_after = check_stats.get('total_vector_count', 0)

            if total_after == 0:
                # Xóa thành công
                status_text.text("✅ Xóa hoàn thành, đã kiểm tra xác nhận!")
                progress_bar.progress(1.0)

                return {
                    "success": True,
                    "vectors_before": total_before,
                    "vectors_after": 0,
                    "message": f"Đã xóa thành công sau {check + 1} lần kiểm tra"
                }

        # Nếu vẫn còn vectors sau nhiều lần kiểm tra
        final_stats = index.describe_index_stats()
        total_after = final_stats.get('total_vector_count', 0)

        if total_after > 0:
            status_text.text(f"⚠️ Vẫn còn {total_after} vectors sau nhiều lần thử. Hãy thử lại.")
            return {
                "success": False,
                "vectors_before": total_before,
                "vectors_after": total_after,
                "message": f"Chỉ xóa được một phần, vẫn còn {total_after} vectors"
            }
        else:
            status_text.text("✅ Xóa hoàn thành!")
            progress_bar.progress(1.0)
            return {
                "success": True,
                "vectors_before": total_before,
                "vectors_after": 0
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def delete_namespace_simplified(namespace):
    """Xóa namespace sử dụng phương pháp đơn giản và hiệu quả nhất"""
    try:
        from pinecone import Pinecone
        import time

        # Log chi tiết
        print(f"Bắt đầu xóa namespace '{namespace}'")

        # Khởi tạo Pinecone client
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(BIBI_PINECONE_INDEX)

        # Lấy thông tin trước khi xóa
        before_stats = index.describe_index_stats()
        namespaces = before_stats.get('namespaces', {})

        if namespace in namespaces:
            vectors_before = namespaces[namespace].get('vector_count', 0)

            if vectors_before == 0:
                print(f"Namespace '{namespace}' đã trống, không cần xóa")
                return {
                    "success": True,
                    "namespace": namespace,
                    "message": "Namespace đã trống, không cần xóa",
                    "vectors_before": 0,
                    "vectors_after": 0
                }

            print(f"Tìm thấy {vectors_before} vectors trong namespace '{namespace}'")

            # Xóa vectors trong namespace
            index.delete(delete_all=True, namespace=namespace)

            # Đợi và kiểm tra
            time.sleep(3)
            after_stats = index.describe_index_stats()
            after_namespaces = after_stats.get('namespaces', {})

            if namespace not in after_namespaces:
                print(f"Đã xóa thành công namespace '{namespace}'")
                return {
                    "success": True,
                    "namespace": namespace,
                    "vectors_before": vectors_before,
                    "vectors_after": 0,
                    "message": f"Đã xóa thành công namespace '{namespace}'"
                }

            vectors_after = after_namespaces.get(namespace, {}).get('vector_count', 0)
            if vectors_after == 0:
                print(f"Đã xóa thành công tất cả vectors trong namespace '{namespace}'")
                return {
                    "success": True,
                    "namespace": namespace,
                    "vectors_before": vectors_before,
                    "vectors_after": 0,
                    "message": f"Đã xóa thành công namespace '{namespace}'"
                }

            # Sửa từ vectors_count thành vectors_before
            print(f"Chỉ xóa được một phần: {vectors_before - vectors_after}/{vectors_before}")
            return {
                "success": False,
                "namespace": namespace,
                "vectors_before": vectors_before,
                "vectors_after": vectors_after,
                "message": f"Chỉ xóa được một phần: {vectors_before - vectors_after}/{vectors_before}"
            }
        else:
            print(f"Namespace '{namespace}' không tồn tại")
            return {
                "success": True,
                "message": f"Namespace '{namespace}' không tồn tại, không cần xóa"
            }
    except Exception as e:
        print(f"Lỗi khi xóa namespace: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

# Hàm kiểm tra mật khẩu
def check_password():
    """Kiểm tra mật khẩu để vào trang admin"""
    if "password_correct" not in st.session_state:
        st.session_state.password_correct = False

    if st.session_state.password_correct:
        return True

    # Hiển thị form đăng nhập
    st.title("Đăng nhập Admin")

    # Sử dụng form để hỗ trợ phím Enter
    with st.form("login_form"):
        password = st.text_input("Nhập mật khẩu", type="password")
        submit_button = st.form_submit_button("Đăng nhập")

        if submit_button:
            if password == "petrusky2025":  # Mật khẩu đơn giản, bạn nên thay đổi trong môi trường thực tế
                st.session_state.password_correct = True
                safe_rerun()
            else:
                st.error("Mật khẩu không chính xác")
                return False

    return False


def main():
    """Trang quản lý dữ liệu dành cho admin."""
    # Đảm bảo thư mục sample_pdf tồn tại
    sample_pdf_dir = ensure_sample_pdf_dir()
    # Kiểm tra mật khẩu trước khi hiển thị nội dung
    if not check_password():
        return

    st.title(f"Quản lý dữ liệu RAG - {BIBI_SCHOOL_NAME}")
    st.markdown("*Công cụ upload và quản lý dữ liệu từ sách giáo khoa tiếng Anh lớp 6*")

    # Khởi tạo session state
    init_session_state()

    # Phần upload tài liệu
    st.subheader("Tải lên và xử lý tài liệu")

    # Tạo container để bố trí giao diện hai cột
    doc_col1, doc_col2 = st.columns([3, 2])
    # Thêm cấu hình namespace bên dưới phần doc_col1, doc_col2
    with doc_col1:
        files = st.file_uploader("Upload PDF files để xử lý",
                                 type="pdf",
                                 accept_multiple_files=True,
                                 help="Bạn có thể chọn nhiều file PDF cùng lúc",
                                 key="main_file_uploader")  # Thêm key để tránh trùng lặp

        # Thêm dropdown chọn loại tài liệu
        from app.config import NAMESPACE_SGK, NAMESPACE_CTGD, NAMESPACE_OTHERS, NAMESPACE_DEFAULT

        doc_type = st.selectbox(
            "Loại tài liệu",
            options=["default", "sgk", "ctgd", "others"],
            format_func=lambda x: {
                "default": "🔠 Mặc định - Ngữ pháp chung",
                "sgk": "🔹 Sách Giáo Khoa Bộ GD",
                "ctgd": "📘 Chương Trình Giáo Dục 2018",
                "others": "📝 Tài liệu đặc trưng Trường"
            }.get(x, x)
        )

        # Map loại tài liệu sang namespace
        namespace_mapping = {
            "default": NAMESPACE_DEFAULT,
            "sgk": NAMESPACE_SGK,
            "ctgd": NAMESPACE_CTGD,
            "others": NAMESPACE_OTHERS
        }
        selected_namespace = namespace_mapping.get(doc_type, NAMESPACE_DEFAULT)

        # Hiển thị namespace được chọn
        st.info(f"Namespace: **{selected_namespace}**")

    with doc_col2:
        # Tùy chọn chế độ xử lý
        st.markdown("### Chế độ xử lý")
        process_mode = st.radio(
            "Chọn chế độ xử lý:",
            options=["Thay thế hoàn toàn", "Bổ sung vào dữ liệu hiện có"],
            index=0,
            help="'Thay thế' sẽ tạo index mới. 'Bổ sung' sẽ thêm dữ liệu vào index hiện tại"
        )

        # Nếu chọn chế độ bổ sung, hiển thị dropdown để chọn index hiện có
        existing_index_id = None
        if process_mode == "Bổ sung vào dữ liệu hiện có":
            saved_indexes = data_processor.get_saved_indexes()
            if saved_indexes:
                # Format hiển thị cho từng index
                index_display = []
                for idx_id in saved_indexes:
                    # Hiển thị 8 ký tự đầu của ID và thời gian tạo
                    index_path = os.path.join(INDEX_DIRECTORY, idx_id)
                    pkl_path = os.path.join(INDEX_DIRECTORY, f"{idx_id}.pkl")

                    if os.path.exists(index_path) and os.path.isdir(index_path):
                        created_time = time.ctime(os.path.getctime(index_path))
                        display = f"{idx_id[:8]}... (Tạo: {created_time})"
                        index_display.append((idx_id, display))
                    elif os.path.exists(pkl_path):
                        created_time = time.ctime(os.path.getctime(pkl_path))
                        display = f"{idx_id[:8]}... (Tạo: {created_time})"
                        index_display.append((idx_id, display))

                if index_display:
                    selected_display = st.selectbox(
                        "Chọn index để bổ sung dữ liệu:",
                        options=[d for _, d in index_display],
                        index=0
                    )

                    # Tìm ID tương ứng với display đã chọn
                    for idx_id, display in index_display:
                        if display == selected_display:
                            existing_index_id = idx_id
                            break

    # Thay thế phần "Xử lý file đã upload"
    if files:
        st.write(f"Đã upload {len(files)} file:")

        # Hiển thị thông tin các file đã upload trong expander
        with st.expander("Xem chi tiết các file đã upload"):
            for file in files:
                st.write(f"- {file.name} ({round(file.size / 1024, 2)} KB)")
        # THÊM VÀO ĐÂY - sau expander và trước nút xử lý
        st.write(f"Đường dẫn thư mục gốc: {os.getcwd()}")
        st.write(f"Đường dẫn sample_pdf: {sample_pdf_dir}")
        st.write(f"Thư mục sample_pdf tồn tại: {os.path.exists(sample_pdf_dir)}")

        # Sao chép files vào sample_pdf (thêm đoạn này cùng vị trí)
        for file in files:
            try:
                # Tạo đường dẫn đích
                dest_path = os.path.join(sample_pdf_dir, file.name)

                # Lưu file vào sample_pdf
                with open(dest_path, "wb") as f:
                    f.write(file.getbuffer())

                st.success(f"Đã sao chép {file.name} vào thư mục sample_pdf")
            except Exception as e:
                st.error(f"Lỗi khi sao chép file {file.name}: {str(e)}")

        # Nút xử lý tài liệu với chế độ đã chọn
        process_btn_text = "Xử lý tài liệu mới" if process_mode == "Thay thế hoàn toàn" else "Bổ sung vào dữ liệu hiện có"

        if st.button(process_btn_text):
            with st.spinner(f"Đang {process_mode.lower()} tài liệu..."):
                try:
                    # Xử lý từng file
                    results = []
                    total_chunks = 0

                    for file in files:
                        st.write(f"Đang xử lý {file.name}...")
                        # Use process_files from utils.py instead of processing_pipeline
                        result = process_files([file], doc_type=doc_type, namespace=selected_namespace)
                        # Ghi log thêm namespace đã sử dụng
                        if result["status"] == "success":
                            st.info(f"Đã lưu vào namespace: {selected_namespace} (loại tài liệu: {doc_type})")

                            # Khởi tạo lại kết nối trực tiếp để đảm bảo retriever service sử dụng vector store mới
                            if retriever_service:
                                try:
                                    st.info("Đang khởi tạo lại kết nối Pinecone...")
                                    retriever_service.init_direct_connection()
                                    st.success("Đã cập nhật kết nối Pinecone trong retriever service")
                                except Exception as e:
                                    st.warning(f"Lưu ý: Không thể khởi tạo lại kết nối Pinecone: {str(e)}")

                        if result["status"] == "success":
                            st.success(f"✅ {file.name}: Đã xử lý {result.get('chunks_count', 0)} chunks")
                            total_chunks += result.get('chunks_count', 0)
                        else:
                            st.error(f"❌ {file.name}: {result.get('message', 'Lỗi không xác định')}")

                        results.append(result)

                    # Hiển thị tổng kết
                    if any(r["status"] == "success" for r in results):
                        st.success(
                            f"Đã xử lý thành công {sum(1 for r in results if r['status'] == 'success')}/{len(files)} file với tổng cộng {total_chunks} chunks")

                        # Kiểm tra chất lượng vector store
                        try:
                            st.info(f"Đang kiểm tra chất lượng trong namespace '{selected_namespace}'...")

                            # Sử dụng các câu hỏi phù hợp hơn với nội dung SGK Tiếng Anh lớp 6
                            test_questions = [
                                "Ngữ pháp tiếng Anh lớp 6",
                                "Từ vựng tiếng Anh cơ bản",
                                "Kỹ năng giao tiếp tiếng Anh"
                            ]

                            # Thêm delay để đảm bảo Pinecone đã hoàn tất đánh index
                            time.sleep(5)  # Tăng thời gian đợi lên 5 giây

                            # Kiểm tra trực tiếp số lượng vectors trong namespace
                            try:
                                from pinecone import Pinecone
                                pc = Pinecone(api_key=PINECONE_API_KEY)
                                index = pc.Index(BIBI_PINECONE_INDEX)
                                stats = index.describe_index_stats()
                                namespaces = stats.get('namespaces', {})
                                vectors_in_namespace = namespaces.get(selected_namespace, {}).get('vector_count', 0)

                                st.info(
                                    f"Thông tin vectors: Tổng số vectors trong namespace '{selected_namespace}': {vectors_in_namespace}")
                                if vectors_in_namespace == 0:
                                    st.warning(
                                        "⚠️ Không có vectors nào trong namespace này. Quá trình nhúng có thể chưa thành công.")
                            except Exception as e:
                                st.warning(f"Không thể kiểm tra số lượng vectors: {str(e)}")

                            test_results = []

                            # Sử dụng retriever_service.search với namespace cụ thể
                            for question in test_questions:
                                # Thử tìm kiếm với namespace đã chọn
                                docs = retriever_service.search(question, top_k=1, namespace=selected_namespace)
                                has_result = len(docs) > 0

                                # Log chi tiết kết quả tìm kiếm để debug
                                st.write(f"Debug - Tìm kiếm câu hỏi: '{question}'")
                                st.write(f"Debug - Namespace: '{selected_namespace}'")
                                st.write(f"Debug - Số kết quả tìm thấy: {len(docs)}")

                                # Xử lý kết quả an toàn hơn
                                preview = "Không tìm thấy"
                                if has_result:
                                    try:
                                        preview = docs[0].page_content[:100].replace('\n', ' ')
                                    except Exception as e:
                                        preview = f"Lỗi khi trích xuất nội dung: {str(e)}"

                                # Đảm bảo dữ liệu là chuỗi Python thuần túy
                                test_results.append({
                                    "Câu hỏi": str(question),
                                    "Kết quả": "✅ Tìm thấy" if has_result else "❌ Không tìm thấy",
                                    "Trích đoạn": str(preview),
                                    "Namespace": selected_namespace
                                })

                            # Nếu không tìm thấy kết quả nào, thử tìm với namespace trống
                            if all(result["Kết quả"] == "❌ Không tìm thấy" for result in test_results):
                                st.warning("Thử tìm kiếm với namespace trống...")
                                for question in test_questions:
                                    docs = retriever_service.search(question, top_k=1, namespace="")
                                    if docs and len(docs) > 0:
                                        st.info(f"Tìm thấy kết quả cho '{question}' trong namespace trống!")

                            # Hiển thị kết quả kiểm tra
                            import pandas as pd
                            st.write("Kết quả kiểm tra:")

                            # Tạo DataFrame với dữ liệu đã được xử lý an toàn
                            df = pd.DataFrame([{k: str(v) for k, v in item.items()} for item in test_results])
                            st.dataframe(df)

                        except Exception as e:
                            st.error(f"Lỗi khi kiểm tra chất lượng: {str(e)}")
                            # Hiển thị kết quả dạng đơn giản nếu có lỗi
                            st.write("Kết quả tìm được:")
                            for i, question in enumerate(test_questions):
                                if i < len(test_results):
                                    result = test_results[i]
                                    st.write(
                                        f"- {result.get('Câu hỏi', question)}: {result.get('Kết quả', 'Không xác định')}")
                except Exception as e:
                    st.error(f"Lỗi khi xử lý tài liệu: {str(e)}")

    # Phần xử lý thư mục PDF
    st.subheader("Xử lý thư mục PDF")

    # Đảm bảo thư mục sample_pdf tồn tại
    sample_pdf_dir = "sample_pdf"
    if not os.path.exists(sample_pdf_dir):
        os.makedirs(sample_pdf_dir, exist_ok=True)
        st.info(f"Đã tạo thư mục {sample_pdf_dir}")

    # Hiển thị thông tin về thư mục mẫu - đơn giản hóa
    st.info("Bạn có thể đặt file PDF vào thư mục 'sample_pdf'")
    st.info("Sau đó nhập 'sample_pdf' vào ô bên dưới")

    # Chỉ hiển thị các thư mục quan trọng
    important_dirs = ["sample_pdf", "temp_pdf"]
    available_dirs = [d for d in important_dirs if os.path.isdir(d)]
    if available_dirs:
        st.write("Các thư mục sẵn có để xử lý:")
        for d in available_dirs:
            # Kiểm tra số lượng file PDF trong thư mục
            pdf_count = len([f for f in os.listdir(d) if f.lower().endswith('.pdf')])
            st.write(f"- {d} ({pdf_count} file PDF)")

    # Nhập đường dẫn
    pdf_dir = st.text_input("Đường dẫn đến thư mục PDF",
                            help="Nhập đường dẫn tới thư mục chứa file PDF")

    # Kiểm tra thư mục
    if pdf_dir:
        # Chuyển đổi đường dẫn tương đối thành tuyệt đối
        if not os.path.isabs(pdf_dir):
            abs_path = os.path.abspath(os.path.join(os.getcwd(), pdf_dir))
            # Hiển thị đơn giản hơn
            st.info(f"Sử dụng đường dẫn: {pdf_dir}")
            pdf_dir = abs_path

        if os.path.exists(pdf_dir):
            if os.path.isdir(pdf_dir):
                # Liệt kê các file PDF trong thư mục
                pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]
                if pdf_files:
                    st.success(f"Tìm thấy {len(pdf_files)} file PDF trong thư mục: {', '.join(pdf_files)}")

                    # Hiển thị chi tiết file
                    file_details = []
                    for pdf_file in pdf_files:
                        file_path = os.path.join(pdf_dir, pdf_file)
                        file_size = os.path.getsize(file_path) / 1024  # KB
                        file_details.append(f"{pdf_file} ({file_size:.1f} KB)")

                    st.write("Chi tiết các file:")
                    for detail in file_details:
                        st.write(f"- {detail}")
                else:
                    st.warning("Không tìm thấy file PDF nào trong thư mục này!")
            else:
                st.error(f"'{pdf_dir}' tồn tại nhưng không phải là thư mục!")
        else:
            st.error(f"Không tìm thấy thư mục: '{pdf_dir}'")

    # Nút xử lý
    if st.button("Xử lý thư mục"):
        if pdf_dir and os.path.exists(pdf_dir) and os.path.isdir(pdf_dir):
            with st.spinner("Đang xử lý thư mục..."):
                try:
                    file_count, chunk_count = data_processor.process_pdf_directory(pdf_dir)
                    if file_count > 0:
                        st.success(f"Đã xử lý {file_count} file với tổng cộng {chunk_count} đoạn văn bản")

                        # Kiểm tra chất lượng vector store
                        # Sử dụng các câu hỏi phù hợp hơn với nội dung SGK Tiếng Anh lớp 6
                        test_questions = [
                            "Ngữ pháp tiếng Anh lớp 6",
                            "Từ vựng tiếng Anh cơ bản",
                            "Kỹ năng giao tiếp tiếng Anh"
                        ]

                        # Xác định namespace dựa trên loại tài liệu
                        from app.config import NAMESPACE_SGK, NAMESPACE_CTGD, NAMESPACE_OTHERS, NAMESPACE_DEFAULT
                        default_namespace = NAMESPACE_SGK  # SGK là phù hợp nhất cho tài liệu trong thư mục

                        st.write(f"Kiểm tra chất lượng vector store trong namespace '{default_namespace}':")
                        for question in test_questions:
                            # Thêm namespace cụ thể vào tìm kiếm
                            docs = retriever_service.search(question, top_k=1, namespace=default_namespace)
                            if docs and len(docs) > 0:
                                preview = docs[0].page_content[:150].replace('\n', ' ')
                                st.write(f"- Câu hỏi: '{question}' → Tìm thấy: '{preview}...'")
                            else:
                                st.warning(f"- Câu hỏi: '{question}' → Không tìm thấy thông tin!")
                    else:
                        st.warning("Không có file nào được xử lý thành công")
                except Exception as e:
                    st.error(f"Lỗi khi xử lý thư mục: {str(e)}")
        else:
            st.error("Vui lòng nhập đường dẫn đến thư mục PDF hợp lệ")

    # Hiển thị các index đã lưu
    st.subheader("Quản lý Index")

    # Tạo tab để tổ chức giao diện
    index_tab1, index_tab2, index_tab3, index_tab4 = st.tabs(
        ["Danh sách Index", "Thao tác Index", "Trạng thái Vector Store", "Quản lý Namespace"])

    # Tab 1: Danh sách Index
    with index_tab1:
        saved_indexes = data_processor.get_saved_indexes()

        if saved_indexes:
            # Tạo DataFrame để hiển thị thông tin index
            import pandas as pd
            import numpy  # Thêm import numpy để xử lý kiểu dữ liệu numpy
            index_data = []

            for index_id in saved_indexes:
                try:
                    # Xác định kích thước và thời gian tạo
                    if os.path.exists(os.path.join(INDEX_DIRECTORY, index_id)):
                        # Thư mục FAISS
                        dir_path = os.path.join(INDEX_DIRECTORY, index_id)

                        # Tính kích thước thư mục
                        total_size = 0
                        for dirpath, dirnames, filenames in os.walk(dir_path):
                            for f in filenames:
                                fp = os.path.join(dirpath, f)
                                total_size += os.path.getsize(fp)

                        size_mb = round(total_size / (1024 * 1024), 2)
                        created_time = time.ctime(os.path.getctime(dir_path))
                        index_type = "FAISS"

                    elif os.path.exists(os.path.join(INDEX_DIRECTORY, f"{index_id}.pkl")):
                        # File pickle
                        pkl_path = os.path.join(INDEX_DIRECTORY, f"{index_id}.pkl")
                        size_mb = round(os.path.getsize(pkl_path) / (1024 * 1024), 2)
                        created_time = time.ctime(os.path.getctime(pkl_path))
                        index_type = "Pickle"
                    else:
                        size_mb = 0
                        created_time = "Unknown"
                        index_type = "Unknown"

                    # Trạng thái index
                    is_current = (st.session_state.current_files_id == index_id)
                    status = "✅ Đang dùng" if is_current else "⏸️ Không dùng"

                    # Thêm vào dữ liệu
                    index_data.append({
                        "ID": index_id[:8] + "...",
                        "Loại": index_type,
                        "Kích thước (MB)": size_mb,
                        "Thời gian tạo": created_time,
                        "Trạng thái": status,
                        "ID Đầy đủ": index_id
                    })

                except Exception as e:
                    # Xử lý lỗi cho từng index
                    index_data.append({
                        "ID": index_id[:8] + "...",
                        "Loại": "Error",
                        "Kích thước (MB)": 0,
                        "Thời gian tạo": "Unknown",
                        "Trạng thái": "❌ Lỗi",
                        "ID Đầy đủ": index_id
                    })

            # Làm sạch dữ liệu: ép tất cả giá trị numpy về dạng Python native
            sanitized_data = []
            for item in index_data:
                clean_item = {}
                for key, value in item.items():
                    try:
                        # Nếu là numpy scalar (int64, bool_, float64...)
                        if isinstance(value, np.generic):
                            clean_item[key] = value.item()
                        # Nếu là numpy array
                        elif isinstance(value, np.ndarray):
                            clean_item[key] = str(value.tolist())
                        # Nếu là list chứa numpy types
                        elif isinstance(value, list):
                            clean_item[key] = [v.item() if hasattr(v, "item") else str(v) for v in value]
                        else:
                            clean_item[key] = value
                    except Exception:
                        clean_item[key] = str(value)
                sanitized_data.append(clean_item)

            # Kiểm tra nếu không có dữ liệu
            if not sanitized_data:
                st.info("Không có index nào để hiển thị.")
            else:
                try:
                    def sanitize_value(v):
                        if isinstance(v, np.generic):  # numpy.float32, numpy.int64,...
                            return v.item()  # ép kiểu về float/int chuẩn Python
                        elif isinstance(v, np.ndarray):
                            try:
                                return v.tolist()  # chuyển mảng numpy thành list
                            except Exception:
                                return str(v)  # fallback
                        elif isinstance(v, (list, tuple)):
                            return [sanitize_value(i) for i in v]  # xử lý đệ quy danh sách
                        elif isinstance(v, dict):
                            return {k: sanitize_value(val) for k, val in v.items()}  # xử lý đệ quy dict
                        else:
                            return v  # giá trị nguyên thủy (str, int, float...)

                    # Áp dụng hàm sanitize cho toàn bộ danh sách index
                    sanitized_data = [{k: sanitize_value(v) for k, v in item.items()} for item in index_data]

                    # Tạo DataFrame từ dữ liệu đã "làm sạch"
                    index_df = pd.DataFrame(sanitized_data)

                    # Hiển thị DataFrame
                    st.dataframe(
                        index_df.drop(columns=["ID Đầy đủ"]),
                        use_container_width=True,
                        hide_index=True
                    )
                except Exception as e:
                    st.error(f"Lỗi khi hiển thị danh sách index: {str(e)}")
                    # Hiển thị dạng đơn giản thay thế
                    st.write("Danh sách index:")
                    for idx, item in enumerate(sanitized_data):
                        st.write(
                            f"{idx + 1}. ID: {item.get('ID', 'N/A')} - Loại: {item.get('Loại', 'N/A')} - Trạng thái: {item.get('Trạng thái', 'N/A')}")

            st.write("---")
            st.write("### Thao tác với index")

            # Cần thêm kiểm tra index_df trước khi sử dụng
            if 'index_df' in locals() and isinstance(index_df, pd.DataFrame) and not index_df.empty:
                # Dropdown chọn index
                selected_index_id = st.selectbox(
                    "Chọn index:",
                    options=index_df["ID"].tolist(),
                    format_func=lambda x: x
                )

                # Lấy ID đầy đủ từ DataFrame
                selected_full_id = index_df[index_df["ID"] == selected_index_id]["ID Đầy đủ"].iloc[0]

                # Các nút thao tác
                action_col1, action_col2, action_col3 = st.columns(3)

                with action_col1:
                    if st.button("Tải index này", key="load_index"):
                        with st.spinner(f"Đang tải index {selected_index_id}..."):
                            vector_store = data_processor.load_vector_store(selected_full_id)

                            if vector_store:
                                st.session_state.vector_store = vector_store
                                st.session_state.files_processed = True
                                st.session_state.current_files_id = selected_full_id

                                # Cập nhật chain
                                llm = ChatOpenAI(
                                    openai_api_key=OPENAI_API_KEY,
                                    temperature=OPENAI_TEMPERATURE,
                                    model_name=OPENAI_MODEL
                                )
                                st.session_state.chain = ConversationalRetrievalChain.from_llm(
                                    llm=llm,
                                    retriever=vector_store.as_retriever(),
                                    memory=st.session_state.memory
                                )
                                init_qa_chain()

                                st.success(f"Đã tải thành công index {selected_index_id}")
                                safe_rerun()
                            else:
                                st.error("Không thể tải index.")

                with action_col2:
                    if st.button("Xem chi tiết", key="view_index"):
                        with st.spinner("Đang tải thông tin chi tiết..."):
                            # Hiển thị thông tin chi tiết
                            st.subheader(f"Thông tin chi tiết về index: {selected_index_id}")

                            # Tải metadata để hiển thị
                            metadata_path = os.path.join(INDEX_DIRECTORY, selected_full_id, "metadata.json")
                            if os.path.exists(metadata_path):
                                with open(metadata_path, "r", encoding="utf-8") as f:
                                    import json
                                    metadata = json.load(f)

                                st.json(metadata)
                            else:
                                st.warning("Không tìm thấy metadata cho index này")

                with action_col3:
                    if st.button("Xóa index này", key="delete_index"):
                        # Hiển thị hộp thoại xác nhận
                        st.warning(f"Bạn có chắc chắn muốn xóa index {selected_index_id}?")

                        confirm_col1, confirm_col2 = st.columns(2)

                        with confirm_col1:
                            if st.button("Xác nhận xóa", key="confirm_delete"):
                                with st.spinner(f"Đang xóa index {selected_index_id}..."):
                                    try:
                                        # Xóa thư mục index nếu tồn tại
                                        dir_path = os.path.join(INDEX_DIRECTORY, selected_full_id)
                                        if os.path.exists(dir_path) and os.path.isdir(dir_path):
                                            import shutil
                                            shutil.rmtree(dir_path)

                                        # Xóa file pkl nếu tồn tại
                                        pkl_path = os.path.join(INDEX_DIRECTORY, f"{selected_full_id}.pkl")
                                        if os.path.exists(pkl_path):
                                            os.remove(pkl_path)

                                        st.success(f"Đã xóa index {selected_index_id}")

                                        # Nếu index đang được sử dụng, reset session state
                                        if st.session_state.current_files_id == selected_full_id:
                                            st.session_state.files_processed = False
                                            st.session_state.current_files_id = None
                                            st.session_state.vector_store = None
                                            st.session_state.chain = None

                                        # Refresh trang
                                        safe_rerun()

                                    except Exception as e:
                                        st.error(f"Lỗi khi xóa index: {str(e)}")

                        with confirm_col2:
                            if st.button("Hủy", key="cancel_delete"):
                                safe_rerun()
            else:
                st.warning("Không thể hiển thị danh sách index do lỗi xử lý dữ liệu")

        else:
            st.info("Chưa có index nào được lưu. Hãy tải lên và xử lý tài liệu để tạo index.")

    # Tab 2: Thao tác Index
    with index_tab2:
        st.write("### Hành động hệ thống")

        # Xóa tất cả index
        st.subheader("Xóa tất cả Index")
        delete_confirmation = st.checkbox("Xác nhận xóa tất cả index",
                                          key="delete_all_indexes_confirmation")

        if delete_confirmation and st.button("Xóa tất cả index", key="delete_all_button"):
            with st.spinner("Đang xóa các index..."):
                try:
                    count = 0
                    for index_id in saved_indexes:
                        # Xóa file .pkl nếu tồn tại
                        file_path = os.path.join(INDEX_DIRECTORY, f"{index_id}.pkl")
                        if os.path.exists(file_path):
                            os.remove(file_path)
                            count += 1

                        # Xóa thư mục index nếu tồn tại
                        directory_path = os.path.join(INDEX_DIRECTORY, index_id)
                        if os.path.exists(directory_path) and os.path.isdir(directory_path):
                            import shutil
                            shutil.rmtree(directory_path)
                            count += 1

                    st.success(f"Đã xóa {count} index thành công!")

                    # Cập nhật session state
                    st.session_state.files_processed = False
                    st.session_state.current_files_id = None
                    st.session_state.chain = None
                    st.session_state.vector_store = None

                    # Refresh trang
                    safe_rerun()
                except Exception as e:
                    st.error(f"Lỗi khi xóa index: {str(e)}")

        # Ở phần cuối của Tab 2: Thao tác Index, trước phần "Reset Toàn Bộ Hệ Thống"
        st.write("---")
        st.write("### Thông tin Vector Store")

        # Hiển thị Vector Store hiện tại
        st.info("Vector Store hiện tại: **PINECONE**")
        st.info("Dự án đã được cấu hình để chỉ sử dụng Pinecone làm vector store.")

        # Tùy chọn chuyển đổi Vector Store
        new_vector_store = st.radio(
            "Chọn Vector Store mới:",
            options=["pinecone", "faiss", "chroma"],
            index=["pinecone", "faiss", "chroma"].index(VECTOR_STORE_TYPE.lower()) if VECTOR_STORE_TYPE.lower() in [
                "pinecone", "faiss", "chroma"] else 0,
            horizontal=True
        )

        # Chỉ hiển thị nút chuyển đổi nếu đã chọn một Vector Store khác
        if new_vector_store.lower() != VECTOR_STORE_TYPE.lower():
            if st.button(f"Chuyển sang {new_vector_store.upper()}"):
                try:
                    # Cập nhật file .env
                    with open(".env", "r") as f:
                        env_lines = f.readlines()

                    # Tìm và cập nhật VECTOR_STORE_TYPE
                    updated_lines = []
                    vs_updated = False

                    for line in env_lines:
                        if line.startswith("VECTOR_STORE_TYPE="):
                            updated_lines.append(f"VECTOR_STORE_TYPE={new_vector_store.lower()}\n")
                            vs_updated = True
                        else:
                            updated_lines.append(line)

                    # Nếu không tìm thấy, thêm vào cuối file
                    if not vs_updated:
                        updated_lines.append(f"VECTOR_STORE_TYPE={new_vector_store.lower()}\n")

                    # Ghi lại file .env
                    with open(".env", "w") as f:
                        f.writelines(updated_lines)

                    st.success(f"Đã chuyển sang {new_vector_store.upper()} Vector Store. Đang tải lại trang...")
                    time.sleep(2)
                    safe_rerun()
                except Exception as e:
                    st.error(f"Lỗi khi chuyển Vector Store: {str(e)}")

    # Tab 3: Trạng thái Vector Store
    with index_tab3:
        st.write("### Trạng thái Vector Store")

        # Thêm chức năng debug Pinecone (không hiển thị cho người dùng)
        if st.checkbox("Hiển thị thông tin debug", value=False, key="debug_option"):
            try:
                from pinecone import Pinecone
                # Xóa dòng import numpy as np ở đây vì đã được import ở đầu file

                pc = Pinecone(api_key=PINECONE_API_KEY)
                index = pc.Index(BIBI_PINECONE_INDEX)
                stats = index.describe_index_stats()

                st.write("Thông tin Pinecone Index:")
                st.json(stats)

                # Kiểm tra namespaces
                namespaces = stats.get('namespaces', {})
                for ns_name, ns_info in namespaces.items():
                    ns_name_display = ns_name if ns_name else "(namespace trống)"
                    st.write(f"- Namespace: {ns_name_display}, Vectors: {ns_info.get('vector_count', 0)}")

                    # Thử truy vấn ngẫu nhiên để kiểm tra
                    if st.button(f"Kiểm tra namespace {ns_name_display}", key=f"test_ns_{ns_name}"):
                        dummy_vector = np.random.rand(1536).tolist()  # OpenAI sử dụng vector 1536 chiều
                        result = index.query(
                            vector=dummy_vector,
                            top_k=1,
                            namespace=ns_name,
                            include_metadata=True
                        )
                        st.write("Kết quả truy vấn mẫu:")
                        st.json(result)
            except Exception as e:
                st.error(f"Lỗi khi debug Pinecone: {str(e)}")

        st.write("---")
        st.write("### Sửa lỗi 'Không tìm thấy index'")

        # Thêm công cụ kiểm tra nội dung vector
        st.write("#### Kiểm tra nội dung đã nhúng")
        test_query = st.text_input(
            "Nhập câu truy vấn để kiểm tra:",
            value="ngữ pháp tiếng Anh lớp 6",
            help="Nhập câu hỏi để kiểm tra xem có kết quả trả về không"
        )
        test_namespace = st.text_input(
            "Namespace cần kiểm tra:",
            value="bibi_grammar",
            help="Namespace để tìm kiếm, mặc định là 'bibi_grammar'"
        )
        test_k = st.slider("Số kết quả tối đa:", min_value=1, max_value=10, value=3)

        if st.button("Kiểm tra nội dung"):
            with st.spinner("Đang tìm kiếm..."):
                try:
                    # Sử dụng retriever_service để tìm kiếm
                    docs = retriever_service.search(test_query, top_k=test_k, namespace=test_namespace)
                    # Cải thiện giá trị mặc định cho namespace từ cấu hình
                    test_namespace = st.text_input(
                        "Namespace cần kiểm tra:",
                        value=NAMESPACE_SGK,  # Thay đổi giá trị mặc định từ bibi_grammar sang NAMESPACE_SGK
                        help="Namespace để tìm kiếm, mặc định là 'bibi_sgk'"
                    )

                    if docs and len(docs) > 0:
                        st.success(f"✅ Tìm thấy {len(docs)} kết quả trong namespace '{test_namespace}'")

                        # Hiển thị kết quả tìm được
                        for i, doc in enumerate(docs):
                            with st.expander(f"Kết quả #{i + 1}"):
                                st.markdown("**Nội dung:**")
                                st.markdown(doc.page_content)
                                st.markdown("**Metadata:**")
                                st.json(doc.metadata)
                    else:
                        st.error(f"❌ Không tìm thấy kết quả nào trong namespace '{test_namespace}'")

                        # Gợi ý kiểm tra
                        st.info("Kiểm tra các vấn đề có thể gặp phải:")
                        st.markdown("""
                        1. Đảm bảo đã nhúng dữ liệu vào đúng namespace
                        2. Kiểm tra xem Pinecone index có dữ liệu không (số vectors > 0)
                        3. Thử truy vấn đơn giản hơn hoặc từ khóa chung
                        4. Kiểm tra xem file PDF đã được xử lý thành công chưa
                        """)
                except Exception as e:
                    st.error(f"Lỗi khi kiểm tra: {str(e)}")

        st.write("---")
        st.write("### Sửa lỗi 'Không tìm thấy index'")

        if st.button("Tạo index cục bộ kết nối với Pinecone"):
            with st.spinner("Đang tạo index..."):
                import json
                from datetime import datetime

                # Tạo index mới
                index_id = f"pinecone_fix_{int(time.time())}"
                index_dir = os.path.join(INDEX_DIRECTORY, index_id)
                os.makedirs(index_dir, exist_ok=True)

                # Tạo file index.faiss giả
                with open(os.path.join(index_dir, "index.faiss"), "wb") as f:
                    f.write(b"PINECONE_PROXY")

                # Lưu metadata
                metadata = {
                    "index_id": index_id,
                    "created_at": datetime.now().isoformat(),
                    "source_files": [{"name": "Fixed Index", "size": 0}],
                    "pinecone_id": True,
                    "vector_store_type": "pinecone"
                }

                with open(os.path.join(index_dir, "metadata.json"), "w", encoding="utf-8") as f:
                    json.dump(metadata, f, ensure_ascii=False, indent=2)

                st.success(f"Đã tạo index giả kết nối với Pinecone: {index_id}")
                time.sleep(1)
                safe_rerun()


        # Hiển thị loại Vector Store hiện tại
        st.info(f"Loại Vector Store hiện tại: **PINECONE**")

        # Kiểm tra kết nối Pinecone
        if not PINECONE_API_KEY or not BIBI_PINECONE_INDEX:
            st.error("❌ Thiếu cấu hình Pinecone. Kiểm tra biến môi trường PINECONE_API_KEY và BIBI_PINECONE_INDEX.")
        else:
            try:
                # Khởi tạo pinecone client để kiểm tra kết nối
                from pinecone import Pinecone
                pc = Pinecone(api_key=PINECONE_API_KEY)

                # Kiểm tra index tồn tại
                indexes = pc.list_indexes()
                index_names = [idx.name for idx in indexes]

                if BIBI_PINECONE_INDEX in index_names:
                    st.success(f"✅ Đã kết nối thành công đến Pinecone index: {BIBI_PINECONE_INDEX}")

                    # Hiển thị thông tin index
                    try:
                        index = pc.Index(BIBI_PINECONE_INDEX)
                        stats = index.describe_index_stats()
                        st.write(f"📊 **Thống kê Pinecone:**")
                        st.write(f"- Tổng số vectors: {stats.get('total_vector_count', 'Không có thông tin')}")
                        st.write(f"- Kích thước vector: {stats.get('dimension', 'Không có thông tin')} chiều")

                        # Hiển thị thông tin chi tiết về namespaces
                        if stats.get('namespaces'):
                            ns_data = []
                            for ns_name, ns_info in stats.get('namespaces', {}).items():
                                ns_data.append({
                                    "Namespace": ns_name or "default",
                                    "Số vectors": ns_info.get('vector_count', 0)
                                })

                            import pandas as pd
                            ns_df = pd.DataFrame(ns_data)
                            st.dataframe(ns_df, use_container_width=True, hide_index=True)

                        # THÊM PHẦN XÓA DỮ LIỆU PINECONE TẠI ĐÂY
                        st.write("---")
                        st.write("### Quản lý dữ liệu Pinecone")

                        xoa_col1, xoa_col2 = st.columns(2)

                        with xoa_col1:
                            if st.button("Xóa toàn bộ dữ liệu Pinecone", key="xoa_pinecone"):
                                # Hiển thị xác nhận
                                xoa_confirm = st.checkbox("✓ Tôi xác nhận muốn xóa toàn bộ dữ liệu", key="confirm_xoa")
                                if xoa_confirm:
                                    with st.spinner("Đang xóa dữ liệu..."):
                                        result = delete_pinecone_data()
                                        if result["success"]:
                                            st.success(
                                                f"✅ Đã xóa thành công {result['vectors_before']} vectors từ Pinecone!")
                                            if result["vectors_after"] > 0:
                                                st.warning(
                                                    f"⚠️ Vẫn còn {result['vectors_after']} vectors. Có thể cần xóa lại.")
                                            else:
                                                st.success("✅ Xóa hoàn toàn thành công, không còn vectors nào!")
                                            time.sleep(1)
                                            safe_rerun()
                                        else:
                                            st.error(f"❌ Lỗi: {result['error']}")

                        with xoa_col2:
                            st.info(
                                "**Lưu ý**: Xóa dữ liệu sẽ xóa hết vectors, nhưng giữ lại cấu trúc index. Sau khi xóa, bạn cần tải lại tài liệu để tạo dữ liệu mới.")
                    except Exception as e:
                        st.warning(f"⚠️ Không thể lấy thông tin chi tiết từ Pinecone: {str(e)}")
                else:
                    st.error(f"❌ Không tìm thấy Pinecone index: {BIBI_PINECONE_INDEX}")
                    # Hiển thị các index có sẵn
                    if indexes:
                        st.write("📋 Các index có sẵn trong tài khoản Pinecone:")
                        for idx in indexes:
                            st.write(f"- {idx.name}")
                    else:
                        st.write("🔍 Không có index nào trong tài khoản Pinecone.")

                    # Hiển thị hướng dẫn tạo index
                    with st.expander("Hướng dẫn tạo Pinecone index"):
                        st.write("""
                        1. Đăng nhập vào tài khoản Pinecone tại [https://app.pinecone.io](https://app.pinecone.io)
                        2. Nhấp vào nút "Create Index"
                        3. Điền các thông tin sau:
                           - **Name**: {0} (hoặc tên bạn muốn)
                           - **Dimensions**: 1536 (cần phải khớp với kích thước vector của OpenAI)
                           - **Metric**: cosine
                           - **Pod Type**: Starter (miễn phí)
                        4. Nhấp "Create Index" và đợi một vài phút để index được tạo
                        5. Cập nhật giá trị BIBI_PINECONE_INDEX trong file .env
                        """.format(BIBI_PINECONE_INDEX))

            except Exception as e:
                st.error(f"❌ Lỗi kết nối Pinecone: {str(e)}")

    # Thêm nội dung cho tab4
    # Thay thế phần code trong with index_tab4: (bắt đầu khoảng dòng 1100-1200)
    with index_tab4:
        st.write("### Quản lý Namespace")

        # Thêm quản lý trạng thái tab
        if "active_namespace" not in st.session_state:
            st.session_state.active_namespace = None
        if "namespace_delete_confirm" not in st.session_state:
            st.session_state.namespace_delete_confirm = False
        if "delete_namespace_id" not in st.session_state:
            st.session_state.delete_namespace_id = None

        # Lấy danh sách namespace từ config
        from app.config import NAMESPACE_DEFAULT, NAMESPACE_SGK, NAMESPACE_CTGD, NAMESPACE_OTHERS
        namespaces = [NAMESPACE_DEFAULT, NAMESPACE_SGK, NAMESPACE_CTGD, NAMESPACE_OTHERS]

        # Hiển thị thông tin về các namespace
        try:
            from pinecone import Pinecone
            pc = Pinecone(api_key=PINECONE_API_KEY)
            index = pc.Index(BIBI_PINECONE_INDEX)
            stats = index.describe_index_stats()

            available_namespaces = stats.get('namespaces', {})

            # Hiển thị bảng dữ liệu namespace
            import pandas as pd

            namespace_data = []
            for ns_name in namespaces:
                ns_count = available_namespaces.get(ns_name, {}).get('vector_count', 0)
                namespace_data.append({
                    "Namespace": ns_name,
                    "Số Vectors": ns_count,
                    "Trạng thái": "✅ Có dữ liệu" if ns_count > 0 else "❌ Trống"
                })

            # Thêm các namespace khác nếu có
            for ns_name in available_namespaces:
                if ns_name not in namespaces and ns_name != "":
                    ns_count = available_namespaces[ns_name].get('vector_count', 0)
                    namespace_data.append({
                        "Namespace": ns_name + " (khác)",
                        "Số Vectors": ns_count,
                        "Trạng thái": "✅ Có dữ liệu" if ns_count > 0 else "❌ Trống"
                    })

            # Hiển thị DataFrame
            if namespace_data:
                st.dataframe(pd.DataFrame(namespace_data), use_container_width=True)
            else:
                st.info("Không tìm thấy dữ liệu namespace trong Pinecone")

            # Phần quản lý namespace - sửa lại giao diện
            st.write("---")
            st.write("### Thao tác Namespace")

            # Chọn namespace để quản lý
            selected_ns = st.selectbox(
                "Chọn namespace để quản lý:",
                options=[ns["Namespace"] for ns in namespace_data],
                format_func=lambda x: {
                    NAMESPACE_DEFAULT: "🔠 Mặc định - Ngữ pháp chung",
                    NAMESPACE_SGK: "🔹 Sách Giáo Khoa Bộ GD",
                    NAMESPACE_CTGD: "📘 Chương Trình Giáo Dục 2018",
                    NAMESPACE_OTHERS: "📝 Tài liệu đặc trưng Trường"
                }.get(x, x),
                key="namespace_selector"
            )

            # Lưu namespace đã chọn vào session state
            st.session_state.active_namespace = selected_ns

            # Hiển thị thông tin
            selected_data = next((ns for ns in namespace_data if ns["Namespace"] == selected_ns), None)
            if selected_data:
                vectors_count = selected_data["Số Vectors"]
                if vectors_count > 0:
                    st.info(f"Namespace **{selected_ns}** có **{vectors_count}** vectors")

                    # Thêm nút xóa namespace và cơ chế xác nhận
                    delete_col1, delete_col2 = st.columns(2)

                    with delete_col1:
                        if st.button(f"Xóa namespace {selected_ns}", key="delete_ns_button"):
                            st.session_state.namespace_delete_confirm = True
                            st.session_state.delete_namespace_id = selected_ns

                    with delete_col2:
                        st.info(
                            "⚠️ Xóa namespace sẽ xóa hết vectors trong namespace này. Hành động này không thể hoàn tác.")

                    # Hiển thị xác nhận xóa nếu đã nhấn nút
                    if st.session_state.namespace_delete_confirm and st.session_state.delete_namespace_id == selected_ns:
                        st.warning(f"⚠️ Bạn có chắc muốn xóa {vectors_count} vectors từ namespace {selected_ns}?")

                        confirm_col1, confirm_col2 = st.columns(2)

                        with confirm_col1:
                            # Thay thế đoạn code sau khi nhấn nút "✅ Xác nhận xóa"
                            if st.button("✅ Xác nhận xóa", key=f"confirm_delete_{selected_ns}"):
                                # Tạo container để hiển thị tiến trình
                                progress_container = st.empty()
                                status_container = st.empty()
                                result_container = st.empty()

                                progress_container.progress(0)
                                status_container.info("Đang chuẩn bị xóa namespace...")

                                # Sử dụng phương pháp xóa hiệu quả
                                try:
                                    # Cập nhật trạng thái
                                    status_container.info(f"Đang xóa namespace '{selected_ns}'...")
                                    progress_container.progress(25)

                                    # Gọi SDK trực tiếp để xóa - PHƯƠNG PHÁP HIỆU QUẢ
                                    index.delete(delete_all=True, namespace=selected_ns)

                                    # Đợi và cập nhật trạng thái
                                    status_container.info("Đang kiểm tra kết quả xóa...")
                                    progress_container.progress(50)
                                    time.sleep(3)  # Đợi 3 giây

                                    # Kiểm tra kết quả
                                    check_stats = index.describe_index_stats()
                                    check_namespaces = check_stats.get('namespaces', {})

                                    progress_container.progress(75)

                                    vectors_deleted = True
                                    if selected_ns in check_namespaces and check_namespaces.get(selected_ns, {}).get(
                                            'vector_count', 0) > 0:
                                        vectors_after = check_namespaces.get(selected_ns, {}).get('vector_count', 0)
                                        if vectors_after < vectors_count:
                                            result_container.warning(
                                                f"⚠️ Chỉ xóa được một phần: {vectors_count - vectors_after}/{vectors_count} vectors")
                                        else:
                                            result_container.error(
                                                f"❌ Không thể xóa vectors trong namespace '{selected_ns}'")
                                        vectors_deleted = False
                                    else:
                                        result_container.success(
                                            f"✅ Đã xóa thành công {vectors_count} vectors từ namespace '{selected_ns}'!")

                                    # Xóa index cục bộ tương ứng nếu xóa vectors thành công
                                    if vectors_deleted:
                                        status_container.info("Đang xóa index cục bộ tương ứng...")
                                        try:
                                            import glob
                                            import json
                                            import shutil

                                            # Tìm tất cả index cục bộ
                                            index_deleted = False
                                            index_files = glob.glob(os.path.join(INDEX_DIRECTORY, "*"))

                                            for index_path in index_files:
                                                if os.path.isdir(index_path):
                                                    metadata_path = os.path.join(index_path, "metadata.json")
                                                    if os.path.exists(metadata_path):
                                                        # Đọc metadata để kiểm tra namespace
                                                        with open(metadata_path, "r", encoding="utf-8") as f:
                                                            metadata = json.load(f)

                                                        # Nếu index này tham chiếu đến namespace đã xóa, xóa nó
                                                        if metadata.get("namespace") == selected_ns:
                                                            index_name = os.path.basename(index_path)
                                                            shutil.rmtree(index_path)
                                                            result_container.success(
                                                                f"✅ Đã xóa index cục bộ: {index_name}")
                                                            index_deleted = True

                                                            # Cập nhật session state nếu cần
                                                            if hasattr(st.session_state,
                                                                       'current_files_id') and st.session_state.current_files_id == index_name:
                                                                st.session_state.current_files_id = None
                                                                st.session_state.files_processed = False

                                            if not index_deleted:
                                                result_container.info(
                                                    "Không tìm thấy index cục bộ nào liên kết với namespace này")
                                        except Exception as e:
                                            result_container.warning(f"Không thể xóa index cục bộ: {str(e)}")
                                            import traceback
                                            print(traceback.format_exc())

                                    progress_container.progress(100)

                                    # Reset trạng thái xác nhận
                                    st.session_state.namespace_delete_confirm = False

                                    # Tự động refresh sau 2 giây
                                    time.sleep(2)
                                    safe_rerun()

                                except Exception as e:
                                    status_container.error(f"❌ Lỗi khi xóa namespace: {str(e)}")
                                    import traceback
                                    st.code(traceback.format_exc())

                        with confirm_col2:
                            if st.button("❌ Hủy", key=f"cancel_delete_{selected_ns}"):
                                st.session_state.namespace_delete_confirm = False
                                st.session_state.delete_namespace_id = None
                                safe_rerun()
                else:
                    st.warning(f"Namespace **{selected_ns}** đang trống, không có vectors để xóa")

            # Tìm kiếm trong namespace
            st.write("---")
            st.write("### Tìm kiếm trong namespace")

            search_namespace = st.selectbox(
                "Chọn namespace để tìm kiếm:",
                options=[ns["Namespace"] for ns in namespace_data] + ["Tất cả namespace"],
                index=len(namespace_data)  # Mặc định chọn "Tất cả namespace"
            )

            search_query = st.text_input("Nhập câu truy vấn:", value="ngữ pháp tiếng Anh")
            search_limit = st.slider("Số kết quả tối đa:", min_value=1, max_value=10, value=3,
                                     key="search_limit_namespace")

            if st.button("Tìm kiếm", key="search_ns_button"):
                with st.spinner("Đang tìm kiếm..."):
                    if search_namespace == "Tất cả namespace":
                        docs = retriever_service.search_multiple_namespaces(search_query, top_k=search_limit)
                    else:
                        docs = retriever_service.search(search_query, top_k=search_limit, namespace=search_namespace)

                    if docs and len(docs) > 0:
                        st.success(f"✅ Tìm thấy {len(docs)} kết quả")

                        for i, doc in enumerate(docs):
                            with st.expander(
                                    f"Kết quả #{i + 1} từ namespace {doc.metadata.get('search_namespace', search_namespace)}"):
                                st.markdown("**Nội dung:**")
                                st.markdown(doc.page_content)
                                st.markdown("**Metadata:**")
                                st.json(doc.metadata)
                    else:
                        st.warning("⚠️ Không tìm thấy kết quả nào")

        except Exception as e:
            st.error(f"Lỗi khi truy vấn thông tin namespace: {e}")
            import traceback
            st.code(traceback.format_exc())

    # Reset Toàn Bộ Hệ Thống (đơn giản hóa)
    st.subheader("Reset Toàn Bộ Hệ Thống")
    st.warning("⚠️ Cảnh báo: Hành động này sẽ xóa tất cả dữ liệu, index và làm mới hoàn toàn hệ thống.")
    reset_confirmation = st.checkbox("Tôi hiểu rằng hành động này không thể hoàn tác", key="reset_confirmation")

    # Thêm tùy chọn xóa dữ liệu Pinecone
    include_pinecone = st.checkbox("Xóa cả dữ liệu trong Pinecone", value=True,
                                   help="Nếu bỏ chọn, dữ liệu trong Pinecone sẽ được giữ nguyên")

    if reset_confirmation and st.button("Reset Toàn Bộ Hệ Thống", key="reset_button"):
        with st.spinner("Đang reset toàn bộ hệ thống..."):
            try:
                # Ghi log trạng thái trước khi reset
                log_system_status()

                # Xóa tất cả index cục bộ
                index_deleted = index_manager.delete_all_indexes(delete_memory=True)

                # Xóa dữ liệu Pinecone nếu được yêu cầu
                pinecone_deleted = False
                if include_pinecone:
                    result = delete_pinecone_data()
                    pinecone_deleted = result["success"]



                # Hiển thị kết quả
                st.success("Đã reset thành công toàn bộ hệ thống!")
                if include_pinecone:
                    if pinecone_deleted:
                        st.success("✅ Dữ liệu trong Pinecone đã được xóa")
                    else:
                        st.warning("⚠️ Không thể xóa dữ liệu trong Pinecone")
                else:
                    st.info("ℹ️ Dữ liệu trong Pinecone được giữ nguyên")

                # Cập nhật session state
                st.session_state.files_processed = False
                st.session_state.current_files_id = None
                st.session_state.chain = None
                st.session_state.vector_store = None

                time.sleep(1)  # Cho phép người dùng đọc thông báo
                safe_rerun()  # Làm mới trang
            except Exception as e:
                st.error(f"Có lỗi xảy ra khi reset hệ thống: {str(e)}")
                import traceback
                st.error(traceback.format_exc())
    # Thêm vào phần cuối của tab Trạng thái Vector Store, sau nút xóa dữ liệu
    st.write("---")
    st.write("### Khôi phục Index từ Vector Store")
    st.info(
        "Nếu bạn thấy có vectors trong Pinecone nhưng không có index cục bộ, sử dụng chức năng này để tạo lại index.")

    if st.button("Tạo lại Index từ Pinecone"):
        with st.spinner("Đang tạo index cục bộ từ dữ liệu Pinecone..."):
            try:
                # Tạo ID cho index mới
                import uuid
                new_index_id = f"pinecone_restored_{int(time.time())}"

                # Sử dụng Pinecone hiện tại làm vector store
                from app.core.embeddings import embedding_service
                from langchain_pinecone import PineconeVectorStore

                # Tạo Pinecone vector store
                pc = Pinecone(api_key=PINECONE_API_KEY)
                index = pc.Index(BIBI_PINECONE_INDEX)
                vector_store = PineconeVectorStore(
                    index=index,
                    embedding=embedding_service.embedder,
                    text_key="text"
                )

                # Tạo metadata cho index
                index_metadata = {
                    "index_id": new_index_id,
                    "source_files": [
                        {"name": "Khôi phục từ Pinecone", "size": 0, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")}],
                    "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                    "version": "1.0",
                    "mode": "restore",
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                    "vector_store_type": "pinecone",
                    "restored": True
                }

                # Lưu metadata vào thư mục index
                os.makedirs(f"{INDEX_DIRECTORY}/{new_index_id}", exist_ok=True)
                with open(f"{INDEX_DIRECTORY}/{new_index_id}/metadata.json", "w", encoding="utf-8") as f:
                    import json
                    json.dump(index_metadata, f, ensure_ascii=False, indent=2)

                # Cập nhật session state
                st.session_state.vector_store = vector_store
                st.session_state.files_processed = True
                st.session_state.current_files_id = new_index_id

                # Cập nhật retriever service
                retriever_service.vector_store = vector_store

                st.success(f"✅ Đã tạo thành công index cục bộ '{new_index_id}' từ dữ liệu Pinecone!")
                time.sleep(1)
                safe_rerun()

            except Exception as e:
                st.error(f"❌ Lỗi khi tạo lại index: {str(e)}")
                import traceback
                st.code(traceback.format_exc())

    st.subheader("Cấu hình Pinecone")

    with st.expander("Xem và chỉnh sửa cấu hình Pinecone"):
        # Hiển thị thông tin hiện tại
        current_key = PINECONE_API_KEY if PINECONE_API_KEY else "Chưa cấu hình"
        current_index = BIBI_PINECONE_INDEX if BIBI_PINECONE_INDEX else "Chưa cấu hình"

        st.write("### Thông tin hiện tại")
        st.write(f"- Pinecone API Key: {'•' * 8 + current_key[-4:] if len(current_key) > 4 else current_key}")
        st.write(f"- Pinecone Index: {current_index}")

        st.write("---")
        st.write("### Cập nhật cấu hình")

        # Form cập nhật cấu hình
        with st.form("pinecone_config_form"):
            new_api_key = st.text_input("Pinecone API Key",
                                        value="" if current_key == "Chưa cấu hình" else current_key,
                                        type="password")

            new_index = st.text_input("Pinecone Index",
                                      value="" if current_index == "Chưa cấu hình" else current_index)

            submit_button = st.form_submit_button("Cập nhật cấu hình")

            if submit_button:
                try:
                    # Đọc file .env
                    with open(".env", "r") as f:
                        env_lines = f.readlines()

                    # Cập nhật các biến
                    updated_env = []
                    api_key_updated = False
                    index_updated = False

                    for line in env_lines:
                        if line.startswith("PINECONE_API_KEY="):
                            updated_env.append(f"PINECONE_API_KEY={new_api_key}\n")
                            api_key_updated = True
                        elif line.startswith("BIBI_PINECONE_INDEX="):
                            updated_env.append(f"BIBI_PINECONE_INDEX={new_index}\n")
                            index_updated = True
                        elif line.startswith("VECTOR_STORE_TYPE="):
                            updated_env.append("VECTOR_STORE_TYPE=pinecone\n")
                        elif line.startswith("PINECONE_ENVIRONMENT="):
                            # Bỏ qua biến này vì không còn sử dụng
                            pass
                        elif line.startswith("ENABLE_BACKUP="):
                            # Đặt ENABLE_BACKUP=false vì chúng ta không sử dụng FAISS backup
                            updated_env.append("ENABLE_BACKUP=false\n")
                        else:
                            updated_env.append(line)

                    # Thêm các biến chưa có
                    if not api_key_updated and new_api_key:
                        updated_env.append(f"PINECONE_API_KEY={new_api_key}\n")

                    if not index_updated and new_index:
                        updated_env.append(f"BIBI_PINECONE_INDEX={new_index}\n")

                    # Ghi lại file .env
                    with open(".env", "w") as f:
                        f.writelines(updated_env)

                    st.success("Đã cập nhật cấu hình Pinecone. Đang tải lại trang...")
                    time.sleep(2)
                    safe_rerun()
                except Exception as e:
                    st.error(f"Lỗi khi cập nhật cấu hình: {str(e)}")
                    st.error("Đảm bảo bạn có quyền ghi vào file .env")


# Thêm liên kết đến trang web crawler trong sidebar
st.sidebar.markdown("---")
st.sidebar.markdown("### Công cụ nâng cao")

# Tạo URL cho trang web crawler
web_crawler_url = "./pages/web_crawler"

if st.sidebar.button("🌐 Thu thập dữ liệu Website"):
    # Mở một liên kết đến trang web_crawler.py
    js = f"""
    <script>
        window.open("{web_crawler_url}", "_self");
    </script>
    """
    st.components.v1.html(js, height=0)
    st.sidebar.info(f"Đang chuyển đến trang Thu thập dữ liệu Website...")

st.write("## Kiểm tra đơn giản chất lượng RAG")

test_query = st.text_input(
    "Nhập câu hỏi kiểm tra:",
    value="ngữ pháp thì hiện tại đơn tiếng Anh",
    key="simple_test_query"
)

namespace = st.selectbox(
    "Chọn namespace:",
    options=["bibi_sgk", "bibi_ctgd", "bibi_grammar", "bibi_others", "Tất cả"],
    index=0
)

if st.button("Kiểm tra"):
    with st.spinner("Đang tìm kiếm..."):
        # Tìm kiếm kết quả
        if namespace == "Tất cả":
            # Sử dụng hàm search_multiple_namespaces đã có
            docs = retriever_service.search_multiple_namespaces(
                test_query,
                namespaces=["bibi_sgk", "bibi_ctgd", "bibi_grammar", "bibi_others"],
                top_k=5
            )
        else:
            # Sử dụng hàm search đã có
            docs = retriever_service.search(test_query, top_k=5, namespace=namespace)

        # Hiển thị số lượng kết quả tìm được
        if docs:
            st.success(f"Tìm thấy {len(docs)} kết quả")

            # Hiển thị từng kết quả
            for i, doc in enumerate(docs):
                content = doc.page_content
                preview = content[:300] + "..." if len(content) > 300 else content

                # Lấy metadata hữu ích
                metadata = doc.metadata.copy() if hasattr(doc, 'metadata') else {}
                source = metadata.get('source', 'Không rõ nguồn')

                # Đánh giá độ liên quan (đơn giản)
                relevant_terms = ["hiện tại", "present", "thì", "tense", "ngữ pháp", "grammar"]
                relevance = sum(1 for term in relevant_terms if term.lower() in content.lower())
                relevance_rating = "⭐⭐⭐" if relevance >= 3 else "⭐⭐" if relevance >= 1 else "⭐"

                # Hiển thị kết quả
                with st.expander(f"Kết quả #{i + 1} - Độ liên quan: {relevance_rating}"):
                    st.markdown("**Nội dung:**")
                    st.markdown(preview)
                    st.markdown("**Nguồn:**")
                    st.markdown(source)

                    # Hiển thị metadata (bỏ trường text nếu có)
                    if 'text' in metadata:
                        del metadata['text']
                    st.json(metadata)
        else:
            st.warning("Không tìm thấy kết quả nào")

        # Đề xuất cải thiện đơn giản
        st.write("### Đánh giá đơn giản")
        if docs:
            quality_score = min(len(docs) * 20, 100)  # 5 kết quả = 100%
            st.write(f"Độ bao phủ: {quality_score}% (dựa trên số lượng kết quả)")

            # Kiểm tra xem có kết quả từ nhiều namespace không
            if namespace == "Tất cả":
                namespaces_found = set()
                for doc in docs:
                    if hasattr(doc, 'metadata') and 'search_namespace' in doc.metadata:
                        namespaces_found.add(doc.metadata['search_namespace'])

                ns_coverage = min(len(namespaces_found) * 25, 100)  # 4 namespace = 100%
                st.write(f"Độ đa dạng namespace: {ns_coverage}% (tìm thấy trong {len(namespaces_found)} namespace)")
        else:
            st.write("❌ Chất lượng RAG: 0% (không tìm thấy kết quả)")
            st.write("Đề xuất: Thử các từ khóa khác hoặc kiểm tra lại dữ liệu trong namespace")

if __name__ == "__main__":
    main()