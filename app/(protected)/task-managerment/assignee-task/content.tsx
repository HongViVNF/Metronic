'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock data for assigned tasks
const mockAssignedTasks = [
  {
    id: 1,
    title: 'Review PR #123',
    description: 'Review the pull request for the new feature',
    status: 'In Progress',
    priority: 'High',
    dueDate: '2025-10-22',
  },
  {
    id: 2,
    title: 'Update documentation',
    description: 'Update API documentation with new endpoints',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '2025-10-25',
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

export function AssigneeTaskContent() {
  const [tasks, setTasks] = useState(mockAssignedTasks);

  const updateStatus = (taskId: number, newStatus: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No assigned tasks</p>
        </div>
      ) : (
        tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                      {task.status}
                    </Badge>
                    <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                      {task.priority}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Due: {task.dueDate}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {task.status !== 'Done' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(task.id, task.status === 'To Do' ? 'In Progress' : 'Done')}
                      >
                        {task.status === 'To Do' ? 'Start' : 'Complete'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline">Edit</Button>
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
