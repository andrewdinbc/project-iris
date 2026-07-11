import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata = {
  title: 'Project Iris - Curriculum Alignment Tool',
  description: 'Automated curriculum standards alignment and assessment ingestion for BC, AB, ON',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
