"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

const QR_SIZE = 200;
const QR_EXPORT_SIZE = 512;

interface ClassroomInviteQrProps {
  inviteUrl: string;
  inviteCode: string;
  classroomName?: string;
}

async function svgToPngBlob(svg: SVGElement, size: number): Promise<Blob> {
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not create canvas"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not export QR image"));
        },
        "image/png",
        1
      );
    };
    img.onerror = () => reject(new Error("Could not load QR image"));
    img.src = svgUrl;
  });
}

export function ClassroomInviteQr({
  inviteUrl,
  inviteCode,
  classroomName,
}: ClassroomInviteQrProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getSvg = () => containerRef.current?.querySelector("svg") ?? null;

  const handleDownload = async () => {
    const svg = getSvg();
    if (!svg) return;

    try {
      const blob = await svgToPngBlob(svg, QR_EXPORT_SIZE);
      const filename = classroomName
        ? `trippy-tropa-invite-${classroomName.replace(/\s+/g, "-").toLowerCase()}.png`
        : `trippy-tropa-invite-${inviteCode}.png`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("QR code downloaded");
    } catch {
      toast.error("Could not download QR code");
    }
  };

  const handleCopyImage = async () => {
    const svg = getSvg();
    if (!svg) return;

    try {
      const blob = await svgToPngBlob(svg, QR_EXPORT_SIZE);
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        toast.error("Copy image is not supported in this browser");
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.success("QR code copied to clipboard");
    } catch {
      toast.error("Could not copy QR code — try Download instead");
    }
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div
        ref={containerRef}
        className="flex items-center justify-center rounded-lg border border-[#c3c6d7] bg-white p-4 shadow-inner"
      >
        <QRCodeSVG
          value={inviteUrl}
          size={QR_SIZE}
          level="M"
          includeMargin
          bgColor="#ffffff"
          fgColor="#191b23"
        />
      </div>
      <div className="mt-4 grid w-full grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void handleDownload()}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-3 py-2.5 text-sm font-medium text-[#191b23] transition-colors hover:bg-[#e7e7f3]"
        >
          <Download className="size-4 text-[#004ac6]" />
          Download PNG
        </button>
        <button
          type="button"
          onClick={() => void handleCopyImage()}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#c3c6d7] bg-[#faf8ff] px-3 py-2.5 text-sm font-medium text-[#191b23] transition-colors hover:bg-[#e7e7f3]"
        >
          <Copy className="size-4 text-[#004ac6]" />
          Copy image
        </button>
      </div>
    </div>
  );
}
