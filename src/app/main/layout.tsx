import SessionChecker from "../components/SessionChecker";
import Header from "../components/header";

export default async function mainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div>
        <SessionChecker>
          <Header/>
        </SessionChecker>
      </div>
      {children}
    </div>
  );
}