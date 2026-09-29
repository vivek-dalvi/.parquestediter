import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parquet Dataset Studio | OCR Dataset Editor by Devcart Technologies",
  description:
    "Professional Parquet file editor, viewer, and OCR dataset builder for machine learning and Hugging Face datasets. Built by Devcart Technologies.",
  openGraph: {
    title: "Parquet Dataset Studio | OCR Dataset Editor by Devcart Technologies",
    description:
      "Professional Parquet file editor, viewer, and OCR dataset builder for machine learning and Hugging Face datasets. Built by Devcart Technologies.",
    images: ["https://i.ibb.co/8D1FTxPx/devcart-technologies-logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
