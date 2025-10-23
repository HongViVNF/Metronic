import { Fragment } from 'react';
import { Container } from '@/components/common/container';
import { Toolbar, ToolbarActions, ToolbarHeading } from '@/layouts/demo1/components/toolbar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MyTaskFollowedContent } from './content';

export default function MyTaskFollowedPage() {
  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="My Task Followed"
            description="Tasks you are following"
          />
          <ToolbarActions>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Follow Task
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container>
        <MyTaskFollowedContent />
      </Container>
    </Fragment>
  );
}
