import Reminders from '../components/Reminders';

export default function RemindersPage() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>🔔 Reminders</h1>
        <p>Track your daily doses and mark them as taken</p>
      </div>
      <Reminders />
    </div>
  );
}
