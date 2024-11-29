import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { Document } from "langchain/document";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { RedisVectorStore } from "langchain/vectorstores/redis";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";

const model = new ChatAnthropic({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  modelName: "claude-2.1"
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export class DocumentProcessor {
  private vectorStore: RedisVectorStore | SupabaseVectorStore;

  constructor() {
    // Initialize vector store (Redis or Supabase)
    this.vectorStore = new SupabaseVectorStore(model.embeddings, {
      client: supabase,
      tableName: "documents",
    });
  }

  async processFile(file: File, metadata: Record<string, any>) {
    let loader;
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer]);

    switch (file.type) {
      case "application/pdf":
        loader = new PDFLoader(blob);
        break;
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        loader = new DocxLoader(blob);
        break;
      case "text/plain":
        loader = new TextLoader(blob);
        break;
      default:
        throw new Error("Unsupported file type");
    }

    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);

    // Add metadata to each split
    const processedDocs = splitDocs.map(doc => ({
      ...doc,
      metadata: { ...doc.metadata, ...metadata }
    }));

    // Store in vector database
    await this.vectorStore.addDocuments(processedDocs);

    return processedDocs;
  }

  async analyzeDocument(documentId: string, query: string) {
    const relevantDocs = await this.vectorStore.similaritySearch(query, 3, {
      documentId
    });

    const response = await model.call([
      { role: "system", content: "You are a legal document analyzer. Analyze the provided document segments and answer the user's query." },
      { role: "user", content: `
Documents:
${relevantDocs.map(doc => doc.pageContent).join('\n\n')}

Query: ${query}

Provide a detailed analysis based on the document contents.`}
    ]);

    return response;
  }

  async compareDocuments(documentIds: string[], query: string) {
    const documents = await Promise.all(
      documentIds.map(id => 
        this.vectorStore.similaritySearch(query, 3, { documentId: id })
      )
    );

    const response = await model.call([
      { role: "system", content: "You are a legal document comparison expert. Compare the provided documents and highlight key differences." },
      { role: "user", content: `
Document 1:
${documents[0].map(doc => doc.pageContent).join('\n\n')}

Document 2:
${documents[1].map(doc => doc.pageContent).join('\n\n')}

Query: ${query}

Compare these documents and provide a detailed analysis of their differences.`}
    ]);

    return response;
  }

  async generateDocument(query: string, documentType: string) {
    const response = await model.call([
      { role: "system", content: "You are a legal document generation expert. Generate professional legal documents based on the user's requirements." },
      { role: "user", content: `
Generate a ${documentType} based on the following requirements:

${query}

Provide the document in a clear, professional format with appropriate legal language and structure.`}
    ]);

    return response;
  }

  async modifyDocument(documentId: string, query: string) {
    const relevantDocs = await this.vectorStore.similaritySearch(query, 3, {
      documentId
    });

    const response = await model.call([
      { role: "system", content: "You are a legal document modification expert. Modify the provided document based on the user's requirements." },
      { role: "user", content: `
Original Document:
${relevantDocs.map(doc => doc.pageContent).join('\n\n')}

Requested Changes:
${query}

Provide the modified version of the document with the requested changes.`}
    ]);

    return response;
  }
} 