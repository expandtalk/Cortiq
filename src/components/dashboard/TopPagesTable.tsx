import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TopPage {
  url: string;
  views: number;
  title?: string;
}

interface TopPagesTableProps {
  topPages: TopPage[];
}

export function TopPagesTable({ topPages }: TopPagesTableProps) {
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + (urlObj.search ? urlObj.search.substring(0, 20) + '...' : '');
    } catch {
      return url.length > 40 ? url.substring(0, 40) + '...' : url;
    }
  };

  const getTotalViews = () => {
    return topPages.reduce((sum, page) => sum + page.views, 0);
  };

  const totalViews = getTotalViews();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top pages</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Page title</TableHead>
              <TableHead>Views</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topPages.map((page, index) => {
              const percentage = totalViews > 0 ? ((page.views / totalViews) * 100).toFixed(1) : '0';
              
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <a 
                      href={page.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {formatUrl(page.url)}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {page.title || 'No title'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{page.views}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}