import { PageMenu } from './page-menu';
import { Container } from '@/components/common/container';
import { Navbar } from '@/partials/navbar/navbar';

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* <Navbar>
        <Container>
          <PageMenu />
        </Container>
      </Navbar> */}
      {children}
    </>
  );
}