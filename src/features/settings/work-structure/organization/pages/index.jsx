import OrganizationListTwo from "../components/oranganization-list-two";
import OrganizationList from "../components/organization-list";
import PageContainer from "@/components/page-container";

const Organizaitons = () => {
  return (
    <PageContainer>
      <OrganizationList />
      <OrganizationListTwo />
    </PageContainer>
  );
};

export default Organizaitons;
