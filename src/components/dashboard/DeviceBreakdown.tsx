import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Smartphone } from 'lucide-react';

interface DeviceStats {
  device: string;
  count: number;
}

interface DeviceBreakdownProps {
  deviceBreakdown: DeviceStats[];
}

export function DeviceBreakdown({ deviceBreakdown }: DeviceBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Device breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deviceBreakdown.map((device, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {device.device === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                <span className="capitalize">{device.device}</span>
              </div>
              <span className="font-semibold">{device.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}