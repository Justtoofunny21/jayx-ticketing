import './globals.css';
export const metadata = { title: 'Tickets', description: 'Buy tickets securely' };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
