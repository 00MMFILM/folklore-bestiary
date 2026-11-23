import type { EditorialImage } from "@/lib/editorial-images";

export default function EditorialFigure({ image }: { image: EditorialImage }) {
  return <figure style={{ margin: "24px 0 32px" }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={image.src} srcSet={`${image.smallSrc} 768w, ${image.src} 1536w`}
      sizes="(max-width: 848px) calc(100vw - 48px), 800px"
      alt={image.alt} width={image.width} height={image.height}
      decoding="async" fetchPriority="high"
      style={{ display: "block", width: "100%", height: "auto", borderRadius: 16 }} />
    <figcaption style={{ color: "#b7aa99", fontSize: 12, lineHeight: 1.6, marginTop: 10 }}>
      {image.caption}
    </figcaption>
  </figure>;
}
