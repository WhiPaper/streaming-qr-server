'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StreamingQRProps {
  text: string;
  chunkSize?: number;
  frameRate?: number; // FPS (frames per second)
  enabled?: boolean;
  loop?: boolean; // 청크가 끝나면 반복할지 여부
}

export function StreamingQR({ 
  text, 
  chunkSize = 100,
  frameRate = 10,
  enabled = true,
  loop = true
}: StreamingQRProps) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [chunks, setChunks] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef<boolean>(false); // 비반복 모드에서 완료 여부 추적

  // 텍스트를 청크로 분할
  useEffect(() => {
    if (!text || text.trim() === '') {
      setChunks([]);
      setCurrentChunkIndex(0);
      return;
    }

    const newChunks: string[] = [];
    const totalChunks = Math.ceil(text.length / chunkSize);

    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      // 청크 번호와 총 청크 수를 포함한 메타데이터 추가
      const chunkNumber = Math.floor(i / chunkSize) + 1;
      const chunkData = JSON.stringify({
        chunk: chunkNumber,
        total: totalChunks,
        data: chunk,
        index: i,
      });
      newChunks.push(chunkData);
    }

    setChunks(newChunks);
    setCurrentChunkIndex(0);
    hasCompletedRef.current = false; // 완료 상태 초기화
    
    // 텍스트가 변경되면 interval 재설정을 위해 정리
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [text, chunkSize]);

  // Streaming 효과: 청크를 빠르게 순회
  useEffect(() => {
    if (!enabled || chunks.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 비반복 모드에서 완료되었고, enabled가 다시 켜졌을 때 초기화
    if (hasCompletedRef.current) {
      setCurrentChunkIndex(0);
      hasCompletedRef.current = false;
    }

    // 기존 interval 정리
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 새 interval 설정
    const interval = setInterval(() => {
      setCurrentChunkIndex((prev) => {
        // 범위 검증
        if (prev >= chunks.length || prev < 0) {
          return 0;
        }

        const nextIndex = prev + 1;
        if (loop) {
          // 반복 모드: 마지막 청크 후 첫 번째 청크로 돌아감
          return nextIndex % chunks.length;
        } else {
          // 비반복 모드: 마지막 청크에 도달하면 interval 정지
          if (nextIndex >= chunks.length) {
            hasCompletedRef.current = true;
            clearInterval(interval);
            intervalRef.current = null;
            return chunks.length - 1;
          }
          return nextIndex;
        }
      });
    }, 1000 / frameRate); // frameRate에 맞춰 간격 조정

    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [chunks, enabled, frameRate, loop]);

  // early return은 모든 Hook 호출 이후에
  if (chunks.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Streaming QR</CardTitle>
          <CardDescription>텍스트를 입력하면 QR 코드가 스트리밍됩니다</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            QR 코드가 여기에 표시됩니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 안전한 인덱스 확인 및 청크 정보 파싱 (한 번만 수행)
  const safeIndex = Math.max(0, Math.min(currentChunkIndex, chunks.length - 1));
  const currentChunk = chunks[safeIndex];
  
  // 청크 정보 파싱 (에러 처리 포함)
  let chunkInfo: { chunk: number; total: number; data: string; index: number } | null = null;
  if (currentChunk) {
    try {
      chunkInfo = JSON.parse(currentChunk);
    } catch (error) {
      console.error('Failed to parse chunk data:', error);
    }
  }

  // 현재 청크가 없거나 파싱 실패 시 에러 처리
  if (!currentChunk || !chunkInfo) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Streaming QR</CardTitle>
          <CardDescription>오류가 발생했습니다</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-destructive">
            {!currentChunk ? '청크 데이터를 찾을 수 없습니다' : '청크 데이터를 파싱할 수 없습니다'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Streaming QR</CardTitle>
        <CardDescription>
          청크 {chunkInfo.chunk}/{chunkInfo.total} ({frameRate} FPS)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 p-8">
        <div className="rounded-lg border bg-white p-4">
          <QRCodeSVG
            value={currentChunk}
            size={256}
            level="M"
            includeMargin={true}
          />
        </div>
        <div className="text-sm text-muted-foreground text-center">
          <div>현재 청크: {chunkInfo.chunk}/{chunkInfo.total}</div>
          <div className="mt-1 text-xs">데이터 위치: {chunkInfo.index} - {chunkInfo.index + chunkInfo.data.length}</div>
        </div>
      </CardContent>
    </Card>
  );
}

