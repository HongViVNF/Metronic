import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarActions, ToolbarHeading } from '@/layouts/demo1/components/toolbar';
import { AssigneeTaskContent } from './content';

export default function AssigneeTaskPage() {
  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="My Tasks"
            description="Tasks assigned to you"
          />
          <ToolbarActions>
            {/* Add any actions here */}
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container>
        <AssigneeTaskContent />
      </Container>
    </Fragment>
  );
}
