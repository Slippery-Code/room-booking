import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useBookings } from './storage/useBookings';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

function Root() {
  const { bookings, currentName, book, cancel, setName } = useBookings();
  return (
    <App
      bookings={bookings}
      currentName={currentName}
      book={book}
      cancel={cancel}
      setName={setName}
    />
  );
}

createRoot(root).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
