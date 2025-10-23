import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarActions, ToolbarHeading } from '@/layouts/demo1/components/toolbar';
import { TaskChatContent } from './content';

export default function TaskChatPage() {
  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="Task Chat"
            description="Discuss tasks with your team"
          />
          <ToolbarActions>
            {/* Add any actions here */}
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container>
        <TaskChatContent />
      </Container>
    </Fragment>
  );
}
