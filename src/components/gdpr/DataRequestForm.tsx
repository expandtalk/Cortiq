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
        return 'Exportera all data som är kopplad till denna email-adress i ett maskinläsbart format.';
      case 'deletion':
        return 'Radera all data som är kopplad till denna email-adress permanent från systemet.';
      case 'portability':
        return 'Få en kopia av all data i ett strukturerat, maskinläsbart format för överföring.';
      default:
        return 'Välj typ av begäran för mer information.';
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
        <CardTitle>Skapa ny databegäran</CardTitle>
        <CardDescription>
          Hantera användarnas rättigheter enligt GDPR
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email-adress</Label>
            <Input
              id="email"
              type="email"
              placeholder="användare@example.com"
              {...register('email', {
                required: 'Email-adress krävs',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Ogiltig email-adress'
                }
              })}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_type">Typ av begäran</Label>
            <Select value={requestType} onValueChange={(value: any) => setValue('request_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Välj typ av begäran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="export">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Dataexport
                  </div>
                </SelectItem>
                <SelectItem value="deletion">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Dataradering
                  </div>
                </SelectItem>
                <SelectItem value="portability">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Dataportabilitet
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
                    {requestType === 'export' && 'Dataexport'}
                    {requestType === 'deletion' && 'Dataradering'}
                    {requestType === 'portability' && 'Dataportabilitet'}
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
            {createRequest.isPending ? 'Skickar...' : 'Skicka begäran'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}