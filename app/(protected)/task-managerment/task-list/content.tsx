'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

// Mock data for tasks
const mockTasks = [
  {
    id: 1,
    title: 'Design new landing page',
    description: 'Create wireframes and mockups for the new landing page',
    status: 'In Progress',
    priority: 'High',
    assignee: 'John Doe',
    dueDate: '2025-10-25',
  },
  {
    id: 2,
    title: 'Fix login bug',
    description: 'Resolve the issue with user authentication',
    status: 'To Do',
    priority: 'Medium',
    assignee: 'Jane Smith',
    dueDate: '2025-10-22',
  },
  {
    id: 3,
    title: 'Update documentation',
    description: 'Update API documentation with new endpoints',
    status: 'Done',
    priority: 'Low',
    assignee: 'Bob Johnson',
    dueDate: '2025-10-20',
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

export function TaskListContent() {
  const [tasks] = useState(mockTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="To Do">To Do</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Priority</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
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
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
