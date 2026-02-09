/**
 * Session Recording Player Component
 * Task #7: Session Recording
 *
 * Plays back session recordings using rrweb-player
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// Import rrweb-player types
import type { eventWithTime } from 'rrweb';

export interface SessionRecording {
  id: string;
  site_id: string;
  session_id: string;
  visitor_hash: string;
  recording_url: string;
  duration_ms: number;
  started_at: string;
  ended_at: string;
  page_url: string;
  page_title: string | null;
  device_type: string;
  browser: string;
  os: string;
  viewport_width: number;
  viewport_height: number;
  is_ai_agent: boolean;
  agent_type: string | null;
}

interface SessionRecordingPlayerProps {
  recording: SessionRecording;
  events: eventWithTime[];
  onClose?: () => void;
}

export function SessionRecordingPlayer({
  recording,
  events,
  onClose
}: SessionRecordingPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!playerRef.current || events.length === 0) return;

    // Dynamically import rrweb-player (to avoid SSR issues)
    import('rrweb-player').then(({ default: rrwebPlayer }) => {
      const playerInstance = new rrwebPlayer({
        target: playerRef.current!,
        props: {
          events,
          width: 800,
          height: 600,
          autoPlay: false,
          showController: false, // We'll use custom controls
          skipInactive: true,
          speed: playbackSpeed,
        },
      });

      setPlayer(playerInstance);

      // Set up event listeners
      playerInstance.addEventListener('ui-update-current-time', (e: any) => {
        setCurrentTime(e.payload);
      });

      playerInstance.addEventListener('finish', () => {
        setIsPlaying(false);
      });

      return () => {
        playerInstance?.destroy();
      };
    });
  }, [events]);

  function handlePlayPause() {
    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  }

  function handleSeek(value: number[]) {
    if (!player) return;
    player.goto(value[0]);
    setCurrentTime(value[0]);
  }

  function handleSpeedChange(speed: number) {
    if (!player) return;
    player.setSpeed(speed);
    setPlaybackSpeed(speed);
  }

  function handleSkipBack() {
    if (!player) return;
    player.goto(Math.max(0, currentTime - 10000)); // Skip back 10 seconds
  }

  function handleSkipForward() {
    if (!player) return;
    player.goto(Math.min(recording.duration_ms, currentTime + 10000)); // Skip forward 10 seconds
  }

  function toggleFullscreen() {
    if (!playerRef.current) return;

    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Session Recording
              {recording.is_ai_agent && (
                <Badge variant="outline" className="ml-2">
                  🤖 AI Agent: {recording.agent_type}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span>{recording.page_title || recording.page_url}</span>
              <span>•</span>
              <span>{recording.device_type}</span>
              <span>•</span>
              <span>{recording.browser}</span>
              <span>•</span>
              <span>{new Date(recording.started_at).toLocaleString()}</span>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Player Container */}
        <div
          ref={playerRef}
          className="relative bg-muted rounded-lg overflow-hidden"
          style={{ minHeight: '600px' }}
        />

        {/* Custom Controls */}
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={recording.duration_ms}
              step={100}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(recording.duration_ms)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipBack}
                disabled={!player}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handlePlayPause}
                disabled={!player}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleSkipForward}
                disabled={!player}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Playback Speed */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed:</span>
              {[0.5, 1, 1.5, 2].map((speed) => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSpeedChange(speed)}
                  disabled={!player}
                >
                  {speed}x
                </Button>
              ))}
            </div>

            {/* Fullscreen Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              disabled={!player}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">{formatTime(recording.duration_ms)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Viewport</p>
            <p className="font-medium">
              {recording.viewport_width} × {recording.viewport_height}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Device</p>
            <p className="font-medium">{recording.device_type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">OS</p>
            <p className="font-medium">{recording.os}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
