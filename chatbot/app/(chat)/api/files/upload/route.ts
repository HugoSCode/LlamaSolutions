import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";
import { extractText, getDocumentProxy } from "unpdf";

import { auth } from "@/app/(auth)/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    .refine((file) => ["image/jpeg", "image/png"].includes(file.type), {
      message: "File type should be JPEG or PNG",
    }),
});

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 100;
const MAX_PDF_TEXT_LENGTH = 80000;

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    if (file.type === "application/pdf" || safeName.toLowerCase().endsWith(".pdf")) {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "The uploaded file is not a valid PDF" },
          { status: 400 }
        );
      }

      if (file.size > MAX_PDF_SIZE) {
        return NextResponse.json(
          { error: "PDF size should be less than 10MB" },
          { status: 400 }
        );
      }

      try {
        const pdf = await getDocumentProxy(
          new Uint8Array(await file.arrayBuffer())
        );

        if (pdf.numPages > MAX_PDF_PAGES) {
          return NextResponse.json(
            { error: "PDFs must contain 100 pages or fewer" },
            { status: 400 }
          );
        }

        const { text } = await extractText(pdf, { mergePages: true });
        const extractedText = text.trim();

        if (!extractedText) {
          return NextResponse.json(
            { error: "No selectable text found. Scanned PDFs are not supported yet." },
            { status: 422 }
          );
        }

        if (extractedText.length > MAX_PDF_TEXT_LENGTH) {
          return NextResponse.json(
            { error: "PDF text is too long. Upload a shorter document (80,000 characters maximum)." },
            { status: 400 }
          );
        }

        return NextResponse.json({
          contentType: "application/pdf",
          extractedText,
          pathname: safeName,
        });
      } catch (error) {
        console.error(
          "PDF parsing failed:",
          error instanceof Error ? error.message : error
        );
        return NextResponse.json(
          { error: "Could not read this PDF. Check that the file is valid and not password-protected." },
          { status: 400 }
        );
      }
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(`${safeName}`, fileBuffer, {
        access: "public",
      });

      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}