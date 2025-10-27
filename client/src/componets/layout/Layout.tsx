import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // Stop scroll bar from appearing next to the header
    <div className="h-screen flex flex-col overflow-hidden">
        <Header />

        <main className="grow overflow-y-auto flex flex-col">
            
                <div className="grow w-full">
                    {children}
                </div>

                <Footer />
        </main>
    </div>
    );
}