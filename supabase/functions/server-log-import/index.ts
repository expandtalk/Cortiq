import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LogEntry {
  url: string
  statusCode: number
  loadTimeMs: number
  deviceType?: string
  browser?: string
  countryCode?: string
  referrerDomain?: string
  timestamp: Date
}

// Parse Apache/Nginx combined log format
function parseCombinedLog(line: string): LogEntry | null {
  // Example: 192.168.1.1 - - [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 2326 "http://example.com" "Mozilla/5.0..."
  const regex = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) ([^\s]+) \S+" (\d{3}) (\d+) "([^"]*)" "([^"]*)"/
  const match = line.match(regex)
  
  if (!match) return null
  
  const [, ip, timestamp, method, url, statusCode, bytes, referrer, userAgent] = match
  
  return {
    url: url,
    statusCode: parseInt(statusCode),
    loadTimeMs: 0, // Not available in combined log
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    countryCode: 'XX', // Would need IP geolocation
    referrerDomain: extractDomain(referrer),
    timestamp: parseApacheTimestamp(timestamp)
  }
}

// Parse JSON log format
function parseJsonLog(line: string): LogEntry | null {
  try {
    const log = JSON.parse(line)
    return {
      url: log.url || log.path || '',
      statusCode: log.status || log.statusCode || 200,
      loadTimeMs: log.responseTime || log.loadTime || 0,
      deviceType: log.deviceType || detectDeviceType(log.userAgent || ''),
      browser: log.browser || detectBrowser(log.userAgent || ''),
      countryCode: log.country || log.countryCode || 'XX',
      referrerDomain: extractDomain(log.referrer || log.referer || ''),
      timestamp: new Date(log.timestamp || log.time || Date.now())
    }
  } catch {
    return null
  }
}

// Parse CSV log format
function parseCsvLog(line: string, headers: string[]): LogEntry | null {
  const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'))
  const log: Record<string, string> = {}
  
  headers.forEach((header, i) => {
    log[header] = values[i] || ''
  })
  
  return {
    url: log.url || log.path || '',
    statusCode: parseInt(log.status || log.statusCode || '200'),
    loadTimeMs: parseInt(log.responseTime || log.loadTime || '0'),
    deviceType: log.deviceType || detectDeviceType(log.userAgent || ''),
    browser: log.browser || detectBrowser(log.userAgent || ''),
    countryCode: log.country || log.countryCode || 'XX',
    referrerDomain: extractDomain(log.referrer || log.referer || ''),
    timestamp: new Date(log.timestamp || log.time || Date.now())
  }
}

function detectDeviceType(userAgent: string): string {
  if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) return 'mobile'
  if (/tablet|ipad/i.test(userAgent)) return 'tablet'
  return 'desktop'
}

function detectBrowser(userAgent: string): string {
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) return 'Chrome'
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari'
  if (/firefox/i.test(userAgent)) return 'Firefox'
  if (/edg/i.test(userAgent)) return 'Edge'
  return 'Other'
}

function extractDomain(url: string): string {
  if (!url || url === '-') return ''
  try {
    const domain = new URL(url).hostname
    return domain
  } catch {
    return ''
  }
}

function parseApacheTimestamp(timestamp: string): Date {
  // Format: 10/Oct/2000:13:55:36 -0700
  try {
    return new Date(timestamp)
  } catch {
    return new Date()
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const formData = await req.formData()
    const file = formData.get('file') as File
    const siteId = formData.get('siteId') as string
    const logFormat = formData.get('logFormat') as string // 'combined', 'json', 'csv'

    if (!file || !siteId || !logFormat) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${logFormat} log file: ${file.name} for site ${siteId}`)

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('server_log_imports')
      .insert({
        site_id: siteId,
        filename: file.name,
        log_format: logFormat,
        status: 'processing'
      })
      .select()
      .single()

    if (importError) {
      throw new Error(`Failed to create import record: ${importError.message}`)
    }

    // Read and parse file
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    let csvHeaders: string[] = []
    if (logFormat === 'csv' && lines.length > 0) {
      csvHeaders = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'))
      lines.shift() // Remove header line
    }

    const totalLines = lines.length
    let processedLines = 0
    let failedLines = 0

    // Process in batches
    const batchSize = 100
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize)
      
      for (const line of batch) {
        try {
          let entry: LogEntry | null = null
          
          switch (logFormat) {
            case 'combined':
              entry = parseCombinedLog(line)
              break
            case 'json':
              entry = parseJsonLog(line)
              break
            case 'csv':
              entry = parseCsvLog(line, csvHeaders)
              break
          }

          if (entry) {
            // Call the increment function
            const { error } = await supabase.rpc('increment_server_log_analytics', {
              p_site_id: siteId,
              p_date: entry.timestamp.toISOString().split('T')[0],
              p_url: entry.url,
              p_device_type: entry.deviceType || 'desktop',
              p_browser: entry.browser || 'Other',
              p_country_code: entry.countryCode || 'XX',
              p_referrer_domain: entry.referrerDomain || '',
              p_load_time_ms: entry.loadTimeMs,
              p_status_code: entry.statusCode
            })

            if (error) {
              console.error('Error incrementing analytics:', error)
              failedLines++
            } else {
              processedLines++
            }
          } else {
            failedLines++
          }
        } catch (error) {
          console.error('Error processing line:', error)
          failedLines++
        }
      }

      // Update progress
      await supabase
        .from('server_log_imports')
        .update({
          total_lines: totalLines,
          processed_lines: processedLines,
          failed_lines: failedLines
        })
        .eq('id', importRecord.id)
    }

    // Mark as completed
    await supabase
      .from('server_log_imports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', importRecord.id)

    console.log(`Import completed: ${processedLines} processed, ${failedLines} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        importId: importRecord.id,
        totalLines,
        processedLines,
        failedLines
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in server-log-import:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
