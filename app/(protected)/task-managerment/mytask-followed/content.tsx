'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock data for followed tasks
const mockFollowedTasks = [
  {
    id: 1,
    title: 'Design new landing page',
    description: 'Create wireframes and mockups for the new landing page',
    status: 'In Progress',
    priority: 'High',
    assignee: 'John Doe',
    dueDate: '2025-10-25',
    lastUpdate: '2025-10-20',
  },
  {
    id: 2,
    title: 'Fix login bug',
    description: 'Resolve the issue with user authentication',
    status: 'To Do',
    priority: 'Medium',
    assignee: 'Jane Smith',
    dueDate: '2025-10-22',
    lastUpdate: '2025-10-19',
  },
];

const statusColors = {
  'To Do': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Done': 'bg-green-100 text-green-800',
};

const priorityColors = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-red-100 text-red-800',
};

export function MyTaskFollowedContent() {
  const [tasks] = useState(mockFollowedTasks);

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No followed tasks</p>
        </div>
      ) : (
        tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  <div className="flex items-center gap-4">
                    <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                      {task.status}
                    </Badge>
                    <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                      {task.priority}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Assigned to: {task.assignee}
                    </span>
                    <span className="text-sm text-gray-500">
                      Due: {task.dueDate}
                    </span>
                    <span className="text-sm text-gray-500">
                      Last update: {task.lastUpdate}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
