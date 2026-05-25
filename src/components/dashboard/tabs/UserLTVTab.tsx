import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "../DateRangePicker";
import { useState } from "react";
import { subMonths, endOfDay } from "date-fns";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

interface UserLTVTabProps {
  selectedSiteId: string | null;
}

export const UserLTVTab = ({ selectedSiteId }: UserLTVTabProps) => {
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 12),
    to: endOfDay(new Date()),
  });

  const { data: ltvData, isLoading } = useQuery({
    queryKey: ['user-ltv', selectedSiteId, dateRange],
    queryFn: async () => {
      if (!selectedSiteId) return null;

      const { data, error } = await supabase.functions.invoke('user-lifetime-value', {
        body: {
          siteId: selectedSiteId,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString()
        }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedSiteId
  });

  if (!selectedSiteId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Lifetime Value</CardTitle>
          <CardDescription>Select a site to see LTV data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Lifetime Value (LTV)</h2>
          <p className="text-muted-foreground">GDPR-compatible user analysis with hashed IDs</p>
        </div>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={(range) => range && setDateRange({ from: range.from!, to: range.to! })} />
      </div>

      {/* LTV Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ltvData?.stats.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(ltvData?.stats.totalRevenue || 0).toLocaleString('sv-SE')} kr
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(ltvData?.stats.avgLTV || 0).toLocaleString('sv-SE')} kr
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(ltvData?.stats.avgSessions || 0).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis — compact */}
      {ltvData?.cohorts?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cohorts by first visit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y text-sm">
              {ltvData.cohorts.map((cohort: any) => (
                <div key={cohort.month} className="flex items-center justify-between py-1.5">
                  <span className="font-medium">{cohort.month}</span>
                  <span className="text-muted-foreground">{cohort.users} users</span>
                  <span className="text-muted-foreground">{cohort.avgSessions.toFixed(1)} sessions</span>
                  <span className="font-semibold">{cohort.avgRevenue.toLocaleString('sv-SE')} kr</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Value Users — compact table, only shown when there's data */}
      {ltvData?.topUsers?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Top users by LTV</CardTitle>
            <CardDescription>Anonymized with hash</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {ltvData.topUsers.slice(0, 10).map((user: any, index: number) => (
                <div key={user.userHash} className="flex items-center justify-between py-1.5 text-sm border-b last:border-0">
                  <span className="text-muted-foreground w-6">#{index + 1}</span>
                  <span className="font-mono text-xs text-muted-foreground flex-1 truncate px-2">
                    {user.userHash.substring(0, 12)}…
                  </span>
                  <span className="text-muted-foreground text-xs mr-4">{user.totalSessions} sessions</span>
                  <span className="font-semibold">{user.totalRevenue.toLocaleString('sv-SE')} kr</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
