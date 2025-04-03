import Header from "../components/header";

export default async function mainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div>
        <Header/>
      </div>
      {children}
    </div>
  );
}