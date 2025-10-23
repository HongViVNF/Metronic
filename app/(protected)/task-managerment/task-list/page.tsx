import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarActions, ToolbarHeading } from '@/layouts/demo1/components/toolbar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskListContent } from './content';

export default function TaskListPage() {
  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="Task List"
            description="Manage and track your tasks"
          />
          <ToolbarActions>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container>
        <TaskListContent />
      </Container>
    </Fragment>
  );
}
