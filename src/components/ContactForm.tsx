import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, User, MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react';
import { ContactFormSchema, type ContactForm as ContactFormType } from '@/types/validation';

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormType>({
    resolver: zodResolver(ContactFormSchema),
  });

  const onSubmit = async (data: ContactFormType) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours."
      });

      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-2 border-primary/20 shadow-elegant">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl text-gradient-primary">Contact Us</CardTitle>
        <CardDescription className="text-base">
          Interested in invite-only access? Send us a message.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                {...register('name')}
                className={`pl-10 h-12 ${errors.name ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.name && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {errors.name.message}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className={`pl-10 h-12 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-base font-semibold">Message</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Textarea
                id="message"
                placeholder="Tell us about your company and why you're interested in CortIQ..."
                {...register('message')}
                className={`pl-10 min-h-[150px] resize-none ${errors.message ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.message && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                {errors.message.message}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-lg bg-gradient-primary hover-scale hover-glow"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
