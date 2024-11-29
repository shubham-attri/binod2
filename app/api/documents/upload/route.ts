import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DocumentProcessor } from "@/services/document-processor";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const buffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name}`;
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from("documents")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600"
      });

    if (storageError) {
      throw new Error(`Failed to upload to storage: ${storageError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from("documents")
      .getPublicUrl(fileName);

    // Process the document
    const processor = new DocumentProcessor();
    const metadata = {
      fileName: file.name,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      storageUrl: publicUrl
    };

    const processedDocs = await processor.processFile(file, metadata);

    // Store document metadata in Supabase
    const { data: docData, error: dbError } = await supabase
      .from("document_metadata")
      .insert({
        title: file.name,
        file_type: file.type,
        storage_url: publicUrl,
        chunks: processedDocs.length,
        metadata: metadata
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to store metadata: ${dbError.message}`);
    }

    return NextResponse.json({
      id: docData.id,
      title: docData.title,
      type: "document",
      content: "Document uploaded successfully. You can now ask questions about it.",
      metadata: {
        documentType: file.type,
        fileName: file.name,
        chunks: processedDocs.length
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
} 