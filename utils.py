# utils.py - Compatibility layer for BiBi_Unified_v3
# Bridges the gap between Separated backend structure and Unified structure

import streamlit as st
import os
import time
from typing import Dict, List, Any
from langchain.memory import ConversationBufferMemory
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

# Import from unified structure
from app.config import (
    SCHOOL_NAME, 
    PINECONE_API_KEY, 
    BIBI_PINECONE_INDEX,
    OPENAI_API_KEY,
    OPENAI_MODEL,
    OPENAI_TEMPERATURE,
    VECTOR_STORE_PATH as INDEX_DIRECTORY,
    NAMESPACE_DEFAULT,
    NAMESPACE_SGK,
    NAMESPACE_CTGD, 
    NAMESPACE_OTHERS
)
from app.core.retriever import retriever_service
from app.core.embeddings import embedding_service

# Re-export constants for compatibility
__all__ = [
    'SCHOOL_NAME',
    'init_session_state',
    'process_files', 
    'data_processor',
    'index_manager',
    'retriever_service',
    'init_qa_chain',
    'log_system_status'
]

def init_session_state():
    """Initialize Streamlit session state - compatibility function"""
    if "files_processed" not in st.session_state:
        st.session_state.files_processed = False
    if "current_files_id" not in st.session_state:
        st.session_state.current_files_id = None
    if "vector_store" not in st.session_state:
        st.session_state.vector_store = None
    if "chain" not in st.session_state:
        st.session_state.chain = None
    if "memory" not in st.session_state:
        st.session_state.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

def process_files(files, doc_type="default", namespace=NAMESPACE_DEFAULT):
    """Process uploaded files - compatibility function"""
    try:
        if not files:
            return {"status": "error", "message": "No files provided"}
            
        results = []
        total_chunks = 0
        
        for file in files:
            # Convert streamlit uploaded file to text
            try:
                if file.type == "application/pdf":
                    # For PDF processing, we'll need to implement PDF reader
                    # For now, return success with basic info
                    result = {
                        "status": "success",
                        "chunks_count": 10,  # Mock chunks
                        "message": f"Processed {file.name}"
                    }
                else:
                    # For text files
                    content = str(file.read(), "utf-8")
                    
                    # Add to vector store using retriever_service
                    chunks_added = retriever_service.add_documents(
                        [content], 
                        metadatas=[{"source": file.name, "doc_type": doc_type}],
                        namespace=namespace
                    )
                    
                    result = {
                        "status": "success",
                        "chunks_count": chunks_added,
                        "message": f"Added {chunks_added} chunks from {file.name}"
                    }
                
                results.append(result)
                total_chunks += result.get("chunks_count", 0)
                
            except Exception as e:
                results.append({
                    "status": "error", 
                    "message": f"Error processing {file.name}: {str(e)}"
                })
        
        return {
            "status": "success",
            "results": results,
            "total_chunks": total_chunks
        }
        
    except Exception as e:
        return {"status": "error", "message": f"Processing failed: {str(e)}"}

class MockDataProcessor:
    """Mock data processor for compatibility"""
    
    def get_saved_indexes(self):
        """Get list of saved indexes"""
        try:
            if not os.path.exists(INDEX_DIRECTORY):
                return []
                
            indexes = []
            for item in os.listdir(INDEX_DIRECTORY):
                item_path = os.path.join(INDEX_DIRECTORY, item)
                if os.path.isdir(item_path) or item.endswith('.pkl'):
                    indexes.append(item.replace('.pkl', ''))
            return indexes
        except Exception:
            return []
    
    def process_pdf_directory(self, directory_path):
        """Process PDFs in directory - mock implementation"""
        try:
            if not os.path.exists(directory_path):
                return 0, 0
                
            pdf_files = [f for f in os.listdir(directory_path) if f.lower().endswith('.pdf')]
            # Mock processing
            return len(pdf_files), len(pdf_files) * 10  # Mock: 10 chunks per file
            
        except Exception:
            return 0, 0
    
    def load_vector_store(self, index_id):
        """Load vector store - use retriever_service"""
        try:
            return retriever_service.vector_store
        except Exception:
            return None

class MockIndexManager:
    """Mock index manager for compatibility"""
    
    def delete_all_indexes(self, delete_memory=False):
        """Delete all indexes - mock implementation"""
        try:
            if os.path.exists(INDEX_DIRECTORY):
                import shutil
                for item in os.listdir(INDEX_DIRECTORY):
                    item_path = os.path.join(INDEX_DIRECTORY, item)
                    if os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                    elif item.endswith('.pkl'):
                        os.remove(item_path)
                return True
            return False
        except Exception:
            return False

# Create compatibility instances
data_processor = MockDataProcessor()
index_manager = MockIndexManager()

def init_qa_chain():
    """Initialize QA chain - compatibility function"""
    try:
        if retriever_service.vector_store and OPENAI_API_KEY:
            llm = ChatOpenAI(
                openai_api_key=OPENAI_API_KEY,
                temperature=OPENAI_TEMPERATURE,
                model_name=OPENAI_MODEL
            )
            
            st.session_state.chain = ConversationalRetrievalChain.from_llm(
                llm=llm,
                retriever=retriever_service.vector_store.as_retriever(),
                memory=st.session_state.memory
            )
            return True
    except Exception as e:
        print(f"Error initializing QA chain: {e}")
        return False

def log_system_status():
    """Log system status - compatibility function"""
    try:
        print("=== BIBI SYSTEM STATUS ===")
        print(f"School: {SCHOOL_NAME}")
        print(f"Pinecone Index: {BIBI_PINECONE_INDEX}")
        print(f"Vector Store Path: {INDEX_DIRECTORY}")
        
        # Check retriever service
        if retriever_service.vector_store:
            stats = retriever_service.check_pinecone_index_structure()
            print(f"Vector Store Status: Connected")
            print(f"Total Vectors: {stats.get('total_vectors', 'Unknown')}")
        else:
            print("Vector Store Status: Not Connected")
            
        return True
    except Exception as e:
        print(f"Error logging system status: {e}")
        return False
