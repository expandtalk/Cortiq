import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Calendar, FileText, Shield, Upload } from 'lucide-react';
import { usePluginDownloader } from '@/hooks/usePluginDownloader';

interface PluginDownloaderProps {
  trackingId?: string;
}

export default function PluginDownloader({ trackingId }: PluginDownloaderProps) {
  const { downloadPlugin, uploadAndDownloadPlugin, clearUploadedFiles, getUploadedFiles } = usePluginDownloader();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Kontrollera om det finns uppladdade filer
  const uploadedFiles = getUploadedFiles();
  const hasUploadedFiles = uploadedFiles && Object.keys(uploadedFiles).length > 0;
  
  // Last updated date for the plugin files
  const lastUpdated = '2025-07-25'; // Updated with custom files
  const version = '3.0.3';
  
  const handleDownload = () => {
    downloadPlugin();
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Kontrollera både MIME-typ och filnamn för ZIP-filer
      const isZipFile = file.type === 'application/zip' || 
                       file.type === 'application/x-zip-compressed' || 
                       file.type === 'application/x-zip' ||
                       file.name.toLowerCase().endsWith('.zip');
      
      if (isZipFile) {
        uploadAndDownloadPlugin(file);
      } else {
        alert('Please select a ZIP file');
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Plugin Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="font-semibold">Version</div>
            <div className="text-muted-foreground">{version}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="font-semibold">Senast uppdaterad</div>
            <div className="text-muted-foreground">{lastUpdated}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="font-semibold">GDPR</div>
            <div className="text-muted-foreground">Kompatibel</div>
          </CardContent>
        </Card>
      </div>

      {/* Download Button */}
      <div className="text-center">
        <Button 
          onClick={handleDownload}
          size="lg" 
          className="flex items-center gap-2 px-8 py-4 text-lg"
        >
          <Download className="h-5 w-5" />
          Download WordPress Plugin (ZIP)
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          {hasUploadedFiles 
            ? `Using your uploaded files (${Object.keys(uploadedFiles!).length} files)`
            : 'Complete WordPress plugin with all necessary files'
          }
        </p>
      </div>

      {/* Uploaded Files Status */}
      {hasUploadedFiles && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Custom Files Active</p>
                  <p className="text-sm text-green-700 mt-1">
                    Download now uses your uploaded files ({Object.keys(uploadedFiles!).length} files)
                  </p>
                </div>
              </div>
              <Button 
                onClick={clearUploadedFiles}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Återställ till standard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <h3 className="font-semibold text-lg mb-2 text-orange-800">Ladda upp dina egna filer</h3>
            <p className="text-sm text-orange-700 mb-4">
              Har du uppdaterat plugin-filerna? Ladda upp din ZIP-fil så skapas en korrekt WordPress-plugin
            </p>
            <Button 
              onClick={handleUpload}
              size="lg" 
              variant="outline"
              className="flex items-center gap-2 px-8 py-4 text-lg border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Upload className="h-5 w-5" />
              Välj ZIP-fil att ladda upp
            </Button>
            <p className="text-xs text-orange-600 mt-2">
              Stöds: .zip filer med dina uppdaterade plugin-filer
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Detailed File List */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">📁 All Files in ZIP Package</h3>
          <p className="text-sm text-muted-foreground mb-4">All files last updated: {lastUpdated}</p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-gray-800 dark:bg-gray-900">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-white">File</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-white">Size</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-white">Description</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">heatmap-analytics.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">1.2 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Main plugin file</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-heatmap-analytics-core.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">3.8 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Core functionality</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-admin-settings.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm font-semibold text-blue-600">52.8 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Admin-gränssnitt & inställningar</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Komplett</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-security-manager.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm font-semibold text-orange-600">18.4 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Säkerhetshantering & validering</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Ny tillagd</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-supabase-sync.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">12.6 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Supabase API-integration</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-enhanced-cookie-banner.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">25.4 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Förbättrad GDPR & Cookie-hantering</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Komplett</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-tracking-manager.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">15.2 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Spårning & analytics</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-cookie-manager.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">7.3 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Cookie-hantering</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-cookie-banner.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">7.3 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Grundläggande cookie-banner</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-data-retention.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">4.1 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Data-retention</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-google-analytics.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">5.4 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Google Analytics-integration</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-pixel-detector.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">3.9 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Pixel-detektor</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">includes/class-plugin-scanner.php</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">2.8 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Plugin-scanner</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">assets/tracking-script.js</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">11.7 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Frontend tracking-script</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">assets/external-consent.js</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">3.2 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">Extern consent-script</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2 font-mono text-sm">readme.txt</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">2.1 KB</td>
                  <td className="border border-gray-200 px-4 py-2 text-sm">WordPress plugin-readme</td>
                  <td className="border border-gray-200 px-4 py-2"><span className="text-green-600 text-sm">✓ Included</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-semibold text-blue-800">Total paket-storlek: ~167 KB</span>
            </div>
            <p className="text-sm text-blue-700">
              Kompletta funktioner: Heatmap-tracking, GDPR-kompatibilitet, Cookie-hantering, 
              Säkerhetsvalidering, Supabase-integration, Admin-gränssnitt med flikar
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Installation Note */}
      {trackingId && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Ditt Tracking ID är klart</p>
                <p className="text-sm text-green-700 mt-1">
                  Tracking ID: <code className="bg-green-100 px-1 rounded">{trackingId}</code>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Detta ID kommer automatiskt att konfigureras i pluginet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">File Updates</p>
              <p className="text-sm text-blue-700 mt-1">
                All files last updated: <strong>{lastUpdated}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Inkluderar alla dina ursprungliga filer med full Supabase-integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}