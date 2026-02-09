import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "../DateRangePicker";
import { useState } from "react";
import { startOfMonth, endOfDay } from "date-fns";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

interface UserLTVTabProps {
  selectedSiteId: string | null;
}

export const UserLTVTab = ({ selectedSiteId }: UserLTVTabProps) => {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
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
          <CardDescription>Välj en sajt för att se LTV-data</CardDescription>
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
          <p className="text-muted-foreground">GDPR-kompatibel användaranalys med hashade ID</p>
        </div>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={(range) => range && setDateRange({ from: range.from!, to: range.to! })} />
      </div>

      {/* LTV Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totalt Antal Användare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ltvData?.stats.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Omsättning</CardTitle>
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
            <CardTitle className="text-sm font-medium">Genomsnittlig LTV</CardTitle>
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
            <CardTitle className="text-sm font-medium">Genomsnitt Sessioner</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(ltvData?.stats.avgSessions || 0).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Kohort-analys</CardTitle>
          <CardDescription>Användare grupperade efter första besöket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ltvData?.cohorts?.map((cohort: any) => (
              <div key={cohort.month} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium">{cohort.month}</p>
                  <p className="text-sm text-muted-foreground">{cohort.users} användare</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{cohort.avgRevenue.toLocaleString('sv-SE')} kr</p>
                  <p className="text-sm text-muted-foreground">
                    Snitt {cohort.avgSessions.toFixed(1)} sessioner
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Value Users */}
      <Card>
        <CardHeader>
          <CardTitle>Top 100 Användare</CardTitle>
          <CardDescription>Högst LTV (anonymiserade med hash)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ltvData?.topUsers?.slice(0, 20).map((user: any, index: number) => (
              <div key={user.userHash} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {user.userHash.substring(0, 16)}...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.totalSessions} sessioner
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{user.totalRevenue.toLocaleString('sv-SE')} kr</p>
                  <p className="text-sm text-muted-foreground">
                    {user.avgRevenuePerSession.toLocaleString('sv-SE')} kr/session
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
