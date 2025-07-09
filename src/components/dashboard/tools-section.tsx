import { Sparkles, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

const tools = [
  {
    title: 'AI Assistant',
    description: 'Ask questions about your spending.',
    href: '/dashboard/ai-assistant',
    icon: Sparkles,
  },
  {
    title: 'eKYC Verification',
    description: 'Verify your identity for higher limits.',
    href: '/dashboard/kyc',
    icon: UserCheck,
  },
];

const ToolItem = ({ tool }: { tool: typeof tools[0] }) => (
    <Link href={tool.href}>
        <Card className="hover:bg-accent transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-xl">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tool.icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="font-semibold text-base">{tool.title}</p>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
            </CardContent>
        </Card>
    </Link>
);


export function ToolsSection() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">AI Tools</h2>
      <div className="space-y-3">
        {tools.map((tool) => (
          <ToolItem key={tool.title} tool={tool} />
        ))}
      </div>
    </div>
  );
}
