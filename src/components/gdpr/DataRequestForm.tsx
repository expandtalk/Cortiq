import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { Download, Trash2, FileText } from 'lucide-react';
import { useCreateDataRequest } from '@/hooks/useGDPR';

interface DataRequestFormProps {
  siteId: string;
}

type DataRequestFormData = {
  email: string;
  request_type: 'export' | 'deletion' | 'portability';
};

export function DataRequestForm({ siteId }: DataRequestFormProps) {
  const createRequest = useCreateDataRequest();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<DataRequestFormData>();

  const requestType = watch('request_type');

  const onSubmit = (data: DataRequestFormData) => {
    createRequest.mutate({
      site_id: siteId,
      email: data.email,
      request_type: data.request_type
    }, {
      onSuccess: () => {
        reset();
      }
    });
  };

  const getRequestDescription = (type: string) => {
    switch (type) {
      case 'export':
        return 'Export all data associated with this email address in a machine-readable format.';
      case 'deletion':
        return 'Permanently delete all data associated with this email address from the system.';
      case 'portability':
        return 'Receive a copy of all data in a structured, machine-readable format for transfer.';
      default:
        return 'Select a request type for more information.';
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'export':
        return <Download className="h-4 w-4" />;
      case 'deletion':
        return <Trash2 className="h-4 w-4" />;
      case 'portability':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create new data request</CardTitle>
        <CardDescription>
          Manage user rights under GDPR
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_type">Request type</Label>
            <Select value={requestType} onValueChange={(value: any) => setValue('request_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="export">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Data export
                  </div>
                </SelectItem>
                <SelectItem value="deletion">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Data deletion
                  </div>
                </SelectItem>
                <SelectItem value="portability">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Data portability
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {requestType && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                {getRequestIcon(requestType)}
                <div>
                  <p className="text-sm font-medium mb-1">
                    {requestType === 'export' && 'Data export'}
                    {requestType === 'deletion' && 'Data deletion'}
                    {requestType === 'portability' && 'Data portability'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getRequestDescription(requestType)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={createRequest.isPending}
            className="w-full"
          >
            {createRequest.isPending ? 'Submitting...' : 'Submit request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}