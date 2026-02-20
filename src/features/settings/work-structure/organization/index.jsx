import PageContainer from "@/components/page-container";
import OrganizationListTwo from "./oranganization-list-two";
import OrganizationList from "./organization-list";
import OrganizationListThree from "./organization-list-three";


const Organizations = () => {
  return (
    <PageContainer>
      <OrganizationList />
      <OrganizationListTwo />
      <OrganizationListThree />
    </PageContainer>
  );
};

export default Organizations;
