import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Trash2, Clock } from 'lucide-react';
import { useDataRequests, type DataRequest } from '@/hooks/useGDPR';
import { format } from 'date-fns';

interface DataRequestsTableProps {
  siteId: string;
}

export function DataRequestsTable({ siteId }: DataRequestsTableProps) {
  const { data: requests, isLoading } = useDataRequests(siteId);

  const getStatusBadge = (status: DataRequest['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;

    const labels = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeIcon = (type: DataRequest['request_type']) => {
    switch (type) {
      case 'export':
        return <Download className="h-4 w-4" />;
      case 'deletion':
        return <Trash2 className="h-4 w-4" />;
      case 'portability':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: DataRequest['request_type']) => {
    const labels = {
      export: 'Export',
      deletion: 'Deletion',
      portability: 'Portability'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return <div>Loading data requests...</div>;
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data requests yet
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeIcon(request.request_type)}
                  {getTypeLabel(request.request_type)}
                </div>
              </TableCell>
              <TableCell>{request.email}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell>
                {format(new Date(request.created_at), 'PPp')}
              </TableCell>
              <TableCell>
                {format(new Date(request.expires_at), 'PPp')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {request.status === 'completed' && request.request_type === 'export' && (
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                  {request.status === 'pending' && (
                    <Button size="sm" variant="outline">
                      Process
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}