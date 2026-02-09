import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ServerLogImporterProps {
  siteId: string;
}

type LogFormat = 'combined' | 'json' | 'csv';

export function ServerLogImporter({ siteId }: ServerLogImporterProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logFormat, setLogFormat] = useState<LogFormat>('combined');
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Välj en loggfil först');
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      // Read file content
      const fileContent = await selectedFile.text();

      // Call edge function to process logs
      const { data, error } = await supabase.functions.invoke('import-server-logs', {
        body: {
          site_id: siteId,
          log_content: fileContent,
          log_format: logFormat
        }
      });

      if (error) {
        throw error;
      }

      setImportResult(data);
      toast.success(`Import klar! ${data.stats.processed_lines} rader processade`);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('log-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Fel vid import: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="glass shadow-elegant">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Upload className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Importera Server-loggar</CardTitle>
            <CardDescription>
              Ladda upp server-loggfiler för cookiefree analytics (IP-anonymisering sker automatiskt)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Information */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Loggfilsformat som stöds:</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <div className="text-sm space-y-1">
              <p><strong>Combined Log Format (Apache/Nginx):</strong></p>
              <code className="text-xs bg-muted p-1 rounded">
                93.184.216.34 - - [10/Jan/2025:13:55:36] "GET /produkter HTTP/1.1" 200...
              </code>
            </div>
            <div className="text-sm space-y-1 mt-2">
              <p><strong>JSON format:</strong></p>
              <code className="text-xs bg-muted p-1 rounded">
                {"{"}"timestamp":"2025-01-10T13:55:36Z","ip":"93.184.216.34",...{"}"}
              </code>
            </div>
            <div className="text-sm space-y-1 mt-2">
              <p><strong>CSV format:</strong></p>
              <code className="text-xs bg-muted p-1 rounded">
                timestamp,ip,method,url,status,referrer,user_agent
              </code>
            </div>
          </AlertDescription>
        </Alert>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label htmlFor="log-format">Loggfilsformat</Label>
          <Select value={logFormat} onValueChange={(value) => setLogFormat(value as LogFormat)}>
            <SelectTrigger id="log-format">
              <SelectValue placeholder="Välj format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="combined">Combined Log Format (Apache/Nginx)</SelectItem>
              <SelectItem value="json">JSON-format</SelectItem>
              <SelectItem value="csv">CSV-format</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="log-file-input">Välj loggfil</Label>
          <div className="flex items-center space-x-2">
            <input
              id="log-file-input"
              type="file"
              accept=".log,.txt,.json,.csv"
              onChange={handleFileSelect}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</span>
            </p>
          )}
        </div>

        {/* Import Button */}
        <Button
          onClick={handleImport}
          disabled={!selectedFile || isUploading}
          className="w-full bg-gradient-primary hover-scale"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importerar...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importera loggfil
            </>
          )}
        </Button>

        {/* Import Result */}
        {importResult && (
          <Alert className={importResult.stats.failed_lines > 0 ? 'border-yellow-500' : 'border-green-500'}>
            {importResult.stats.failed_lines > 0 ? (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            <AlertTitle>Import genomförd</AlertTitle>
            <AlertDescription>
              <div className="space-y-1 mt-2 text-sm">
                <p>✓ Totalt antal rader: {importResult.stats.total_lines}</p>
                <p>✓ Processade rader: {importResult.stats.processed_lines}</p>
                {importResult.stats.failed_lines > 0 && (
                  <p className="text-yellow-600">⚠ Misslyckade rader: {importResult.stats.failed_lines}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  IP-adresser har anonymiserats omedelbart (IP → Land → Raderad)
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Privacy Notice */}
        <div className="bg-primary/5 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">🔒 Integritet & GDPR</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✓ IP-adresser anonymiseras <strong>omedelbart</strong> vid import</li>
            <li>✓ Endast land/region lagras - aldrig IP-adresser</li>
            <li>✓ Bot-trafik exkluderas automatiskt</li>
            <li>✓ Data aggregeras för cookiefree analytics</li>
            <li>✓ Ingen cookie-banner krävs (GDPR Art. 6.1.f)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
