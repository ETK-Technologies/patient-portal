import PageContainer from "@/components/PageContainer";

export default function Profile() {
  return (
    <PageContainer title="Profile Page">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">
          Your profile information will appear here.
        </p>
      </div>
    </PageContainer>
  );
}
