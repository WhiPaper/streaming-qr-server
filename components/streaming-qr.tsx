'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StreamingQRProps {
  text: string;
  chunkSize?: number;
  frameRate?: number;
  enabled?: boolean;
  loop?: boolean;
}

function safeBtoa(str: string): string {
  try {
    return btoa(str);
  } catch (error) {
    console.error('Base64 encoding failed. Non-ASCII characters might be present.', error);
    return ''; 
  }
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
  const [streamId, setStreamId] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef<boolean>(false); 

  useEffect(() => {
    if (!text || text.trim() === '') {
      setChunks([]);
      setStreamId('');
      setCurrentChunkIndex(0);
      return;
    }

    const newStreamId = 'stream_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setStreamId(newStreamId);

    const newChunks: string[] = [];
    const totalChunks = Math.ceil(text.length / chunkSize);

    for (let i = 0; i < text.length; i += chunkSize) {
      const rawChunk = text.slice(i, i + chunkSize);
      
      const seq = Math.floor(i / chunkSize);
      const encodedData = safeBtoa(rawChunk); 

      const chunkData = JSON.stringify({
        id: newStreamId,
        seq: seq,
        total: totalChunks,
        data: encodedData,
      });
      newChunks.push(chunkData);
    }

    setChunks(newChunks);
    setCurrentChunkIndex(0);
    hasCompletedRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [text, chunkSize]);

  useEffect(() => {
    if (!enabled || chunks.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (hasCompletedRef.current) {
      setCurrentChunkIndex(0);
      hasCompletedRef.current = false;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const interval = setInterval(() => {
      setCurrentChunkIndex((prev) => {
        if (prev >= chunks.length || prev < 0) {
          return 0;
        }

        const nextIndex = prev + 1;
        if (loop) {
          return nextIndex % chunks.length;
        } else {
          if (nextIndex >= chunks.length) {
            hasCompletedRef.current = true;
            clearInterval(interval);
            intervalRef.current = null;
            return chunks.length - 1;
          }
          return nextIndex;
        }
      });
    }, 1000 / frameRate); 

    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [chunks, enabled, frameRate, loop]);


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

  const safeIndex = Math.max(0, Math.min(currentChunkIndex, chunks.length - 1));
  const currentChunk = chunks[safeIndex];
  
  let chunkInfo: { id: string; seq: number; total: number; data: string } | null = null;
  if (currentChunk) {
    try {
      chunkInfo = JSON.parse(currentChunk);
    } catch (error) {
      console.error('Failed to parse chunk data:', error);
    }
  }

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
          청크 {chunkInfo.seq + 1}/{chunkInfo.total} ({frameRate} FPS)
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
          <div>Stream: {chunkInfo.id}</div>
          <div className="mt-1">현재 청크: {chunkInfo.seq + 1}/{chunkInfo.total}</div>
        </div>
      </CardContent>
    </Card>
  );
}