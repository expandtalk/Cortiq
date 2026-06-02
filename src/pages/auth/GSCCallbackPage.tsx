import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function GSCCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code  = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('Google authorization was denied or cancelled.');
      setTimeout(() => navigate('/dashboard'), 3000);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('Invalid callback — missing parameters.');
      setTimeout(() => navigate('/dashboard'), 3000);
      return;
    }

    async function exchange() {
      try {
        await supabase.auth.refreshSession();
        const { data: { session } } = await supabase.auth.getSession();

        const { data, error: fnError } = await supabase.functions.invoke('gsc-oauth-callback', {
          body: { code, state },
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        });

        if (fnError || !data?.success) {
          throw new Error(data?.error || fnError?.message || 'Connection failed');
        }

        setStatus('success');
        setMessage(`Connected ${data.properties?.length ?? 0} ${data.properties?.length === 1 ? 'property' : 'properties'}. Redirecting...`);
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message ?? 'Connection failed');
        setTimeout(() => navigate('/dashboard'), 4000);
      }
    }

    exchange();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-sm px-4">
        {status === 'loading' && (
          <>
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Connecting Google Search Console...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-green-700">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-medium text-red-700">Connection failed</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
