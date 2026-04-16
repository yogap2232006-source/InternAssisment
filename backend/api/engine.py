import os
import requests
import json
import tempfile
from bs4 import BeautifulSoup
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate

from .models import Book

# Initialize vectorstore
if os.path.exists('/data'):
    persist_directory = '/data/chroma_db'
else:
    persist_directory = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'chroma_db')

def get_vectorstore():
    # We use Gemini for embeddings to fit in cloud memory constraints
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vectorstore = Chroma(
        collection_name="books_collection",
        embedding_function=embeddings,
        persist_directory=persist_directory
    )
    return vectorstore

def scrape_and_process():
    """Scrapes dummy books, processes them, and stores them in DB and VectorStore."""
    url = "https://books.toscrape.com/"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Let's scrape the first 3 books to save time & API costs for the demo
    articles = soup.find_all('article', class_='product_pod')[:3]
    
    chat = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
    vectorstore = get_vectorstore()
    
    processed_books = []
    
    for article in articles:
        book_url = url + article.find('h3').find('a')['href']
        title = article.find('h3').find('a')['title']
        
        # Scrape book detail page
        book_resp = requests.get(book_url)
        book_soup = BeautifulSoup(book_resp.content, 'html.parser')
        
        try:
            description = book_soup.find('div', id='product_description').find_next_sibling('p').text
        except AttributeError:
            description = "No description available."
            
        # AI Insight 1 & 2: Summary and Genre Classification
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI book assistant. The user provides a book description. Output ONLY a valid JSON object with keys: 'summary' (a brief 1 sentence summary), and 'genre' (best predicted genre based on the description)."),
            ("user", "Title: {title}\nDescription: {description}")
        ])
        chain = prompt | chat
        response_msg = chain.invoke({"title": title, "description": description})
        
        try:
            content = response_msg.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            insights = json.loads(content)
            summary = insights.get('summary', '')
            genre = insights.get('genre', '')
        except (json.JSONDecodeError, AttributeError):
            summary = "Summary could not be generated."
            genre = "Unknown"
        
        # Create or update DB
        book, created = Book.objects.get_or_create(
            url=book_url,
            defaults={
                'title': title,
                'author': 'Unknown', 
                'description': description,
                'summary': summary,
                'genre': genre
            }
        )
        
        if created:
            # Chunking and Embeddings
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
            text_to_split = f"Title: {title}\nAuthor: Unknown\nGenre: {genre}\nDescription: {description}\nSummary: {summary}"
            chunks = text_splitter.split_text(text_to_split)
            
            # Store chunks in Chroma
            vectorstore.add_texts(
                texts=chunks,
                metadatas=[{"book_id": book.id, "title": book.title, "url": book.url} for _ in chunks]
            )
            
        processed_books.append(book)
        
    return [b.title for b in processed_books]


def process_uploaded_book(file_path, filename):
    chat = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
    vectorstore = get_vectorstore()
    
    # Extract text based on file type
    if filename.lower().endswith('.pdf'):
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        full_text = "\n".join([doc.page_content for doc in docs])
    else:
        loader = TextLoader(file_path, encoding='utf-8')
        docs = loader.load()
        full_text = "\n".join([doc.page_content for doc in docs])
        
    title = os.path.splitext(filename)[0]
    # For description, take first 500 chars 
    description = full_text[:500] + "..." if len(full_text) > 500 else full_text
    
    # AI Insight 1 & 2: Summary and Genre Classification
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an AI book assistant. The user provides a book description. Output ONLY a valid JSON object with keys: 'summary' (a brief 1 sentence summary), and 'genre' (best predicted genre based on the description)."),
        ("user", "Title: {title}\nDescription: {description}")
    ])
    chain = prompt | chat
    response_msg = chain.invoke({"title": title, "description": description})
    
    try:
        content = response_msg.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
        insights = json.loads(content)
        summary = insights.get('summary', '')
        genre = insights.get('genre', '')
    except (json.JSONDecodeError, AttributeError):
        summary = "Summary could not be generated."
        genre = "Unknown"
    
    # Create or update DB
    book, created = Book.objects.get_or_create(
        url=f"local://{filename}",
        defaults={
            'title': title,
            'author': 'Uploaded User', 
            'description': description,
            'summary': summary,
            'genre': genre
        }
    )
    
    if created:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        text_to_split = f"Title: {title}\nAuthor: Uploaded User\nGenre: {genre}\nDescription: {description}\nSummary: {summary}\n\nContent:\n{full_text}"
        chunks = text_splitter.split_text(text_to_split)
        
        vectorstore.add_texts(
            texts=chunks,
            metadatas=[{"book_id": book.id, "title": book.title, "url": book.url} for _ in chunks]
        )
        
    return book.title


def rag_query(question):
    vectorstore = get_vectorstore()
    # Perform similarity search
    results = vectorstore.similarity_search(question, k=3)
    
    context = "\n\n".join([f"Source: {doc.metadata.get('title')}\nContent: {doc.page_content}" for doc in results])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an intelligent book query assistant. Answer the user's question using ONLY the provided context. If the answer is not in the context, say 'I don't know'. Always cite your sources at the end."),
        ("user", "Context:\n{context}\n\nQuestion: {question}")
    ])
    
    chat = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
    chain = prompt | chat
    response_msg = chain.invoke({"context": context, "question": question})
    
    return response_msg.content
