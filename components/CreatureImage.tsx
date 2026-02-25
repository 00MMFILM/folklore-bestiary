// ============================================================
// 📁 components/CreatureImage.tsx
// GFS 크리처 이미지 컴포넌트
// 기존 크리처 카드/상세 페이지에 통합
// ============================================================

'use client';

import { useState, useCallback } from 'react';

interface CreatureImageProps {
  creatureId: string;
  creatureName: string;
  creatureNameEn: string;
  country: string;
  fearLevel: number;
  prompt?: string;          // DALL-E 프롬프트 (프리셋 크리처용)
  imageUrl?: string | null; // 이미 생성된 이미지 URL
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGenerateButton?: boolean;
  onImageGenerated?: (url: string) => void;
}

const SIZE_MAP = {
  sm: { width: 64, height: 64, iconSize: 20, fontSize: 10 },
  md: { width: 128, height: 128, iconSize: 32, fontSize: 12 },
  lg: { width: 256, height: 256, iconSize: 48, fontSize: 14 },
  xl: { width: 512, height: 512, iconSize: 64, fontSize: 16 },
};

export default function CreatureImage({
  creatureId,
  creatureName,
  creatureNameEn,
  country,
  fearLevel,
  prompt,
  imageUrl: initialImageUrl,
  size = 'md',
  showGenerateButton = true,
  onImageGenerated,
}: CreatureImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const dims = SIZE_MAP[size];

  const generateImage = useCallback(async () => {
    if (!prompt || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-creature-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatureId,
          prompt,
          country,
          fearLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
      onImageGenerated?.(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  }, [creatureId, prompt, country, fearLevel, isGenerating, onImageGenerated]);

  // ─── AI 이미지가 있는 경우 ───
  if (imageUrl) {
    return (
      <div
        style={{
          width: dims.width,
          height: dims.height,
          borderRadius: size === 'sm' ? 8 : 12,
          overflow: 'hidden',
          position: 'relative',
          background: '#111',
        }}
      >
        {!imageLoaded && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#111',
          }}>
            <div style={{
              width: dims.iconSize * 0.6,
              height: dims.iconSize * 0.6,
              border: '2px solid #333',
              borderTopColor: '#888',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}/>
          </div>
        )}
        <img
          src={imageUrl}
          alt={`${creatureName} (${creatureNameEn})`}
          onLoad={() => setImageLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
        {/* AI 생성 뱃지 */}
        <div style={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          color: '#10B981',
          fontSize: Math.max(8, dims.fontSize - 4),
          fontWeight: 700,
          fontFamily: 'monospace',
          padding: '2px 6px',
          borderRadius: 4,
        }}>
          ✦ AI
        </div>
      </div>
    );
  }

  // ─── 아직 이미지가 없는 경우: SVG 플레이스홀더 + 생성 버튼 ───
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          width: dims.width,
          height: dims.height,
          borderRadius: size === 'sm' ? 8 : 12,
          background: `linear-gradient(135deg, #1a1a2e, #16213e)`,
          border: '1px solid #2a2a4a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 장식 */}
        <svg width={dims.iconSize} height={dims.iconSize} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#333" strokeWidth="1" strokeDasharray="3 3"/>
          <circle cx="24" cy="24" r="12" stroke="#444" strokeWidth="0.5"/>
          <text x="24" y="28" textAnchor="middle" fill="#555" fontSize="16">?</text>
        </svg>

        {isGenerating ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: dims.iconSize * 0.5,
              height: dims.iconSize * 0.5,
              border: '2px solid #333',
              borderTopColor: '#7C3AED',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 4px',
            }}/>
            <span style={{ color: '#888', fontSize: dims.fontSize - 2, fontFamily: 'monospace' }}>
              생성 중...
            </span>
          </div>
        ) : error ? (
          <span style={{ color: '#EF4444', fontSize: dims.fontSize - 2, textAlign: 'center', padding: '0 8px' }}>
            {error}
          </span>
        ) : null}

        {/* 생성 버튼 (오버레이) */}
        {showGenerateButton && prompt && !isGenerating && (
          <button
            onClick={generateImage}
            style={{
              position: 'absolute',
              bottom: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(124, 58, 237, 0.8)',
              backdropFilter: 'blur(4px)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: `${Math.max(3, size === 'sm' ? 2 : 6)}px ${Math.max(6, size === 'sm' ? 4 : 10)}px`,
              fontSize: Math.max(8, dims.fontSize - 3),
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✦ 이미지 생성
          </button>
        )}
      </div>
    </div>
  );
}

// ─── 배치 생성 훅 ───
export function useCreatureImageBatch() {
  const [progress, setProgress] = useState({ total: 0, done: 0, failed: 0 });
  const [isRunning, setIsRunning] = useState(false);

  const generateBatch = useCallback(async (
    creatures: Array<{ id: string; prompt: string; country: string; fearLevel: number }>,
    delayMs = 2000 // DALL-E rate limit 고려
  ) => {
    setIsRunning(true);
    setProgress({ total: creatures.length, done: 0, failed: 0 });

    const results: Array<{ id: string; imageUrl?: string; error?: string }> = [];

    for (const creature of creatures) {
      try {
        const response = await fetch('/api/generate-creature-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creature),
        });

        if (response.ok) {
          const data = await response.json();
          results.push({ id: creature.id, imageUrl: data.imageUrl });
          setProgress(prev => ({ ...prev, done: prev.done + 1 }));
        } else {
          results.push({ id: creature.id, error: `HTTP ${response.status}` });
          setProgress(prev => ({ ...prev, done: prev.done + 1, failed: prev.failed + 1 }));
        }
      } catch (err) {
        results.push({ id: creature.id, error: String(err) });
        setProgress(prev => ({ ...prev, done: prev.done + 1, failed: prev.failed + 1 }));
      }

      // Rate limit 방지 딜레이
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    setIsRunning(false);
    return results;
  }, []);

  return { generateBatch, progress, isRunning };
}
