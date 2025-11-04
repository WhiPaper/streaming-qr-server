'use client';

import { useState } from 'react';
import { StreamingQR } from '@/components/streaming-qr';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function Home() {
  const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?`;

  const [text, setText] = useState(loremIpsum);
  const [enabled, setEnabled] = useState(true);
  const [chunkSize, setChunkSize] = useState(100);
  const [frameRate, setFrameRate] = useState(10);
  const [loop, setLoop] = useState(true);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleChunkSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 100;
    setChunkSize(Math.max(10, Math.min(500, value)));
  };

  const handleFrameRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 10;
    setFrameRate(Math.max(1, Math.min(30, value)));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-900 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 입력 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>텍스트 입력</CardTitle>
            <CardDescription>
              입력한 텍스트가 QR 코드로 스트리밍됩니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="text-input" className="text-sm font-medium">
                텍스트
              </label>
              <textarea
                id="text-input"
                placeholder="QR 코드로 변환할 텍스트를 입력하세요..."
                value={text}
                onChange={handleTextChange}
                className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="chunk-size" className="text-sm font-medium">
                청크 크기: {chunkSize}자
              </label>
              <Input
                id="chunk-size"
                type="number"
                min="10"
                max="500"
                value={chunkSize}
                onChange={handleChunkSizeChange}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                텍스트를 나눌 청크의 크기를 설정합니다 (10-500)
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="frame-rate" className="text-sm font-medium">
                프레임 레이트: {frameRate} FPS
              </label>
              <Input
                id="frame-rate"
                type="number"
                min="1"
                max="30"
                value={frameRate}
                onChange={handleFrameRateChange}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                QR 코드가 변경되는 속도를 설정합니다 (1-30 FPS)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="loop-checkbox"
                checked={loop}
                onCheckedChange={(checked) => setLoop(checked === true)}
              />
              <label
                htmlFor="loop-checkbox"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                청크가 끝나면 반복
              </label>
            </div>

            <Button
              onClick={() => setEnabled(!enabled)}
              variant={enabled ? 'default' : 'secondary'}
              className="w-full"
            >
              {enabled ? '스트리밍 중지' : '스트리밍 시작'}
            </Button>

            {text && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">텍스트 정보</p>
                <p className="text-xs text-muted-foreground">
                  총 길이: {text.length}자
                </p>
                <p className="text-xs text-muted-foreground">
                  예상 청크 수: {Math.ceil(text.length / chunkSize)}개
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR 코드 섹션 */}
        <div className="flex items-center justify-center">
          <StreamingQR
            text={text}
            chunkSize={chunkSize}
            frameRate={frameRate}
            enabled={enabled}
            loop={loop}
          />
        </div>
      </div>
    </div>
  );
}
