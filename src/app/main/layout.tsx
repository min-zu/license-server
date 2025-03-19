import Header from "../components/header";

export default function mainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div>
        <Header/>
      </div>
      {children}
    </div>
  );
}