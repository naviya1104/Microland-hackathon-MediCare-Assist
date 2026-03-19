import CaregiverDashboard from '../components/CaregiverDashboard';

export default function Caregiver() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>👨‍⚕️ Caregiver</h1>
        <p>Monitor patient's medication adherence</p>
      </div>
      <CaregiverDashboard />
    </div>
  );
}
