'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';

// Mock chat messages
const mockMessages = [
  {
    id: 1,
    sender: 'John Doe',
    message: 'How is the landing page design coming along?',
    timestamp: '2025-10-20 10:30',
  },
  {
    id: 2,
    sender: 'Jane Smith',
    message: 'Almost done! Just need to finalize the color scheme.',
    timestamp: '2025-10-20 10:35',
  },
  {
    id: 3,
    sender: 'Bob Johnson',
    message: 'Looks good! Let me know when you need feedback.',
    timestamp: '2025-10-20 10:40',
  },
];

export function TaskChatContent() {
  const [messages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send to backend
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="h-[600px] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Task Discussion</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                    {msg.sender.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{msg.sender}</span>
                      <span className="text-xs text-gray-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
